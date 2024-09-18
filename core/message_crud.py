import redis.asyncio as redis
import json


async def connect_redis():
    redis_client = redis.Redis(host="localhost", port=6379, db=0)
    await redis_client.setnx("counter", 0)
    return redis_client


async def get_counter(redis_client: redis.Redis) -> int:
    return int(await redis_client.get("counter"))


async def update_counter(redis_client: redis.Redis):
    await redis_client.incr("counter")


async def set_value(redis_client, id, message, time: int):
    data = json.dumps({id: [message, time]})
    await redis_client.set(id, data)


async def get_value(redis_client, id):
    value = await redis_client.get(id)
    return json.loads(value) if value else None


async def get_chat_messages(redis_client: redis.Redis):
    old_messages = {}
    counter = await get_counter(redis_client)
    for i in range(counter):
        old_messages[i]: dict = str(await get_value(redis_client, i)).replace("'", '"')

    return old_messages
