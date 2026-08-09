from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


# Общая схема для чтения/записи
class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    is_completed: bool = False

# Схема для создания задачи (POST)
class TaskCreate(TaskBase):
    pass

# Схема для обновления задачи (PUT/PATCH)
class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    is_completed: Optional[bool] = None

# Схема ответа API (Response)
class TaskResponse(TaskBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
