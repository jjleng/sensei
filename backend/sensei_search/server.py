from __future__ import annotations

import asyncio
import os
from typing import Dict, List, Optional

import socketio  # type: ignore[import-untyped]
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from sensei_search.agents.shogun.agent_v2 import ShogunAgent
from sensei_search.base_agent import NoAccessError
from sensei_search.chat_store import ChatStore
from sensei_search.logger import logger
from sensei_search.models import ChatThread

env = os.getenv("ENV", "development")

origins: Optional[List[str]] = None

if env == "production":
    origins_env = os.getenv("CORS_ORIGINS", "")
    if origins_env:
        origins = origins_env.split(",")


class SocketIOEmitter:
    def __init__(self, sio: socketio.AsyncServer, sid: str):
        self.sio = sio
        self.sid = sid

    async def emit(self, event: str, data: Dict) -> None:
        await self.sio.emit(event, data, room=self.sid)


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if origins is None else origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins="*" if origins is None else origins,
)

sio_asgi_app = socketio.ASGIApp(socketio_server=sio, other_asgi_app=app)

# Add the Socket.IO routes
app.add_route("/socket.io/", route=sio_asgi_app, methods=["GET", "POST", "OPTIONS"])
app.add_websocket_route("/socket.io/", sio_asgi_app)


# Event handlers
@sio.event
async def connect(sid: str, environ: Dict) -> None:
    print(f"Client connected: {sid}")


@sio.event
async def disconnect(sid: str) -> None:
    print(f"Client disconnected: {sid}")


@sio.event
async def sensei_ask(sid: str, thread_id: str, user_query: str, user_id: str) -> None:
    """
    Handles the 'sensei_ask' event by creating a SamuraiAgent and running it.

    Args:
        sid (str): The session ID for the client's socket connection.
        thread_id (str): The ID of the conversation thread.
        user_query (str): The query from the user.
    """
    emitter = SocketIOEmitter(sio, sid)
    agent = ShogunAgent(emitter=emitter, thread_id=thread_id, user_id=user_id)

    async def run_agent() -> None:
        try:
            await agent.run(user_query)
        except NoAccessError as e:
            await sio.emit(
                "app_error",
                {"message": e.message},
                room=sid,
            )
        except Exception as e:
            logger.exception(e)
            await sio.emit(
                "app_error",
                {"message": "An error occurred while processing your request."},
                room=sid,
            )
        finally:
            # Disconnect the client after the conversation is complete
            await sio.disconnect(sid)

    asyncio.create_task(run_agent())


@app.get("/threads/{slug}")
async def get_thread(slug: str) -> ChatThread:
    """
    Fetches the chat history for a given thread.
    """
    logger.info(f"Fetching thread {slug}")

    thread_id = await ChatStore().get_thread_id_by_slug(slug)

    logger.info(f"Thread id for slug {slug} is {thread_id}")

    chat_store = ChatStore()

    chat_history, thread_metadata = await asyncio.gather(
        chat_store.get_chat_history(thread_id),
        chat_store.get_thread_metadata(thread_id),
    )
    # This won't happen in practice. If it does, clients will receive an error message.
    assert thread_metadata is not None
    return ChatThread(
        thread_id=thread_id, chat_history=chat_history, metadata=thread_metadata
    )


@app.get("/health")
async def health() -> Dict[str, str]:
    return {"status": "ok"}
