"use client";

import { useState, useEffect } from "react";
import { createGoal, updateGoal, Goal } from "../../lib/api";

interface GoalFormProps {
  goal?: Goal | null;
  onSave: () => void;
  onClose: () => void;
}

export default function GoalForm({ goal, onSave, onClose }: GoalFormProps) {
  const [title, setTitle] = useState(goal?.title ?? "");
  const [description, setDescription] = useState(goal?.description ?? "");
  const [priority, setPriority] = useState(goal?.priority ?? 0);
  const [dueDate, setDueDate] = useState(goal?.due_date ?? "");
  const [status, setStatus] = useState<Goal["status"]>(goal?.status ?? "active");
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
      const payload = {
        title,
        description: description || undefined,
        priority,
        due_date: dueDate || undefined,
        status,
      };
      if (goal) {
        await updateGoal(goal.id, payload);
      } else {
        await createGoal(payload);
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
      aria-labelledby="goal-form-title"
    >
      <div className="modal">
        <h2 className="modal__title" id="goal-form-title">
          {goal ? "Edit Goal" : "Add Goal"}
        </h2>

        {error && <p className="form-error">{error}</p>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="goal-title">Title *</label>
            <input
              id="goal-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="goal-description">Description</label>
            <textarea
              id="goal-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="goal-status">Status</label>
              <select
                id="goal-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as Goal["status"])}
              >
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="goal-priority">Priority (0–5)</label>
              <input
                id="goal-priority"
                type="number"
                min={0}
                max={5}
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value))}
              />
            </div>

            <div className="form-group">
              <label htmlFor="goal-due-date">Due Date</label>
              <input
                id="goal-due-date"
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
              {submitting ? "Saving…" : goal ? "Save Changes" : "Add Goal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
