# Personal OS Plan

This file is the detailed companion to [`personal-os-map.mmd`](./personal-os-map.mmd). The Mermaid map is the compact execution source of truth: follow it top-to-bottom, mark one block `ACTIVE`, validate it, then mark it `DONE` and commit.

## Scope

Build a private, self-hostable single-user personal operating system. Start with the career module: dashboard priorities, goals, tasks, job applications, projects, and activity tracking. Use Docker Compose with Next.js/TypeScript, FastAPI, PostgreSQL, and n8n. Defer multi-user accounts, teams, SSO, realtime infrastructure, and autonomous AI writes.

## Blocks

1. **R0 Repository bootstrap** — private GitHub repository, `main`, map/docs, and a focused checkpoint commit.
2. **F1 Foundation** — Compose services, persistent database/n8n volumes, health checks, env examples, code quality setup, and a minimal private single-user auth boundary.
3. **F2 Goals and tasks** — migrations, typed FastAPI CRUD, dashboard priorities/goals/tasks, and focused tests.
4. **F3 Activity dashboard** — auditable activity events, recent feed, summary metrics, and accessible UI states.
5. **F4 Applications and automation** — applications/reminders plus authenticated, idempotent Gmail/IMAP n8n ingestion.
6. **F5 Projects and AI** — projects plus a provider-agnostic, approval-based suggestion interface with auditable agent runs.
7. **V Validation** — targeted tests, type checks, lint, Compose health, documentation, and backup/restore checks.

## Delivery rules

- Every block must leave a usable, understandable repository state.
- Commit only after the current block passes its smallest meaningful validation.
- Use phase-scoped commit subjects such as `feat: add goals and tasks vertical slice`.
- Push each checkpoint to `main`; never bundle unfinished blocks.
- Keep business rules in FastAPI; use n8n for external orchestration; require approval for AI writes.
