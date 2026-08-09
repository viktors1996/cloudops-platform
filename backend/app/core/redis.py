import redis.asyncio as redis

from app.core.config import settings

# Инициализируем асинхронный клиент Redis
redis_client = redis.Redis(
    host=settings.REDIS_HOST,
    port=settings.REDIS_PORT,
    decode_responses=True  # Автоматически декодирует байты в utf-8 строки
)

async def get_redis():
    return redis_client
