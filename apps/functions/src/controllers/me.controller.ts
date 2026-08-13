import type { Response } from 'express';
import type { NotificationPrefsInput, UpdateProfileInput } from '@instaauto/shared';
import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { getUserById } from '../services/authService';
import { toUserDto } from '../utils/mappers';
import { REFRESH_COOKIE_NAME } from '../lib/jwt';
import type { AuthedRequest } from '../middleware/auth';

export async function getMe(req: AuthedRequest, res: Response): Promise<void> {
  const user = await getUserById(req.userId);
  res.json(toUserDto(user));
}

export async function updateMe(req: AuthedRequest, res: Response): Promise<void> {
  const input = req.body as UpdateProfileInput;
  const user = await prisma.user.update({ where: { id: req.userId }, data: input as Prisma.UserUpdateInput });
  res.json(toUserDto(user));
}

export async function completeOnboarding(req: AuthedRequest, res: Response): Promise<void> {
  const user = await prisma.user.update({ where: { id: req.userId }, data: { onboardingCompleted: true } });
  res.json(toUserDto(user));
}

export async function updateNotificationPrefs(req: AuthedRequest, res: Response): Promise<void> {
  const input = req.body as NotificationPrefsInput;
  const user = await prisma.user.update({ where: { id: req.userId }, data: input });
  res.json(toUserDto(user));
}

export async function deleteMe(req: AuthedRequest, res: Response): Promise<void> {
  await prisma.user.delete({ where: { id: req.userId } });
  res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/auth' });
  res.status(204).send();
}
