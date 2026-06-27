import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { AppError } from "../utils/errors";

export async function projectMemberMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  try {
    const projectId = req.params.id;
    const userId = req.user?.userId;

    if (!userId) {
      next(new AppError(401, "UNAUTHORIZED", "Authentication required"));
      return;
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      next(new AppError(404, "NOT_FOUND", "Project not found"));
      return;
    }

    const membership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    });

    if (!membership) {
      next(new AppError(403, "FORBIDDEN", "You are not a member of this project"));
      return;
    }

    req.membership = membership;
    next();
  } catch (error) {
    next(error);
  }
}
