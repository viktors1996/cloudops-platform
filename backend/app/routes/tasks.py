from typing import Sequence

from fastapi import APIRouter, Depends, status
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.redis import get_redis
from app.database import get_db
from app.repositories.task import TaskRepository
from app.schemas.task import TaskCreate, TaskResponse, TaskUpdate
from app.services.task import TaskService

router = APIRouter()

def get_task_service(
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis)
) -> TaskService:
    repository = TaskRepository(db)
    return TaskService(repository, redis)

@router.get("/", response_model=Sequence[TaskResponse])
async def list_tasks(
    skip: int = 0,
    limit: int = 100,
    service: TaskService = Depends(get_task_service)
):
    return await service.get_tasks(skip=skip, limit=limit)

@router.post("/", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    task_in: TaskCreate,
    service: TaskService = Depends(get_task_service)
):
    return await service.create_task(task_in)

@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: int,
    service: TaskService = Depends(get_task_service)
):
    return await service.get_task_by_id(task_id)

@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: int,
    task_in: TaskUpdate,
    service: TaskService = Depends(get_task_service)
):
    return await service.update_task(task_id, task_in)

@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: int,
    service: TaskService = Depends(get_task_service)
):
    await service.delete_task(task_id)
