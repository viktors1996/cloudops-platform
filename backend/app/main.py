from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.core.config import settings
from app.database import Base, engine
from app.routes import health, tasks


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Действия при старте приложения: создаем таблицы в БД
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    # Действия при остановке приложения
    await engine.dispose()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

app.include_router(health.router, prefix=settings.API_V1_STR, tags=["Health"])
app.include_router(tasks.router, prefix=f"{settings.API_V1_STR}/tasks", tags=["Tasks"])

@app.get("/")
async def root():
    return {"message": "Welcome to CloudOps Platform API. Visit /docs for Swagger UI."}
