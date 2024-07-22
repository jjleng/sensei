import asyncio
import json
import re
from datetime import datetime
from typing import Any, List, Optional, Tuple

from openai import AsyncOpenAI
from openai.types.chat import ChatCompletionMessageParam, ChatCompletionMessageToolCall
from openai.types.chat.chat_completion_message_tool_call import Function

from sensei_search.agents.shogun.prompts import (
    answer_prompt,
    classification_prompt,
    general_prompt,
    related_questions_prompt,
    search_prompt,
)
from sensei_search.base_agent import BaseAgent, NoAccessError
from sensei_search.chat_store import ThreadMetadata
from sensei_search.config import (
    MD_MODEL,
    MD_MODEL_API_KEY,
    MD_MODEL_URL,
    SM_MODEL,
    SM_MODEL_API_KEY,
    SM_MODEL_URL,
)
from sensei_search.logger import logger
from sensei_search.models import MetaData
from sensei_search.tools.search import Category
from sensei_search.tools.search import Input as SearchInput
from sensei_search.tools.search import TopResults, get_search_tool
from sensei_search.utils import create_slug


async def noop() -> None:
    return None


class ShogunAgent(BaseAgent):
    """
    The goal of the Shogun is to be a high performance agent that can produce high-quality answers with faster speed.
    Shogun aim to achieve the goals with all tools available, not just the open source ones.
    This agent knows how to call tools.
    """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)

    def search_results_to_string(self, search_results: TopResults) -> str:
        # Construct the search context as this format:
        # [1]
        # Page 1 url
        # Page 1 title
        # Page 1 content
        search_context = []
        for i, result in enumerate(search_results["general"]):
            search_context.append(
                f"[{i+1}]\n{result['url']}\n{result['title']}\n{result['content']}"
            )
        return "\n\n".join(search_context)

    async def gen_search_query(self) -> Optional[str]:
        logger.info("generating search query")
        client = AsyncOpenAI(
            base_url=SM_MODEL_URL,
            api_key=SM_MODEL_API_KEY,
        )

        chat_history = self.chat_history_to_string(["user", "assistant"], 5)

        user_current_query = self.chat_messages[-1]["content"]

        prompt = search_prompt.format(
            chat_history=chat_history,
            user_current_query=user_current_query,
            current_date=datetime.now().isoformat(),
        )

        response = await client.chat.completions.create(
            model=SM_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.0,
            max_tokens=500,
        )
        logger.info("Finished generating search query")

        logger.info(f"Search query: {response.choices[0].message.content}")

        if response.choices[0].message.content is None:
            return None

        if "NO_SEARCH_NEEDED" in response.choices[0].message.content:
            logger.info(f"No search needed for {user_current_query}")
            return None

        query = response.choices[0].message.content
        query = query.strip('"').strip("'").strip("\n")
        return query

    async def front_run_search(self) -> Optional[Tuple[TopResults, str]]:
        search_query = await self.gen_search_query()

        if not search_query:
            return None

        search_input = SearchInput(query=search_query, categories=[Category.general])

        return (await get_search_tool().search(search_input), search_query)

    async def process_medium(self, query: Optional[str]) -> TopResults:
        medium_results = TopResults(general=[], images=[], videos=[])

        if query:
            try:
                client = AsyncOpenAI(
                    base_url=SM_MODEL_URL,
                    api_key=SM_MODEL_API_KEY,
                )
                chat_history = self.chat_history_to_string(["user", "assistant"], 5)
                user_current_query = self.chat_messages[-1]["content"]

                prompt = classification_prompt.format(
                    chat_history=chat_history, user_current_query=user_current_query
                )
                response = await client.chat.completions.create(
                    model=SM_MODEL,
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.0,
                    max_tokens=500,
                    stream=False,
                )

                result = response.choices[0].message.content or ""

                tags_dict = {}
                for tag in result.split(","):
                    try:
                        key, value = tag.strip().split(":")
                        tags_dict[key] = value
                    except ValueError:
                        logger.warning(f"Skipping ill-formatted tag: {tag}")

                categories = []

                search_images = tags_dict.get("SEARCH_IMAGE", "NO") == "YES"
                search_videos = tags_dict.get("SEARCH_VIDEO", "NO") == "YES"

                if search_images:
                    categories.append(Category.images)
                if search_videos:
                    categories.append(Category.videos)

                if categories:
                    search_input = SearchInput(query=query, categories=categories)
                    # Search for images and videos
                    medium_results = await get_search_tool().search(search_input)

            except Exception as e:
                logger.exception(f"Error generating related questions: {e}")

        await self.emit_medium_results(medium_results)
        return medium_results

    async def gen_related_questions(self) -> List[str]:
        chat_history = self.chat_history_to_string(["user", "assistant"], 5)

        prompt = related_questions_prompt.format(chat_history=chat_history)

        try:
            client = AsyncOpenAI(
                base_url=SM_MODEL_URL,
                api_key=SM_MODEL_API_KEY,
            )
            response = await client.chat.completions.create(
                model=SM_MODEL,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.0,
                max_tokens=500,
                stream=False,
            )

            return [
                re.sub(r"^\s*\d+\.\s*", "", item)
                for item in (response.choices[0].message.content or "").split("\n")
                if item.strip()
            ]
        except Exception as e:
            logger.exception(f"Error generating related questions: {e}")
            return []

    async def gen_answer_with_search_context(
        self, tool_use_id: str, search_results: TopResults
    ) -> str:
        final_answer_parts = []

        client = AsyncOpenAI(base_url=MD_MODEL_URL, api_key=MD_MODEL_API_KEY)

        system_prompt = answer_prompt.format(
            current_date=datetime.now().strftime("%A, %B %d, %Y")
        )

        messages: List[ChatCompletionMessageParam] = [
            {"role": "system", "content": system_prompt},
        ]
        for message in self.chat_messages:
            messages.append({"role": message["role"], "content": message["content"]})

        # We need to append the search results to the chat history
        messages.append(
            {
                "role": "user",
                "content": json.dumps(
                    [
                        {
                            "type": "tool_result",
                            "tool_use_id": tool_use_id,
                            "content": self.search_results_to_string(search_results),
                        }
                    ]
                ),
            }
        )

        response = await client.chat.completions.create(
            model=MD_MODEL,
            messages=messages,
            temperature=0.0,
            max_tokens=2500,
            stream=True,
        )

        async for chunk in response:
            if chunk.choices[0].delta.content:
                final_answer_parts.append(chunk.choices[0].delta.content)
                # Send the answer to the user ASAP
                await self.emit_answer(chunk.choices[0].delta.content)

        return "".join(final_answer_parts)

    async def gen_answer(self) -> str:
        client = AsyncOpenAI(
            base_url=MD_MODEL_URL,
            api_key=MD_MODEL_API_KEY,
        )

        system_prompt = general_prompt.format(
            current_date=datetime.now().strftime("%A, %B %d, %Y")
        )

        messages: List[ChatCompletionMessageParam] = [
            {"role": "system", "content": system_prompt}
        ]
        for message in self.chat_messages:
            messages.append({"role": message["role"], "content": message["content"]})

        logger.info(messages)

        response = await client.chat.completions.create(
            model=MD_MODEL,
            messages=messages,
            max_tokens=2500,
            stream=True,
        )
        final_answer_parts = []
        async for chunk in response:
            if chunk.choices[0].delta.content:
                final_answer_parts.append(chunk.choices[0].delta.content)
                await self.emit_answer(chunk.choices[0].delta.content)
        return "".join(final_answer_parts)

    async def run(self, user_message: str) -> None:
        """
        Entry point for the agent.
        """
        logger.info("shogun_agent runs")
        # To save LLM tokens, we only load user's queries from the chat history
        # This can already give us a good context for generating search queries and answers
        _, thread_metadata = await asyncio.gather(
            self.load_chat_history(self.thread_id, ["user", "assistant"]),
            self.get_thread_metadata(),
        )

        logger.info(f"Thread metadata: {thread_metadata}")

        # Check if the user has access to the thread
        # We assume there is no easy way to guess the uuid of a user
        if thread_metadata and thread_metadata["user_id"] != self.user_id:
            logger.warning(
                f"User {self.user_id} does not have access to thread {self.thread_id}"
            )
            raise NoAccessError()

        logger.info(f"User original query: {user_message}")

        # Append user message to chat history
        self.append_message(role="user", content=user_message)

        # Generate the search results ASAP
        result = await self.front_run_search()

        # If we have search results, generate the answer with the search context
        if result:
            search_results, search_query = result

            logger.info(search_results)

            await self.emit_web_results(search_results["general"])

            tool_use_id = "toolu_123456"
            # Create a fake tool call
            tool_calls: List[ChatCompletionMessageToolCall] = [
                ChatCompletionMessageToolCall(
                    id=tool_use_id,
                    function=Function(
                        name="searxng_search_results_json",
                        arguments=json.dumps(
                            {"query": user_message, "categories": ["general"]}
                        ),
                    ),
                    type="function",
                )
            ]
            # TODO: double check if this is OK
            self.append_message(
                role="assistant",
                content=json.dumps(
                    json.dumps([tool.model_dump() for tool in tool_calls])
                ),
            )
            answer, medium_results = await asyncio.gather(
                self.gen_answer_with_search_context(
                    tool_use_id=tool_use_id, search_results=search_results
                ),
                self.process_medium(search_query),
            )
        # If no search results, generate a generic answer
        else:
            await self.emit_web_results([])

            answer, medium_results = await asyncio.gather(
                self.gen_answer(), self.process_medium(None)
            )
            search_results = TopResults(general=[], images=[], videos=[])

        self.append_message(role="assistant", content=answer)

        # Generate related questions
        related_questions = await self.gen_related_questions()
        await self.emit_related_questions(related_questions)

        if not thread_metadata:
            # Create a new thread metadata
            thread_metadata = ThreadMetadata(
                name=user_message[:50],
                user_id=self.user_id,
                created_at=datetime.now().isoformat(),
                slug=create_slug(user_message),
                related_questions=related_questions,
            )
            # We send the thread metadata to the client for it save it in the local storage
            await asyncio.gather(
                self.emit_thread_metadata(thread_metadata),
                self.upsert_thread_metadata(thread_metadata),
            )
            logger.info(f"Saved thread metadata: {thread_metadata}")

        # Save the chat history
        metadata = MetaData(has_math=False)

        await self.save_chat_history(
            user_message, answer, medium_results, search_results["general"], metadata
        )
