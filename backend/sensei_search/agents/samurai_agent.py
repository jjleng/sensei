import asyncio
import os
import re
import uuid
from datetime import datetime
from typing import List, Optional, Union, Any

import trafilatura  # type: ignore[import]
from aiohttp import ClientSession, ClientTimeout
from openai import AsyncOpenAI, OpenAI

from sensei_search.base_agent import BaseAgent, EnrichedQuery, EventEnum, QueryTags
from sensei_search.chat_store import (
    ChatHistoryItem,
    ChatStore,
    ThreadMetadata,
)
from sensei_search.models import (
    MediumImage,
    MediumVideo,
    MetaData,
    WebResult,
)
from sensei_search.env import load_envs
from sensei_search.logger import logger
from sensei_search.prompts import (
    answer_prompt,
    classification_prompt,
    related_questions_prompt,
    search_prompt,
)
from sensei_search.tools import Category, GeneralResult
from sensei_search.tools import Input as SearxNGInput
from sensei_search.tools import TopResults, searxng_search_results_json
from sensei_search.utils import create_slug

load_envs()

FETCH_WEBPAGE_TIMEOUT = 3


async def noop() -> None:
    return None


class SamuraiAgent(BaseAgent):
    """
    This agent is designed to balance performance and conversational quality.

    As a search agent, one of our key performance indicators is the Time to First Byte (TTFB).
    To optimize this, our agent employs a two-step approach:

    1. It uses a lighter model and a less complex prompt to quickly generate search queries.
    2. It then uses a larger model and a more complex prompt to generate comprehensive answers.

    Let's consider an example:
    User: "How far is Mars?"
    Agent: "171.7 million mi"
    User: "Is it larger than Earth?"

    If we were to use "Is it larger than Earth?" directly as a search query, it might not yield relevant results.
    To address this, our agent uses a simple system prompt to generate more effective search queries.

    After obtaining the search results, the agent uses a larger language model to generate a comprehensive and contextually
    relevant response. This larger model is capable of processing more information and providing a more nuanced answer.

    This agent works as follows:

    1. Receive a user input and chat history.
    2. Use the chat history to generate a search query for the user's input.
    3. Use the search query to generate a search result.
    4. Return the search results to the user.
    5. Feed the search results to the LLM to generate a response to the user's input.
    6. Return the response to the user.
    """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)

    async def emit_thread_metadata(self, metadata: ThreadMetadata) -> None:
        """
        Send the thread metadata to the frontend
        """
        await self.emitter.emit(EventEnum.thread_metadata.value, {"data": {
            "created_at": metadata['created_at'],
            "slug": metadata['slug'],
            "name": metadata['name'],
        }})

    async def emit_metadata(self, metadata: MetaData) -> None:
        """
        Send the metadata to the frontend.
        """
        await self.emitter.emit(EventEnum.metadata.value, {"data": metadata})

    async def emit_web_results(self, results: List[GeneralResult]) -> None:
        """
        Send the search results to the frontend.
        """
        filtered_results = [
            {"url": res["url"], "title": res["title"], "content": res["content"]}
            for res in results
        ]

        # Emit the search results
        await self.emitter.emit(EventEnum.web_results.value, {"data": filtered_results})

    async def emit_medium_results(self, results: TopResults) -> None:
        """
        Send the medium results to the frontend.
        """
        images = results["images"]
        videos = results["videos"]

        filtered_results = []

        for image in images:
            filtered_results.append(
                {"url": image["url"], "image": image["img_src"], "medium": "image"}
            )

        for video in videos:
            filtered_results.append({"url": video["url"], "medium": "video"})

        # Emit the search results
        await self.emitter.emit(
            EventEnum.medium_results.value, {"data": filtered_results}
        )

    async def emit_answer(self, answer: str) -> None:
        """
        Send the LLM answer to the frontend.
        """
        await self.emitter.emit(EventEnum.answer.value, {"data": answer})

    async def emit_related_questions(self, related_questions: List[str]) -> None:
        """
        Send the related questions to the frontend.
        """
        await self.emitter.emit(
            EventEnum.related_questions.value, {"data": related_questions}
        )

    async def process_user_query(self) -> EnrichedQuery:
        """
        Generate a search query based on the chat history and the user's current query,
        and classify the query to determine its nature and required handling.
        """
        client = AsyncOpenAI(
            base_url=os.environ["SM_MODLE_URL"], api_key=os.environ["SM_MODEL_API_KEY"]
        )

        # We only load user's queries from the chat history to save LLM tokens
        chat_history = self.chat_history_to_string(["user"])
        user_current_query = self.chat_messages[-1]["content"]

        materialized_search_prompt = search_prompt.format(
            chat_history=chat_history,
            user_current_query=user_current_query,
            current_date=datetime.now().isoformat(),
        )

        materialized_classify_prompt = classification_prompt.format(
            chat_history=chat_history,
            user_current_query=user_current_query,
        )

        search_response, classification_response = await asyncio.gather(
            client.chat.completions.create(
                model=os.environ["SM_MODEL"],
                messages=[{"role": "user", "content": materialized_search_prompt}],
                temperature=0.0,
                max_tokens=500,
            ),
            client.chat.completions.create(
                model=os.environ["SM_MODEL"],
                messages=[{"role": "user", "content": materialized_classify_prompt}],
                temperature=0.0,
                max_tokens=500,
            ),
        )

        classify_response = classification_response.choices[0].message.content

        if not classify_response:
            raise ValueError("Classification response is empty.")

        classify_response = classify_response.strip('"').strip("'")

        logger.info(classify_response)

        # need_search, need_image, need_video, violation, has_math
        tags_dict = {}
        for tag in classify_response.split(","):
            try:
                key, value = tag.strip().split(":")
                tags_dict[key] = value
            except ValueError:
                logger.warning(f"Skipping ill-formatted tag: {tag}")

        query_tags = QueryTags(
            needs_search=tags_dict.get("SEARCH_NEEDED", "YES").strip() == "YES",
            needs_image=tags_dict.get("SEARCH_IMAGE", "NO").strip() == "YES",
            needs_video=tags_dict.get("SEARCH_VIDEO", "NO").strip() == "YES",
            content_violation=tags_dict.get("CONTENT_VIOLATION", "NO").strip() == "YES",
            has_math=tags_dict.get("MATH", "NO").strip() == "YES",
        )

        query = search_response.choices[0].message.content

        if not query:
            raise ValueError("Search query response is empty.")

        query = query.strip('"').strip("'")

        enriched_query = EnrichedQuery(search_query=query, tags=query_tags)

        logger.info(enriched_query)

        return enriched_query

    async def fetch_web_pages(self, results: List[GeneralResult]) -> List[str]:
        """
        Fetch the web page contents for the search results.
        """

        async def fetch_page(url: str, session: ClientSession) -> str:
            try:
                async with session.get(url) as response:
                    return await response.text()
            except asyncio.TimeoutError:
                logger.warning(f"Timeout occurred when fetching {url}")
            except Exception as e:
                logger.exception(f"Error fetching {url}: {e}")
            return ""

        timeout = ClientTimeout(total=FETCH_WEBPAGE_TIMEOUT)
        async with ClientSession(timeout=timeout) as session:
            tasks = [fetch_page(result["url"], session) for result in results]
            html_web_pages = await asyncio.gather(*tasks)
            return [trafilatura.extract(page) for page in html_web_pages]

    async def gen_related_questions(self, web_pages: List[str]) -> List[str]:
        search_results = "\n\n".join(
            [f"Document: {i + 1}\n{page}" for i, page in enumerate(web_pages)]
        )
        # We are capping the search results at 5000 words, so that we can use the small model
        search_results = search_results[:5000]

        user_current_query = self.chat_messages[-1]["content"]
        prompt = related_questions_prompt.format(
            user_current_query=user_current_query, search_results=search_results
        )

        try:

            client = OpenAI(
                base_url=os.environ["SM_MODLE_URL"],
                api_key=os.environ["SM_MODEL_API_KEY"],
            )
            response = (
                client.chat.completions.create(
                    model=os.environ["SM_MODEL"],
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.0,
                    max_tokens=500,
                    stream=False,
                ),
            )

            return [
                re.sub(r"^\s*\d+\.\s*", "", item)
                for item in (response[0].choices[0].message.content or "").split("\n")
            ]
        except Exception as e:
            logger.exception(f"Error generating related questions: {e}")
            return []

    async def gen_answer(self, web_pages: List[str]) -> str:
        """
        Generate an answer based on the search results and the user's query.
        """
        final_answer_parts = []

        # We only load user's queries from the chat history to save LLM tokens
        chat_history = self.chat_history_to_string(["user"])

        search_results = "\n\n".join(
            [f"Document: {i + 1}\n{page}" for i, page in enumerate(web_pages)]
        )

        system_prompt = answer_prompt.format(
            chat_history=chat_history,
            search_results=search_results,
            current_date=datetime.now().isoformat(),
        )

        client = OpenAI(
            base_url=os.environ["MD_MODLE_URL"], api_key=os.environ["MD_MODEL_API_KEY"]
        )

        response = client.chat.completions.create(
            model=os.environ["MD_MODEL"],
            messages=[
                {
                    "role": "system",
                    "content": system_prompt,
                },
                {
                    "role": "user",
                    "content": f'{self.chat_messages[-1]["content"]}. (You MUST follow `Query type specifications` and `Formatting Instructions` to write and format your answer.)',
                },
                {
                    "role": "system",
                    "content": (
                        "Carefully perform the following instructions in order. "
                        "1. Ensure that the user's query does not violate the Safety Preamble. If it does, reject the request and provide no response. "
                        "2. Retrieve relevant documents related to the user's query. "
                        "3. Determine which of the retrieved documents contain facts pertinent to crafting an informative response. "
                        "4. Construct your answer based on the information extracted from the relevant documents. Avoid directly copying any grounding markup or references, such as [1][2], from the source material. Always attribute the information by citing the corresponding document(s) using the format `[1][2]` while composing the answer. NEVER include a References or Sources section at the end of your answer. "
                        "5. When relevant documents are available, prioritize the information obtained from the search results over the knowledge from your pre-training data."
                        "Now answer user's latest query using the same language the user used: "
                    ),
                },
            ],
            temperature=0.0,
            max_tokens=2500,
            stream=True,
        )

        for chunk in response:
            if chunk.choices[0].delta.content:
                final_answer_parts.append(chunk.choices[0].delta.content)
                # Send the answer to the user ASAP
                await self.emit_answer(chunk.choices[0].delta.content)

        return "".join(final_answer_parts)

    async def process_medium(self, query: str, tags: Optional[QueryTags]) -> TopResults:
        categories = []

        if tags is not None:
            if tags["needs_image"]:
                categories.append(Category.images)
            if tags["needs_video"]:
                categories.append(Category.videos)

        if categories:
            search_input = SearxNGInput(query=query, categories=categories)
            # Search for images and videos
            medium_results = await searxng_search_results_json(search_input)
        else:
            medium_results = TopResults(general=[], images=[], videos=[])
        await self.emit_medium_results(medium_results)
        return medium_results

    async def run(self, user_message: str) -> None:
        """
        Entry point for the agent.
        """
        logger.info("samurai_agent runs")
        # To save LLM tokens, we only load user's queries from the chat history
        # This can already give us a good context for generating search queries and answers
        _, thread_metadata = await asyncio.gather(self.load_chat_history(self.thread_id, ["user"]), self.get_thread_metadata())

        logger.info(f"User original query: {user_message}")

        # Append user message to chat history
        self.append_message(role="user", content=user_message)

        enriched_query = await self.process_user_query()
        query = enriched_query["search_query"]

        logger.info(f"Search Query: {query}")

        # We should check if the tags contain 'needs_search'. But for now, we always perform a search
        tags = enriched_query["tags"]
        if tags is None or tags["needs_search"]:
            search_input = SearxNGInput(query=query, categories=[Category.general])
            metadata = MetaData(has_math=True if tags and tags["has_math"] else False)

            search_results, _ = await asyncio.gather(
                searxng_search_results_json(search_input),
                self.emit_metadata(metadata=metadata),
            )
        else:
            search_results = TopResults(general=[], images=[], videos=[])

        general_results = search_results["general"]

        _, web_pages = await asyncio.gather(
            # Sending search results to the client ASAP
            self.emit_web_results(general_results),
            # Fetch web page contents for llm to use as context
            self.fetch_web_pages(general_results[:5]),)

        answer, medium_results, related_questions = await asyncio.gather(
            self.gen_answer(web_pages),
            self.process_medium(query, tags),
            self.gen_related_questions(web_pages)
        )

        logger.info("Answer generated successfully.")

        logger.debug(f"Answer for query {query} is {answer}")
        logger.debug(f"Related questions: {related_questions}")

        await self.emit_related_questions(related_questions)

        if not thread_metadata:
            # Create a new thread metadata
            thread_metadata = ThreadMetadata(
                name=user_message[:50],
                user_id="",
                created_at=datetime.now().isoformat(),
                slug=create_slug(user_message),
                related_questions=related_questions,
            )
            # We send the thread metadata to the client for it save it in the local storage
            await asyncio.gather(self.emit_thread_metadata(thread_metadata), self.upsert_thread_metadata(thread_metadata))

        # Save the chat history
        chat_store = ChatStore()

        mediums: List[Union[MediumImage, MediumVideo]] = []

        if medium_results:
            for image in medium_results["images"]:
                mediums.append(
                    {"url": image["url"], "image": image["img_src"], "medium": "image"}
                )

            for video in medium_results["videos"]:
                mediums.append({"url": video["url"], "medium": "video"})

        web_results: List[WebResult] = [
            {"url": res["url"], "title": res["title"], "content": res["content"]}
            for res in general_results
        ]

        metadata = MetaData(has_math=False)

        if tags is not None and tags["has_math"]:
            metadata["has_math"] = True

        chat_history: ChatHistoryItem = {
            "id": str(uuid.uuid4()),
            "thread_id": self.thread_id,
            "mediums": mediums,
            "web_results": web_results,
            "query": user_message,
            "answer": answer,
            # We use the metadata to give the client extra info if they need to load the Math plugin
            "metadata": metadata,
        }
        await chat_store.save_chat_history(self.thread_id, chat_history)
