"""Provider-agnostic AI agent service for project suggestions.

Falls back to a heuristic rule engine when no API keys are configured,
ensuring the feature works out-of-the-box without external dependencies.
When ANTHROPIC_API_KEY is set, uses Claude (claude-opus-5) for richer suggestions.
"""
from __future__ import annotations

import json
import os
from typing import Any

# ─── Structured suggestion contract ──────────────────────────────────────────

SUGGESTION_SCHEMA = {
    "explanation": str,
    "suggested_tasks": list,   # list[{title, description, priority}]
    "recommended_milestone": str,
}


def _heuristic_suggestion(project_title: str, tech_stack: str, status: str) -> dict[str, Any]:
    """Rule-based fallback that works without any API keys."""
    techs = [t.strip().lower() for t in tech_stack.split(",") if t.strip()] if tech_stack else []

    # Milestone by status
    milestone_map = {
        "active": "Ship a working prototype that demonstrates core functionality",
        "in_progress": "Complete the primary feature set and write basic tests",
        "on_hold": "Resolve the blocker keeping this project on hold",
        "completed": "Prepare a retrospective and document lessons learned",
        "archived": "Extract reusable patterns and document them",
    }
    recommended_milestone = milestone_map.get(status, "Define clear success criteria and next deliverable")

    # Base tasks applicable to most projects
    base_tasks = [
        {
            "title": "Write project README with setup instructions",
            "description": "Cover prerequisites, installation, development workflow, and deployment.",
            "priority": 2,
        },
        {
            "title": "Add end-to-end tests for critical paths",
            "description": "Ensure the most important user flows are covered by automated tests.",
            "priority": 2,
        },
    ]

    # Tech-specific tasks
    tech_tasks: list[dict] = []
    if any(t in techs for t in ["fastapi", "flask", "django"]):
        tech_tasks.append({
            "title": "Add API rate limiting and authentication middleware",
            "description": "Protect endpoints with proper authentication and throttle heavy consumers.",
            "priority": 1,
        })
    if any(t in techs for t in ["react", "next.js", "nextjs", "vue"]):
        tech_tasks.append({
            "title": "Audit accessibility with axe-core or Lighthouse",
            "description": "Fix WCAG 2.1 AA issues to broaden user reach and comply with standards.",
            "priority": 2,
        })
    if any(t in techs for t in ["postgresql", "postgres", "sqlite", "mysql"]):
        tech_tasks.append({
            "title": "Add database migration strategy and seed data",
            "description": "Ensure schema migrations are version-controlled and reproducible.",
            "priority": 1,
        })
    if any(t in techs for t in ["docker", "kubernetes", "k8s"]):
        tech_tasks.append({
            "title": "Set up CI/CD pipeline with automated tests on every PR",
            "description": "Configure GitHub Actions or similar to run tests, lint, and build checks.",
            "priority": 1,
        })

    suggested_tasks = (tech_tasks + base_tasks)[:5]  # cap at 5 suggestions

    stack_note = f" using {tech_stack}" if tech_stack else ""
    explanation = (
        f"Analysis of '{project_title}'{stack_note} (status: {status}): "
        f"These tasks address common gaps in {status} projects. "
        + (f"Tech-specific tasks were selected based on your stack ({tech_stack}). " if tech_stack else "")
        + "All suggestions are actionable and scoped to drive your next milestone."
    )

    return {
        "explanation": explanation,
        "suggested_tasks": suggested_tasks,
        "recommended_milestone": recommended_milestone,
    }


async def _anthropic_suggestion(
    project_title: str, tech_stack: str, status: str, prompt: str, api_key: str
) -> dict[str, Any]:
    """Claude-powered suggestions via the Anthropic API."""
    try:
        import anthropic  # type: ignore[import]
    except ImportError:
        # anthropic SDK not installed — fall back gracefully
        return _heuristic_suggestion(project_title, tech_stack, status)

    client = anthropic.Anthropic(api_key=api_key)

    system = (
        "You are a senior engineering coach. "
        "Given a software project's details, return a JSON object with three keys:\n"
        "  explanation: string explaining your reasoning\n"
        "  suggested_tasks: array of {title, description, priority} objects (1=high, 2=medium, 3=low)\n"
        "  recommended_milestone: string describing the next high-impact milestone\n"
        "Output ONLY valid JSON, no markdown fences."
    )
    user_msg = (
        f"Project: {project_title}\n"
        f"Tech stack: {tech_stack or 'not specified'}\n"
        f"Status: {status}\n"
        f"Additional context: {prompt}"
    )

    message = client.messages.create(
        model="claude-opus-5",
        max_tokens=1024,
        messages=[{"role": "user", "content": user_msg}],
        system=system,
    )
    raw = message.content[0].text.strip()
    return json.loads(raw)


async def generate_suggestions(
    project_title: str,
    tech_stack: str,
    status: str,
    prompt: str,
) -> tuple[dict[str, Any], str]:
    """Generate AI suggestions; returns (suggestion_data, model_provider)."""
    anthropic_key = os.getenv("ANTHROPIC_API_KEY", "")

    if anthropic_key:
        try:
            data = await _anthropic_suggestion(project_title, tech_stack, status, prompt, anthropic_key)
            return data, "anthropic"
        except Exception:
            pass  # fall through to heuristic if Anthropic fails

    return _heuristic_suggestion(project_title, tech_stack, status), "heuristic_rules"
