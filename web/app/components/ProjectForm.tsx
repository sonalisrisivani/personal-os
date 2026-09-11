"use client";

import { useState, useEffect } from "react";
import { createProject, updateProject, Project, Goal } from "../../lib/api";

interface ProjectFormProps {
  project?: Project | null;
  goals: Goal[];
  onSave: () => void;
  onClose: () => void;
}

export default function ProjectForm({ project, goals, onSave, onClose }: ProjectFormProps) {
  const [title, setTitle] = useState(project?.title ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [techStack, setTechStack] = useState(project?.tech_stack ?? "");
  const [repoUrl, setRepoUrl] = useState(project?.repo_url ?? "");
  const [demoUrl, setDemoUrl] = useState(project?.demo_url ?? "");
  const [goalId, setGoalId] = useState(project?.goal_id ?? "");
  const [status, setStatus] = useState<Project["status"]>(project?.status ?? "active");
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
        tech_stack: techStack || undefined,
        repo_url: repoUrl || undefined,
        demo_url: demoUrl || undefined,
        goal_id: goalId || undefined,
        status,
      };
      if (project) {
        await updateProject(project.id, payload);
      } else {
        await createProject(payload);
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
      aria-labelledby="project-form-title"
    >
      <div className="modal">
        <h2 className="modal__title" id="project-form-title">
          {project ? "Edit Project" : "Add Project"}
        </h2>

        {error && <p className="form-error">{error}</p>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="project-title">Title *</label>
            <input
              id="project-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
              placeholder="e.g. Personal OS, Distributed Key-Value Store"
            />
          </div>

          <div className="form-group">
            <label htmlFor="project-description">Description</label>
            <textarea
              id="project-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Summary of what this project does and problems it solves"
            />
          </div>

          <div className="form-group">
            <label htmlFor="project-tech-stack">Tech Stack</label>
            <input
              id="project-tech-stack"
              type="text"
              value={techStack}
              onChange={(e) => setTechStack(e.target.value)}
              placeholder="e.g. Next.js, FastAPI, PostgreSQL, Docker"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="project-repo">Repo URL</label>
              <input
                id="project-repo"
                type="url"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/..."
              />
            </div>
            <div className="form-group">
              <label htmlFor="project-demo">Demo URL</label>
              <input
                id="project-demo"
                type="url"
                value={demoUrl}
                onChange={(e) => setDemoUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="project-status">Status</label>
              <select
                id="project-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as Project["status"])}
              >
                <option value="active">Active</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="on_hold">On Hold</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="project-goal">Linked Goal</label>
              <select
                id="project-goal"
                value={goalId}
                onChange={(e) => setGoalId(e.target.value)}
              >
                <option value="">No goal linked</option>
                {goals.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.title}
                  </option>
                ))}
              </select>
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
              {submitting ? "Saving…" : project ? "Save Changes" : "Add Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
