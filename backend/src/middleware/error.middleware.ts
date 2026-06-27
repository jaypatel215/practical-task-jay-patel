import { Request, Response, NextFunction } from "express";
import { AppError, isAppError } from "../utils/errors";

export function errorMiddleware(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (isAppError(error)) {
    res.status(error.statusCode).json({
      error: error.message,
      code: error.code,
      ...(error.details ? { details: error.details } : {}),
    });
    return;
  }

  console.error("Unexpected error:", error);

  res.status(500).json({
    error: "Internal server error",
    code: "INTERNAL_ERROR",
  });
}

export function notFoundMiddleware(_req: Request, res: Response) {
  res.status(404).json({
    error: "Route not found",
    code: "NOT_FOUND",
  });
}

export function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    handler(req, res, next).catch(next);
  };
}
