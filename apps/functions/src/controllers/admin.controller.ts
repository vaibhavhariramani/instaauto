import type { Response } from 'express';
import type { AdminUpdateUserPlanInput, AdminUserListQuery } from '@instaauto/shared';
import * as adminService from '../services/adminService';
import { toUserDto } from '../utils/mappers';
import type { AuthedRequest } from '../middleware/auth';

export async function dashboard(_req: AuthedRequest, res: Response): Promise<void> {
  res.json(await adminService.getDashboard());
}

export async function listUsers(req: AuthedRequest, res: Response): Promise<void> {
  const query = req.query as unknown as AdminUserListQuery;
  res.json(await adminService.listUsers(query));
}

export async function getUser(req: AuthedRequest, res: Response): Promise<void> {
  res.json(await adminService.getUserDetail(req.params.id!));
}

export async function updateUserPlan(req: AuthedRequest, res: Response): Promise<void> {
  const input = req.body as AdminUpdateUserPlanInput;
  const updated = await adminService.updateUserPlan(req.userId, req.params.id!, input);
  res.json(toUserDto(updated));
}
