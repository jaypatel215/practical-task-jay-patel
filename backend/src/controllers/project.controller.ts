import { Request, Response } from "express";
import * as projectService from "../services/project.service";

export async function createProject(req: Request, res: Response) {
  const project = await projectService.createProject(req.user!.userId, req.body);
  res.status(201).json(project);
}

export async function listProjects(req: Request, res: Response) {
  const projects = await projectService.listProjects(req.user!.userId);
  res.status(200).json({ projects });
}

export async function getProject(req: Request, res: Response) {
  const project = await projectService.getProjectById(
    req.params.id,
    req.membership!.role
  );
  res.status(200).json(project);
}

export async function updateProject(req: Request, res: Response) {
  const project = await projectService.updateProject(req.params.id, req.body);
  res.status(200).json(project);
}

export async function deleteProject(req: Request, res: Response) {
  await projectService.deleteProject(req.params.id);
  res.status(204).send();
}
