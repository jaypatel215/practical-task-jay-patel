export interface JwtPayload {
  userId: string;
  email: string;
}

export interface AuthUser {
  userId: string;
  email: string;
}

export interface SafeUser {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

export interface ProjectResponse {
  id: string;
  name: string;
  description: string | null;
  creatorId: string;
  createdAt: Date;
  updatedAt: Date;
  memberCount?: number;
  taskCount?: number;
  role?: string;
}

export interface MemberResponse {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  joinedAt: Date;
}

export interface AssigneeResponse {
  id: string;
  name: string;
  email: string;
}

export interface TaskResponse {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  assigneeId: string | null;
  assignee: AssigneeResponse | null;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardSummary {
  totalProjects: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
}
