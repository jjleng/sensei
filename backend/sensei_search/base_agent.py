from __future__ import annotations

import asyncio
import uuid
from abc import ABC, abstractmethod
from enum import Enum
from typing import Dict, List, Literal, Optional, Protocol, Union

import trafilatura  # type: ignore[import]
from aiohttp import ClientSession, ClientTimeout
from pydantic import BaseModel, Field
from typing_extensions import TypedDict

from sensei_search.chat_store import ChatHistoryItem, ChatStore, ThreadMetadata
from sensei_search.logger import logger
from sensei_search.models import MediumImage, MediumVideo, MetaData, WebResult
from sensei_search.tools import GeneralResult, TopResults

FETCH_WEBPAGE_TIMEOUT = 3


class NoAccessError(Exception):
    """
    Raised when a user attempts to access a resource they do not have permission to access.
    """

    def __init__(
        self, message: str = "You do not have access to this resource."
    ) -> None:
        self.message = message
        super().__init__(self.message)


class EventEnum(str, Enum):
    """
    Enum for the socket.io events emitted the server.
    """

    web_results = "web_results"
    medium_results = "medium_results"
    answer = "answer"
    # Chat history metadata
    metadata = "metadata"
    related_questions = "related_questions"
    thread_metadata = "thread_metadata"


class EventEmitter(Protocol):
    """
    A protocol for the EventEmitter class.
    """

    async def emit(self, event: str, data: Dict) -> None: ...


class QueryTags(TypedDict, total=False):
    """
    Represents the classification tags for a user query to determine the type of response required.

    Attributes:
        needs_search (bool): Indicates whether a search-based response is necessary. True means the query requires
                             external search data, potentially from a Retrieval-Augmented Generation (RAG) system,
                             while False suggests the LLM can answer based on its trained knowledge alone.
        needs_image (bool): True if the response to the query would benefit from including images.
        needs_video (bool): True if the response to the query would benefit from including videos.
        content_violation (bool): True if the query contains content that may violate guidelines or is considered harmful
                          or controversial.
        has_math (bool): True if the query involves mathematical content or requires mathematical understanding
                         or formulation.
    """

    needs_search: bool
    needs_image: bool
    needs_video: bool
    content_violation: bool
    has_math: bool


class EnrichedQuery(TypedDict, total=False):
    """
    A data structure that represents an enriched version of a user's query with additional metadata.

    Attributes:
        search_query (str): The search-optimized query string. This is generated to facilitate enhanced search
                            capabilities, even if the initial query does not require a search, ensuring readiness
                            for any necessary retrieval tasks.
        tags (Optional[QueryTags]): A dictionary of classification tags that provide detailed insights into
                            the nature of the query, such as whether it requires external search, involves images,
                            videos, contains potentially violating content, or involves mathematical computation.
                            The tags are optional and may not be present if the classification step is bypassed
                            or deemed unnecessary.
    """

    search_query: str
    tags: Optional[QueryTags]


class AgentInput(BaseModel):
    session_id: str = Field(..., description="A globally unique session ID")
    user_input: str = Field(..., description="The user's input")


class BaseAgent(ABC):
    """
    Provides a base class for all agents.
    """

    chat_messages: List[Dict]
    emitter: EventEmitter
    thread_id: str
    user_id: str

    def __init__(self, user_id: str, thread_id: str, emitter: EventEmitter) -> None:
        self.chat_messages = []
        self.chat_messages_loaded = False
        self.user_id = user_id
        self.thread_id = thread_id
        self.emitter = emitter

    async def emit_thread_metadata(self, metadata: ThreadMetadata) -> None:
        """
        Send the thread metadata to the frontend
        """
        await self.emitter.emit(
            EventEnum.thread_metadata.value,
            {
                "data": {
                    "created_at": metadata["created_at"],
                    "slug": metadata["slug"],
                    "name": metadata["name"],
                }
            },
        )

    async def emit_metadata(self, metadata: MetaData) -> None:
        """
        Send the chat history item metadata to the frontend.
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

    async def save_chat_history(
        self,
        user_message: str,
        answer: str,
        medium_results: TopResults,
        general_results: List[GeneralResult],
        metadata: MetaData,
    ) -> None:
        """
        Save the chat history to Redis.
        """
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

    async def load_chat_history(
        self, thread_id: str, roles: Optional[List[Literal["user", "assistant"]]] = None
    ) -> None:
        """
        Load the chat history for the current thread from Redis.

        We don't store system messages in the chat history, so we only load user and assistant messages.
        """
        if self.chat_messages_loaded:
            return

        if roles is None:
            roles = ["user", "assistant"]

        chat_store = ChatStore()

        chat_history = await chat_store.get_chat_history(thread_id)

        for m in chat_history:
            if "user" in roles:
                self.chat_messages.append({"role": "user", "content": m["query"]})
            if "assistant" in roles:
                self.chat_messages.append({"role": "assistant", "content": m["answer"]})

        self.chat_messages_loaded = True

    async def get_thread_metadata(self) -> Optional[ThreadMetadata]:
        chat_store = ChatStore()

        return await chat_store.get_thread_metadata(self.thread_id)

    async def upsert_thread_metadata(self, metadata: ThreadMetadata) -> None:
        chat_store = ChatStore()
        await chat_store.update_thread(self.thread_id, metadata)

    def append_message(self, role: str, content: str) -> None:
        self.chat_messages.append({"role": role, "content": content})

    def chat_history_to_string(
        self,
        roles: Optional[List[Literal["user", "assistant"]]] = None,
        turns: int = -1,
    ) -> str:
        if roles is None:
            roles = ["user", "assistant"]

        # If turns is -1, use all entries, otherwise limit to the specified number of turns from the end
        messages_to_include = (
            self.chat_messages if turns == -1 else self.chat_messages[-turns:]
        )

        return "\n".join(
            [
                f"{m['role']}: {m['content']}"
                for m in messages_to_include
                if m["role"] in roles
            ]
        )

    @abstractmethod
    async def run(self, user_message: str) -> None:
        pass
