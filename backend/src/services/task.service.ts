import { TaskStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AppError } from "../utils/errors";
import { TaskResponse } from "../types";
import { formatDueDate, parseDueDate } from "../utils/formatters";
import { CreateTaskInput, UpdateTaskInput } from "../schemas/task.schema";
import { isProjectMember } from "./member.service";

type TaskWithAssignee = {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: Date | null;
  assigneeId: string | null;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  assignee: { id: string; name: string; email: string } | null;
};

function mapTask(task: TaskWithAssignee): TaskResponse {
  return {
    id: task.id,
    projectId: task.projectId,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueDate: formatDueDate(task.dueDate),
    assigneeId: task.assigneeId,
    assignee: task.assignee
      ? {
          id: task.assignee.id,
          name: task.assignee.name,
          email: task.assignee.email,
        }
      : null,
    createdById: task.createdById,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}

async function validateAssignee(projectId: string, assigneeId: string | null | undefined) {
  if (assigneeId === undefined || assigneeId === null) {
    return;
  }

  const isMember = await isProjectMember(projectId, assigneeId);

  if (!isMember) {
    throw new AppError(422, "INVALID_ASSIGNEE", "Assignee must be a project member");
  }
}

const taskInclude = {
  assignee: {
    select: { id: true, name: true, email: true },
  },
};

export async function createTask(
  projectId: string,
  userId: string,
  input: CreateTaskInput
) {
  await validateAssignee(projectId, input.assigneeId);

  const task = await prisma.task.create({
    data: {
      projectId,
      title: input.title,
      description: input.description,
      status: input.status,
      priority: input.priority,
      dueDate: input.dueDate ? parseDueDate(input.dueDate) : null,
      assigneeId: input.assigneeId ?? null,
      createdById: userId,
    },
    include: taskInclude,
  });

  return mapTask(task);
}

export async function listTasks(projectId: string, status?: TaskStatus) {
  const tasks = await prisma.task.findMany({
    where: {
      projectId,
      ...(status ? { status } : {}),
    },
    include: taskInclude,
    orderBy: { createdAt: "desc" },
  });

  return tasks.map(mapTask);
}

export async function getTaskById(projectId: string, taskId: string) {
  const task = await prisma.task.findFirst({
    where: { id: taskId, projectId },
    include: taskInclude,
  });

  if (!task) {
    throw new AppError(404, "NOT_FOUND", "Task not found");
  }

  return mapTask(task);
}

export async function updateTask(
  projectId: string,
  taskId: string,
  input: UpdateTaskInput
) {
  const existingTask = await prisma.task.findFirst({
    where: { id: taskId, projectId },
  });

  if (!existingTask) {
    throw new AppError(404, "NOT_FOUND", "Task not found");
  }

  await validateAssignee(projectId, input.assigneeId);

  const task = await prisma.task.update({
    where: { id: taskId },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.priority !== undefined ? { priority: input.priority } : {}),
      ...(input.dueDate !== undefined
        ? { dueDate: input.dueDate ? parseDueDate(input.dueDate) : null }
        : {}),
      ...(input.assigneeId !== undefined ? { assigneeId: input.assigneeId } : {}),
    },
    include: taskInclude,
  });

  return mapTask(task);
}

export async function deleteTask(projectId: string, taskId: string) {
  const task = await prisma.task.findFirst({
    where: { id: taskId, projectId },
  });

  if (!task) {
    throw new AppError(404, "NOT_FOUND", "Task not found");
  }

  if (task.status === TaskStatus.DONE) {
    throw new AppError(
      422,
      "TASK_COMPLETED",
      "Completed tasks cannot be deleted"
    );
  }

  await prisma.task.delete({
    where: { id: taskId },
  });
}
