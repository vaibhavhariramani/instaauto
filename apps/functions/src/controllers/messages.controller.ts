import type { Response } from 'express';
import type { MessagesQuery } from '@instaauto/shared';
import * as messageService from '../services/messageService';
import { toMessageDto } from '../utils/mappers';
import type { AuthedRequest } from '../middleware/auth';

export async function list(req: AuthedRequest, res: Response): Promise<void> {
  const result = await messageService.listMessages(req.userId, req.query as unknown as MessagesQuery);
  res.json({ ...result, items: result.items.map(toMessageDto) });
}

export async function retry(req: AuthedRequest, res: Response): Promise<void> {
  await messageService.retryMessage(req.userId, req.params.id!);
  res.status(204).send();
}
