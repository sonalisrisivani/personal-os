type Status = "active" | "completed" | "archived" | "todo" | "in_progress" | "done";

const LABELS: Record<Status, string> = {
  active: "Active",
  completed: "Completed",
  archived: "Archived",
  todo: "To Do",
  in_progress: "In Progress",
  done: "Done",
};

interface StatusBadgeProps {
  status: Status;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={`status-badge status-badge--${status.replace("_", "-")}`}>
      {LABELS[status]}
    </span>
  );
}
