"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchGoals, fetchTasks, fetchProjects, fetchActivities, fetchSummaryMetrics, fetchApplications, deleteGoal, deleteTask, deleteProject, deleteApplication, updateApplicationReminder, Goal, Task, Project, ActivityEvent, SummaryMetrics, JobApplication } from "../lib/api";
import EntityDetailModal from "./components/EntityDetailModal";
import { getEntityColor } from "../lib/colors";
import StatusBadge from "./components/StatusBadge";
import ApplicationStatusBadge from "./components/ApplicationStatusBadge";
import ProjectStatusBadge from "./components/ProjectStatusBadge";
import GoalForm from "./components/GoalForm";
import TaskForm from "./components/TaskForm";
import ProjectForm from "./components/ProjectForm";
import ApplicationForm from "./components/ApplicationForm";
import ReminderForm from "./components/ReminderForm";
import ProjectSuggestionModal from "./components/ProjectSuggestionModal";
import GoalSuggestionModal from "./components/GoalSuggestionModal";
import TaskCalendar from "./components/TaskCalendar";
import ConfirmDialog from "./components/ConfirmDialog";
import MultiSelectDropdown from "./components/MultiSelectDropdown";
import { SummaryMetricsCards } from "./components/SummaryMetricsCards";
import { ActivityFeed } from "./components/ActivityFeed";

// ─── Filter types ─────────────────────────────────────────────────────────────

type GoalFilter = "all" | "active" | "completed" | "archived";
type TaskFilter = "all" | "todo" | "in_progress" | "done";
type ProjectFilter = "all" | "active" | "in_progress" | "completed" | "on_hold" | "archived";
type AppFilter  = "all" | "applied" | "screening" | "interviewing" | "offered" | "rejected" | "withdrawn";

// ─── Icons ───────────────────────────────────────────────────────────────────

function SparklesIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
      <path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>
    </svg>
  );
}

function EditIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z"/>
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
    </svg>
  );
}

// ─── Filter Tab Bar ───────────────────────────────────────────────────────────

