from __future__ import annotations

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..models import Project
from ..schemas import PaginatedResponse, ProjectCreate, ProjectResponse, ProjectUpdate
from ..services.activity import record_activity

router = APIRouter(prefix="/projects", tags=["projects"])


@router.post("", response_model=ProjectResponse, status_code=201)
async def create_project(body: ProjectCreate, db: AsyncSession = Depends(get_db)) -> ProjectResponse:
    project = Project(**body.model_dump())
    db.add(project)
    await db.commit()
    await db.refresh(project)
    await record_activity(
        db=db,
        event_type="project.created",
        entity_type="project",
        entity_id=project.id,
        title=f"Created project: {project.title}",
    )
    return ProjectResponse.model_validate(project)


@router.get("", response_model=PaginatedResponse[ProjectResponse])
async def list_projects(
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> PaginatedResponse[ProjectResponse]:
    q = select(Project)
    if status:
        q = q.where(Project.status == status)
    total_result = await db.execute(select(func.count()).select_from(q.subquery()))
    total = total_result.scalar_one()
    q = q.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(q)
    projects = result.scalars().all()
    return PaginatedResponse(
        items=[ProjectResponse.model_validate(p) for p in projects],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: uuid.UUID, db: AsyncSession = Depends(get_db)) -> ProjectResponse:
    project = await db.get(Project, project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return ProjectResponse.model_validate(project)


@router.patch("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: uuid.UUID, body: ProjectUpdate, db: AsyncSession = Depends(get_db)
) -> ProjectResponse:
    project = await db.get(Project, project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(project, field, value)
    await db.commit()
    await db.refresh(project)
    await record_activity(
        db=db,
        event_type="project.updated",
        entity_type="project",
        entity_id=project.id,
        title=f"Updated project: {project.title}",
    )
    return ProjectResponse.model_validate(project)


@router.delete("/{project_id}", status_code=204, response_class=Response)
async def delete_project(project_id: uuid.UUID, db: AsyncSession = Depends(get_db)) -> Response:
    project = await db.get(Project, project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    title = project.title
    await db.delete(project)
    await db.commit()
    await record_activity(
        db=db,
        event_type="project.deleted",
        entity_type="project",
        entity_id=project_id,
        title=f"Deleted project: {title}",
    )
    return Response(status_code=204)
