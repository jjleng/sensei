from abc import ABC, abstractmethod
from enum import Enum
from typing import Dict, List, Literal, Optional, Protocol

from pydantic import BaseModel, Field
from typing_extensions import TypedDict

from sensei_search.chat_store import ChatStore


class EventEnum(str, Enum):
    """
    Enum for the socket.io events emitted the server.
    """

    web_results = "web_results"
    medium_results = "medium_results"
    answer = "answer"
    metadata = "metadata"


class EventEmitter(Protocol):
    """
    A protocol for the EventEmitter class.
    """

    async def emit(self, event: str, data: Dict): ...


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

    def __init__(self, thread_id: str, emitter: EventEmitter):
        self.chat_messages = []
        self.chat_messages_loaded = False
        self.thread_id = thread_id
        self.emitter = emitter

    async def load_chat_history(
        self, thread_id: str, roles: Optional[List[Literal["user", "assistant"]]] = None
    ):
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
            if "assistnat" in roles:
                self.chat_messages.append({"role": "assistant", "content": m["answer"]})

        self.chat_messages_loaded = True

    def append_message(self, role: str, content: str):
        self.chat_messages.append({"role": role, "content": content})

    def chat_history_to_string(
        self, roles: Optional[List[Literal["user", "assistant"]]] = None
    ):
        if roles is None:
            roles = ["user", "assistant"]

        return "\n".join(
            [
                f"{m['role']}: {m['content']}"
                for m in self.chat_messages
                if m["role"] in roles
            ]
        )

    @abstractmethod
    async def run(self, user_message: str):
        pass
