import { Request, Response } from "express";
import { TaskStatus } from "@prisma/client";
import * as taskService from "../services/task.service";

export async function createTask(req: Request, res: Response) {
  const task = await taskService.createTask(
    req.params.id,
    req.user!.userId,
    req.body
  );
  res.status(201).json(task);
}

export async function listTasks(req: Request, res: Response) {
  const status = req.query.status as TaskStatus | undefined;
  const tasks = await taskService.listTasks(req.params.id, status);
  res.status(200).json({ tasks });
}

export async function getTask(req: Request, res: Response) {
  const task = await taskService.getTaskById(req.params.id, req.params.taskId);
  res.status(200).json(task);
}

export async function updateTask(req: Request, res: Response) {
  const task = await taskService.updateTask(
    req.params.id,
    req.params.taskId,
    req.body
  );
  res.status(200).json(task);
}

export async function deleteTask(req: Request, res: Response) {
  await taskService.deleteTask(req.params.id, req.params.taskId);
  res.status(204).send();
}
