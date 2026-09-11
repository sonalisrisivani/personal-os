from datetime import datetime, timezone

from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="Personal Career OS API", version="0.1.0")


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
