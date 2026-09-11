from __future__ import annotations

from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .database import Base, engine
from .routers.activities import router as activities_router
from .routers.applications import router as applications_router
from .routers.goals import router as goals_router
from .routers.metrics import router as metrics_router
from .routers.tasks import router as tasks_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(title="Personal OS API", version="0.1.0", lifespan=lifespan)

# Allow CORS for local frontend development and production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(goals_router)
app.include_router(tasks_router)
app.include_router(activities_router)
app.include_router(metrics_router)
app.include_router(applications_router)


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
