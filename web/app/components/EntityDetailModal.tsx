"use client";

import { useState, useEffect } from "react";
import { Goal, Project, Task, updateTask, deleteTask, createTask, reorderTasks } from "../../lib/api";
import { getEntityColor, ColorScheme } from "../../lib/colors";
import StatusBadge from "./StatusBadge";

// ── Types ─────────────────────────────────────────────────────────────────────

type Entity = { kind: "goal"; data: Goal } | { kind: "project"; data: Project };

interface EntityDetailModalProps {
  entity: Entity;
  tasks: Task[];
  onClose: () => void;
  onDataChanged: () => void;
}

// ── Inline task editor row ─────────────────────────────────────────────────────

interface TaskRowProps {
  task: Task;
  index: number;
  total: number;
  color: ColorScheme;
  onToggleDone: (task: Task) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onSave: (id: string, changes: { title: string; description: string; status: Task["status"]; priority: number; due_date: string }) => Promise<void>;
  onDelete: (id: string) => void;
}

function TaskRow({ task, index, total, color, onToggleDone, onMoveUp, onMoveDown, onSave, onDelete }: TaskRowProps) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [status, setStatus] = useState<Task["status"]>(task.status);
  const [priority, setPriority] = useState(task.priority);
  const [dueDate, setDueDate] = useState(task.due_date ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await onSave(task.id, { title, description, status, priority, due_date: dueDate });
    setSaving(false);
    setEditing(false);
  }

  function handleCancel() {
    setTitle(task.title);
    setDescription(task.description ?? "");
    setStatus(task.status);
    setPriority(task.priority);
    setDueDate(task.due_date ?? "");
    setEditing(false);
  }

  const done = task.status === "done";

  return (
    <div className="det-task-wrapper">
      {/* Sequential arrow connector (skip on first item) */}
      {index > 0 && (
        <div className="det-task-arrow" aria-hidden="true">
          <svg width="16" height="28" viewBox="0 0 16 28" fill="none">
            <line x1="8" y1="0" x2="8" y2="20" stroke={color.hex} strokeWidth="2" strokeDasharray="4 3" />
            <polyline points="3,15 8,22 13,15" fill="none" stroke={color.hex} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}

      <div
        className={`det-task ${done ? "det-task--done" : ""}`}
        style={{ borderLeft: `3px solid ${done ? "var(--border)" : color.hex}`, background: done ? "var(--bg)" : color.bg }}
      >
        {editing ? (
          <div className="det-task-edit">
            <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
              <input
                style={{ flex: 1, border: "1px solid var(--border)", borderRadius: "7px", padding: "6px 10px", fontFamily: "inherit", fontSize: "0.9rem", background: "var(--surface)" }}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
                placeholder="Task title"
              />
              <select
                style={{ border: "1px solid var(--border)", borderRadius: "7px", padding: "6px 8px", fontSize: "0.82rem", fontFamily: "inherit", background: "var(--surface)" }}
                value={status}
                onChange={(e) => setStatus(e.target.value as Task["status"])}
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
            <textarea
              style={{ width: "100%", border: "1px solid var(--border)", borderRadius: "7px", padding: "6px 10px", fontFamily: "inherit", fontSize: "0.85rem", background: "var(--surface)", resize: "vertical" }}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Description (optional)"
            />
            <div style={{ display: "flex", gap: "8px", marginTop: "8px", alignItems: "center" }}>
              <label style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 600 }}>
                Priority
                <input
                  type="number" min={0} max={5} value={priority}
                  onChange={(e) => setPriority(Number(e.target.value))}
                  style={{ width: "50px", marginLeft: "6px", border: "1px solid var(--border)", borderRadius: "6px", padding: "4px 6px", fontSize: "0.82rem", background: "var(--surface)" }}
                />
              </label>
              <label style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}>
                Due
                <input
                  type="date" value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  style={{ border: "1px solid var(--border)", borderRadius: "6px", padding: "4px 8px", fontSize: "0.82rem", background: "var(--surface)" }}
                />
              </label>
              <div style={{ marginLeft: "auto", display: "flex", gap: "6px" }}>
                <button className="btn btn-ghost btn-sm" onClick={handleCancel} disabled={saving}>Cancel</button>
                <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save"}</button>
              </div>
            </div>
          </div>
        ) : (
          <div className="det-task-view">
            <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
              {/* step number bubble */}
              <span className="det-task-step" style={{ background: done ? "var(--border)" : color.hex }}>{index + 1}</span>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 600, fontSize: "0.92rem", textDecoration: done ? "line-through" : "none", color: done ? "var(--text-faint)" : "var(--text)" }}>
                    {task.title}
                  </span>
                  <StatusBadge status={task.status} />
                  {task.priority > 0 && <span className="pill" style={{ fontSize: "0.7rem" }}>P{task.priority}</span>}
                  {task.due_date && <span className="muted" style={{ fontSize: "0.76rem" }}>Due {task.due_date}</span>}
                </div>
                {task.description && (
                  <p style={{ margin: "4px 0 0", fontSize: "0.82rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
                    {task.description}
                  </p>
                )}
              </div>

              <div style={{ display: "flex", gap: "2px", flexShrink: 0 }}>
                {/* done toggle */}
                <button
                  className="action-btn"
                  title={done ? "Mark todo" : "Mark done"}
                  onClick={() => onToggleDone(task)}
                  style={{ fontSize: "0.9rem" }}
                >
                  {done ? "↩" : "✓"}
                </button>
                {/* reorder */}
                <button className="action-btn" title="Move up" onClick={() => onMoveUp(index)} disabled={index === 0}>↑</button>
                <button className="action-btn" title="Move down" onClick={() => onMoveDown(index)} disabled={index === total - 1}>↓</button>
                {/* edit */}
                <button className="action-btn" title="Edit" onClick={() => setEditing(true)}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg>
                </button>
                {/* delete */}
                <button className="action-btn action-btn--danger" title="Delete task" onClick={() => onDelete(task.id)}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── HTML artifact builder ─────────────────────────────────────────────────────

function buildHtmlArtifact(
  entity: Entity,
  tasks: Task[],
  color: ColorScheme,
): string {
  const isGoal = entity.kind === "goal";
  const data = entity.data;
  const title = data.title;
  const description = (data as Goal | Project).description ?? "";
  const status = data.status;

  const taskRows = tasks
    .map(
      (t, i) => `
      ${i > 0 ? `<div class="arrow"><svg width="16" height="28" viewBox="0 0 16 28"><line x1="8" y1="0" x2="8" y2="20" stroke="${color.hex}" stroke-width="2" stroke-dasharray="4 3"/><polyline points="3,15 8,22 13,15" fill="none" stroke="${color.hex}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div>` : ""}
      <div class="task ${t.status === "done" ? "task-done" : ""}" id="task-${i}">
        <div class="task-header" style="display: flex; align-items: center; gap: 8px;">
          <input type="checkbox" class="task-checkbox" ${t.status === "done" ? "checked" : ""} onchange="toggleTask(this)" />
          <div class="step-num" style="background:${t.status === "done" ? "#ccc" : color.hex}">${i + 1}</div>
        </div>
        <div class="task-body">
          <div class="task-title">${escapeHtml(t.title)}</div>
          ${t.description ? `<div class="task-desc">${escapeHtml(t.description)}</div>` : ""}
          <div class="task-meta">
            <span class="badge badge-${t.status}">${t.status.replace("_", " ")}</span>
            ${t.priority > 0 ? `<span class="badge">P${t.priority}</span>` : ""}
            ${t.due_date ? `<span class="due">Due ${t.due_date}</span>` : ""}
          </div>
        </div>
      </div>`,
    )
    .join("\n");

  const projectExtra = !isGoal
    ? `
      ${(data as Project).tech_stack ? `<div class="meta-row"><span class="meta-label">Tech:</span> ${escapeHtml((data as Project).tech_stack!)}</div>` : ""}
      ${(data as Project).repo_url ? `<div class="meta-row"><span class="meta-label">Repo:</span> <a href="${escapeHtml((data as Project).repo_url!)}" target="_blank">${escapeHtml((data as Project).repo_url!)}</a></div>` : ""}
      ${(data as Project).demo_url ? `<div class="meta-row"><span class="meta-label">Demo:</span> <a href="${escapeHtml((data as Project).demo_url!)}" target="_blank">${escapeHtml((data as Project).demo_url!)}</a></div>` : ""}
    `
    : `
      ${(data as Goal).due_date ? `<div class="meta-row"><span class="meta-label">Due:</span> ${escapeHtml((data as Goal).due_date!)}</div>` : ""}
    `;

  const doneTasks = tasks.filter((t) => t.status === "done").length;
  const progress = tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : 0;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escapeHtml(title)} — Personal OS</title>
<style>
  *, *::before, *::after { box-sizing: border-box; }
  body { margin: 0; font-family: "Inter", Arial, sans-serif; background: #f6f7f2; color: #18221b; padding: 40px 20px 80px; }
  .card { background: #fff; border-radius: 20px; padding: 36px; max-width: 680px; margin: 0 auto; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
  .eyebrow { font-size: 0.7rem; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: ${color.text}; margin: 0 0 8px; }
  h1 { margin: 0 0 12px; font-size: 1.9rem; font-weight: 800; line-height: 1.15; }
  .desc { color: #59665c; font-size: 0.95rem; line-height: 1.6; margin: 0 0 20px; }
  .badge { font-size: 0.7rem; font-weight: 700; padding: 2px 9px; border-radius: 99px; display: inline-block; }
  .badge-active    { background: #e2f0d9; color: #2d6a2d; }
  .badge-completed, .badge-done { background: #d4edda; color: #155724; }
  .badge-archived  { background: #e9ecef; color: #555; }
  .badge-todo      { background: #f0f0f0; color: #555; }
  .badge-on_hold   { background: #f3f4f6; color: #4b5563; }
  .badge-in_progress { background: #fff3cd; color: #856404; }
  .meta-row { font-size: 0.84rem; color: #59665c; margin-bottom: 6px; }
  .meta-label { font-weight: 700; }
  .meta-row a { color: ${color.text}; }
  .progress-bar { height: 6px; background: #dfe6df; border-radius: 99px; margin: 20px 0 28px; overflow: hidden; }
  .progress-fill { height: 100%; border-radius: 99px; background: ${color.hex}; width: ${progress}%; transition: width 0.4s; }
  .progress-label { font-size: 0.78rem; color: #59665c; margin-bottom: 6px; font-weight: 600; }
  .section-title { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: #79867c; margin: 0 0 16px; }
  .task { display: flex; align-items: flex-start; gap: 14px; background: ${color.bg}; border-left: 3px solid ${color.hex}; border-radius: 0 10px 10px 0; padding: 14px; transition: background 0.2s, opacity 0.2s; }
  .task.task-done { background: #f6f7f2 !important; border-left-color: #dfe6df !important; opacity: 0.7; }
  .task-header { align-items: center; }
  .task-header input[type="checkbox"] { width: 16px; height: 16px; cursor: pointer; accent-color: ${color.hex}; }
  .step-num { width: 26px; height: 26px; border-radius: 50%; color: #fff; font-size: 0.75rem; font-weight: 800; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .task-body { flex: 1; }
  .task-title { font-weight: 600; font-size: 0.95rem; margin-bottom: 4px; }
  .task-done .task-title { text-decoration: line-through; color: #79867c; }
  .task-desc { font-size: 0.83rem; color: #59665c; line-height: 1.5; margin-bottom: 6px; }
  .task-meta { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
  .due { font-size: 0.76rem; color: #79867c; }
  .arrow { display: flex; justify-content: flex-start; padding-left: 36px; margin: 4px 0; }
  .footer { text-align: center; font-size: 0.75rem; color: #79867c; margin-top: 40px; }
  .header-meta { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; }
  .divider { height: 1px; background: #dfe6df; margin: 24px 0; }
  @media print { body { background: #fff; padding: 0; } .card { box-shadow: none; } }
</style>
<script>
  const STORAGE_KEY = "personal_os_artifact_${data.id}";

  function updateProgress() {
    const all = document.querySelectorAll('.task');
    const done = document.querySelectorAll('.task.task-done');
    const total = all.length;
    const doneCount = done.length;
    const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;
    const fill = document.querySelector('.progress-fill');
    if (fill) fill.style.width = pct + '%';
    const label = document.querySelector('.progress-label');
    if (label) label.textContent = doneCount + ' of ' + total + ' steps complete';
  }

  function applyTaskStyle(checkbox) {
    const taskElement = checkbox.closest('.task');
    const stepNum = taskElement.querySelector('.step-num');
    const badge = taskElement.querySelector('.badge');
    if (checkbox.checked) {
      taskElement.classList.add('task-done');
      if (stepNum) stepNum.style.background = '#ccc';
      if (badge) {
        badge.className = 'badge badge-done';
        badge.textContent = 'done';
      }
    } else {
      taskElement.classList.remove('task-done');
      if (stepNum) stepNum.style.background = '${color.hex}';
      if (badge) {
        badge.className = 'badge badge-todo';
        badge.textContent = 'todo';
      }
    }
  }

  function toggleTask(checkbox) {
    applyTaskStyle(checkbox);
    updateProgress();
    try {
      const state = [];
      document.querySelectorAll('.task-checkbox').forEach(function(cb, i) {
        state[i] = cb.checked;
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {}
  }

  window.addEventListener('DOMContentLoaded', function() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const state = JSON.parse(saved);
        document.querySelectorAll('.task-checkbox').forEach(function(cb, i) {
          if (state[i] !== undefined) {
            cb.checked = state[i];
            applyTaskStyle(cb);
          }
        });
        updateProgress();
      }
    } catch (e) {}
  });
</script>
</head>
<body>
<div class="card">
  <p class="eyebrow">${isGoal ? "Personal Goal" : "Project"} — Personal OS</p>
  <h1>${escapeHtml(title)}</h1>
  ${description ? `<p class="desc">${escapeHtml(description)}</p>` : ""}

  <div class="header-meta">
    <span class="badge badge-${status}">${status.replace("_", " ")}</span>
    ${!isGoal && (data as Project).tech_stack ? `<span class="badge" style="background:${color.bg};color:${color.text};border:1px solid ${color.border}">${escapeHtml((data as Project).tech_stack!)}</span>` : ""}
  </div>

  ${projectExtra}

  <div class="divider"></div>

  <div class="progress-label">${doneTasks} of ${tasks.length} steps complete</div>
  <div class="progress-bar"><div class="progress-fill"></div></div>

  <div class="section-title">Action Steps — in order</div>

  ${tasks.length === 0 ? `<p style="color:#79867c;font-style:italic;font-size:0.9rem">No tasks added yet.</p>` : taskRows}

  <div class="footer">
    Generated by Personal OS · ${new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
  </div>
</div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ── Main modal ────────────────────────────────────────────────────────────────

export default function EntityDetailModal({ entity, tasks: initialTasks, onClose, onDataChanged }: EntityDetailModalProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [addingTask, setAddingTask] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [addingError, setAddingError] = useState<string | null>(null);
  const [addingSaving, setAddingSaving] = useState(false);

  const entityId = entity.data.id;
  const isGoal = entity.kind === "goal";
  const title = entity.data.title;
  const description = entity.data.description;
  const color = getEntityColor(entityId);

  const doneTasks = tasks.filter((t) => t.status === "done").length;
  const progress = tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : 0;

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // ── Task mutations ────────────────────────────────────────────────────────

  async function handleSave(id: string, changes: { title: string; description: string; status: Task["status"]; priority: number; due_date: string }) {
    await updateTask(id, {
      title: changes.title,
      description: changes.description || undefined,
      status: changes.status,
      priority: changes.priority,
      due_date: changes.due_date || undefined,
    });
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              title: changes.title,
              status: changes.status,
              priority: changes.priority,
              description: changes.description || null,
              due_date: changes.due_date || null,
            }
          : t,
      ),
    );
    onDataChanged();
  }

  async function handleToggleDone(task: Task) {
    const nextStatus: Task["status"] = task.status === "done" ? "todo" : "done";
    await updateTask(task.id, { status: nextStatus });
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t)));
    onDataChanged();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this task?")) return;
    await deleteTask(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
    onDataChanged();
  }

  async function handleMoveUp(index: number) {
    if (index === 0) return;
    const next = [...tasks];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    setTasks(next);
    try {
      await reorderTasks(
        next.map((t) => t.id),
        isGoal ? { goal_id: entityId } : { project_id: entityId },
      );
      onDataChanged();
    } catch (err) {
      console.error("Failed to persist task reorder:", err);
    }
  }

  async function handleMoveDown(index: number) {
    if (index === tasks.length - 1) return;
    const next = [...tasks];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    setTasks(next);
    try {
      await reorderTasks(
        next.map((t) => t.id),
        isGoal ? { goal_id: entityId } : { project_id: entityId },
      );
      onDataChanged();
    } catch (err) {
      console.error("Failed to persist task reorder:", err);
    }
  }

  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setAddingSaving(true);
    setAddingError(null);
    try {
      const created = await createTask({
        title: newTitle.trim(),
        order_index: tasks.length,
        ...(isGoal ? { goal_id: entityId } : { project_id: entityId }),
      });
      setTasks((prev) => [...prev, created]);
      setNewTitle("");
      setAddingTask(false);
      onDataChanged();
    } catch (err) {
      setAddingError(err instanceof Error ? err.message : "Failed to add task.");
    } finally {
      setAddingSaving(false);
    }
  }

  // ── Download artifact ─────────────────────────────────────────────────────

  function handleDownload() {
    const html = buildHtmlArtifact(entity, tasks, color);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, "-")}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="entity-detail-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="modal det-modal"
        style={{ maxWidth: "680px", maxHeight: "90vh", display: "flex", flexDirection: "column" }}
      >
        {/* ── Header ────────────────────────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "4px" }}>
          <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: color.hex, flexShrink: 0, marginTop: "6px" }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: "0 0 4px", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: color.text }}>
              {isGoal ? "Personal Goal" : "Project"} Detail
            </p>
            <h2 id="entity-detail-title" style={{ margin: 0, fontSize: "1.35rem", fontWeight: 800, lineHeight: 1.2 }}>
              {title}
            </h2>
            {description && (
              <p style={{ margin: "8px 0 0", fontSize: "0.88rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
                {description}
              </p>
            )}
          </div>
          <button className="action-btn" onClick={onClose} aria-label="Close" style={{ flexShrink: 0, fontSize: "1.1rem" }}>✕</button>
        </div>

        {/* ── Extra meta for projects ────────────────────────────────────── */}
        {!isGoal && (
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", margin: "12px 0 0" }}>
            {(entity.data as Project).tech_stack?.split(",").map((t) => (
              <span key={t} className="pill" style={{ background: color.bg, color: color.text, border: `1px solid ${color.border}` }}>{t.trim()}</span>
            ))}
            {(entity.data as Project).repo_url && (
              <a href={(entity.data as Project).repo_url!} target="_blank" className="pill" style={{ background: color.bg, color: color.text, border: `1px solid ${color.border}`, textDecoration: "none" }}>
                ↗ Repo
              </a>
            )}
            {(entity.data as Project).demo_url && (
              <a href={(entity.data as Project).demo_url!} target="_blank" className="pill" style={{ background: color.bg, color: color.text, border: `1px solid ${color.border}`, textDecoration: "none" }}>
                ↗ Demo
              </a>
            )}
          </div>
        )}

        {/* ── Progress bar ───────────────────────────────────────────────── */}
        <div style={{ margin: "16px 0 4px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>
              Progress — {doneTasks}/{tasks.length} steps done
            </span>
            <span style={{ fontSize: "0.78rem", fontWeight: 700, color: color.text }}>{progress}%</span>
          </div>
          <div style={{ height: "6px", background: "var(--border-soft)", borderRadius: "99px", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${progress}%`, background: color.hex, borderRadius: "99px", transition: "width 0.35s" }} />
          </div>
        </div>

        <div style={{ height: "1px", background: "var(--border-soft)", margin: "16px 0" }} />

        {/* ── Task steps section (scrollable) ───────────────────────────── */}
        <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <span style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-faint)" }}>
              Action Steps — in order
            </span>
            <button
              className="btn btn-sm"
              style={{ background: color.bg, color: color.text, border: `1px solid ${color.border}` }}
              onClick={() => setAddingTask(true)}
            >
              + Add Step
            </button>
          </div>

          {tasks.length === 0 && !addingTask && (
            <p className="empty-hint" style={{ textAlign: "center", padding: "24px 0" }}>
              No tasks yet — add the first step to get started.
            </p>
          )}

          {tasks.map((t, i) => (
            <TaskRow
              key={t.id}
              task={t}
              index={i}
              total={tasks.length}
              color={color}
              onToggleDone={handleToggleDone}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
              onSave={handleSave}
              onDelete={handleDelete}
            />
          ))}

          {/* ── Inline add task ──────────────────────────────────────────── */}
          {addingTask && (
            <div style={{ marginTop: tasks.length > 0 ? "12px" : "0" }}>
              {tasks.length > 0 && (
                <div className="det-task-arrow" aria-hidden="true" style={{ display: "flex", justifyContent: "flex-start", paddingLeft: "36px", marginBottom: "4px" }}>
                  <svg width="16" height="28" viewBox="0 0 16 28" fill="none">
                    <line x1="8" y1="0" x2="8" y2="20" stroke={color.hex} strokeWidth="2" strokeDasharray="4 3" />
                    <polyline points="3,15 8,22 13,15" fill="none" stroke={color.hex} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
              <form onSubmit={handleAddTask}
                style={{ display: "flex", gap: "8px", alignItems: "center", background: color.bg, borderLeft: `3px solid ${color.hex}`, borderRadius: "0 10px 10px 0", padding: "12px" }}
              >
                <span className="det-task-step" style={{ background: color.hex }}>{tasks.length + 1}</span>
                <input
                  autoFocus
                  style={{ flex: 1, border: "1px solid var(--border)", borderRadius: "7px", padding: "6px 10px", fontFamily: "inherit", fontSize: "0.9rem", background: "var(--surface)" }}
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Step title…"
                />
                <button type="submit" className="btn btn-primary btn-sm" disabled={addingSaving}>{addingSaving ? "Adding…" : "Add"}</button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setAddingTask(false); setNewTitle(""); }}>Cancel</button>
              </form>
              {addingError && <p className="form-error" style={{ marginTop: "6px" }}>{addingError}</p>}
            </div>
          )}
        </div>

        {/* ── Footer actions ──────────────────────────────────────────────── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "20px", paddingTop: "16px", borderTop: "1px solid var(--border-soft)" }}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={handleDownload}
            title="Download as self-contained HTML file you can open anywhere or share"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Download as HTML
          </button>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}
