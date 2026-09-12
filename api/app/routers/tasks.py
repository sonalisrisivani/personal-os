from __future__ import annotations

import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..models import Task
from ..schemas import PaginatedResponse, TaskCreate, TaskResponse, TaskUpdate, TaskReorder
from ..services.activity import record_activity

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.post("", response_model=TaskResponse, status_code=201)
async def create_task(body: TaskCreate, db: AsyncSession = Depends(get_db)) -> TaskResponse:
    task = Task(**body.model_dump())
    db.add(task)
    await db.commit()
    await db.refresh(task)
    await record_activity(
        db=db,
        event_type="task.created",
        entity_type="task",
        entity_id=task.id,
        title=f"Created task: {task.title}",
    )
    return TaskResponse.model_validate(task)


@router.get("", response_model=PaginatedResponse[TaskResponse])
async def list_tasks(
    status: Optional[str] = None,
    goal_id: Optional[uuid.UUID] = None,
    project_id: Optional[uuid.UUID] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> PaginatedResponse[TaskResponse]:
    q = select(Task)
    if status:
        q = q.where(Task.status == status)
    if goal_id:
        q = q.where(Task.goal_id == goal_id)
    if project_id:
        q = q.where(Task.project_id == project_id)
    total_result = await db.execute(select(func.count()).select_from(q.subquery()))
    total = total_result.scalar_one()
    q = q.order_by(Task.order_index.asc(), Task.created_at.asc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(q)
    tasks = result.scalars().all()
    return PaginatedResponse(
        items=[TaskResponse.model_validate(t) for t in tasks],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(task_id: uuid.UUID, db: AsyncSession = Depends(get_db)) -> TaskResponse:
    task = await db.get(Task, task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return TaskResponse.model_validate(task)


@router.patch("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: uuid.UUID, body: TaskUpdate, db: AsyncSession = Depends(get_db)
) -> TaskResponse:
    task = await db.get(Task, task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    old_status = task.status
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(task, field, value)
    await db.commit()
    await db.refresh(task)
    event_type = "task.updated"
    if body.status and body.status != old_status:
        if body.status == "done":
            event_type = "task.completed"
    await record_activity(
        db=db,
        event_type=event_type,
        entity_type="task",
        entity_id=task.id,
        title=f"Updated task: {task.title}",
    )
    return TaskResponse.model_validate(task)


@router.delete("/{task_id}", status_code=204, response_class=Response)
async def delete_task(task_id: uuid.UUID, db: AsyncSession = Depends(get_db)) -> Response:
    task = await db.get(Task, task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    title = task.title
    await db.delete(task)
    await db.commit()
    await record_activity(
        db=db,
        event_type="task.deleted",
        entity_type="task",
        entity_id=task_id,
        title=f"Deleted task: {title}",
    )
    return Response(status_code=204)


@router.post("/reorder", response_model=List[TaskResponse])
async def reorder_tasks(
    body: TaskReorder,
    goal_id: Optional[uuid.UUID] = None,
    project_id: Optional[uuid.UUID] = None,
    db: AsyncSession = Depends(get_db)
) -> List[TaskResponse]:
    if not body.task_ids:
        return []
    # Fetch the tasks to update (only those belonging to the goal/project if specified)
    q = select(Task).where(Task.id.in_(body.task_ids))
    if goal_id:
        q = q.where(Task.goal_id == goal_id)
    if project_id:
        q = q.where(Task.project_id == project_id)
    result = await db.execute(q)
    tasks = result.scalars().all()
    # Create a mapping from task id to task for quick lookup
    task_map = {task.id: task for task in tasks}
    # Update order_index based on the position in the provided list
    for index, task_id in enumerate(body.task_ids):
        if task_id in task_map:
            task_map[task_id].order_index = index
    await db.commit()
    # Refresh and return updated tasks
    updated_tasks = []
    for task_id in body.task_ids:
        if task_id in task_map:
            await db.refresh(task_map[task_id])
            updated_tasks.append(task_map[task_id])
    return [TaskResponse.model_validate(t) for t in updated_tasks]
