import asyncio
import os
import re
from datetime import datetime
from typing import List, Optional, Any

from openai import AsyncOpenAI
import json
from openai.types.chat import ChatCompletionMessageParam, ChatCompletionMessageToolCall
from openai.types.chat.chat_completion_chunk import ChoiceDeltaToolCall
from openai.types.chat.chat_completion_message_tool_call import Function

from sensei_search.base_agent import BaseAgent, NoAccessError
from sensei_search.chat_store import (
    ThreadMetadata,
)
from sensei_search.models import (
    MetaData,
)
from sensei_search.env import load_envs
from sensei_search.logger import logger
from sensei_search.agents.shogun.prompts import (
    answer_prompt,
    general_prompt,
)
from sensei_search.tools import Category
from sensei_search.tools import Input as SearxNGInput
from sensei_search.tools import TopResults, searxng_search_results_json
from sensei_search.utils import create_slug, to_openapi_spec

load_envs()

FETCH_WEBPAGE_TIMEOUT = 3


async def noop() -> None:
    return None


class ShogunAgent(BaseAgent):
    """
    The goal of the Shogun is to be a high performance agent that can produce high-quality answers with faster speed.
    Shogun aim to achieve the goals with all tools available, not just the open source ones.
    """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)

    async def gen_answer_with_search_context(
        self, tool_use_id: str, search_results: TopResults
    ) -> str:
        final_answer_parts = []

        client = AsyncOpenAI(
            base_url=os.environ["MD_MODEL_URL"], api_key=os.environ["MD_MODEL_API_KEY"]
        )

        system_prompt = answer_prompt.format(current_date=datetime.now().isoformat())

        messages: List[ChatCompletionMessageParam] = [
            {"role": "system", "content": system_prompt}
        ]
        for message in self.chat_messages:
            messages.append({"role": message["role"], "content": message["content"]})

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

        # We need to append the search results to the chat history
        messages.append(
            {
                "role": "user",
                "content": json.dumps(
                    [
                        {
                            "type": "tool_result",
                            "tool_use_id": tool_use_id,
                            "content": "\n\n".join(search_context),
                        }
                    ]
                ),
            }
        )

        response = await client.chat.completions.create(
            model=os.environ["MD_MODEL"],
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

    def concat_choice_delta_tool_calls(
        self, tool_calls_chunks: List[ChoiceDeltaToolCall]
    ) -> List[ChatCompletionMessageToolCall]:
        full_calls = {}

        for call in tool_calls_chunks:
            index = call.index
            if index not in full_calls:
                full_calls[index] = {"id": "", "name": "", "arguments": ""}

            if call.id:
                full_calls[index]["id"] = call.id
            if call.function and call.function.name:
                full_calls[index]["name"] += call.function.name
            if call.function and call.function.arguments:
                full_calls[index]["arguments"] += call.function.arguments

        # Convert the dictionary to a list of ChatCompletionMessageToolCall
        result = []
        for func_call in full_calls.values():
            result.append(
                ChatCompletionMessageToolCall(
                    id=func_call["id"],
                    function=Function(
                        name=func_call["name"], arguments=func_call["arguments"]
                    ),
                    type="function",
                )
            )

        return result

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

        client = AsyncOpenAI(
            base_url=os.environ["MD_MODEL_URL"], api_key=os.environ["MD_MODEL_API_KEY"]
        )

        system_prompt = general_prompt.format(current_date=datetime.now().isoformat())

        messages: List[ChatCompletionMessageParam] = [
            {"role": "system", "content": system_prompt}
        ]
        for message in self.chat_messages:
            messages.append({"role": message["role"], "content": message["content"]})

        logger.info(messages)

        response = await client.chat.completions.create(
            model=os.environ["MD_MODEL"],
            messages=messages,
            max_tokens=2500,
            tools=[to_openapi_spec(searxng_search_results_json)],
            tool_choice="auto",
            stream=True,
        )

        tool_calls_chunks: List[ChoiceDeltaToolCall] = []

        sources_and_medium_emitted = False

        async for chunk in response:
            if chunk.choices[0].delta.content:
                # That means we have an answer and no tool calls, we can safely emit the answer and the empty medium results
                if not sources_and_medium_emitted:
                    await asyncio.gather(
                        self.emit_web_results([]),
                        self.emit_medium_results(
                            TopResults(general=[], images=[], videos=[])
                        ),
                    )
                    sources_and_medium_emitted = True
                await self.emit_answer(chunk.choices[0].delta.content)
            if chunk.choices[0].delta.tool_calls:
                tool_calls_chunks.extend(chunk.choices[0].delta.tool_calls)

        if not tool_calls_chunks:
            return

        tool_calls = self.concat_choice_delta_tool_calls(tool_calls_chunks)

        logger.debug(tool_calls)

        search_results: Optional[TopResults] = None

        if not tool_calls:
            return

        # TODO: double check if this is OK
        self.append_message(
            role="assistant",
            content=json.dumps(json.dumps([tool.model_dump() for tool in tool_calls])),
        )
        for tool_call in tool_calls:
            if tool_call.function.name == "searxng_search_results_json":
                args = json.loads(tool_call.function.arguments)
                search_results = await searxng_search_results_json(SearxNGInput(**args))

                if search_results["general"]:
                    # Send the search results to the user ASAP for visual feedback
                    await self.emit_web_results(search_results["general"])

                    await asyncio.gather(
                        self.gen_answer_with_search_context(
                            tool_use_id=tool_call.id, search_results=search_results
                        ),
                        self.emit_medium_results(search_results),
                    )
                else:
                    asyncio.gather(
                        self.emit_answer("I couldn't find any relevant information."),
                        self.emit_web_results([]),
                        self.emit_medium_results(
                            TopResults(general=[], images=[], videos=[])
                        ),
                    )
