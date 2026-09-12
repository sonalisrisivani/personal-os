const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Goal {
  id: string;
  title: string;
  description: string | null;
  status: "active" | "completed" | "archived";
  priority: number;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  goal_id: string | null;
  project_id?: string | null;
  title: string;
  description: string | null;
  status: "todo" | "in_progress" | "done";
  priority: number;
  order_index?: number;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface ActivityEvent {
  id: string;
  event_type: string;
  entity_type: string;
  entity_id: string | null;
  title: string;
  details: string | null;
  created_at: string;
}

export interface SummaryMetrics {
  total_goals: number;
  active_goals: number;
  completed_goals: number;
  total_tasks: number;
  pending_tasks: number;
  in_progress_tasks: number;
  done_tasks: number;
  overdue_tasks: number;
  total_applications?: number;
  active_applications?: number;
  total_projects?: number;
  active_projects?: number;
}

export interface ApplicationReminder {
  id: string;
  application_id: string;
  reminder_type: "follow_up" | "interview_prep" | "deadline" | string;
  due_date: string;
  is_completed: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface JobApplication {
  id: string;
  company: string;
  role: string;
  status: "applied" | "screening" | "interviewing" | "offered" | "rejected" | "withdrawn";
  location: string | null;
  job_url: string | null;
  salary_range: string | null;
  applied_at: string | null;
  notes: string | null;
  source: string;
  external_id: string | null;
  reminders: ApplicationReminder[];
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  title: string;
  description: string | null;
  status: "active" | "in_progress" | "completed" | "on_hold" | "archived";
  repo_url: string | null;
  demo_url: string | null;
  tech_stack: string | null;
  goal_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface SuggestedTask {
  title: string;
  description: string;
  priority: number;
}

export interface SuggestionData {
  explanation: string;
  suggested_tasks: SuggestedTask[];
  recommended_milestone: string;
}

export interface AgentRun {
  id: string;
  project_id: string;
  prompt: string;
  suggestion_data: SuggestionData;
  status: "pending" | "approved" | "rejected";
  model_provider: string;
  explanation: string;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

  try {
    const res = await fetch(`${API_URL}${path}`, {
      headers: { "Content-Type": "application/json", ...init?.headers },
      ...init,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText);
      throw new Error(`API ${res.status}: ${text}`);
    }
    if (res.status === 204) return undefined as T;
    return res.json() as Promise<T>;
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error('API Request timed out.');
    }
    throw err;
  }
}

// ─── Goals ───────────────────────────────────────────────────────────────────

export async function fetchGoals(
  status?: string,
): Promise<PaginatedResponse<Goal>> {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  const qs = params.size ? `?${params}` : "";
  return request<PaginatedResponse<Goal>>(`/goals${qs}`);
}

export async function createGoal(data: {
  title: string;
  description?: string;
  priority?: number;
  due_date?: string;
  status?: "active" | "completed" | "archived";
}): Promise<Goal> {
  return request<Goal>("/goals", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateGoal(
  id: string,
  data: Partial<Goal>,
): Promise<Goal> {
  return request<Goal>(`/goals/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteGoal(id: string): Promise<void> {
  return request<void>(`/goals/${id}`, { method: "DELETE" });
}

// ─── Tasks ───────────────────────────────────────────────────────────────────

export async function fetchTasks(filters?: {
  status?: string;
  goal_id?: string;
  project_id?: string;
}): Promise<PaginatedResponse<Task>> {
  const params = new URLSearchParams();
  if (filters?.status) params.set("status", filters.status);
  if (filters?.goal_id) params.set("goal_id", filters.goal_id);
  if (filters?.project_id) params.set("project_id", filters.project_id);
  const qs = params.size ? `?${params}` : "";
  return request<PaginatedResponse<Task>>(`/tasks${qs}`);
}

export async function createTask(data: {
  title: string;
  goal_id?: string;
  project_id?: string;
  description?: string;
  priority?: number;
  order_index?: number;
  due_date?: string;
}): Promise<Task> {
  return request<Task>("/tasks", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateTask(
  id: string,
  data: Partial<Task>,
): Promise<Task> {
  return request<Task>(`/tasks/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteTask(id: string): Promise<void> {
  return request<void>(`/tasks/${id}`, { method: "DELETE" });
}

export async function reorderTasks(taskIds: string[], params?: { goal_id?: string; project_id?: string }): Promise<Task[]> {
  const query = new URLSearchParams();
  if (params?.goal_id) query.set("goal_id", params.goal_id);
  if (params?.project_id) query.set("project_id", params.project_id);
  const qs = query.size ? `?${query}` : "";
  return request<Task[]>(`/tasks/reorder${qs}`, {
    method: "POST",
    body: JSON.stringify({ task_ids: taskIds }),
  });
}

// ─── Activities & Metrics ───────────────────────────────────────────────────

export async function fetchActivities(params?: {
  entity_type?: string;
  page?: number;
  page_size?: number;
}): Promise<PaginatedResponse<ActivityEvent>> {
  const query = new URLSearchParams();
  if (params?.entity_type) query.set("entity_type", params.entity_type);
  if (params?.page) query.set("page", params.page.toString());
  if (params?.page_size) query.set("page_size", params.page_size.toString());
  const qs = query.size ? `?${query}` : "";
  return request<PaginatedResponse<ActivityEvent>>(`/activities${qs}`);
}

export async function fetchSummaryMetrics(): Promise<SummaryMetrics> {
  return request<SummaryMetrics>("/metrics/summary");
}

// ─── Applications ────────────────────────────────────────────────────────────

export async function fetchApplications(
  status?: string,
): Promise<PaginatedResponse<JobApplication>> {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  const qs = params.size ? `?${params}` : "";
  return request<PaginatedResponse<JobApplication>>(`/applications${qs}`);
}

export async function createApplication(data: {
  company: string;
  role: string;
  status?: string;
  location?: string;
  job_url?: string;
  salary_range?: string;
  applied_at?: string;
  notes?: string;
}): Promise<JobApplication> {
  return request<JobApplication>("/applications", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateApplication(
  id: string,
  data: Partial<JobApplication>,
): Promise<JobApplication> {
  return request<JobApplication>(`/applications/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteApplication(id: string): Promise<void> {
  return request<void>(`/applications/${id}`, { method: "DELETE" });
}

// ─── Application Reminders ───────────────────────────────────────────────────

export async function createApplicationReminder(
  applicationId: string,
  data: {
    reminder_type?: string;
    due_date: string;
    notes?: string;
  },
): Promise<ApplicationReminder> {
  return request<ApplicationReminder>(`/applications/${applicationId}/reminders`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateApplicationReminder(
  reminderId: string,
  data: Partial<ApplicationReminder>,
): Promise<ApplicationReminder> {
  return request<ApplicationReminder>(`/applications/reminders/${reminderId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

// ─── Projects ────────────────────────────────────────────────────────────────

export async function fetchProjects(
  status?: string,
): Promise<PaginatedResponse<Project>> {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  const qs = params.size ? `?${params}` : "";
  return request<PaginatedResponse<Project>>(`/projects${qs}`);
}

export async function createProject(data: {
  title: string;
  description?: string;
  status?: string;
  repo_url?: string;
  demo_url?: string;
  tech_stack?: string;
  goal_id?: string;
}): Promise<Project> {
  return request<Project>("/projects", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateProject(
  id: string,
  data: Partial<Project>,
): Promise<Project> {
  return request<Project>(`/projects/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteProject(id: string): Promise<void> {
  return request<void>(`/projects/${id}`, { method: "DELETE" });
}

// ─── AI Agent Runs ───────────────────────────────────────────────────────────

export async function generateGoalSuggestions(
  goalId: string,
  prompt: string,
): Promise<AgentRun> {
  const params = new URLSearchParams({ prompt });
  return request<AgentRun>(`/agent-runs/goals/${goalId}/suggestions?${params}`, {
    method: "POST",
  });
}

export async function generateProjectSuggestions(
  projectId: string,
  prompt: string,
): Promise<AgentRun> {
  const params = new URLSearchParams({ prompt });
  return request<AgentRun>(`/agent-runs/projects/${projectId}/suggestions?${params}`, {
    method: "POST",
  });
}

export async function fetchAgentRuns(
  status?: string,
): Promise<PaginatedResponse<AgentRun>> {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  const qs = params.size ? `?${params}` : "";
  return request<PaginatedResponse<AgentRun>>(`/agent-runs${qs}`);
}

export async function approveAgentRun(runId: string, taskIndices?: number[]): Promise<AgentRun> {
  return request<AgentRun>(`/agent-runs/${runId}/approve`, {
    method: "POST",
    body: JSON.stringify({ task_indices: taskIndices }),
  });
}

export async function rejectAgentRun(runId: string): Promise<AgentRun> {
  return request<AgentRun>(`/agent-runs/${runId}/reject`, {
    method: "POST",
  });
}
