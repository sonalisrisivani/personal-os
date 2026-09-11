from __future__ import annotations

import uuid
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_and_get_project(client: AsyncClient):
    payload = {
        "title": "Personal OS",
        "description": "An open source personal operating system",
        "status": "active",
        "tech_stack": "Next.js, FastAPI, SQLite",
        "repo_url": "https://github.com/example/personal-os",
    }
    response = await client.post("/projects", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Personal OS"
    assert data["status"] == "active"
    assert data["tech_stack"] == "Next.js, FastAPI, SQLite"
    project_id = data["id"]

    # Get project
    get_res = await client.get(f"/projects/{project_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == project_id


@pytest.mark.asyncio
async def test_list_and_filter_projects(client: AsyncClient):
    await client.post("/projects", json={"title": "Project 1", "status": "active"})
    await client.post("/projects", json={"title": "Project 2", "status": "completed"})

    # List all
    res = await client.get("/projects")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] == 2
    assert len(data["items"]) == 2

    # Filter status
    res_filtered = await client.get("/projects?status=active")
    assert res_filtered.status_code == 200
    data_filtered = res_filtered.json()
    assert data_filtered["total"] == 1
    assert data_filtered["items"][0]["title"] == "Project 1"


@pytest.mark.asyncio
async def test_update_and_delete_project(client: AsyncClient):
    res = await client.post("/projects", json={"title": "Old Project Title"})
    project_id = res.json()["id"]

    # Patch
    patch_res = await client.patch(
        f"/projects/{project_id}",
        json={"title": "New Project Title", "status": "in_progress"},
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["title"] == "New Project Title"
    assert patch_res.json()["status"] == "in_progress"

    # Delete
    del_res = await client.delete(f"/projects/{project_id}")
    assert del_res.status_code == 204

    # Get after delete
    get_res = await client.get(f"/projects/{project_id}")
    assert get_res.status_code == 404


@pytest.mark.asyncio
async def test_generate_suggestions_and_approval_workflow(client: AsyncClient):
    # Create project
    proj_res = await client.post(
        "/projects",
        json={
            "title": "AI Agent Dashboard",
            "tech_stack": "FastAPI, React, PostgreSQL",
            "status": "active",
        },
    )
    project_id = proj_res.json()["id"]

    # Generate suggestions
    sug_res = await client.post(
        f"/agent-runs/projects/{project_id}/suggestions?prompt=Help%20me%20break%20down%20features"
    )
    assert sug_res.status_code == 201
    sug_data = sug_res.json()
    assert sug_data["project_id"] == project_id
    assert sug_data["status"] == "pending"
    assert "suggested_tasks" in sug_data["suggestion_data"]
    assert len(sug_data["suggestion_data"]["suggested_tasks"]) > 0
    assert sug_data["explanation"] != ""
    run_id = sug_data["id"]

    # Approve run
    appr_res = await client.post(f"/agent-runs/{run_id}/approve")
    assert appr_res.status_code == 200
    assert appr_res.json()["status"] == "approved"

    # Verify tasks were created
    tasks_res = await client.get("/tasks")
    assert tasks_res.status_code == 200
    tasks = tasks_res.json()["items"]
    assert len(tasks) >= len(sug_data["suggestion_data"]["suggested_tasks"])


@pytest.mark.asyncio
async def test_reject_suggestion_workflow(client: AsyncClient):
    # Create project
    proj_res = await client.post("/projects", json={"title": "Reject Test", "status": "active"})
    project_id = proj_res.json()["id"]

    # Generate suggestions
    sug_res = await client.post(
        f"/agent-runs/projects/{project_id}/suggestions?prompt=Next%20steps"
    )
    assert sug_res.status_code == 201
    run_id = sug_res.json()["id"]

    # Reject run
    rej_res = await client.post(f"/agent-runs/{run_id}/reject")
    assert rej_res.status_code == 200
    assert rej_res.json()["status"] == "rejected"
