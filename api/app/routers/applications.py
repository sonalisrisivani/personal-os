from __future__ import annotations

import os
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Query, Response, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..database import get_db
from ..models import ApplicationReminder, JobApplication
from ..schemas import (
    ApplicationReminderCreate,
    ApplicationReminderResponse,
    ApplicationReminderUpdate,
    EmailIngestPayload,
    JobApplicationCreate,
    JobApplicationResponse,
    JobApplicationUpdate,
    PaginatedResponse,
)
from ..services.activity import record_activity

router = APIRouter(prefix="/applications", tags=["applications"])

INGESTION_TOKEN = os.getenv("INGESTION_TOKEN", "personal-os-secret-token")


def verify_ingestion_token(
    authorization: Optional[str] = Header(None),
    x_api_key: Optional[str] = Header(None),
) -> None:
    token = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split("Bearer ", 1)[1]
    elif x_api_key:
        token = x_api_key

    if not token or token != INGESTION_TOKEN:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing authentication token",
        )


@router.post("", response_model=JobApplicationResponse, status_code=201)
async def create_application(
    body: JobApplicationCreate, db: AsyncSession = Depends(get_db)
) -> JobApplicationResponse:
    app = JobApplication(**body.model_dump())
    db.add(app)
    await db.commit()
    await db.refresh(app)
    await record_activity(
        db=db,
        event_type="application.created",
        entity_type="application",
        entity_id=app.id,
        title=f"Applied to {app.company} for {app.role}",
    )
    # Query with reminders loaded
    res = await db.execute(
        select(JobApplication)
        .options(selectinload(JobApplication.reminders))
        .where(JobApplication.id == app.id)
    )
    return JobApplicationResponse.model_validate(res.scalar_one())


