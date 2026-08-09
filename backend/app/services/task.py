from typing import Sequence

from fastapi import HTTPException, status
from redis.asyncio import Redis

from app.models import Task
from app.repositories.task import TaskRepository
from app.schemas.task import TaskCreate, TaskResponse, TaskUpdate


class TaskService:
    def __init__(self, repository: TaskRepository, redis: Redis):
        self.repository = repository
        self.redis = redis
        self.CACHE_TTL = 60  # Время жизни кэша в секундах

    async def get_tasks(self, skip: int = 0, limit: int = 100) -> Sequence[Task]:
        return await self.repository.get_all(skip=skip, limit=limit)

    async def get_task_by_id(self, task_id: int) -> TaskResponse:
        cache_key = f"task:{task_id}"

        # 1. Проверяем кэш в Redis
        cached_task = await self.redis.get(cache_key)
        if cached_task:
            # Cache Hit! Возвращаем Pydantic модель из закешированного JSON
            return TaskResponse.model_validate_json(cached_task)

        # 2. Cache Miss! Идем в PostgreSQL
        task = await self.repository.get_by_id(task_id)
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Task with id {task_id} not found"
            )

        # Преобразуем модель ORM в Pydantic для валидации и сериализации в JSON
        task_response = TaskResponse.model_validate(task)

        # 3. Записываем в Redis с TTL 60 сек
        await self.redis.setex(
            cache_key,
            self.CACHE_TTL,
            task_response.model_dump_json()
        )

        return task_response

    async def create_task(self, task_in: TaskCreate) -> Task:
        return await self.repository.create(task_in)

    async def update_task(self, task_id: int, task_in: TaskUpdate) -> Task:
        task = await self.repository.get_by_id(task_id)
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Task with id {task_id} not found"
            )
        updated_task = await self.repository.update(task, task_in)

        # Инвалидация кэша
        await self.redis.delete(f"task:{task_id}")
        return updated_task

    async def delete_task(self, task_id: int) -> None:
        task = await self.repository.get_by_id(task_id)
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Task with id {task_id} not found"
            )
        await self.repository.delete(task)

        # Инвалидация кэша
        await self.redis.delete(f"task:{task_id}")
