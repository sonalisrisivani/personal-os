from __future__ import annotations

import pytest
from httpx import AsyncClient

from app.routers.applications import INGESTION_TOKEN


@pytest.mark.asyncio
async def test_crud_job_application(client: AsyncClient) -> None:
    # Create
    body = {
        "company": "Anthropic",
        "role": "Engineer",
    }
    res = await client.post("/applications", json=body)
    assert res.status_code == 201
    app_id = res.json()["id"]

    # List
    ls_res = await client.get("/applications")
    assert ls_res.status_code == 200
    assert ls_res.json()["total"] >= 1

    # Get
    get_res = await client.get(f"/applications/{app_id}")
    assert get_res.status_code == 200
    assert get_res.json()["company"] == "Anthropic"

    # Update
    patch_res = await client.patch(f"/applications/{app_id}", json={"status": "interviewing"})
    assert patch_res.status_code == 200
    assert patch_res.json()["status"] == "interviewing"

    # Delete
    del_res = await client.delete(f"/applications/{app_id}")
    assert del_res.status_code == 204


@pytest.mark.asyncio
async def test_application_reminders(client: AsyncClient) -> None:
    body = {
        "company": "DeepMind",
        "role": "Researcher",
    }
    app_res = await client.post("/applications", json=body)
    app_id = app_res.json()["id"]

    # Create reminder
    rem_body = {
        "reminder_type": "follow_up",
        "due_date": "2026-10-01T10:00:00Z"
    }
    rem_res = await client.post(f"/applications/{app_id}/reminders", json=rem_body)
    assert rem_res.status_code == 201
    rem_id = rem_res.json()["id"]

    # Update reminder
    patch_res = await client.patch(f"/applications/reminders/{rem_id}", json={"is_completed": True})
    assert patch_res.status_code == 200
    assert patch_res.json()["is_completed"] is True


@pytest.mark.asyncio
async def test_ingest_email_webhook(client: AsyncClient) -> None:
    ingest_body = {
        "external_id": "msg-123",
        "company": "Google",
        "role": "SWE",
        "status": "applied",
        "source": "email_ingest"
    }

    # Should fail without token
    res_fail = await client.post("/applications/ingest", json=ingest_body)
    assert res_fail.status_code == 401

    # With token it should succeed
    res_ok = await client.post(
        "/applications/ingest",
        json=ingest_body,
        headers={"Authorization": f"Bearer {INGESTION_TOKEN}"}
    )
    assert res_ok.status_code == 200
    app_id = res_ok.json()["id"]

    # Ingesting same external_id should update
    update_body = {
        "external_id": "msg-123",
        "company": "Google",
        "role": "SWE",
        "status": "interviewing",
        "notes": "Invited for onsite",
        "source": "email_ingest"
    }
    res_up = await client.post(
        "/applications/ingest",
        json=update_body,
        headers={"Authorization": f"Bearer {INGESTION_TOKEN}"}
    )
    assert res_up.status_code == 200
    assert res_up.json()["id"] == app_id
    assert res_up.json()["status"] == "interviewing"
    assert "Invited for onsite" in res_up.json()["notes"]
