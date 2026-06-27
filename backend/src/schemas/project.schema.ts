import { z } from "zod";

export const projectIdParamSchema = z.object({
  id: z.string().uuid("Invalid project ID"),
});

export const createProjectSchema = z.object({
  name: z.string().min(1, "Name is required").max(150),
  description: z.string().max(1000).optional(),
});

export const updateProjectSchema = z
  .object({
    name: z.string().min(1).max(150).optional(),
    description: z.string().max(1000).optional(),
  })
  .refine((data) => data.name !== undefined || data.description !== undefined, {
    message: "At least one field must be provided",
  });

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
