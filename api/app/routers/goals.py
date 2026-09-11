from __future__ import annotations

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..models import Goal
from ..schemas import GoalCreate, GoalResponse, GoalUpdate, PaginatedResponse
from ..services.activity import record_activity

router = APIRouter(prefix="/goals", tags=["goals"])


@router.post("", response_model=GoalResponse, status_code=201)
async def create_goal(body: GoalCreate, db: AsyncSession = Depends(get_db)) -> GoalResponse:
    goal = Goal(**body.model_dump())
    db.add(goal)
    await db.commit()
    await db.refresh(goal)
    await record_activity(
        db=db,
        event_type="goal.created",
        entity_type="goal",
        entity_id=goal.id,
        title=f"Created goal: {goal.title}",
    )
    return GoalResponse.model_validate(goal)


@router.get("", response_model=PaginatedResponse[GoalResponse])
async def list_goals(
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> PaginatedResponse[GoalResponse]:
    q = select(Goal)
    if status:
        q = q.where(Goal.status == status)
    total_result = await db.execute(select(func.count()).select_from(q.subquery()))
    total = total_result.scalar_one()
    q = q.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(q)
    goals = result.scalars().all()
    return PaginatedResponse(
        items=[GoalResponse.model_validate(g) for g in goals],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{goal_id}", response_model=GoalResponse)
async def get_goal(goal_id: uuid.UUID, db: AsyncSession = Depends(get_db)) -> GoalResponse:
    goal = await db.get(Goal, goal_id)
    if goal is None:
        raise HTTPException(status_code=404, detail="Goal not found")
    return GoalResponse.model_validate(goal)


@router.patch("/{goal_id}", response_model=GoalResponse)
async def update_goal(
    goal_id: uuid.UUID, body: GoalUpdate, db: AsyncSession = Depends(get_db)
) -> GoalResponse:
    goal = await db.get(Goal, goal_id)
    if goal is None:
        raise HTTPException(status_code=404, detail="Goal not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(goal, field, value)
    await db.commit()
    await db.refresh(goal)
    await record_activity(
        db=db,
        event_type="goal.updated",
        entity_type="goal",
        entity_id=goal.id,
        title=f"Updated goal: {goal.title}",
    )
    return GoalResponse.model_validate(goal)


@router.delete("/{goal_id}", status_code=204, response_class=Response)
async def delete_goal(goal_id: uuid.UUID, db: AsyncSession = Depends(get_db)) -> Response:
    goal = await db.get(Goal, goal_id)
    if goal is None:
        raise HTTPException(status_code=404, detail="Goal not found")
    title = goal.title
    await db.delete(goal)
    await db.commit()
    await record_activity(
        db=db,
        event_type="goal.deleted",
        entity_type="goal",
        entity_id=goal_id,
        title=f"Deleted goal: {title}",
    )
    return Response(status_code=204)
