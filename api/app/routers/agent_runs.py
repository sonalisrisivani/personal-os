from __future__ import annotations

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..models import AgentRun, Project, Task, Goal
from ..schemas import AgentRunResponse, PaginatedResponse, AgentRunApprove
from ..services.activity import record_activity
from ..services.ai_agent import generate_suggestions

router = APIRouter(prefix="/agent-runs", tags=["agent-runs"])


@router.post("/goals/{goal_id}/suggestions", response_model=AgentRunResponse, status_code=201)
async def generate_goal_suggestions(
    goal_id: uuid.UUID,
    prompt: str,
    db: AsyncSession = Depends(get_db),
) -> AgentRunResponse:
    goal = await db.get(Goal, goal_id)
    if goal is None:
        raise HTTPException(status_code=404, detail="Goal not found")

    suggestion_data, model_provider = await generate_suggestions(
        project_title=goal.title,
        tech_stack="",  # goals don't have tech_stack, maybe priority/status?
        status=goal.status,
        prompt=prompt,
        context_type="goal"
    )

    agent_run = AgentRun(
        goal_id=goal.id,
        prompt=prompt,
        suggestion_data=suggestion_data,
        model_provider=model_provider,
        explanation=suggestion_data["explanation"],
        status="pending",
    )
    db.add(agent_run)
    await db.commit()
    await db.refresh(agent_run)

    await record_activity(
        db=db,
        event_type="agent_run.created",
        entity_type="agent_run",
        entity_id=agent_run.id,
        title=f"AI suggestions generated for goal '{goal.title}'",
        details=f"Provider: {model_provider}",
    )
    return AgentRunResponse.model_validate(agent_run)


@router.post("/projects/{project_id}/suggestions", response_model=AgentRunResponse, status_code=201)
async def generate_project_suggestions(
    project_id: uuid.UUID,
    prompt: str,
    db: AsyncSession = Depends(get_db),
) -> AgentRunResponse:
    project = await db.get(Project, project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")

    suggestion_data, model_provider = await generate_suggestions(
        project_title=project.title,
        tech_stack=project.tech_stack or "",
        status=project.status,
        prompt=prompt,
        context_type="project"
    )

    agent_run = AgentRun(
        project_id=project.id,
        prompt=prompt,
        suggestion_data=suggestion_data,
        model_provider=model_provider,
        explanation=suggestion_data["explanation"],
        status="pending",
    )
    db.add(agent_run)
    await db.commit()
    await db.refresh(agent_run)

    await record_activity(
        db=db,
        event_type="agent_run.created",
        entity_type="agent_run",
        entity_id=agent_run.id,
        title=f"AI suggestions generated for project '{project.title}'",
        details=f"Provider: {model_provider}",
    )
    return AgentRunResponse.model_validate(agent_run)


@router.get("", response_model=PaginatedResponse[AgentRunResponse])
async def list_agent_runs(
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> PaginatedResponse[AgentRunResponse]:
    q = select(AgentRun)
    if status:
        q = q.where(AgentRun.status == status)
    total_result = await db.execute(select(func.count()).select_from(q.subquery()))
    total = total_result.scalar_one()
    q = q.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(q)
    runs = result.scalars().all()
    return PaginatedResponse(
        items=[AgentRunResponse.model_validate(r) for r in runs],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{run_id}", response_model=AgentRunResponse)
async def get_agent_run(run_id: uuid.UUID, db: AsyncSession = Depends(get_db)) -> AgentRunResponse:
    run = await db.get(AgentRun, run_id)
    if run is None:
        raise HTTPException(status_code=404, detail="Agent run not found")
    return AgentRunResponse.model_validate(run)


@router.post("/{run_id}/approve", response_model=AgentRunResponse)
async def approve_agent_run(
    run_id: uuid.UUID,
    body: AgentRunApprove = AgentRunApprove(),
    db: AsyncSession = Depends(get_db)
) -> AgentRunResponse:
    run = await db.get(AgentRun, run_id)
    if run is None:
        raise HTTPException(status_code=404, detail="Agent run not found")
    if run.status != "pending":
        raise HTTPException(status_code=400, detail=f"Cannot approve run in status '{run.status}'")

    project = await db.get(Project, run.project_id) if run.project_id else None
    goal = await db.get(Goal, run.goal_id) if run.goal_id else None

    if not project and not goal:
        raise HTTPException(status_code=404, detail="Associated project or goal not found")

    # Create tasks from suggestions
    suggested_tasks = run.suggestion_data.get("suggested_tasks", [])

    # Filter if specific indices provided
    tasks_to_create = suggested_tasks
    if body.task_indices is not None:
        tasks_to_create = [
            task for i, task in enumerate(suggested_tasks)
            if i in body.task_indices
        ]

    for task_data in tasks_to_create:
        task = Task(
            goal_id=goal.id if goal else (project.goal_id if project else None),
            project_id=project.id if project else None,
            title=task_data.get("title", "Untitled task"),
            description=task_data.get("description"),
            priority=task_data.get("priority", 2),
            status="todo",
        )
        db.add(task)

    # Update run status
    run.status = "approved"

    await db.commit()
    await db.refresh(run)

    entity_name = project.title if project else goal.title

    await record_activity(
        db=db,
        event_type="agent_run.approved",
        entity_type="agent_run",
        entity_id=run.id,
        title=f"Approved AI suggestions for { 'project' if project else 'goal' } '{entity_name}'",
        details=f"Created {len(tasks_to_create)} tasks",
    )
    return AgentRunResponse.model_validate(run)


@router.post("/{run_id}/reject", response_model=AgentRunResponse)
async def reject_agent_run(run_id: uuid.UUID, db: AsyncSession = Depends(get_db)) -> AgentRunResponse:
    run = await db.get(AgentRun, run_id)
    if run is None:
        raise HTTPException(status_code=404, detail="Agent run not found")
    if run.status != "pending":
        raise HTTPException(status_code=400, detail=f"Cannot reject run in status '{run.status}'")

    project = await db.get(Project, run.project_id) if run.project_id else None
    goal = await db.get(Goal, run.goal_id) if run.goal_id else None

    run.status = "rejected"
    await db.commit()
    await db.refresh(run)

    entity_name = project.title if project else (goal.title if goal else 'Unknown')

    await record_activity(
        db=db,
        event_type="agent_run.rejected",
        entity_type="agent_run",
        entity_id=run.id,
        title=f"Rejected AI suggestions for {'project' if project else 'goal'} '{entity_name}'",
    )
    return AgentRunResponse.model_validate(run)