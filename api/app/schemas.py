from __future__ import annotations

import uuid
from datetime import date, datetime
from typing import Generic, List, Optional, TypeVar

from pydantic import BaseModel, ConfigDict


T = TypeVar("T")


# --- Goal schemas ---

class GoalCreate(BaseModel):
    title: str
    description: Optional[str] = None
    status: str = "active"
    priority: int = 0
    due_date: Optional[date] = None


class GoalUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[int] = None
    due_date: Optional[date] = None


class GoalResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    description: Optional[str]
    status: str
    priority: int
    due_date: Optional[date]
    created_at: datetime
    updated_at: datetime


# --- Task schemas ---

class TaskCreate(BaseModel):
    goal_id: Optional[uuid.UUID] = None
    title: str
    description: Optional[str] = None
    status: str = "todo"
    priority: int = 0
    due_date: Optional[date] = None


class TaskUpdate(BaseModel):
    goal_id: Optional[uuid.UUID] = None
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[int] = None
    due_date: Optional[date] = None


class TaskResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    goal_id: Optional[uuid.UUID]
    title: str
    description: Optional[str]
    status: str
    priority: int
    due_date: Optional[date]
    created_at: datetime
    updated_at: datetime


# --- Pagination wrapper ---

class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    page_size: int


# --- Activity schemas ---

class ActivityEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    event_type: str
    entity_type: str
    entity_id: Optional[uuid.UUID]
    title: str
    details: Optional[str]
    created_at: datetime


# --- Metrics schemas ---

class SummaryMetricsResponse(BaseModel):
    total_goals: int
    active_goals: int
    completed_goals: int
    archived_goals: int
    total_tasks: int
    pending_tasks: int
    in_progress_tasks: int
    done_tasks: int
    overdue_tasks: int
    total_applications: int = 0
    active_applications: int = 0


# --- Application Reminder schemas ---

class ApplicationReminderCreate(BaseModel):
    reminder_type: str = "follow_up"
    due_date: datetime
    notes: Optional[str] = None


class ApplicationReminderUpdate(BaseModel):
    reminder_type: Optional[str] = None
    due_date: Optional[datetime] = None
    is_completed: Optional[bool] = None
    notes: Optional[str] = None


class ApplicationReminderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    application_id: uuid.UUID
    reminder_type: str
    due_date: datetime
    is_completed: bool
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime


# --- Job Application schemas ---

class JobApplicationCreate(BaseModel):
    company: str
    role: str
    status: str = "applied"
    location: Optional[str] = None
    job_url: Optional[str] = None
    salary_range: Optional[str] = None
    applied_at: Optional[date] = None
    notes: Optional[str] = None
    source: str = "manual"
    external_id: Optional[str] = None


class JobApplicationUpdate(BaseModel):
    company: Optional[str] = None
    role: Optional[str] = None
    status: Optional[str] = None
    location: Optional[str] = None
    job_url: Optional[str] = None
    salary_range: Optional[str] = None
    applied_at: Optional[date] = None
    notes: Optional[str] = None
    source: Optional[str] = None


class JobApplicationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    company: str
    role: str
    status: str
    location: Optional[str]
    job_url: Optional[str]
    salary_range: Optional[str]
    applied_at: Optional[date]
    notes: Optional[str]
    source: str
    external_id: Optional[str]
    reminders: List[ApplicationReminderResponse] = []
    created_at: datetime
    updated_at: datetime


# --- Ingestion Webhook schemas ---

class EmailIngestPayload(BaseModel):
    external_id: str
    company: str
    role: str
    status: str = "applied"
    location: Optional[str] = None
    job_url: Optional[str] = None
    notes: Optional[str] = None
    applied_at: Optional[date] = None
    source: str = "email_ingest"

