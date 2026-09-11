"use client";

type ProjectStatus = "active" | "in_progress" | "completed" | "on_hold" | "archived";

const LABELS: Record<ProjectStatus, string> = {
  active: "Active",
  in_progress: "In Progress",
  completed: "Completed",
  on_hold: "On Hold",
  archived: "Archived",
};

interface ProjectStatusBadgeProps {
  status: ProjectStatus;
}

export default function ProjectStatusBadge({ status }: ProjectStatusBadgeProps) {
  return (
    <span className={`status-badge status-badge--${status}`}>
      {LABELS[status] ?? status}
    </span>
  );
}
