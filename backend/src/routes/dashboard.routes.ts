import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { asyncHandler } from "../middleware/error.middleware";
import * as dashboardController from "../controllers/dashboard.controller";

const router = Router();

router.get(
  "/summary",
  authMiddleware,
  asyncHandler(dashboardController.getSummary)
);

export default router;
