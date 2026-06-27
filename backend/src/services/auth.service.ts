import { prisma } from "../lib/prisma";
import { AppError } from "../utils/errors";
import { hashPassword, comparePassword } from "../utils/password";
import { signToken } from "../utils/jwt";
import { toSafeUser } from "../utils/formatters";
import { RegisterInput, LoginInput } from "../schemas/auth.schema";

export async function registerUser(input: RegisterInput) {
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existingUser) {
    throw new AppError(409, "EMAIL_EXISTS", "Email is already registered");
  }

  const passwordHash = await hashPassword(input.password);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      name: input.name,
    },
  });

  const token = signToken({ userId: user.id, email: user.email });

  return {
    token,
    user: toSafeUser(user),
  };
}

export async function loginUser(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (!user) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Invalid email or password");
  }

  const isValidPassword = await comparePassword(input.password, user.passwordHash);

  if (!isValidPassword) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Invalid email or password");
  }

  const token = signToken({ userId: user.id, email: user.email });

  return {
    token,
    user: toSafeUser(user),
  };
}

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError(404, "NOT_FOUND", "User not found");
  }

  return toSafeUser(user);
}
