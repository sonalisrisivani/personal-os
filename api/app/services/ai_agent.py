"""Provider-agnostic AI agent service for project and goal suggestions.

Falls back to a heuristic rule engine when no API keys are configured,
ensuring the feature works out-of-the-box without external dependencies.
When ANTHROPIC_API_KEY is set, uses Claude (claude-opus-5) for richer suggestions.
"""
from __future__ import annotations

import json
import os
import re
from typing import Any, Dict, List, Optional

# ─── Structured suggestion contract ──────────────────────────────────────────

SUGGESTION_SCHEMA = {
    "explanation": str,
    "suggested_tasks": list,   # list[{title, description, priority}]
    "recommended_milestone": str,
}


def _extract_keywords(text: str) -> List[str]:
    """Extract meaningful keywords from text, ignoring common words."""
    if not text:
        return []
    # Convert to lowercase and split by non-alphanumeric
    words = re.findall(r'\b[a-z]{3,}\b', text.lower())
    # Common stop words to ignore
    stop_words = {
        'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'any', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'who', 'boy', 'did', 'man', 'men', 'put', 'too', 'use'
    }
    return [w for w in words if w not in stop_words]


def _heuristic_suggestion_project(project_title: str, tech_stack: str, status: str) -> dict[str, Any]:
    """Rule-based fallback for projects."""
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


def _heuristic_suggestion_goal(goal_title: str, status: str, priority: int, description: Optional[str] = None) -> dict[str, Any]:
    """Rule-based fallback for goals."""
    # Extract keywords from title and description
    text_for_keywords = f"{goal_title} {description or ''}"
    keywords = _extract_keywords(text_for_keywords)

    # Milestone by status (similar to projects but more life-oriented)
    milestone_map = {
        "active": "Establish consistent habits and make visible progress toward your objective.",
        "in_progress": "Overcome current challenges and maintain momentum toward completion.",
        "on_hold": "Identify and resolve what's preventing you from moving forward.",
        "completed": "Reflect on your achievement and set your next meaningful goal.",
        "archived": "Document what you learned for future reference.",
    }
    recommended_milestone = milestone_map.get(status, "Define what success looks like and plan your next steps.")

    # Base goals/tasks
    base_tasks = [
        {
            "title": "Define clear, measurable success criteria",
            "description": "How will you know when this goal is successfully achieved?",
            "priority": 1,
        },
        {
            "title": "Break down into weekly milestones",
            "description": "Create achievable weekly targets that lead to your ultimate goal.",
            "priority": 1,
        },
        {
            "title": "Identify potential obstacles and solutions",
            "description": "What might get in your way, and how will you overcome those challenges?",
            "priority": 2,
        },
    ]

    # Context-specific tasks based on keywords
    extra_tasks: list[dict] = []

    # Health & Fitness
    if any(k in keywords for k in ["fat", "loss", "weight", "diet", "fitness", "health", "workout", "exercise", "gym", "run", "walk", "yoga"]):
        extra_tasks.extend([
            {
                "title": "Plan nutritious meals for the week",
                "description": "Prepare a simple meal plan that supports your health goals.",
                "priority": 1,
            },
            {
                "title": "Schedule regular physical activity",
                "description": "Block time in your calendar for exercise or movement you enjoy.",
                "priority": 1,
            },
            {
                "title": "Track your progress weekly",
                "description": "Use a journal or app to monitor measurements, energy levels, or performance.",
                "priority": 2,
            }
        ])

    # Learning & Skill Development
    if any(k in keywords for k in ["learn", "study", "course", "skill", "language", "certification", "training", "education", "book", "read"]):
        extra_tasks.extend([
            {
                "title": "Set up a dedicated learning schedule",
                "description": "Allocate specific times each week for focused learning and practice.",
                "priority": 1,
            },
            {
                "title": "Find quality resources and materials",
                "description": "Identify books, courses, or tutorials that match your learning objectives.",
                "priority": 2,
            },
            {
                "title": "Practice what you learn regularly",
                "description": "Apply new knowledge through exercises, projects, or real-world applications.",
                "priority": 2,
            }
        ])

    # Financial & Money
    if any(k in keywords for k in ["finance", "money", "budget", "save", "invest", "debt", "loan", "expense", "income", "salary"]):
        extra_tasks.extend([
            {
                "title": "Track your income and expenses for one week",
                "description": "Record every dollar coming in and going out to understand your cash flow.",
                "priority": 1,
            },
            {
                "title": "Create a simple budget aligned with your goals",
                "description": "Plan your spending to ensure you're saving or investing appropriately.",
                "priority": 1,
            },
            {
                "title": "Set up automatic transfers for savings",
                "description": "Automate moving money to savings or investment accounts each payday.",
                "priority": 2,
            }
        ])

    # Productivity & Habits
    if any(k in keywords for k in ["habit", "routine", "productive", "organize", "declutter", "time", "focus", "concentrate"]):
        extra_tasks.extend([
            {
                "title": "Design a morning or evening routine",
                "description": "Create consistent bookends to your day that support your goals.",
                "priority": 1,
            },
            {
                "title": "Use the Pomodoro technique for focused work",
                "description": "Work in 25-minute focused bursts with short breaks to maintain concentration.",
                "priority": 2,
            },
            {
                "title": "Weekly review and planning session",
                "description": "Review progress, adjust plans, and set intentions for the coming week.",
                "priority": 2,
            }
        ])

    # Relationships & Social
    if any(k in keywords for k in ["friend", "family", "relationship", "social", "community", "network", "connect"]):
        extra_tasks.extend([
            {
                "title": "Schedule regular connection time",
                "description": "Set aside dedicated time each week to nurture important relationships.",
                "priority": 1,
            },
            {
                "title": "Practice active listening in conversations",
                "description": "Focus on truly understanding others before responding in your interactions.",
                "priority": 2,
            }
        ])

    # Default: if no specific keywords matched, add some general life tasks
    if not extra_tasks:
        extra_tasks.extend([
            {
                "title": "Gather necessary resources and information",
                "description": "Identify what you need to know, tools required, or people to consult.",
                "priority": 2,
            },
            {
                "title": "Set up a tracking system",
                "description": "Create a simple way to monitor your progress toward this goal.",
                "priority": 2,
            }
        ])

    suggested_tasks = (extra_tasks + base_tasks)[:5]  # cap at 5 suggestions

    explanation = (
        f"Analysis of goal '{goal_title}' (status: {status}, priority: {priority}): "
        f"These suggested actions focus on building momentum, creating clarity, and establishing sustainable progress toward what matters most to you. "
    )

    return {
        "explanation": explanation,
        "suggested_tasks": suggested_tasks,
        "recommended_milestone": recommended_milestone,
    }


