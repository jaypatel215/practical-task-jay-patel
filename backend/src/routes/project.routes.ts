import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { projectMemberMiddleware } from "../middleware/projectMember.middleware";
import { projectCreatorMiddleware } from "../middleware/projectCreator.middleware";
import { asyncHandler } from "../middleware/error.middleware";
import {
  createProjectSchema,
  projectIdParamSchema,
  updateProjectSchema,
} from "../schemas/project.schema";
import * as projectController from "../controllers/project.controller";
import memberRoutes from "./member.routes";
import taskRoutes from "./task.routes";

const router = Router();

router.post(
  "/",
  authMiddleware,
  validate({ body: createProjectSchema }),
  asyncHandler(projectController.createProject)
);

router.get("/", authMiddleware, asyncHandler(projectController.listProjects));

router.get(
  "/:id",
  authMiddleware,
  validate({ params: projectIdParamSchema }),
  projectMemberMiddleware,
  asyncHandler(projectController.getProject)
);

router.patch(
  "/:id",
  authMiddleware,
  validate({ params: projectIdParamSchema, body: updateProjectSchema }),
  projectMemberMiddleware,
  projectCreatorMiddleware,
  asyncHandler(projectController.updateProject)
);

router.delete(
  "/:id",
  authMiddleware,
  validate({ params: projectIdParamSchema }),
  projectMemberMiddleware,
  projectCreatorMiddleware,
  asyncHandler(projectController.deleteProject)
);

router.use(
  "/:id/members",
  authMiddleware,
  validate({ params: projectIdParamSchema }),
  projectMemberMiddleware,
  memberRoutes
);

router.use(
  "/:id/tasks",
  authMiddleware,
  validate({ params: projectIdParamSchema }),
  projectMemberMiddleware,
  taskRoutes
);

export default router;