@router.get("", response_model=PaginatedResponse[JobApplicationResponse])
async def list_applications(
    status: Optional[str] = None,
    company: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> PaginatedResponse[JobApplicationResponse]:
    q = select(JobApplication).options(selectinload(JobApplication.reminders))
    if status:
        q = q.where(JobApplication.status == status)
    if company:
        q = q.where(JobApplication.company.ilike(f"%{company}%"))

    count_q = select(func.count()).select_from(
        select(JobApplication.id)
        .where(
            *(
                [JobApplication.status == status] if status else []
            ),
            *(
                [JobApplication.company.ilike(f"%{company}%")] if company else []
            ),
        )
        .subquery()
    )
    total_result = await db.execute(count_q)
    total = total_result.scalar_one()

    q = q.order_by(JobApplication.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(q)
    apps = result.scalars().all()

    return PaginatedResponse(
        items=[JobApplicationResponse.model_validate(a) for a in apps],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{app_id}", response_model=JobApplicationResponse)
async def get_application(
    app_id: uuid.UUID, db: AsyncSession = Depends(get_db)
) -> JobApplicationResponse:
    res = await db.execute(
        select(JobApplication)
        .options(selectinload(JobApplication.reminders))
        .where(JobApplication.id == app_id)
    )
    app = res.scalar_one_or_none()
    if app is None:
        raise HTTPException(status_code=404, detail="Job application not found")
    return JobApplicationResponse.model_validate(app)


@router.patch("/{app_id}", response_model=JobApplicationResponse)
async def update_application(
    app_id: uuid.UUID,
    body: JobApplicationUpdate,
    db: AsyncSession = Depends(get_db),
) -> JobApplicationResponse:
    res = await db.execute(
        select(JobApplication)
        .options(selectinload(JobApplication.reminders))
        .where(JobApplication.id == app_id)
    )
    app = res.scalar_one_or_none()
    if app is None:
        raise HTTPException(status_code=404, detail="Job application not found")

    old_status = app.status
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(app, field, value)

    await db.commit()
    await db.refresh(app)

    event_type = "application.updated"
    if body.status and body.status != old_status:
        event_type = f"application.status_{body.status}"
        title = f"Updated status to {body.status} for {app.company} ({app.role})"
    else:
        title = f"Updated application: {app.company} ({app.role})"

    await record_activity(
        db=db,
        event_type=event_type,
        entity_type="application",
        entity_id=app.id,
        title=title,
    )
    return JobApplicationResponse.model_validate(app)


@router.delete("/{app_id}", status_code=204, response_class=Response)
async def delete_application(
    app_id: uuid.UUID, db: AsyncSession = Depends(get_db)
) -> Response:
    app = await db.get(JobApplication, app_id)
    if app is None:
        raise HTTPException(status_code=404, detail="Job application not found")
    company, role = app.company, app.role
    await db.delete(app)
    await db.commit()
    await record_activity(
        db=db,
        event_type="application.deleted",
        entity_type="application",
        entity_id=app_id,
        title=f"Deleted application for {company} ({role})",
    )
    return Response(status_code=204)


# --- Reminders ---

@router.post("/{app_id}/reminders", response_model=ApplicationReminderResponse, status_code=201)
async def create_reminder(
    app_id: uuid.UUID,
    body: ApplicationReminderCreate,
    db: AsyncSession = Depends(get_db),
) -> ApplicationReminderResponse:
    app = await db.get(JobApplication, app_id)
    if app is None:
        raise HTTPException(status_code=404, detail="Job application not found")

    reminder = ApplicationReminder(
        application_id=app_id,
        **body.model_dump(),
    )
    db.add(reminder)
    await db.commit()
    await db.refresh(reminder)
    await record_activity(
        db=db,
        event_type="reminder.created",
        entity_type="reminder",
        entity_id=reminder.id,
        title=f"Set reminder for {app.company}: {reminder.reminder_type}",
    )
    return ApplicationReminderResponse.model_validate(reminder)


@router.patch("/reminders/{reminder_id}", response_model=ApplicationReminderResponse)
async def update_reminder(
    reminder_id: uuid.UUID,
    body: ApplicationReminderUpdate,
    db: AsyncSession = Depends(get_db),
) -> ApplicationReminderResponse:
    reminder = await db.get(ApplicationReminder, reminder_id)
    if reminder is None:
        raise HTTPException(status_code=404, detail="Reminder not found")

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(reminder, field, value)

    await db.commit()
    await db.refresh(reminder)
    return ApplicationReminderResponse.model_validate(reminder)


# --- Idempotent Email Ingestion Webhook ---

@router.post(
    "/ingest",
    response_model=JobApplicationResponse,
    dependencies=[Depends(verify_ingestion_token)],
)
async def ingest_email(
    body: EmailIngestPayload,
    db: AsyncSession = Depends(get_db),
) -> JobApplicationResponse:
    # Check for existing application by external_id
    res = await db.execute(
        select(JobApplication)
        .options(selectinload(JobApplication.reminders))
        .where(JobApplication.external_id == body.external_id)
    )
    existing = res.scalar_one_or_none()

    if existing:
        # Update existing record idempotently
        existing.status = body.status or existing.status
        if body.notes:
            existing.notes = (existing.notes or "") + f"\n[Update]: {body.notes}"
        await db.commit()
        await db.refresh(existing)
        await record_activity(
            db=db,
            event_type="application.email_ingest_update",
            entity_type="application",
            entity_id=existing.id,
            title=f"Ingested email update for {existing.company}",
        )
        return JobApplicationResponse.model_validate(existing)

    # Create new application
    new_app = JobApplication(**body.model_dump())
    db.add(new_app)
    await db.commit()
    await db.refresh(new_app)
    await record_activity(
        db=db,
        event_type="application.email_ingest_created",
        entity_type="application",
        entity_id=new_app.id,
        title=f"Auto-ingested application: {new_app.company} ({new_app.role})",
    )
    res = await db.execute(
        select(JobApplication)
        .options(selectinload(JobApplication.reminders))
        .where(JobApplication.id == new_app.id)
    )
    return JobApplicationResponse.model_validate(res.scalar_one())
