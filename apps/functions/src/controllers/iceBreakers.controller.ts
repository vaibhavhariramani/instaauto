import type { Response } from 'express';
import type { IceBreakerInput, UpdateIceBreakerInput } from '@instaauto/shared';
import * as iceBreakerService from '../services/iceBreakerService';
import { toIceBreakerDto } from '../utils/mappers';
import type { AuthedRequest } from '../middleware/auth';

export async function list(req: AuthedRequest, res: Response): Promise<void> {
  const iceBreakers = await iceBreakerService.listIceBreakers(req.userId, req.params.accountId!);
  res.json(iceBreakers.map(toIceBreakerDto));
}

export async function create(req: AuthedRequest, res: Response): Promise<void> {
  const iceBreaker = await iceBreakerService.createIceBreaker(
    req.userId,
    req.body as IceBreakerInput,
  );
  res.status(201).json(toIceBreakerDto(iceBreaker));
}

export async function update(req: AuthedRequest, res: Response): Promise<void> {
  const iceBreaker = await iceBreakerService.updateIceBreaker(
    req.userId,
    req.params.id!,
    req.body as UpdateIceBreakerInput,
  );
  res.json(toIceBreakerDto(iceBreaker));
}

export async function remove(req: AuthedRequest, res: Response): Promise<void> {
  await iceBreakerService.deleteIceBreaker(req.userId, req.params.id!);
  res.status(204).send();
}
