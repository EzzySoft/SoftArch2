from datetime import datetime
from typing import List
from redis import exceptions as redis_exceptions
from fastapi import (
    APIRouter,
    WebSocketDisconnect,
    WebSocket,
)
from redis.exceptions import ConnectionError

import message_crud

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
    try:
        await manager.connect(websocket)

        redis_session = await message_crud.connect_redis()
        old_messages = await message_crud.get_chat_messages(redis_session)

        for key, value in old_messages.items():
            await websocket.send_text("{" '"ok":' f"{str(value)}" "}")
    except ConnectionError:
        manager.disconnect(websocket)
        await websocket.send_json({"error": "Redis server offline"})
        await websocket.close()
        return

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
                '"ok":'
                "{"
                f'"{await message_crud.get_counter(redis_session)}": ["{str(data)}", {message_time}]'
                "}"
                "}"
            )
            await message_crud.update_counter(redis_session)
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except ConnectionError:
        manager.disconnect(websocket)
        await websocket.send_json({"error": "Redis server offline"})
        await websocket.close()
        return


@router.get("/count")
async def get_count():
    try:
        redis_session = await message_crud.connect_redis()
        return {"ok": f"{await message_crud.get_counter(redis_session)}"}
    except redis_exceptions.ConnectionError:
        return {"error": "Redis server offline"}
