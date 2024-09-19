import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch
from core.main import main_app

client = TestClient(main_app)


@patch("core.message_crud.connect_redis")
def test_websocket_endpoint_negative(mock_connect_redis):
    mock_connect_redis.side_effect = ConnectionError("Redis server offline")

    with pytest.raises(Exception):
        with client.websocket_connect("/ws") as websocket:
            websocket.receive_text()
