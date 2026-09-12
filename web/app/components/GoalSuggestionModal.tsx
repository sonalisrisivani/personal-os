"use client";

import { useState, useEffect } from "react";
import {
  generateGoalSuggestions,
  approveAgentRun,
  rejectAgentRun,
  Goal,
  AgentRun,
  SuggestedTask,
} from "../../lib/api";

interface GoalSuggestionModalProps {
  goal: Goal;
  onSuccess: () => void;
  onClose: () => void;
}

interface SelectableTask {
  originalIndex: number;
  task: SuggestedTask;
}

export default function GoalSuggestionModal({
  goal,
  onSuccess,
  onClose,
}: GoalSuggestionModalProps) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agentRun, setAgentRun] = useState<AgentRun | null>(null);
  const [tasks, setTasks] = useState<SelectableTask[]>([]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleGenerate(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const run = await generateGoalSuggestions(
        goal.id,
        prompt || "Suggest next actionable daily steps, habits, and milestones for this goal."
      );
      setAgentRun(run);
      setTasks(
        run.suggestion_data.suggested_tasks.map((task, idx) => ({
          originalIndex: idx,
          task,
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate AI suggestions.");
    } finally {
      setLoading(false);
    }
  }

  function handleRemoveTask(indexToRemove: number) {
    setTasks((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  }

  async function handleApprove() {
    if (!agentRun) return;
    if (tasks.length === 0) {
      setError("Please keep at least one task to approve, or click Reject.");
      return;
    }
    setActionLoading(true);
    setError(null);
    try {
      await approveAgentRun(
        agentRun.id,
        tasks.map((t) => t.originalIndex)
      );
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve suggestions.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReject() {
    if (!agentRun) return;
    setActionLoading(true);
    setError(null);
    try {
      await rejectAgentRun(agentRun.id);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reject suggestions.");
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="goal-agent-modal-title"
    >
      <div className="modal" style={{ maxWidth: "620px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h2 className="modal__title" id="goal-agent-modal-title" style={{ margin: 0 }}>
            ⚡ AI Coach: {goal.title}
          </h2>
          <span className="pill" style={{ textTransform: "capitalize" }}>
            {goal.status.replace("_", " ")}
          </span>
        </div>

        {error && <p className="form-error">{error}</p>}

        {!agentRun ? (
          <div>
            <p className="modal__message" style={{ marginBottom: "16px" }}>
              The AI coach will analyze your personal goal <strong>{goal.title}</strong>
              {goal.description ? ` (${goal.description})` : ""} and suggest structured daily steps and a core milestone for your approval.
            </p>

            <form onSubmit={handleGenerate}>
              <div className="form-group">
                <label htmlFor="goal-agent-prompt">Optional focus or current challenge</label>
                <input
                  id="goal-agent-prompt"
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g. Focus on weekly routine, habit consistency, or meal planning"
                />
              </div>

              <div className="modal__actions">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={onClose}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? "Generating suggestions…" : "⚡ Generate Action Plan"}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div>
            <div style={{ background: "var(--bg)", borderRadius: "12px", padding: "16px", marginBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)" }}>
                  Coach Reasoning & Strategy
                </span>
                <span className="pill" style={{ fontSize: "0.7rem" }}>
                  Provider: {agentRun.model_provider}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: "0.88rem", lineHeight: "1.5", color: "var(--text)" }}>
                {agentRun.suggestion_data.explanation}
              </p>
            </div>

            {agentRun.suggestion_data.recommended_milestone && (
              <div style={{ marginBottom: "16px", padding: "12px 16px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "10px" }}>
                <strong style={{ fontSize: "0.82rem", color: "#166534", display: "block", marginBottom: "4px" }}>
                  🎯 Recommended Milestone:
                </strong>
                <span style={{ fontSize: "0.9rem", color: "#14532d", fontWeight: 500 }}>
                  {agentRun.suggestion_data.recommended_milestone}
                </span>
              </div>
            )}

            <div style={{ marginBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span style={{ fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)" }}>
                  Proposed Tasks ({tasks.length})
                </span>
                <span style={{ fontSize: "0.75rem", color: "var(--text-faint)" }}>
                  Click ✕ to remove unwanted tasks
                </span>
              </div>

              {tasks.length === 0 ? (
                <p style={{ color: "var(--text-faint)", fontStyle: "italic", fontSize: "0.88rem", padding: "12px 0", textAlign: "center" }}>
                  All tasks removed. Click Reject or regenerate.
                </p>
              ) : (
                <ul className="item-list" style={{ maxHeight: "240px", overflowY: "auto" }}>
                  {tasks.map(({ task }, idx) => (
                    <li key={idx} className="item" style={{ padding: "8px 0", display: "flex", alignItems: "flex-start", gap: "12px" }}>
                      <div className="item__main" style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span className="item__title" style={{ fontSize: "0.9rem" }}>{task.title}</span>
                          <span className="pill" style={{ fontSize: "0.7rem" }}>P{task.priority}</span>
                        </div>
                        {task.description && (
                          <p className="item__desc" style={{ fontSize: "0.8rem", margin: "4px 0 0" }}>
                            {task.description}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        className="action-btn action-btn--danger"
                        title="Remove this task"
                        aria-label="Remove task"
                        onClick={() => handleRemoveTask(idx)}
                        style={{ padding: "4px 6px", fontSize: "0.85rem" }}
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="modal__actions" style={{ justifyContent: "space-between" }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={handleReject}
                disabled={actionLoading}
              >
                ✕ Reject Plan
              </button>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={onClose}
                  disabled={actionLoading}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleApprove}
                  disabled={actionLoading || tasks.length === 0}
                >
                  {actionLoading ? "Processing…" : `✓ Approve & Add Tasks (${tasks.length})`}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
