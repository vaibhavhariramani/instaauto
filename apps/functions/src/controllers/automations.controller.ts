import type { Response } from 'express';
import type { AutomationInput, UpdateAutomationInput } from '@instaauto/shared';
import * as automationService from '../services/automationService';
import { toAutomationDto } from '../utils/mappers';
import type { AuthedRequest } from '../middleware/auth';

export async function list(req: AuthedRequest, res: Response): Promise<void> {
  const automations = await automationService.listAutomations(req.userId);
  res.json(automations.map(toAutomationDto));
}

export async function getOne(req: AuthedRequest, res: Response): Promise<void> {
  const automation = await automationService.getAutomation(req.userId, req.params.id!);
  res.json(toAutomationDto(automation));
}

export async function create(req: AuthedRequest, res: Response): Promise<void> {
  const automation = await automationService.createAutomation(req.userId, req.body as AutomationInput);
  res.status(201).json(toAutomationDto(automation));
}

export async function update(req: AuthedRequest, res: Response): Promise<void> {
  const automation = await automationService.updateAutomation(
    req.userId,
    req.params.id!,
    req.body as UpdateAutomationInput,
  );
  res.json(toAutomationDto(automation));
}

export async function remove(req: AuthedRequest, res: Response): Promise<void> {
  await automationService.deleteAutomation(req.userId, req.params.id!);
  res.status(204).send();
}
