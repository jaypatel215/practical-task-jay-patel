import { Request, Response } from "express";
import * as dashboardService from "../services/dashboard.service";

export async function getSummary(req: Request, res: Response) {
  const summary = await dashboardService.getDashboardSummary(req.user!.userId);
  res.status(200).json(summary);
}