function FilterTabs<T extends string>({
  options,
  value,
  onChange,
  label,
  children,
}: {
  options: [T, string][];
  value: T;
  onChange: (v: T) => void;
  label: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="filter-tabs" role="tablist" aria-label={label}>
      {options.map(([v, l]) => (
        <button
          key={v}
          role="tab"
          aria-selected={value === v}
          className={`filter-tab${value === v ? " filter-tab--active" : ""}`}
          onClick={() => onChange(v)}
        >
          {l}
        </button>
      ))}
      {children}
    </div>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeading({
  id,
  title,
  count,
  onAdd,
  addLabel,
}: {
  id: string;
  title: string;
  count: number;
  onAdd: () => void;
  addLabel: string;
}) {
  return (
    <div className="section-header">
      <h3 id={id}>
        {title} <span className="count">{count}</span>
      </h3>
      <button className="btn btn-sm btn-primary" onClick={onAdd}>
        + {addLabel}
      </button>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Home() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [metrics, setMetrics] = useState<SummaryMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [goalFilter, setGoalFilter] = useState<GoalFilter>("all");
  const [taskFilter, setTaskFilter] = useState<TaskFilter>("all");
  const [taskContextFilter, setTaskContextFilter] = useState<string[]>([]);
  const [projectFilter, setProjectFilter] = useState<ProjectFilter>("active");
  const [appFilter, setAppFilter] = useState<AppFilter>("all");

  const [goalForm, setGoalForm] = useState<{ open: boolean; goal?: Goal | null }>({ open: false });
  const [taskForm, setTaskForm] = useState<{ open: boolean; task?: Task | null }>({ open: false });
  const [projectForm, setProjectForm] = useState<{ open: boolean; project?: Project | null }>({ open: false });
  const [agentModal, setAgentModal] = useState<{ open: boolean; project?: Project | null }>({ open: false });
  const [goalAgentModal, setGoalAgentModal] = useState<{ open: boolean; goal?: Goal | null }>({ open: false });
  const [detailModal, setDetailModal] = useState<{ open: boolean; entity?: { kind: "goal"; data: Goal } | { kind: "project"; data: Project } }>({ open: false });
  const [appForm, setAppForm] = useState<{ open: boolean; application?: JobApplication | null }>({ open: false });
  const [reminderForm, setReminderForm] = useState<{ open: boolean; applicationId?: string }>({ open: false });
  const [confirm, setConfirm] = useState<{ open: boolean; message: string; onConfirm: () => void } | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [goalsRes, tasksRes, projectsRes, appsRes, activitiesRes, metricsRes] = await Promise.all([
        fetchGoals(),
        fetchTasks(),
        fetchProjects(),
        fetchApplications(),
        fetchActivities({ page_size: 10 }),
        fetchSummaryMetrics(),
      ]);
      setGoals(goalsRes.items);
      setTasks(tasksRes.items);
      setProjects(projectsRes.items);
      setApplications(appsRes.items);
      setActivities(activitiesRes.items);
      setMetrics(metricsRes);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const visibleGoals = goalFilter === "all" ? goals : goals.filter((g) => g.status === goalFilter);
  const visibleTasks = tasks.filter((t) => {
    const matchesStatus = taskFilter === "all" || t.status === taskFilter;
    const matchesContext = taskContextFilter.length === 0 ||
      (t.goal_id && taskContextFilter.includes(t.goal_id)) ||
      (t.project_id && taskContextFilter.includes(t.project_id));
    return matchesStatus && matchesContext;
  });
  const visibleProjects = projectFilter === "all" ? projects : projects.filter((p) => p.status === projectFilter);
  const visibleApps  = appFilter  === "all" ? applications : applications.filter((a) => a.status === appFilter);

  function askDelete(message: string, onConfirm: () => Promise<void>) {
    setConfirm({
      open: true,
      message,
      onConfirm: async () => { await onConfirm(); setConfirm(null); loadData(); },
    });
  }

  async function toggleReminder(id: string, done: boolean) {
    try { await updateApplicationReminder(id, { is_completed: !done }); loadData(); }
    catch (e) { console.error(e); }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      <main>
        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <div className="hero">
          <p className="eyebrow">PERSONAL OS</p>
          <h1>Make your next move deliberate.</h1>
          <p className="intro">
            Everything becomes easier when it's written down clearly. Your private space to declutter thoughts, organize plans, and track daily actions.
          </p>
        </div>

        {error && <p className="error-banner">{error}</p>}

        {loading ? (
          <p className="loading">Loading…</p>
        ) : (
          <div className="dashboard">
            {/* Metrics strip */}
            <SummaryMetricsCards metrics={metrics} loading={loading} />

            {/* ── SECTION GROUP 1: Personal & Technical Growth ───────────── */}
            <div className="group-label">▸ Personal & Technical Growth</div>

            {/* Goals (Personal / Life / Habits) */}
            <section aria-labelledby="goals-heading" className="card-section">
              <SectionHeading
                id="goals-heading"
                title="Personal Goals"
                count={visibleGoals.length}
                onAdd={() => setGoalForm({ open: true, goal: null })}
                addLabel="Add Goal"
              />
              <FilterTabs
                options={[["all","All"],["active","Active"],["completed","Completed"],["archived","Archived"]]}
                value={goalFilter}
                onChange={setGoalFilter}
                label="Filter goals"
              />
              {visibleGoals.length === 0 ? (
                <p className="empty-hint">No personal goals yet — set one to focus on health, habits, or life milestones.</p>
              ) : (
                <ul className="item-list">
                  {visibleGoals.map((g) => (
                    <li key={g.id} className="item">
                      <div className="item__main">
                        <span className="item__title">{g.title}</span>
                        <div className="item__meta">
                          <span className="goal-color-indicator" style={{ backgroundColor: getEntityColor(g.id).hex, width: '8px', height: '8px', borderRadius: '50%', display: 'inline-block', marginRight: '6px' }}></span>
                          <StatusBadge status={g.status} />
                          {g.priority > 0 && <span className="pill">P{g.priority}</span>}
                          {g.due_date && <span className="muted">Due {g.due_date}</span>}
                        </div>
                        {g.description && <p className="item__desc">{g.description}</p>}
                      </div>
                      <div className="actions">
                        <button className="action-btn" aria-label="View goal detail" title="View Full Details & Steps" onClick={() => setDetailModal({ open: true, entity: { kind: "goal", data: g } })} style={{ color: getEntityColor(g.id).hex }}><EyeIcon /></button>
                        <button className="action-btn" aria-label="Ask AI Coach" title="⚡ Ask AI Coach" onClick={() => setGoalAgentModal({ open: true, goal: g })}><SparklesIcon /></button>
                        <button className="action-btn" aria-label="Edit goal" onClick={() => setGoalForm({ open: true, goal: g })}><EditIcon /></button>
                        <button className="action-btn action-btn--danger" aria-label="Delete goal" onClick={() => askDelete(`Delete goal "${g.title}"?`, () => deleteGoal(g.id))}><TrashIcon /></button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Projects (Technical & Engineering) */}
            <section aria-labelledby="projects-heading" className="card-section">
              <SectionHeading
                id="projects-heading"
                title="Technical Projects"
                count={visibleProjects.length}
                onAdd={() => setProjectForm({ open: true, project: null })}
                addLabel="Add Project"
              />
              <FilterTabs
                options={[["all","All"],["active","Active"],["in_progress","In Progress"],["completed","Completed"],["on_hold","On Hold"],["archived","Archived"]]}
                value={projectFilter}
                onChange={setProjectFilter}
                label="Filter projects"
              />
              {visibleProjects.length === 0 ? (
                <p className="empty-hint">No technical projects — track your engineering projects and repositories here.</p>
              ) : (
                <ul className="item-list">
                  {visibleProjects.map((p) => (
                    <li key={p.id} className="item">
                      <div className="item__main">
                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                          <span className="goal-color-indicator" style={{ backgroundColor: getEntityColor(p.id).hex, width: '8px', height: '8px', borderRadius: '50%', display: 'inline-block' }}></span>
                          <span className="item__title">{p.title}</span>
                          <ProjectStatusBadge status={p.status} />
                        </div>
                        <div className="item__meta">
                          {p.tech_stack && p.tech_stack.split(',').map(t => <span key={t} className="pill">{t.trim()}</span>)}
                          {p.repo_url && <a href={p.repo_url} target="_blank" className="muted" style={{textDecoration: 'none'}}>Link</a>}
                        </div>
                        {p.description && <p className="item__desc">{p.description}</p>}
                      </div>
                      <div className="actions">
                        <button className="action-btn" aria-label="View project detail" title="View Full Details & Steps" onClick={() => setDetailModal({ open: true, entity: { kind: "project", data: p } })} style={{ color: getEntityColor(p.id).hex }}><EyeIcon /></button>
                        <button className="action-btn" aria-label="Ask AI Architect" title="⚡ Ask AI Architect" onClick={() => setAgentModal({ open: true, project: p })}><SparklesIcon /></button>
                        <button className="action-btn" aria-label="Edit project" onClick={() => setProjectForm({ open: true, project: p })}><EditIcon /></button>
                        <button className="action-btn action-btn--danger" aria-label="Delete project" onClick={() => askDelete(`Delete project "${p.title}"?`, () => deleteProject(p.id))}><TrashIcon /></button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* ── SECTION GROUP 2: Daily Actions & Deadlines ────────────── */}
            <div className="group-label">▸ Daily Actions & Schedule</div>

            {/* Tasks */}
            <section aria-labelledby="tasks-heading" className="card-section">
              <SectionHeading
                id="tasks-heading"
                title="Tasks"
                count={visibleTasks.length}
                onAdd={() => setTaskForm({ open: true, task: null })}
                addLabel="Add Task"
              />
              <FilterTabs
                options={[["all","All"],["todo","To Do"],["in_progress","In Progress"],["done","Done"]]}
                value={taskFilter}
                onChange={setTaskFilter}
                label="Filter tasks"
              >
                <MultiSelectDropdown
                  label="Filter by Source"
                  options={[
                    ...goals.map(g => ({ label: g.title, value: g.id, group: "Goals", color: getEntityColor(g.id).hex })),
                    ...projects.map(p => ({ label: p.title, value: p.id, group: "Projects", color: getEntityColor(p.id).hex }))
                  ]}
                  selectedValues={taskContextFilter}
                  onChange={setTaskContextFilter}
                />
              </FilterTabs>
              {visibleTasks.length === 0 ? (
                <p className="empty-hint">No tasks here — break a personal goal or project into daily actions.</p>
              ) : (
                <ul className="item-list">
                  {visibleTasks.map((t) => {
                    const parentGoal = goals.find((g) => g.id === t.goal_id);
                    const parentProject = projects.find((p) => p.id === t.project_id);
                    return (
                      <li key={t.id} className="item">
                        <div className="item__main">
                          <span className="item__title">{t.title}</span>
                          <div className="item__meta">
                            <StatusBadge status={t.status} />
                            {t.priority > 0 && <span className="pill">P{t.priority}</span>}
                            {parentGoal && (
                              <span
                                className="pill"
                                style={{
                                  borderColor: getEntityColor(parentGoal.id).border,
                                  color: getEntityColor(parentGoal.id).text,
                                  background: getEntityColor(parentGoal.id).bg,
                                  fontWeight: 600,
                                  fontSize: "0.72rem",
                                }}
                              >
                                ↗ {parentGoal.title}
                              </span>
                            )}
                            {parentProject && (
                              <span
                                className="pill"
                                style={{
                                  borderColor: getEntityColor(parentProject.id).border,
                                  color: getEntityColor(parentProject.id).text,
                                  background: getEntityColor(parentProject.id).bg,
                                  fontWeight: 600,
                                  fontSize: "0.72rem",
                                }}
                              >
                                ⊞ {parentProject.title}
                              </span>
                            )}
                            {t.due_date && <span className="muted">Due {t.due_date}</span>}
                          </div>
                          {t.description && <p className="item__desc">{t.description}</p>}
                        </div>
                        <div className="actions">
                          <button className="action-btn" aria-label="Edit task" onClick={() => setTaskForm({ open: true, task: t })}><EditIcon /></button>
                          <button className="action-btn action-btn--danger" aria-label="Delete task" onClick={() => askDelete(`Delete task "${t.title}"?`, () => deleteTask(t.id))}><TrashIcon /></button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            {/* Calendar View */}
            <TaskCalendar tasks={tasks} goals={goals} projects={projects} onTaskUpdated={loadData} />

            {/* ── SECTION GROUP 3: Job Search Pipeline ──────────────────── */}
            <div className="group-label">▸ Job Search Pipeline</div>

            <section aria-labelledby="apps-heading" className="card-section">
              <SectionHeading
                id="apps-heading"
                title="Applications"
                count={visibleApps.length}
                onAdd={() => setAppForm({ open: true, application: null })}
                addLabel="Add Application"
              />
              <FilterTabs
                options={[
                  ["all","All"],["applied","Applied"],["screening","Screening"],
                  ["interviewing","Interviewing"],["offered","Offered"],
                  ["rejected","Rejected"],["withdrawn","Withdrawn"],
                ]}
                value={appFilter}
                onChange={setAppFilter}
                label="Filter applications"
              />
              {visibleApps.length === 0 ? (
                <p className="empty-hint">No applications tracked — add one to start your pipeline.</p>
              ) : (
                <ul className="item-list">
                  {visibleApps.map((a) => (
                    <li key={a.id} className="item">
                      <div className="item__main">
                        <span className="item__title">{a.role} <span className="muted">at</span> {a.company}</span>
                        <div className="item__meta">
                          <ApplicationStatusBadge status={a.status} />
                          {a.location && <span className="pill">{a.location}</span>}
                          {a.applied_at && <span className="muted">Applied {a.applied_at}</span>}
                        </div>
                        {a.notes && <p className="item__desc">{a.notes}</p>}
                        {/* reminders */}
                        {a.reminders && a.reminders.length > 0 && (
                          <ul className="reminder-list">
                            {a.reminders.map((r) => (
                              <li key={r.id} className={`reminder-item${r.is_completed ? " reminder-item--done" : ""}`}>
                                <input type="checkbox" checked={r.is_completed} onChange={() => toggleReminder(r.id, r.is_completed)} />
                                <span>🔔 <strong>{r.reminder_type.replace("_", " ")}</strong> — {new Date(r.due_date).toLocaleDateString()}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <div className="actions">
                        <button className="action-btn" aria-label="Add reminder" title="Add Reminder" onClick={() => setReminderForm({ open: true, applicationId: a.id })}><BellIcon /></button>
                        <button className="action-btn" aria-label="Edit application" onClick={() => setAppForm({ open: true, application: a })}><EditIcon /></button>
                        <button className="action-btn action-btn--danger" aria-label="Delete application" onClick={() => askDelete(`Delete application for "${a.role} at ${a.company}"?`, () => deleteApplication(a.id))}><TrashIcon /></button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* ── Activity Feed ─────────────────────────────────────────── */}
            <div className="group-label">▸ Recent Activity</div>
            <ActivityFeed activities={activities} loading={loading} />
          </div>
        )}
      </main>

      {/* ── Modals ────────────────────────────────────────────────────────── */}

      {goalForm.open && (
        <GoalForm
          goal={goalForm.goal}
          onSave={() => { setGoalForm({ open: false }); loadData(); }}
          onClose={() => setGoalForm({ open: false })}
        />
      )}

      {goalAgentModal.open && goalAgentModal.goal && (
        <GoalSuggestionModal
          goal={goalAgentModal.goal}
          onSuccess={() => { setGoalAgentModal({ open: false }); loadData(); }}
          onClose={() => setGoalAgentModal({ open: false })}
        />
      )}

      {detailModal.open && detailModal.entity && (
        <EntityDetailModal
          entity={detailModal.entity}
          tasks={tasks.filter((t) =>
            detailModal.entity?.kind === "goal"
              ? t.goal_id === detailModal.entity.data.id
              : t.project_id === detailModal.entity?.data.id
          )}
          onClose={() => setDetailModal({ open: false })}
          onDataChanged={loadData}
        />
      )}

      {projectForm.open && (
        <ProjectForm
          project={projectForm.project}
          goals={goals}
          onSave={() => { setProjectForm({ open: false }); loadData(); }}
          onClose={() => setProjectForm({ open: false })}
        />
      )}

      {agentModal.open && agentModal.project && (
        <ProjectSuggestionModal
          project={agentModal.project}
          onSuccess={() => { setAgentModal({ open: false }); loadData(); }}
          onClose={() => setAgentModal({ open: false })}
        />
      )}

      {taskForm.open && (
        <TaskForm
          task={taskForm.task}
          goals={goals}
          projects={projects}
          onSave={() => { setTaskForm({ open: false }); loadData(); }}
          onClose={() => setTaskForm({ open: false })}
        />
      )}

      {appForm.open && (
        <ApplicationForm
          application={appForm.application}
          onSave={() => { setAppForm({ open: false }); loadData(); }}
          onClose={() => setAppForm({ open: false })}
        />
      )}

      {reminderForm.open && reminderForm.applicationId && (
        <ReminderForm
          applicationId={reminderForm.applicationId}
          onSave={() => { setReminderForm({ open: false }); loadData(); }}
          onClose={() => setReminderForm({ open: false })}
        />
      )}

      {confirm?.open && (
        <ConfirmDialog
          message={confirm.message}
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}
    </>
  );
}
