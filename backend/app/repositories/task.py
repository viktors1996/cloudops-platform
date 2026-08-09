from typing import Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Task
from app.schemas.task import TaskCreate, TaskUpdate


class TaskRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_all(self, skip: int = 0, limit: int = 100) -> Sequence[Task]:
        query = select(Task).offset(skip).limit(limit)
        result = await self.session.execute(query)
        return result.scalars().all()

    async def get_by_id(self, task_id: int) -> Task | None:
        query = select(Task).where(Task.id == task_id)
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def create(self, task_in: TaskCreate) -> Task:
        db_task = Task(**task_in.model_dump())
        self.session.add(db_task)
        await self.session.commit()
        await self.session.refresh(db_task)
        return db_task

    async def update(self, db_task: Task, task_in: TaskUpdate) -> Task:
        update_data = task_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_task, field, value)
        await self.session.commit()
        await self.session.refresh(db_task)
        return db_task

    async def delete(self, db_task: Task) -> None:
        await self.session.delete(db_task)
        await self.session.commit()
