from datetime import datetime
from typing import List

from fastapi import (
    APIRouter,
    WebSocketDisconnect,
    WebSocket,
)

from core import message_crud

router = APIRouter()


class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except WebSocketDisconnect:
                self.disconnect(connection)


manager = ConnectionManager()


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)

    redis_session = await message_crud.connect_redis()
    old_messages = await message_crud.get_chat_messages(redis_session)

    for key, value in old_messages.items():
        await websocket.send_text(str(value))

    try:
        while True:
            data = await websocket.receive_text()
            message_time = int(datetime.now().timestamp())

            await message_crud.set_value(
                redis_session,
                await message_crud.get_counter(redis_session),
                data,
                message_time,
            )

            await manager.broadcast(
                "{"
                f'"{await message_crud.get_counter(redis_session)}": ["{str(data)}", {message_time}]'
                "}"
            )
            await message_crud.update_counter(redis_session)
    except WebSocketDisconnect:
        manager.disconnect(websocket)


@router.get("/count")
async def get_count():
    redis_session = await message_crud.connect_redis()
    return await message_crud.get_counter(redis_session)
