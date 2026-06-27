import { Request, Response, NextFunction } from "express";
import { ProjectMemberRole } from "@prisma/client";
import { AppError } from "../utils/errors";

export function projectCreatorMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  if (!req.membership) {
    next(new AppError(403, "FORBIDDEN", "You are not a member of this project"));
    return;
  }

  if (req.membership.role !== ProjectMemberRole.CREATOR) {
    next(
      new AppError(403, "FORBIDDEN", "Only the project creator can perform this action")
    );
    return;
  }

  next();
}
