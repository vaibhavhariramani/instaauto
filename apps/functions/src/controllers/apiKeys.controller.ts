import type { Response } from 'express';
import type { CreateApiKeyInput } from '@instaauto/shared';
import * as apiKeyService from '../services/apiKeyService';
import type { AuthedRequest } from '../middleware/auth';

export async function list(req: AuthedRequest, res: Response): Promise<void> {
  res.json(await apiKeyService.listApiKeys(req.userId));
}

export async function create(req: AuthedRequest, res: Response): Promise<void> {
  const created = await apiKeyService.createApiKey(
    req.userId,
    req.body as CreateApiKeyInput,
    req.ip,
  );
  // The response carries the one-time secret: make sure no proxy or browser cache keeps it.
  res.set('Cache-Control', 'no-store').status(201).json(created);
}

export async function revoke(req: AuthedRequest, res: Response): Promise<void> {
  await apiKeyService.revokeApiKey(req.userId, req.params.id!, req.ip);
  res.status(204).end();
}
