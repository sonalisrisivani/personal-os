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
  title: string;
  description: string | null;
  status: "todo" | "in_progress" | "done";
  priority: number;
  due_date: string | null;
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
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`API ${res.status}: ${text}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
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
}): Promise<PaginatedResponse<Task>> {
  const params = new URLSearchParams();
  if (filters?.status) params.set("status", filters.status);
  if (filters?.goal_id) params.set("goal_id", filters.goal_id);
  const qs = params.size ? `?${params}` : "";
  return request<PaginatedResponse<Task>>(`/tasks${qs}`);
}

export async function createTask(data: {
  title: string;
  goal_id?: string;
  description?: string;
  priority?: number;
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
