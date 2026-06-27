import { Router } from "express";
import { validate } from "../middleware/validate.middleware";
import { asyncHandler } from "../middleware/error.middleware";
import {
  createTaskSchema,
  listTasksQuerySchema,
  taskParamsSchema,
  updateTaskSchema,
} from "../schemas/task.schema";
import * as taskController from "../controllers/task.controller";

const router = Router({ mergeParams: true });

router.post(
  "/",
  validate({ body: createTaskSchema }),
  asyncHandler(taskController.createTask)
);

router.get(
  "/",
  validate({ query: listTasksQuerySchema }),
  asyncHandler(taskController.listTasks)
);

router.get(
  "/:taskId",
  validate({ params: taskParamsSchema }),
  asyncHandler(taskController.getTask)
);

router.patch(
  "/:taskId",
  validate({ params: taskParamsSchema, body: updateTaskSchema }),
  asyncHandler(taskController.updateTask)
);

router.delete(
  "/:taskId",
  validate({ params: taskParamsSchema }),
  asyncHandler(taskController.deleteTask)
);

export default router;
