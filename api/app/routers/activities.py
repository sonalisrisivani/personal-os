from __future__ import annotations

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..models import ActivityEvent
from ..schemas import ActivityEventResponse, PaginatedResponse

router = APIRouter(prefix="/activities", tags=["activities"])


@router.get("", response_model=PaginatedResponse[ActivityEventResponse])
async def list_activities(
    entity_type: Optional[str] = None,
    event_type: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> PaginatedResponse[ActivityEventResponse]:
    q = select(ActivityEvent).order_by(ActivityEvent.created_at.desc())
    if entity_type:
        q = q.where(ActivityEvent.entity_type == entity_type)
    if event_type:
        q = q.where(ActivityEvent.event_type == event_type)
    total_result = await db.execute(select(func.count()).select_from(q.subquery()))
    total = total_result.scalar_one()
    q = q.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(q)
    activities = result.scalars().all()
    return PaginatedResponse(
        items=[ActivityEventResponse.model_validate(a) for a in activities],
        total=total,
        page=page,
        page_size=page_size,
    )