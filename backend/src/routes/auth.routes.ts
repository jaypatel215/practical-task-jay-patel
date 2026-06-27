import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { asyncHandler } from "../middleware/error.middleware";
import { registerSchema, loginSchema } from "../schemas/auth.schema";
import * as authController from "../controllers/auth.controller";

const router = Router();

router.post(
  "/register",
  validate({ body: registerSchema }),
  asyncHandler(authController.register)
);

router.post(
  "/login",
  validate({ body: loginSchema }),
  asyncHandler(authController.login)
);

router.get("/me", authMiddleware, asyncHandler(authController.me));

export default router;
