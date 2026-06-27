import { ProjectMemberRole } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AppError } from "../utils/errors";
import { MemberResponse } from "../types";
import { AddMemberInput } from "../schemas/member.schema";

function mapMember(member: {
  id: string;
  userId: string;
  role: ProjectMemberRole;
  joinedAt: Date;
  user: { name: string; email: string };
}): MemberResponse {
  return {
    id: member.id,
    userId: member.userId,
    name: member.user.name,
    email: member.user.email,
    role: member.role,
    joinedAt: member.joinedAt,
  };
}

export async function listMembers(projectId: string) {
  const members = await prisma.projectMember.findMany({
    where: { projectId },
    include: {
      user: {
        select: { name: true, email: true },
      },
    },
    orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
  });

  return members.map(mapMember);
}

export async function addMember(projectId: string, input: AddMemberInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (!user) {
    throw new AppError(404, "USER_NOT_FOUND", "No registered user with that email");
  }

  const existingMembership = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId: user.id,
      },
    },
  });

  if (existingMembership) {
    throw new AppError(409, "ALREADY_MEMBER", "User is already a project member");
  }

  const member = await prisma.projectMember.create({
    data: {
      projectId,
      userId: user.id,
      role: ProjectMemberRole.MEMBER,
    },
    include: {
      user: {
        select: { name: true, email: true },
      },
    },
  });

  return mapMember(member);
}

export async function removeMember(projectId: string, userId: string) {
  const membership = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId,
      },
    },
  });

  if (!membership) {
    throw new AppError(404, "NOT_FOUND", "Member not found in project");
  }

  if (membership.role === ProjectMemberRole.CREATOR) {
    throw new AppError(
      403,
      "CANNOT_REMOVE_CREATOR",
      "The project creator cannot be removed"
    );
  }

  await prisma.projectMember.delete({
    where: { id: membership.id },
  });
}

export async function isProjectMember(projectId: string, userId: string) {
  const membership = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId,
      },
    },
  });

  return Boolean(membership);
}
