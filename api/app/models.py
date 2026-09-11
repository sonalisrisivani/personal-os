from __future__ import annotations

import uuid
from datetime import date, datetime, timezone
from typing import Optional

from sqlalchemy import ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class BaseMixin:
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        server_default=func.now(), onupdate=func.now()
    )


class Goal(Base, BaseMixin):
    __tablename__ = "goals"
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    status: Mapped[str] = mapped_column(String, default="active")
    priority: Mapped[int] = mapped_column(default=0)
    due_date: Mapped[Optional[date]] = mapped_column(nullable=True)
    tasks: Mapped[list["Task"]] = relationship(back_populates="goal")


class Task(Base, BaseMixin):
    __tablename__ = "tasks"
    goal_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("goals.id"), nullable=True)
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    status: Mapped[str] = mapped_column(String, default="todo")
    priority: Mapped[int] = mapped_column(default=0)
    due_date: Mapped[Optional[date]] = mapped_column(nullable=True)
    goal: Mapped[Optional["Goal"]] = relationship(back_populates="tasks")


class ActivityEvent(Base, BaseMixin):
    __tablename__ = "activity_events"
    event_type: Mapped[str] = mapped_column(String, nullable=False)
    entity_type: Mapped[str] = mapped_column(String, nullable=False)
    entity_id: Mapped[Optional[uuid.UUID]] = mapped_column(nullable=True)
    title: Mapped[str] = mapped_column(String, nullable=False)
    details: Mapped[Optional[str]] = mapped_column(String, nullable=True)
