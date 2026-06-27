import { ProjectMemberRole } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AppError } from "../utils/errors";
import { ProjectResponse } from "../types";
import { CreateProjectInput, UpdateProjectInput } from "../schemas/project.schema";

function mapProject(
  project: {
    id: string;
    name: string;
    description: string | null;
    creatorId: string;
    createdAt: Date;
    updatedAt: Date;
    _count?: { members: number; tasks: number };
  },
  role?: string
): ProjectResponse {
  return {
    id: project.id,
    name: project.name,
    description: project.description,
    creatorId: project.creatorId,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    ...(project._count
      ? {
          memberCount: project._count.members,
          taskCount: project._count.tasks,
        }
      : {}),
    ...(role ? { role } : {}),
  };
}

export async function createProject(userId: string, input: CreateProjectInput) {
  const project = await prisma.project.create({
    data: {
      name: input.name,
      description: input.description,
      creatorId: userId,
      members: {
        create: {
          userId,
          role: ProjectMemberRole.CREATOR,
        },
      },
    },
    include: {
      _count: {
        select: { members: true, tasks: true },
      },
    },
  });

  return mapProject(project, ProjectMemberRole.CREATOR);
}

export async function listProjects(userId: string) {
  const memberships = await prisma.projectMember.findMany({
    where: { userId },
    include: {
      project: {
        include: {
          _count: {
            select: { members: true, tasks: true },
          },
        },
      },
    },
    orderBy: {
      project: { updatedAt: "desc" },
    },
  });

  return memberships.map((membership) =>
    mapProject(membership.project, membership.role)
  );
}

export async function getProjectById(projectId: string, role: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    throw new AppError(404, "NOT_FOUND", "Project not found");
  }

  return mapProject(project, role);
}

export async function updateProject(projectId: string, input: UpdateProjectInput) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    throw new AppError(404, "NOT_FOUND", "Project not found");
  }

  const updated = await prisma.project.update({
    where: { id: projectId },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
    },
    include: {
      _count: {
        select: { members: true, tasks: true },
      },
    },
  });

  return mapProject(updated, ProjectMemberRole.CREATOR);
}

export async function deleteProject(projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    throw new AppError(404, "NOT_FOUND", "Project not found");
  }

  await prisma.project.delete({
    where: { id: projectId },
  });
}
