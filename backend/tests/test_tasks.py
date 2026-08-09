import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.mark.asyncio
async def test_create_task_validation_error():
    # Проверяем, что передача пустых данных вызывает ошибку валидации 422
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as ac:
        response = await ac.post("/api/v1/tasks/", json={})

    assert response.status_code == 422
