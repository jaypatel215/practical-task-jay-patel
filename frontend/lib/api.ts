import {
  AuthResponse,
  CreateProjectInput,
  CreateTaskInput,
  DashboardSummary,
  LoginInput,
  Project,
  ProjectMember,
  RegisterInput,
  Task,
  TaskStatus,
  UpdateProjectInput,
  UpdateTaskInput,
  User,
} from "@/types";
import { getToken, clearToken } from "./auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export class ApiClientError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number,
    public details?: { field: string; message: string }[]
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

async function apiClient<T>(
  path: string,
  options: RequestInit = {},
  auth = true
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (auth) {
    const token = getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401 && auth) {
    clearToken();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiClientError(
      data?.error ?? "Request failed",
      data?.code ?? "REQUEST_FAILED",
      response.status,
      data?.details
    );
  }

  return data as T;
}

export function register(data: RegisterInput) {
  return apiClient<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  }, false);
}

export function login(data: LoginInput) {
  return apiClient<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  }, false);
}

export function getMe() {
  return apiClient<User>("/auth/me");
}

export function getProjects() {
  return apiClient<{ projects: Project[] }>("/projects");
}

export function getProject(id: string) {
  return apiClient<Project>(`/projects/${id}`);
}

export function createProject(data: CreateProjectInput) {
  return apiClient<Project>("/projects", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateProject(id: string, data: UpdateProjectInput) {
  return apiClient<Project>(`/projects/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteProject(id: string) {
  return apiClient<void>(`/projects/${id}`, { method: "DELETE" });
}

export function getMembers(projectId: string) {
  return apiClient<{ members: ProjectMember[] }>(`/projects/${projectId}/members`);
}

export function addMember(projectId: string, email: string) {
  return apiClient<ProjectMember>(`/projects/${projectId}/members`, {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function removeMember(projectId: string, userId: string) {
  return apiClient<void>(`/projects/${projectId}/members/${userId}`, {
    method: "DELETE",
  });
}

export function getTasks(projectId: string, status?: TaskStatus) {
  const query = status ? `?status=${status}` : "";
  return apiClient<{ tasks: Task[] }>(`/projects/${projectId}/tasks${query}`);
}

export function getTask(projectId: string, taskId: string) {
  return apiClient<Task>(`/projects/${projectId}/tasks/${taskId}`);
}

export function createTask(projectId: string, data: CreateTaskInput) {
  return apiClient<Task>(`/projects/${projectId}/tasks`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateTask(projectId: string, taskId: string, data: UpdateTaskInput) {
  return apiClient<Task>(`/projects/${projectId}/tasks/${taskId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteTask(projectId: string, taskId: string) {
  return apiClient<void>(`/projects/${projectId}/tasks/${taskId}`, {
    method: "DELETE",
  });
}

export function getDashboardSummary() {
  return apiClient<DashboardSummary>("/dashboard/summary");
}
