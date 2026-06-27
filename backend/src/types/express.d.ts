import { ProjectMember } from "@prisma/client";
import { AuthUser } from "./index";

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      membership?: ProjectMember;
    }
  }
}

export {};
