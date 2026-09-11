"use client";

import { useState, useEffect } from "react";
import {
  generateProjectSuggestions,
  approveAgentRun,
  rejectAgentRun,
  Project,
  AgentRun,
} from "../../lib/api";

interface ProjectSuggestionModalProps {
  project: Project;
  onSuccess: () => void;
  onClose: () => void;
}

export default function ProjectSuggestionModal({
  project,
  onSuccess,
  onClose,
}: ProjectSuggestionModalProps) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agentRun, setAgentRun] = useState<AgentRun | null>(null);

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
      const run = await generateProjectSuggestions(
        project.id,
        prompt || "Suggest next actionable tasks and roadmap milestone for this project."
      );
      setAgentRun(run);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate AI suggestions.");
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove() {
    if (!agentRun) return;
    setActionLoading(true);
    setError(null);
    try {
      await approveAgentRun(agentRun.id);
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
      aria-labelledby="agent-modal-title"
    >
      <div className="modal" style={{ maxWidth: "620px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h2 className="modal__title" id="agent-modal-title" style={{ margin: 0 }}>
            ⚡ AI Agent: {project.title}
          </h2>
          <span className="pill" style={{ textTransform: "capitalize" }}>
            {project.status.replace("_", " ")}
          </span>
        </div>

        {error && <p className="form-error">{error}</p>}

        {!agentRun ? (
          <div>
            <p className="modal__message" style={{ marginBottom: "16px" }}>
              The AI agent will analyze <strong>{project.title}</strong>
              {project.tech_stack ? ` (${project.tech_stack})` : ""} and propose high-impact next tasks and milestones for your approval.
            </p>

            <form onSubmit={handleGenerate}>
              <div className="form-group">
                <label htmlFor="agent-prompt">Optional context or focus area</label>
                <input
                  id="agent-prompt"
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g. Focus on deployment & testing, or API design"
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
                  {loading ? "Generating suggestions…" : "⚡ Generate Suggestions"}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div>
            <div style={{ background: "var(--bg)", borderRadius: "12px", padding: "16px", marginBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)" }}>
                  Agent Reasoning & Explainability
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
                  🎯 Recommended Next Milestone:
                </strong>
                <span style={{ fontSize: "0.9rem", color: "#14532d", fontWeight: 500 }}>
                  {agentRun.suggestion_data.recommended_milestone}
                </span>
              </div>
            )}

            <div style={{ marginBottom: "16px" }}>
              <span style={{ fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "8px" }}>
                Proposed Tasks ({agentRun.suggestion_data.suggested_tasks.length})
              </span>
              <ul className="item-list" style={{ maxHeight: "240px", overflowY: "auto" }}>
                {agentRun.suggestion_data.suggested_tasks.map((task, idx) => (
                  <li key={idx} className="item" style={{ padding: "8px 0" }}>
                    <div className="item__main">
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span className="item__title" style={{ fontSize: "0.9rem" }}>{task.title}</span>
                        <span className="pill" style={{ fontSize: "0.7rem" }}>P{task.priority}</span>
                      </div>
                      {task.description && (
                        <p className="item__desc" style={{ fontSize: "0.8rem", margin: 0 }}>
                          {task.description}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="modal__actions" style={{ justifyContent: "space-between" }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={handleReject}
                disabled={actionLoading}
              >
                ✕ Reject Suggestions
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
                  disabled={actionLoading}
                >
                  {actionLoading ? "Processing…" : "✓ Approve & Create Tasks"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
