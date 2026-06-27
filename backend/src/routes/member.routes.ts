import { Router } from "express";
import { validate } from "../middleware/validate.middleware";
import { projectCreatorMiddleware } from "../middleware/projectCreator.middleware";
import { asyncHandler } from "../middleware/error.middleware";
import { addMemberSchema, memberParamsSchema } from "../schemas/member.schema";
import * as memberController from "../controllers/member.controller";

const router = Router({ mergeParams: true });

router.get("/", asyncHandler(memberController.listMembers));

router.post(
  "/",
  projectCreatorMiddleware,
  validate({ body: addMemberSchema }),
  asyncHandler(memberController.addMember)
);

router.delete(
  "/:userId",
  projectCreatorMiddleware,
  validate({ params: memberParamsSchema }),
  asyncHandler(memberController.removeMember)
);

export default router;
