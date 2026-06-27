import { Request, Response } from "express";
import * as memberService from "../services/member.service";

export async function listMembers(req: Request, res: Response) {
  const members = await memberService.listMembers(req.params.id);
  res.status(200).json({ members });
}

export async function addMember(req: Request, res: Response) {
  const member = await memberService.addMember(req.params.id, req.body);
  res.status(201).json(member);
}

export async function removeMember(req: Request, res: Response) {
  await memberService.removeMember(req.params.id, req.params.userId);
  res.status(204).send();
}
