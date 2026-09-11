from __future__ import annotations

import uuid
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from ..models import ActivityEvent


async def record_activity(
    db: AsyncSession,
    event_type: str,
    entity_type: str,
    entity_id: Optional[uuid.UUID],
    title: str,
    details: Optional[str] = None,
) -> None:
    event = ActivityEvent(
        event_type=event_type,
        entity_type=entity_type,
        entity_id=entity_id,
        title=title,
        details=details,
    )
    db.add(event)
    await db.commit()
