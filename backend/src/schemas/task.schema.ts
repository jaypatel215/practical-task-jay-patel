import { z } from "zod";
import { isDueDateInPast } from "../utils/formatters";

export const taskStatusEnum = z.enum(["BACKLOG", "TODO", "IN_PROGRESS", "DONE"]);
export const taskPriorityEnum = z.enum(["LOW", "MEDIUM", "HIGH"]);

export const dueDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Due date must be YYYY-MM-DD")
  .refine((date) => !isDueDateInPast(date), "Due date cannot be in the past");

export const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(2000).optional(),
  status: taskStatusEnum.optional().default("BACKLOG"),
  priority: taskPriorityEnum.optional().default("MEDIUM"),
  dueDate: dueDateSchema.optional(),
  assigneeId: z.string().uuid().nullable().optional(),
});

export const updateTaskSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(2000).optional(),
    status: taskStatusEnum.optional(),
    priority: taskPriorityEnum.optional(),
    dueDate: dueDateSchema.nullable().optional(),
    assigneeId: z.string().uuid().nullable().optional(),
  })
  .refine(
    (data) =>
      Object.values(data).some((value) => value !== undefined),
    { message: "At least one field must be provided" }
  );

export const taskParamsSchema = z.object({
  id: z.string().uuid("Invalid project ID"),
  taskId: z.string().uuid("Invalid task ID"),
});

export const listTasksQuerySchema = z.object({
  status: taskStatusEnum.optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
