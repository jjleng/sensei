from __future__ import annotations

import json
from typing import Any, List, Optional

import redis.asyncio as redis

from sensei_search.config import REDIS_HOST
from sensei_search.logger import logger
from sensei_search.models import ChatHistoryItem, ThreadMetadata

CHAT_HISTORY_LIMIT = 3


class ChatStore:
    """
    This class is responsible for storing and fetching chat history using Redis.
    """

    _instance = None

    def __new__(cls, *args: Any, **kwargs: Any) -> ChatStore:
        # Ensure only one instance of ChatStore is created
        if not cls._instance:
            cls._instance = super(ChatStore, cls).__new__(cls, *args, **kwargs)
        return cls._instance

    def __init__(self) -> None:
        if not hasattr(self, "redis"):
            self.redis = redis.Redis(
                host=REDIS_HOST, port=6379, db=0, decode_responses=True
            )

    def _get_key(self, thread_id: str) -> str:
        return f"chat_thread:{thread_id}"

    async def create_thread(self, thread_id: str, metadata: ThreadMetadata) -> None:
        await self._awaitable_to_any(
            self.redis.hset(
                f"thread_metadata:{thread_id}",
                mapping={
                    **metadata,
                    "related_questions": json.dumps(metadata["related_questions"]),
                },
            )
        )
        slug = metadata.get("slug")
        if slug:
            await self._awaitable_to_any(
                self.redis.set(f"slug_to_thread_id:{slug}", thread_id)
            )

    async def get_thread_id_by_slug(self, slug: str) -> str:
        thread_id = await self._awaitable_to_any(
            self.redis.get(f"slug_to_thread_id:{slug}")
        )
        if not thread_id:
            raise ValueError(f"No thread found for slug: {slug}")
        return thread_id

    async def update_thread(self, thread_id: str, metadata: ThreadMetadata) -> None:
        await self.create_thread(thread_id, metadata)

    async def get_thread_metadata(self, thread_id: str) -> Optional[ThreadMetadata]:
        metadata = await self._awaitable_to_any(
            self.redis.hgetall(f"thread_metadata:{thread_id}")
        )
        if not metadata:
            return None
        metadata["related_questions"] = json.loads(metadata["related_questions"])
        return metadata

    async def save_chat_history(
        self, thread_id: str, chat_history: ChatHistoryItem
    ) -> None:
        logger.info(f"Saving chat history for thread {thread_id}")
        # Here, we swallow the exception and log it. This is not ideal, but the goal
        # is to ensure users get a response even without the chat history being saved.
        try:
            await self._awaitable_to_any(
                self.redis.rpush(self._get_key(thread_id), json.dumps(chat_history))
            )
            logger.info(f"Chat history saved for thread {thread_id}")
        except Exception as e:
            logger.exception(e)

    async def get_chat_history(
        self,
        thread_id: str,
        range_start: int = -1 * CHAT_HISTORY_LIMIT,
        range_end: int = -1,
    ) -> List[ChatHistoryItem]:
        # Here, we swallow the exception and log it. This is not ideal, but the goal
        # is to ensure users get a response even without the chat history context.
        try:
            logger.info(f"Load chat history for thread {thread_id}")
            chat_history_json = await self._awaitable_to_any(
                self.redis.lrange(self._get_key(thread_id), range_start, range_end)
            )
            return [json.loads(chat_history) for chat_history in chat_history_json]
        except Exception as e:
            logger.exception(e)
            return []

    @staticmethod
    async def _awaitable_to_any(awaitable: Any) -> Any:
        return await awaitable
