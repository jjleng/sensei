import asyncio
import os
from typing import Dict

import socketio  # type: ignore[import-untyped]
from fastapi import FastAPI

from sensei_search.agents import SamuraiAgent
from sensei_search.logger import logger


class SocketIOEmitter:
    def __init__(self, sio: socketio.AsyncServer, sid: str):
        self.sio = sio
        self.sid = sid

    async def emit(self, event: str, data: Dict):
        await self.sio.emit(event, data, room=self.sid)


app = FastAPI()

sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins=["http://sensei-frontend.default.52.24.120.109.sslip.io", "http://localhost", "http://localhost:3000"],
)

sio_asgi_app = socketio.ASGIApp(socketio_server=sio, other_asgi_app=app)

# Add the Socket.IO routes
app.add_route("/socket.io/", route=sio_asgi_app, methods=["GET", "POST", "OPTIONS"])
app.add_websocket_route("/socket.io/", sio_asgi_app)


# Event handlers
@sio.event
async def connect(sid, environ):
    print(f"Client connected: {sid}")


@sio.event
async def disconnect(sid):
    print(f"Client disconnected: {sid}")


@sio.event
async def sensei_ask(sid: str, thread_id: str, user_query: str):
    """
    Handles the 'sensei_ask' event by creating a SamuraiAgent and running it.

    Args:
        sid (str): The session ID for the client's socket connection.
        thread_id (str): The ID of the conversation thread.
        user_query (str): The query from the user.
    """
    emitter = SocketIOEmitter(sio, sid)
    agent = SamuraiAgent(emitter=emitter, thread_id=thread_id)

    async def run_agent():
        try:
            await agent.run(user_query)
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
