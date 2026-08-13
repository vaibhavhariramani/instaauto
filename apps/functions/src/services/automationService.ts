import type { AutomationInput, UpdateAutomationInput } from '@instaauto/shared';
import { InstagramAccountStatus, NotificationType, type MatchType, type Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { ApiError } from '../middleware/errors';
import { notificationService } from './notificationService';

export async function listAutomations(userId: string) {
  return prisma.automation.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
}

export async function getAutomation(userId: string, id: string) {
  const automation = await prisma.automation.findFirst({ where: { id, userId } });
  if (!automation) throw ApiError.notFound('Automation not found');
  return automation;
}

export async function createAutomation(userId: string, input: AutomationInput) {
  const account = await prisma.instagramAccount.findFirst({
    where: { id: input.instagramAccountId, userId, status: InstagramAccountStatus.CONNECTED },
  });
  if (!account) throw ApiError.badRequest('Select a connected Instagram account');

  const automation = await prisma.automation.create({
    data: {
      userId,
      instagramAccountId: input.instagramAccountId,
      name: input.name,
      reelId: input.reelId,
      reelThumbnailUrl: input.reelThumbnailUrl,
      reelPermalink: input.reelPermalink,
      reelCaption: input.reelCaption,
      triggerKeywords: input.triggerKeywords,
      matchType: input.matchType as MatchType,
      replyMessage: input.replyMessage,
      templateId: input.templateId || null,
      dmOncePerUser: input.dmOncePerUser,
      ignoreCreatorComments: input.ignoreCreatorComments,
      isActive: input.isActive,
    },
  });

  if (input.templateId) {
    await prisma.template.update({
      where: { id: input.templateId },
      data: { usageCount: { increment: 1 } },
    }).catch(() => undefined);
  }

  if (automation.isActive) {
    await notificationService.create(
      userId,
      NotificationType.AUTOMATION_STARTED,
      'Automation activated',
      `"${automation.name}" is now live and watching for comments.`,
    );
  }

  return automation;
}

export async function updateAutomation(userId: string, id: string, input: UpdateAutomationInput) {
  await getAutomation(userId, id);
  const automation = await prisma.automation.update({
    where: { id },
    data: input as Prisma.AutomationUpdateInput,
  });
  return automation;
}

export async function deleteAutomation(userId: string, id: string): Promise<void> {
  await getAutomation(userId, id);
  await prisma.automation.delete({ where: { id } });
}
