import json
import os
from typing import List, TypedDict, Union

import redis.asyncio as redis

from sensei_search.logger import logger


class WebResult(TypedDict):
    url: str
    title: str
    content: str


class MediumVideo(TypedDict):
    url: str
    medium: str


class MediumImage(TypedDict):
    url: str
    image: str
    medium: str


class ChatHistory(TypedDict):
    id: str
    thread_id: str
    mediums: List[Union[MediumImage, MediumVideo]]
    web_results: List[WebResult]
    query: str
    answer: str


class ThreadMetadata(TypedDict):
    user_id: str
    created_at: str
    slug: str


class ChatStore:
    """
    This class is responsible for storing and fetching chat history using Redis.
    """

    _instance = None

    def __new__(cls, *args, **kwargs):
        # Ensure only one instance of ChatStore is created
        if not cls._instance:
            cls._instance = super(ChatStore, cls).__new__(cls, *args, **kwargs)
        return cls._instance

    def __init__(self):
        if not hasattr(self, "redis"):
            self.redis = redis.Redis(
                host=os.environ["REDIS_HOST"], port=6379, db=0, decode_responses=True
            )

    def _get_key(self, thread_id: str) -> str:
        return f"chat_thread:{thread_id}"

    async def create_thread(self, thread_id: str, metadata: ThreadMetadata):
        await self.redis.hset(f"thread_metadata:{thread_id}", mapping=metadata)

    async def get_thread_metadata(self, thread_id: str) -> ThreadMetadata:
        return await self.redis.hgetall(f"thread_metadata:{thread_id}")

    async def save_chat_history(self, thread_id: str, chat_history: ChatHistory):
        logger.info(f"Saving chat history for thread {thread_id}")
        # Here, we swallow the exception and log it. This is not ideal, but the goal
        # is to ensure users get a response even without the chat history being saved.
        try:
            await self.redis.rpush(self._get_key(thread_id), json.dumps(chat_history))
            logger.info(f"Chat history saved for thread {thread_id}")
        except Exception as e:
            logger.exception(e)

    async def get_chat_history(self, thread_id: str) -> List[ChatHistory]:
        # Here, we swallow the exception and log it. This is not ideal, but the goal
        # is to ensure users get a response even without the chat history context.
        try:
            chat_history_json = await self.redis.lrange(self._get_key(thread_id), 0, -1)
            return [json.loads(chat_history) for chat_history in chat_history_json]
        except Exception as e:
            logger.exception(e)
            return []
