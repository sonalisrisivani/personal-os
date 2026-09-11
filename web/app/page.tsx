"use client";

import { useState, useEffect, useCallback } from "react";
import {
  fetchGoals,
  fetchTasks,
  fetchActivities,
  fetchSummaryMetrics,
  deleteGoal,
  deleteTask,
  Goal,
  Task,
  ActivityEvent,
  SummaryMetrics,
} from "../lib/api";
import StatusBadge from "./components/StatusBadge";
import GoalForm from "./components/GoalForm";
import TaskForm from "./components/TaskForm";
import ConfirmDialog from "./components/ConfirmDialog";
import { SummaryMetricsCards } from "./components/SummaryMetricsCards";
import { ActivityFeed } from "./components/ActivityFeed";

// ─── Filter tab types ─────────────────────────────────────────────────────────

type GoalFilter = "all" | "active" | "completed" | "archived";
type TaskFilter = "all" | "todo" | "in_progress" | "done";

// ─── Small icon components ────────────────────────────────────────────────────

function PencilIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Home() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [metrics, setMetrics] = useState<SummaryMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [goalFilter, setGoalFilter] = useState<GoalFilter>("all");
  const [taskFilter, setTaskFilter] = useState<TaskFilter>("all");

  const [goalForm, setGoalForm] = useState<{
    open: boolean;
    goal?: Goal | null;
  }>({ open: false });
  const [taskForm, setTaskForm] = useState<{
    open: boolean;
    task?: Task | null;
  }>({ open: false });

  const [confirm, setConfirm] = useState<{
    open: boolean;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [goalsRes, tasksRes, activitiesRes, metricsRes] = await Promise.all([
        fetchGoals(),
        fetchTasks(),
        fetchActivities({ page_size: 10 }),
        fetchSummaryMetrics(),
      ]);
      setGoals(goalsRes.items);
      setTasks(tasksRes.items);
      setActivities(activitiesRes.items);
      setMetrics(metricsRes);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Filtered lists ──────────────────────────────────────────────────────────

  const visibleGoals =
    goalFilter === "all" ? goals : goals.filter((g) => g.status === goalFilter);

  const visibleTasks =
    taskFilter === "all" ? tasks : tasks.filter((t) => t.status === taskFilter);

  // ── Delete helpers ──────────────────────────────────────────────────────────

  function confirmDeleteGoal(goal: Goal) {
    setConfirm({
      open: true,
      message: `Delete goal "${goal.title}"? This cannot be undone.`,
      onConfirm: async () => {
        await deleteGoal(goal.id);
        setConfirm(null);
        loadData();
      },
    });
  }

  function confirmDeleteTask(task: Task) {
    setConfirm({
      open: true,
      message: `Delete task "${task.title}"? This cannot be undone.`,
      onConfirm: async () => {
        await deleteTask(task.id);
        setConfirm(null);
        loadData();
      },
    });
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      <main>
        <p className="eyebrow">PERSONAL OS</p>
        <h1>Make your next move deliberate.</h1>
        <p className="intro">
          Your private workspace for goals, tasks, applications, and progress.
        </p>

        {error && <p className="error-banner">{error}</p>}

        {loading ? (
          <p className="loading">Loading…</p>
        ) : (
          <div className="dashboard">
            <SummaryMetricsCards metrics={metrics} loading={loading} />

            {/* ── Goals section ────────────────────────────────────────────── */}
            <section aria-labelledby="goals-heading">
              <div className="section-header">
                <h2 id="goals-heading">
                  Goals
                  <span className="count">{visibleGoals.length}</span>
                </h2>
                <button
                  className="btn btn-primary"
                  onClick={() => setGoalForm({ open: true, goal: null })}
                >
                  + Add Goal
                </button>
              </div>

              <div className="filter-tabs" role="tablist" aria-label="Filter goals">
                {(
                  [
                    ["all", "All"],
                    ["active", "Active"],
                    ["completed", "Completed"],
                    ["archived", "Archived"],
                  ] as [GoalFilter, string][]
                ).map(([value, label]) => (
                  <button
                    key={value}
                    role="tab"
                    aria-selected={goalFilter === value}
                    className={`filter-tab${goalFilter === value ? " filter-tab--active" : ""}`}
                    onClick={() => setGoalFilter(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {visibleGoals.length === 0 ? (
                <div className="empty-state">
                  <p>No goals yet. Add your first goal to get started.</p>
                  <button
                    className="btn btn-primary"
                    onClick={() => setGoalForm({ open: true, goal: null })}
                  >
                    + Add Goal
                  </button>
                </div>
              ) : (
                <ul className="item-list" aria-label="Goals list">
                  {visibleGoals.map((goal) => (
                    <li key={goal.id} className="item">
                      <div className="item__main">
                        <span className="item__title">{goal.title}</span>
                        <div className="item__meta">
                          <StatusBadge status={goal.status} />
                          {goal.priority > 0 && (
                            <span className="priority-badge">
                              P{goal.priority}
                            </span>
                          )}
                          {goal.due_date && (
                            <span className="due-date">
                              Due {goal.due_date}
                            </span>
                          )}
                        </div>
                        {goal.description && (
                          <p className="item__desc">{goal.description}</p>
                        )}
                      </div>
                      <div className="actions">
                        <button
                          className="action-btn"
                          aria-label={`Edit goal: ${goal.title}`}
                          onClick={() => setGoalForm({ open: true, goal })}
                        >
                          <PencilIcon />
                        </button>
                        <button
                          className="action-btn action-btn--danger"
                          aria-label={`Delete goal: ${goal.title}`}
                          onClick={() => confirmDeleteGoal(goal)}
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* ── Tasks section ────────────────────────────────────────────── */}
            <section aria-labelledby="tasks-heading">
              <div className="section-header">
                <h2 id="tasks-heading">
                  Tasks
                  <span className="count">{visibleTasks.length}</span>
                </h2>
                <button
                  className="btn btn-primary"
                  onClick={() => setTaskForm({ open: true, task: null })}
                >
                  + Add Task
                </button>
              </div>

              <div className="filter-tabs" role="tablist" aria-label="Filter tasks">
                {(
                  [
                    ["all", "All"],
                    ["todo", "To Do"],
                    ["in_progress", "In Progress"],
                    ["done", "Done"],
                  ] as [TaskFilter, string][]
                ).map(([value, label]) => (
                  <button
                    key={value}
                    role="tab"
                    aria-selected={taskFilter === value}
                    className={`filter-tab${taskFilter === value ? " filter-tab--active" : ""}`}
                    onClick={() => setTaskFilter(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {visibleTasks.length === 0 ? (
                <div className="empty-state">
                  <p>No tasks yet. Add your first task to get started.</p>
                  <button
                    className="btn btn-primary"
                    onClick={() => setTaskForm({ open: true, task: null })}
                  >
                    + Add Task
                  </button>
                </div>
              ) : (
                <ul className="item-list" aria-label="Tasks list">
                  {visibleTasks.map((task) => {
                    const parentGoal = goals.find((g) => g.id === task.goal_id);
                    return (
                      <li key={task.id} className="item">
                        <div className="item__main">
                          <span className="item__title">{task.title}</span>
                          <div className="item__meta">
                            <StatusBadge status={task.status} />
                            {task.priority > 0 && (
                              <span className="priority-badge">
                                P{task.priority}
                              </span>
                            )}
                            {parentGoal && (
                              <span className="goal-label">
                                ↗ {parentGoal.title}
                              </span>
                            )}
                            {task.due_date && (
                              <span className="due-date">
                                Due {task.due_date}
                              </span>
                            )}
                          </div>
                          {task.description && (
                            <p className="item__desc">{task.description}</p>
                          )}
                        </div>
                        <div className="actions">
                          <button
                            className="action-btn"
                            aria-label={`Edit task: ${task.title}`}
                            onClick={() => setTaskForm({ open: true, task })}
                          >
                            <PencilIcon />
                          </button>
                          <button
                            className="action-btn action-btn--danger"
                            aria-label={`Delete task: ${task.title}`}
                            onClick={() => confirmDeleteTask(task)}
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <ActivityFeed activities={activities} loading={loading} />
          </div>
        )}
      </main>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}

      {goalForm.open && (
        <GoalForm
          goal={goalForm.goal}
          onSave={() => {
            setGoalForm({ open: false });
            loadData();
          }}
          onClose={() => setGoalForm({ open: false })}
        />
      )}

      {taskForm.open && (
        <TaskForm
          task={taskForm.task}
          goals={goals}
          onSave={() => {
            setTaskForm({ open: false });
            loadData();
          }}
          onClose={() => setTaskForm({ open: false })}
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
