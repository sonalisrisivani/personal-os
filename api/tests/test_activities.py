from __future__ import annotations

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_activity_logged_on_goal_creation(client: AsyncClient) -> None:
    res = await client.post(
        "/goals",
        json={"title": "Test Activity Goal", "status": "active", "priority": 1},
    )
    assert res.status_code == 201

    act_res = await client.get("/activities")
    assert act_res.status_code == 200
    data = act_res.json()
    assert data["total"] >= 1
    assert any("Test Activity Goal" in item["title"] for item in data["items"])


@pytest.mark.asyncio
async def test_activity_logged_on_task_creation(client: AsyncClient) -> None:
    res = await client.post(
        "/tasks",
        json={"title": "Test Activity Task", "status": "todo", "priority": 2},
    )
    assert res.status_code == 201

    act_res = await client.get("/activities?entity_type=task")
    assert act_res.status_code == 200
    data = act_res.json()
    assert any("Test Activity Task" in item["title"] for item in data["items"])
