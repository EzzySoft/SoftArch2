import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch
from core.main import main_app

client = TestClient(main_app)

@pytest.mark.asyncio
@patch("core.message_crud.connect_redis")
async def test_websocket_endpoint_positive(mock_connect_redis):
    mock_redis_instance = AsyncMock()
    mock_connect_redis.return_value = mock_redis_instance
    mock_redis_instance.get.return_value = b'{"0": ["Hello", 1628374653]}'
    
    async with client.websocket_connect("/messages/ws") as websocket:
        message = await websocket.receive_text()
        assert "Hello" in message

@pytest.mark.asyncio
@patch("core.message_crud.connect_redis")
async def test_websocket_endpoint_negative(mock_connect_redis):
    mock_connect_redis.side_effect = ConnectionError("Redis server offline")

    with pytest.raises(Exception):
        # Пытаемся установить соединение, ожидая, что это вызовет исключение
        with client.websocket_connect("/messages/ws") as websocket:
            # Эта строка не будет выполнена, так как ожидается исключение
            await websocket.receive_text()

