from __future__ import annotations

from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI
from pydantic import BaseModel

from .database import Base, engine
from .routers.activities import router as activities_router
from .routers.goals import router as goals_router
from .routers.metrics import router as metrics_router
from .routers.tasks import router as tasks_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(title="Personal OS API", version="0.1.0", lifespan=lifespan)
app.include_router(goals_router)
app.include_router(tasks_router)
app.include_router(activities_router)
app.include_router(metrics_router)


class HealthResponse(BaseModel):
    status: str
    service: str
    timestamp: datetime


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(
        status="ok",
        service="api",
        timestamp=datetime.now(timezone.utc),
    )
