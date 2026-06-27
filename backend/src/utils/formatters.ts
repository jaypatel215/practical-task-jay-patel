import { User } from "@prisma/client";
import { SafeUser } from "../types";

export function toSafeUser(user: User): SafeUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt,
  };
}

export function formatDueDate(date: Date | null): string | null {
  if (!date) {
    return null;
  }

  return date.toISOString().split("T")[0];
}

export function parseDueDate(dateString: string): Date {
  return new Date(`${dateString}T00:00:00.000Z`);
}

export function isDueDateInPast(dateString: string): boolean {
  const input = new Date(`${dateString}T00:00:00.000Z`);
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  return input < today;
}
