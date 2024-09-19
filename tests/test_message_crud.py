import pytest
from unittest.mock import AsyncMock, patch
from core import message_crud

@pytest.mark.asyncio
@patch("core.message_crud.redis.Redis")
async def test_get_counter_positive(mock_redis):
    # Настройка Mock
    mock_redis_instance = AsyncMock()
    mock_redis_instance.get.return_value = b'5'
    mock_redis.return_value = mock_redis_instance

    # Вызов функции
    counter = await message_crud.get_counter(mock_redis_instance)

    # Проверка
    assert counter == 5

@pytest.mark.asyncio
@patch("core.message_crud.redis.Redis")
async def test_get_counter_negative(mock_redis):
    # Настройка Mock
    mock_redis_instance = AsyncMock()
    mock_redis_instance.get.return_value = None
    mock_redis.return_value = mock_redis_instance

    # Вызов функции
    counter = await message_crud.get_counter(mock_redis_instance)

    # Проверка
    assert counter == 0

@pytest.mark.asyncio
@patch("core.message_crud.redis.Redis")
async def test_set_value_positive(mock_redis):
    # Настройка Mock
    mock_redis_instance = AsyncMock()
    mock_redis.return_value = mock_redis_instance

    # Вызов функции
    await message_crud.set_value(mock_redis_instance, '1', 'Test message', 1234567890)

    # Проверка
    mock_redis_instance.set.assert_called_once_with('1', '{"1": ["Test message", 1234567890]}')

@pytest.mark.asyncio
@patch("core.message_crud.redis.Redis")
async def test_get_value_positive(mock_redis):
    # Настройка Mock
    mock_redis_instance = AsyncMock()
    mock_redis_instance.get.return_value = b'{"1": ["Test message", 1234567890]}'
    mock_redis.return_value = mock_redis_instance

    # Вызов функции
    value = await message_crud.get_value(mock_redis_instance, '1')

    # Проверка
    assert value == {"1": ["Test message", 1234567890]}

@pytest.mark.asyncio
@patch("core.message_crud.redis.Redis")
async def test_get_value_negative(mock_redis):
    # Настройка Mock
    mock_redis_instance = AsyncMock()
    mock_redis_instance.get.return_value = None
    mock_redis.return_value = mock_redis_instance

    # Вызов функции
    value = await message_crud.get_value(mock_redis_instance, '1')

    # Проверка
    assert value is None
