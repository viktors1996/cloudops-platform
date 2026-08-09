from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings

# Создаем асинхронный движок SQLAlchemy
engine = create_async_engine(
    settings.ASYNC_DATABASE_URI,
    echo=settings.DEBUG,  # Автоматически отключается, если DEBUG=False
    future=True
)

# Фабрика асинхронных сессий
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False
)

# Базовый класс для моделей
class Base(DeclarativeBase):
    pass

# Dependency для FastAPI (получение сессии БД на каждый запрос)
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session

