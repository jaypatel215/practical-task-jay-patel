import { z } from "zod";
import { projectIdParamSchema } from "./project.schema";

export const addMemberSchema = z.object({
  email: z
    .string()
    .email("Invalid email address")
    .transform((value) => value.toLowerCase().trim()),
});

export const memberParamsSchema = projectIdParamSchema.extend({
  userId: z.string().uuid("Invalid user ID"),
});

export type AddMemberInput = z.infer<typeof addMemberSchema>;
