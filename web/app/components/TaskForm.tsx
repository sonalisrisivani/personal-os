"use client";

import { useState, useEffect } from "react";
import { createTask, updateTask, Task, Goal, Project } from "../../lib/api";

interface TaskFormProps {
  task?: Task | null;
  goals: Goal[];
  projects: Project[];
  onSave: () => void;
  onClose: () => void;
}

export default function TaskForm({ task, goals, projects, onSave, onClose }: TaskFormProps) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");

  // Tasks can belong to EITHER a goal OR a project.
  const [parentId, setParentId] = useState<string>(() => {
    if (task?.goal_id) return `goal_${task.goal_id}`;
    if (task?.project_id) return `project_${task.project_id}`;
    return "";
  });
  const [priority, setPriority] = useState(task?.priority ?? 0);
  const [dueDate, setDueDate] = useState(task?.due_date ?? "");
  const [status, setStatus] = useState<Task["status"]>(task?.status ?? "todo");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      let goal_id = undefined;
      let project_id = undefined;
      if (parentId.startsWith("goal_")) {
        goal_id = parentId.replace("goal_", "");
      } else if (parentId.startsWith("project_")) {
        project_id = parentId.replace("project_", "");
      }

      const payload = {
        title,
        description: description || undefined,
        goal_id,
        project_id,
        priority,
        due_date: dueDate || undefined,
        status,
      };
      if (task) {
        await updateTask(task.id, payload);
      } else {
        await createTask(payload);
      }
      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-form-title"
    >
      <div className="modal">
        <h2 className="modal__title" id="task-form-title">
          {task ? "Edit Task" : "Add Task"}
        </h2>

        {error && <p className="form-error">{error}</p>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="task-title">Title *</label>
            <input
              id="task-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="task-description">Description</label>
            <textarea
              id="task-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="form-group">
            <label htmlFor="task-parent">Parent (Goal or Project)</label>
            <select
              id="task-parent"
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
            >
              <option value="">— Standalone Task (No Parent) —</option>
              <optgroup label="Personal Goals">
                {goals.map((g) => (
                  <option key={`goal_${g.id}`} value={`goal_${g.id}`}>
                    ↗ Goal: {g.title}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Technical Projects">
                {projects.map((p) => (
                  <option key={`project_${p.id}`} value={`project_${p.id}`}>
                    ⊞ Project: {p.title}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="task-status">Status</label>
              <select
                id="task-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as Task["status"])}
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="task-priority">Priority (0–5)</label>
              <input
                id="task-priority"
                type="number"
                min={0}
                max={5}
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value))}
              />
            </div>

            <div className="form-group">
              <label htmlFor="task-due-date">Due Date</label>
              <input
                id="task-due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div className="modal__actions">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? "Saving…" : task ? "Save Changes" : "Add Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
