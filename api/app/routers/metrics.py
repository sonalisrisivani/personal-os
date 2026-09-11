from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..models import Goal, JobApplication, Project, Task
from ..schemas import SummaryMetricsResponse

router = APIRouter(prefix="/metrics", tags=["metrics"])


@router.get("/summary", response_model=SummaryMetricsResponse)
async def get_summary_metrics(db: AsyncSession = Depends(get_db)) -> SummaryMetricsResponse:
    # Goals metrics
    total_goals_res = await db.execute(select(func.count()).select_from(Goal))
    total_goals = total_goals_res.scalar_one()

    active_goals_res = await db.execute(
        select(func.count()).select_from(Goal).where(Goal.status == "active")
    )
    active_goals = active_goals_res.scalar_one()

    completed_goals_res = await db.execute(
        select(func.count()).select_from(Goal).where(Goal.status == "completed")
    )
    completed_goals = completed_goals_res.scalar_one()

    archived_goals_res = await db.execute(
        select(func.count()).select_from(Goal).where(Goal.status == "archived")
    )
    archived_goals = archived_goals_res.scalar_one()

    # Tasks metrics
    total_tasks_res = await db.execute(select(func.count()).select_from(Task))
    total_tasks = total_tasks_res.scalar_one()

    pending_tasks_res = await db.execute(
        select(func.count()).select_from(Task).where(Task.status == "todo")
    )
    pending_tasks = pending_tasks_res.scalar_one()

    in_progress_tasks_res = await db.execute(
        select(func.count()).select_from(Task).where(Task.status == "in_progress")
    )
    in_progress_tasks = in_progress_tasks_res.scalar_one()

    done_tasks_res = await db.execute(
        select(func.count()).select_from(Task).where(Task.status == "done")
    )
    done_tasks = done_tasks_res.scalar_one()

    today = date.today()
    overdue_tasks_res = await db.execute(
        select(func.count())
        .select_from(Task)
        .where(Task.status != "done", Task.due_date < today)
    )
    overdue_tasks = overdue_tasks_res.scalar_one()

    # Applications metrics
    total_applications_res = await db.execute(select(func.count()).select_from(JobApplication))
    total_applications = total_applications_res.scalar_one()

    active_applications_res = await db.execute(
        select(func.count()).select_from(JobApplication).where(JobApplication.status.in_(["applied", "screening", "interviewing", "offered"]))
    )
    active_applications = active_applications_res.scalar_one()

    # Projects metrics
    total_projects_res = await db.execute(select(func.count()).select_from(Project))
    total_projects = total_projects_res.scalar_one()

    active_projects_res = await db.execute(
        select(func.count()).select_from(Project).where(Project.status.in_(["active", "in_progress"]))
    )
    active_projects = active_projects_res.scalar_one()

    return SummaryMetricsResponse(
        total_goals=total_goals,
        active_goals=active_goals,
        completed_goals=completed_goals,
        archived_goals=archived_goals,
        total_tasks=total_tasks,
        pending_tasks=pending_tasks,
        in_progress_tasks=in_progress_tasks,
        done_tasks=done_tasks,
        overdue_tasks=overdue_tasks,
        total_applications=total_applications,
        active_applications=active_applications,
        total_projects=total_projects,
        active_projects=active_projects,
    )