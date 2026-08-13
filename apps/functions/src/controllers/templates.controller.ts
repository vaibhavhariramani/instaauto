import type { Response } from 'express';
import type { TemplateInput, UpdateTemplateInput } from '@instaauto/shared';
import * as templateService from '../services/templateService';
import { toTemplateDto } from '../utils/mappers';
import type { AuthedRequest } from '../middleware/auth';

export async function list(req: AuthedRequest, res: Response): Promise<void> {
  const templates = await templateService.listTemplates(req.userId);
  res.json(templates.map(toTemplateDto));
}

export async function create(req: AuthedRequest, res: Response): Promise<void> {
  const template = await templateService.createTemplate(req.userId, req.body as TemplateInput);
  res.status(201).json(toTemplateDto(template));
}

export async function update(req: AuthedRequest, res: Response): Promise<void> {
  const template = await templateService.updateTemplate(req.userId, req.params.id!, req.body as UpdateTemplateInput);
  res.json(toTemplateDto(template));
}

export async function remove(req: AuthedRequest, res: Response): Promise<void> {
  await templateService.deleteTemplate(req.userId, req.params.id!);
  res.status(204).send();
}

export async function favorite(req: AuthedRequest, res: Response): Promise<void> {
  const template = await templateService.toggleFavorite(req.userId, req.params.id!);
  res.json(toTemplateDto(template));
}

export async function duplicate(req: AuthedRequest, res: Response): Promise<void> {
  const template = await templateService.duplicateTemplate(req.userId, req.params.id!);
  res.status(201).json(toTemplateDto(template));
}
