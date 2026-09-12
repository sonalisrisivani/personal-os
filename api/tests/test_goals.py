from __future__ import annotations

import uuid
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_and_get_goal(client: AsyncClient):
    payload = {
        "title": "Learn Rust",
        "description": "Master systems programming",
        "status": "active",
        "priority": 1,
        "due_date": "2026-12-31",
    }
    response = await client.post("/goals", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Learn Rust"
    assert data["status"] == "active"
    assert data["priority"] == 1
    assert data["due_date"] == "2026-12-31"
    goal_id = data["id"]

    # Get goal
    get_res = await client.get(f"/goals/{goal_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == goal_id


@pytest.mark.asyncio
async def test_create_goal_with_empty_due_date(client: AsyncClient):
    payload = {
        "title": "Daily Meditation",
        "description": "15 minutes mindfulness",
        "status": "active",
        "priority": 2,
        "due_date": "",
    }
    response = await client.post("/goals", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Daily Meditation"
    assert data["due_date"] is None


@pytest.mark.asyncio
async def test_list_and_filter_goals(client: AsyncClient):
    await client.post("/goals", json={"title": "Goal 1", "status": "active"})
    await client.post("/goals", json={"title": "Goal 2", "status": "completed"})

    # List all
    res = await client.get("/goals")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] == 2
    assert len(data["items"]) == 2

    # Filter status
    res_filtered = await client.get("/goals?status=active")
    assert res_filtered.status_code == 200
    data_filtered = res_filtered.json()
    assert data_filtered["total"] == 1
    assert data_filtered["items"][0]["title"] == "Goal 1"


@pytest.mark.asyncio
async def test_update_and_delete_goal(client: AsyncClient):
    res = await client.post("/goals", json={"title": "Old Title"})
    goal_id = res.json()["id"]

    # Patch
    patch_res = await client.patch(f"/goals/{goal_id}", json={"title": "New Title", "status": "completed"})
    assert patch_res.status_code == 200
    assert patch_res.json()["title"] == "New Title"
    assert patch_res.json()["status"] == "completed"

    # Delete
    del_res = await client.delete(f"/goals/{goal_id}")
    assert del_res.status_code == 204

    # Get after delete
    get_res = await client.get(f"/goals/{goal_id}")
    assert get_res.status_code == 404


@pytest.mark.asyncio
async def test_get_nonexistent_goal(client: AsyncClient):
    random_id = str(uuid.uuid4())
    res = await client.get(f"/goals/{random_id}")
    assert res.status_code == 404


@pytest.mark.asyncio
async def test_goal_suggestion_and_approval(client: AsyncClient):
    # 1. Create a personal goal
    goal_res = await client.post(
        "/goals",
        json={"title": "Fat Loss & Routine", "description": "Achieve 15% body fat with clean diet and cardio", "priority": 1},
    )
    assert goal_res.status_code == 201
    goal_id = goal_res.json()["id"]

    # 2. Request AI coach suggestions
    sugg_res = await client.post(
        f"/agent-runs/goals/{goal_id}/suggestions",
        params={"prompt": "Focus on daily workout routines and meal prep"},
    )
    assert sugg_res.status_code == 201
    run_data = sugg_res.json()
    assert run_data["goal_id"] == goal_id
    assert run_data["status"] == "pending"
    assert "suggested_tasks" in run_data["suggestion_data"]
    assert len(run_data["suggestion_data"]["suggested_tasks"]) > 0
    run_id = run_data["id"]

    # 3. Approve AI suggestion
    approve_res = await client.post(f"/agent-runs/{run_id}/approve")
    assert approve_res.status_code == 200
    assert approve_res.json()["status"] == "approved"

    # 4. Verify tasks created and linked to goal
    tasks_res = await client.get(f"/tasks?goal_id={goal_id}")
    assert tasks_res.status_code == 200
    tasks = tasks_res.json()["items"]
    assert len(tasks) > 0
    assert tasks[0]["goal_id"] == goal_id
