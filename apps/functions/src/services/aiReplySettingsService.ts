import type { AiReplySettingsInput } from '@instaauto/shared';
import { prisma } from '../lib/prisma';
import { ApiError } from '../middleware/errors';
import { aiConfigured } from '../config/env';

async function requireOwnedAccount(userId: string, instagramAccountId: string) {
  const account = await prisma.instagramAccount.findFirst({
    where: { id: instagramAccountId, userId },
  });
  if (!account) throw ApiError.notFound('Instagram account not found');
  return account;
}

export async function getSettings(userId: string, instagramAccountId: string) {
  await requireOwnedAccount(userId, instagramAccountId);
  const settings = await prisma.aiReplySettings.findUnique({ where: { instagramAccountId } });
  return {
    instagramAccountId,
    enabled: settings?.enabled ?? false,
    personaPrompt: settings?.personaPrompt ?? null,
    serverConfigured: aiConfigured,
  };
}

export async function updateSettings(
  userId: string,
  instagramAccountId: string,
  input: AiReplySettingsInput,
) {
  await requireOwnedAccount(userId, instagramAccountId);
  const settings = await prisma.aiReplySettings.upsert({
    where: { instagramAccountId },
    create: {
      instagramAccountId,
      enabled: input.enabled,
      personaPrompt: input.personaPrompt ?? null,
    },
    update: { enabled: input.enabled, personaPrompt: input.personaPrompt ?? null },
  });
  return {
    instagramAccountId,
    enabled: settings.enabled,
    personaPrompt: settings.personaPrompt,
    serverConfigured: aiConfigured,
  };
}
