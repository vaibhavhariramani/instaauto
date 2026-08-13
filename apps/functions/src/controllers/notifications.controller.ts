import type { Response } from 'express';
import { notificationService } from '../services/notificationService';
import { toNotificationDto } from '../utils/mappers';
import type { AuthedRequest } from '../middleware/auth';

export async function list(req: AuthedRequest, res: Response): Promise<void> {
  const page = Number(req.query.page ?? 1);
  const pageSize = Number(req.query.pageSize ?? 20);
  const result = await notificationService.list(req.userId, page, pageSize);
  res.json({ ...result, items: result.items.map(toNotificationDto) });
}

export async function markRead(req: AuthedRequest, res: Response): Promise<void> {
  await notificationService.markRead(req.userId, req.params.id!);
  res.status(204).send();
}

export async function markAllRead(req: AuthedRequest, res: Response): Promise<void> {
  await notificationService.markAllRead(req.userId);
  res.status(204).send();
}
