from __future__ import annotations

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_summary_metrics(client: AsyncClient) -> None:
    # Create goal
    await client.post("/goals", json={"title": "Goal 1", "status": "active"})
    # Create tasks
    await client.post("/tasks", json={"title": "Task 1", "status": "todo"})
    await client.post("/tasks", json={"title": "Task 2", "status": "done"})

    res = await client.get("/metrics/summary")
    assert res.status_code == 200
    data = res.json()
    assert "total_goals" in data
    assert "active_goals" in data
    assert "total_tasks" in data
    assert "done_tasks" in data
    assert data["total_goals"] >= 1
    assert data["total_tasks"] >= 2
    assert data["done_tasks"] >= 1
