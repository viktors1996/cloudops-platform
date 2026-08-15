import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from prometheus_client import Counter, Histogram, make_asgi_app

from app.core.config import settings
from app.database import Base, engine
from app.routes import health, tasks

HTTP_REQUESTS_TOTAL = Counter(
    "http_requests_total",
    "Total number of HTTP requests",
    ["method", "path", "status_code"],
)

HTTP_REQUEST_DURATION_SECONDS = Histogram(
    "http_request_duration_seconds",
    "HTTP request duration in seconds",
    ["method", "path"],
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield

    await engine.dispose()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)


@app.middleware("http")
async def prometheus_metrics(request: Request, call_next):
    if request.url.path.startswith("/metrics"):
        return await call_next(request)

    start_time = time.perf_counter()
    status_code = 500

    try:
        response = await call_next(request)
        status_code = response.status_code
        return response

    finally:
        duration = time.perf_counter() - start_time

        HTTP_REQUESTS_TOTAL.labels(
            method=request.method,
            path=request.url.path,
            status_code=str(status_code),
        ).inc()

        HTTP_REQUEST_DURATION_SECONDS.labels(
            method=request.method,
            path=request.url.path,
        ).observe(duration)


app.include_router(
    health.router,
    prefix=settings.API_V1_STR,
    tags=["Health"],
)

app.include_router(
    tasks.router,
    prefix=f"{settings.API_V1_STR}/tasks",
    tags=["Tasks"],
)


@app.get("/")
async def root():
    return {
        "message": "Welcome to CloudOps Platform API. Visit /docs for Swagger UI."
    }


metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)
