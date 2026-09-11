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
    context = [t.strip().lower() for t in tech_stack.split(",")] if tech_stack else []

    # Milestone by status
    milestone_map = {
        "active": "Achieve the core objective and establish a sustainable habit or set of actions.",
        "in_progress": "Overcome current obstacles and maintain consistent momentum.",
        "on_hold": "Resolve the blocker keeping this project on hold.",
        "completed": "Reflect on success and identify next growth opportunities.",
        "archived": "Extract reusable learnings and document them.",
    }
    recommended_milestone = milestone_map.get(status, "Define clear success criteria and next deliverable.")

    # Base tasks applicable to most projects/goals
    base_tasks = [
        {
            "title": "Define clear success metrics",
            "description": "How will you know when this project is successfully completed?",
            "priority": 1,
        },
        {
            "title": "Identify and mitigate potential obstacles",
            "description": "What could stop you from moving forward? How can you plan around that?",
            "priority": 2,
        },
    ]

    # Content/Context-specific tasks
    extra_tasks: list[dict] = []

    # Life/Health contexts
    if any(k in " ".join(context) for k in ["fat loss", "weight loss", "diet", "fitness", "health", "workout"]):
        extra_tasks.extend([
            {
                "title": "Create a sustainable weekly meal plan",
                "description": "Plan meals that you enjoy and fit your goals, making it easier to be consistent.",
                "priority": 1,
            },
            {
                "title": "Schedule workout sessions",
                "description": "Block off specific times in your calendar for physical activity.",
                "priority": 1,
            }
        ])

    # Financial/Planning contexts
    if any(k in " ".join(context) for k in ["finance", "money", "budget", "save"]):
        extra_tasks.extend([
            {
                "title": "Analyze current spending habits",
                "description": "Review the last 30 days to identify areas for adjustment.",
                "priority": 1,
            }
        ])

    # Tech contexts (if used as technical projects)
    if any(t in context for t in ["fastapi", "react", "next.js", "docker"]):
        extra_tasks.append({
            "title": "Set up a structured development environment",
            "description": "Ensure your tools and repository are configured for efficiency.",
            "priority": 2,
        })

    suggested_tasks = (extra_tasks + base_tasks)[:5]  # cap at 5 suggestions

    explanation = (
        f"Analysis of '{project_title}' (status: {status}): "
        f"These tasks are designed to streamline action, build consistency, and reduce mental overhead. "
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
        return _heuristic_suggestion(project_title, tech_stack, status)

    client = anthropic.Anthropic(api_key=api_key)

    system = (
        "You are a holistic life and productivity coach. "
        "Given a project or life goal, return a JSON object with three keys:\n"
        "  explanation: string explaining your reasoning\n"
        "  suggested_tasks: array of {title, description, priority} objects (1=high, 2=medium, 3=low)\n"
        "  recommended_milestone: string describing the next high-impact milestone\n"
        "Output ONLY valid JSON, no markdown fences."
    )
    user_msg = (
        f"Goal/Project: {project_title}\n"
        f"Context/Tags: {tech_stack or 'not specified'}\n"
        f"Status: {status}\n"
        f"Additional context/concerns: {prompt}"
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
