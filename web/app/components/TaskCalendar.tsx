"use client";

import { useState } from "react";
import { Task, updateTask, Goal, Project } from "../../lib/api";
import { getEntityColor } from "../../lib/colors";
import StatusBadge from "./StatusBadge";

interface TaskCalendarProps {
  tasks: Task[];
  goals: Goal[];
  projects: Project[];
  onTaskUpdated?: () => void;
}

const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const SHORT_MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

function formatLocalDate(year: number, month: number, day: number): string {
  const m = String(month + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

function formatDisplayDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const weekday = WEEKDAY_NAMES[date.getDay()] ?? "";
  const month = SHORT_MONTH_NAMES[m - 1] ?? "";
  return `${weekday}, ${month} ${d}, ${y}`;
}

export default function TaskCalendar({
  tasks,
  goals,
  projects,
  onTaskUpdated,
}: TaskCalendarProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(() => {
    const today = new Date();
    return formatLocalDate(today.getFullYear(), today.getMonth(), today.getDate());
  });

  // Maps for quick goal/project lookup
  const goalMap = new Map<string, Goal>(goals.map((g) => [g.id, g]));
  const projectMap = new Map<string, Project>(projects.map((p) => [p.id, p]));

  function getTaskParentInfo(task: Task): { name: string; type: "goal" | "project" | null; color: ReturnType<typeof getEntityColor> } {
    if (task.goal_id && goalMap.has(task.goal_id)) {
      const g = goalMap.get(task.goal_id)!;
      return { name: g.title, type: "goal", color: getEntityColor(g.id) };
    }
    if (task.project_id && projectMap.has(task.project_id)) {
      const p = projectMap.get(task.project_id)!;
      return { name: p.title, type: "project", color: getEntityColor(p.id) };
    }
    return { name: "General", type: null, color: getEntityColor(null) };
  }

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // First day of month (0 = Sun, 1 = Mon, ..., 6 = Sat)
  const firstDayIndex = new Date(year, month, 1).getDay();
  // Total days in current month
  const totalDays = new Date(year, month + 1, 0).getDate();
  // Total days in previous month
  const prevMonthTotalDays = new Date(year, month, 0).getDate();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  function prevMonth() {
    setCurrentDate(new Date(year, month - 1, 1));
  }

  function nextMonth() {
    setCurrentDate(new Date(year, month + 1, 1));
  }

  function goToday() {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDateStr(formatLocalDate(now.getFullYear(), now.getMonth(), now.getDate()));
  }

  // Map tasks by date YYYY-MM-DD cleanly
  const tasksByDate: Record<string, Task[]> = {};
  tasks.forEach((t) => {
    if (!t.due_date) return;
    // Handle both 'YYYY-MM-DD' and 'YYYY-MM-DDTHH:MM:SS'
    const datePart = t.due_date.split("T")[0];
    if (!tasksByDate[datePart]) tasksByDate[datePart] = [];
    tasksByDate[datePart].push(t);
  });

  // Calendar cells
  const calendarCells = [];

  // Previous month padding cells
  const prevYear = month === 0 ? year - 1 : year;
  const prevMonthNum = month === 0 ? 11 : month - 1;
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const dayNum = prevMonthTotalDays - i;
    const dateStr = formatLocalDate(prevYear, prevMonthNum, dayNum);
    calendarCells.push({
      dateStr,
      dayNum,
      isCurrentMonth: false,
      isToday: false,
      tasks: tasksByDate[dateStr] || [],
    });
  }

  // Current month cells
  const now = new Date();
  const todayStr = formatLocalDate(now.getFullYear(), now.getMonth(), now.getDate());

  for (let d = 1; d <= totalDays; d++) {
    const dateStr = formatLocalDate(year, month, d);
    calendarCells.push({
      dateStr,
      dayNum: d,
      isCurrentMonth: true,
      isToday: dateStr === todayStr,
      tasks: tasksByDate[dateStr] || [],
    });
  }

  // Next month padding cells to complete full 7-day rows
  const nextYear = month === 11 ? year + 1 : year;
  const nextMonthNum = month === 11 ? 0 : month + 1;
  const remainingCells = (7 - (calendarCells.length % 7)) % 7;
  for (let i = 1; i <= remainingCells; i++) {
    const dateStr = formatLocalDate(nextYear, nextMonthNum, i);
    calendarCells.push({
      dateStr,
      dayNum: i,
      isCurrentMonth: false,
      isToday: false,
      tasks: tasksByDate[dateStr] || [],
    });
  }

  const selectedTasks = selectedDateStr ? tasksByDate[selectedDateStr] || [] : [];

  async function toggleTaskStatus(task: Task) {
    const nextStatus = task.status === "done" ? "todo" : "done";
    try {
      await updateTask(task.id, { status: nextStatus });
      if (onTaskUpdated) onTaskUpdated();
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <section aria-labelledby="calendar-heading" className="card-section calendar-section" suppressHydrationWarning>
      <div className="section-header calendar-header">
        <h3 id="calendar-heading">
          📅 Deadlines & Task Calendar
        </h3>
        <div className="calendar-controls">
          <button className="btn btn-sm btn-ghost calendar-nav-btn" onClick={prevMonth} aria-label="Previous Month">
            ‹
          </button>
          <span className="calendar-month-label">
            {monthNames[month]} {year}
          </span>
          <button className="btn btn-sm btn-ghost calendar-nav-btn" onClick={nextMonth} aria-label="Next Month">
            ›
          </button>
          <button className="btn btn-sm btn-ghost calendar-today-btn" onClick={goToday}>
            Today
          </button>
        </div>
      </div>

      <div className="calendar-container">
        {/* Calendar Grid */}
        <div className="calendar-grid-wrapper">
          <div className="calendar-weekdays">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="calendar-weekday">
                {day}
              </div>
            ))}
          </div>

          <div className="calendar-grid">
            {calendarCells.map((cell, idx) => {
              const isSelected = cell.dateStr === selectedDateStr;
              const hasTasks = cell.tasks.length > 0;

              return (
                <div
                  key={idx}
                  className={`calendar-cell ${!cell.isCurrentMonth ? "calendar-cell--muted" : ""} ${
                    cell.isToday ? "calendar-cell--today" : ""
                  } ${isSelected ? "calendar-cell--selected" : ""}`}
                  onClick={() => setSelectedDateStr(cell.dateStr)}
                >
                  <div className="calendar-cell-header">
                    <span className="calendar-cell-num">{cell.dayNum}</span>
                    {hasTasks && (
                      <span className="calendar-cell-badge">
                        {cell.tasks.length}
                      </span>
                    )}
                  </div>

                  {hasTasks && (
                    <div className="calendar-cell-dots">
                      {cell.tasks.slice(0, 4).map((t) => {
                        const parentInfo = getTaskParentInfo(t);
                        return (
                          <span
                            key={t.id}
                            className="calendar-dot"
                            style={{
                              backgroundColor: parentInfo.color.hex,
                              opacity: t.status === "done" ? 0.4 : 1,
                              border: t.status === "done" ? "1px dashed var(--text-faint)" : "none",
                            }}
                            title={`${t.title} [${parentInfo.name}] (${t.status})`}
                          />
                        );
                      })}
                      {cell.tasks.length > 4 && (
                        <span className="calendar-dot-more">+{cell.tasks.length - 4}</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Day Agenda */}
        <div className="calendar-agenda">
          <div className="calendar-agenda-header">
            <div>
              <h4 suppressHydrationWarning style={{ margin: 0, fontSize: "1rem" }}>
                {selectedDateStr ? formatDisplayDate(selectedDateStr) : "Select a date"}
              </h4>
              <span style={{ fontSize: "0.78rem", color: "var(--text-faint)" }}>
                {selectedTasks.length} {selectedTasks.length === 1 ? "task due" : "tasks due"}
              </span>
            </div>
          </div>

          {selectedTasks.length === 0 ? (
            <p className="empty-hint" style={{ padding: "24px 0", textAlign: "center" }}>
              No tasks due on this date.
            </p>
          ) : (
            <ul className="agenda-list">
              {selectedTasks.map((t) => {
                const parentInfo = getTaskParentInfo(t);
                return (
                  <li
                    key={t.id}
                    className={`agenda-item ${t.status === "done" ? "agenda-item--done" : ""}`}
                    style={{
                      borderLeft: `4px solid ${parentInfo.color.hex}`,
                      background: parentInfo.color.bg,
                    }}
                  >
                    <label className="agenda-item-label">
                      <input
                        type="checkbox"
                        checked={t.status === "done"}
                        onChange={() => toggleTaskStatus(t)}
                        className="agenda-checkbox"
                      />
                      <div className="agenda-item-body">
                        <span className="agenda-item-title">
                          {t.title}
                        </span>

                        <div className="item__meta" style={{ marginTop: "4px", gap: "6px" }}>
                          <StatusBadge status={t.status} />
                          {t.priority > 0 && <span className="pill">P{t.priority}</span>}
                          {parentInfo.type && (
                            <span
                              className="pill"
                              style={{
                                borderColor: parentInfo.color.border,
                                color: parentInfo.color.text,
                                fontWeight: 600,
                                fontSize: "0.72rem",
                              }}
                            >
                              {parentInfo.type === "goal" ? "↗ Goal: " : "⊞ Project: "}
                              {parentInfo.name}
                            </span>
                          )}
                        </div>
                        {t.description && <p className="item__desc" style={{ marginTop: "4px", fontSize: "0.8rem" }}>{t.description}</p>}
                      </div>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
