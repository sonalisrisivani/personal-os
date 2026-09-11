from __future__ import annotations

import uuid
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_and_get_task(client: AsyncClient):
    # First create a goal
    goal_res = await client.post("/goals", json={"title": "Main Goal"})
    goal_id = goal_res.json()["id"]

    payload = {
        "goal_id": goal_id,
        "title": "Do task 1",
        "description": "Details about task 1",
        "status": "todo",
        "priority": 2,
        "due_date": "2026-10-15",
    }
    response = await client.post("/tasks", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Do task 1"
    assert data["goal_id"] == goal_id
    assert data["priority"] == 2
    task_id = data["id"]

    # Get task
    get_res = await client.get(f"/tasks/{task_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == task_id


@pytest.mark.asyncio
async def test_list_and_filter_tasks(client: AsyncClient):
    goal_res = await client.post("/goals", json={"title": "Goal for tasks"})
    goal_id = goal_res.json()["id"]

    await client.post("/tasks", json={"title": "Task 1", "status": "todo", "goal_id": goal_id})
    await client.post("/tasks", json={"title": "Task 2", "status": "done"})

    # List all
    res = await client.get("/tasks")
    assert res.status_code == 200
    assert res.json()["total"] == 2

    # Filter status
    res_status = await client.get("/tasks?status=todo")
    assert res_status.status_code == 200
    assert res_status.json()["total"] == 1
    assert res_status.json()["items"][0]["title"] == "Task 1"

    # Filter goal_id
    res_goal = await client.get(f"/tasks?goal_id={goal_id}")
    assert res_goal.status_code == 200
    assert res_goal.json()["total"] == 1
    assert res_goal.json()["items"][0]["title"] == "Task 1"


@pytest.mark.asyncio
async def test_update_and_delete_task(client: AsyncClient):
    res = await client.post("/tasks", json={"title": "Old Task"})
    task_id = res.json()["id"]

    # Patch
    patch_res = await client.patch(f"/tasks/{task_id}", json={"title": "New Task", "status": "in_progress"})
    assert patch_res.status_code == 200
    assert patch_res.json()["title"] == "New Task"
    assert patch_res.json()["status"] == "in_progress"

    # Delete
    del_res = await client.delete(f"/tasks/{task_id}")
    assert del_res.status_code == 204

    # Get after delete
    get_res = await client.get(f"/tasks/{task_id}")
    assert get_res.status_code == 404


@pytest.mark.asyncio
async def test_get_nonexistent_task(client: AsyncClient):
    random_id = str(uuid.uuid4())
    res = await client.get(f"/tasks/{random_id}")
    assert res.status_code == 404
