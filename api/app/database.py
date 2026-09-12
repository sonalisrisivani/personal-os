from __future__ import annotations

import os

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Default to SQLite for local development if DATABASE_URL is not set in environment
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./personal_os.db")

# Normalize postgres:// or postgresql:// to postgresql+asyncpg:// for async engine support
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
elif DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

engine = create_async_engine(DATABASE_URL, echo=False)
async_session = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)
Base = declarative_base()


async def get_db() -> AsyncSession:
    async with async_session() as session:
        yield session
