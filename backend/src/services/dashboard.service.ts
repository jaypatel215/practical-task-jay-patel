import { TaskStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { DashboardSummary } from "../types";

export async function getDashboardSummary(userId: string): Promise<DashboardSummary> {
  const memberships = await prisma.projectMember.findMany({
    where: { userId },
    select: { projectId: true },
  });

  const projectIds = memberships.map((membership) => membership.projectId);
  const totalProjects = projectIds.length;

  if (totalProjects === 0) {
    return {
      totalProjects: 0,
      totalTasks: 0,
      completedTasks: 0,
      pendingTasks: 0,
    };
  }

  const [totalTasks, completedTasks] = await Promise.all([
    prisma.task.count({
      where: { projectId: { in: projectIds } },
    }),
    prisma.task.count({
      where: {
        projectId: { in: projectIds },
        status: TaskStatus.DONE,
      },
    }),
  ]);

  return {
    totalProjects,
    totalTasks,
    completedTasks,
    pendingTasks: totalTasks - completedTasks,
  };
}