def _heuristic_suggestion(
    project_title: str,
    tech_stack: str,
    status: str,
    priority: int = 0,
    description: Optional[str] = None,
    context_type: str = "project"  # "project" or "goal"
) -> dict[str, Any]:
    """Route to appropriate heuristic based on context type."""
    if context_type == "goal":
        return _heuristic_suggestion_goal(project_title, status, priority, description)
    else:
        return _heuristic_suggestion_project(project_title, tech_stack, status)


async def _anthropic_suggestion(
    project_title: str,
    tech_stack: str,
    status: str,
    prompt: str,
    api_key: str,
    context_type: str = "project"
) -> dict[str, Any]:
    """Claude-powered suggestions via the Anthropic API."""
    try:
        import anthropic  # type: ignore[import]
    except ImportError:
        return _heuristic_suggestion(project_title, tech_stack, status, priority, description=None, context_type=context_type)

    client = anthropic.Anthropic(api_key=api_key)

    if context_type == "goal":
        system = (
            "You are a holistic life and productivity coach specializing in personal goal achievement. "
            "Given a personal goal or life objective, return a JSON object with three keys:\n"
            "  explanation: string explaining your reasoning and approach\n"
            "  suggested_tasks: array of {title, description, priority} objects (1=high, 2=medium, 3=low)\n"
            "  recommended_milestone: string describing the next meaningful milestone or achievement\n"
            "Output ONLY valid JSON, no markdown fences."
        )
        user_msg = (
            f"Personal Goal: {project_title}\n"
            f"Description: {description or 'not provided'}\n"
            f"Status: {status}\n"
            f"Priority: {priority}/5\n"
            f"Additional context or challenges: {prompt}"
        )
    else:
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
    tech_stack: str = "",
    status: str = "active",
    priority: int = 0,
    description: Optional[str] = None,
    prompt: str = "",
    context_type: str = "project"
) -> tuple[dict[str, Any], str]:
    """Generate AI suggestions; returns (suggestion_data, model_provider)."""
    anthropic_key = os.getenv("ANTHROPIC_API_KEY", "")

    if anthropic_key:
        try:
            data = await _anthropic_suggestion(
                project_title, tech_stack, status, prompt, anthropic_key,
                context_type=context_type
            )
            return data, "anthropic"
        except Exception:
            pass  # fall through to heuristic if Anthropic fails

    data = _heuristic_suggestion(
        project_title, tech_stack, status, priority, description, context_type=context_type
    )
    return data, "heuristic_rules"
