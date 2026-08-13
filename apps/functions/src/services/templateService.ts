import type { TemplateInput, UpdateTemplateInput } from '@instaauto/shared';
import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { ApiError } from '../middleware/errors';

export async function listTemplates(userId: string) {
  return prisma.template.findMany({
    where: { userId },
    orderBy: [{ isFavorite: 'desc' }, { createdAt: 'desc' }],
  });
}

export async function getTemplate(userId: string, id: string) {
  const template = await prisma.template.findFirst({ where: { id, userId } });
  if (!template) throw ApiError.notFound('Template not found');
  return template;
}

export async function createTemplate(userId: string, input: TemplateInput) {
  return prisma.template.create({ data: { ...input, userId } as Prisma.TemplateUncheckedCreateInput });
}

export async function updateTemplate(userId: string, id: string, input: UpdateTemplateInput) {
  await getTemplate(userId, id);
  return prisma.template.update({ where: { id }, data: input as Prisma.TemplateUpdateInput });
}

export async function deleteTemplate(userId: string, id: string): Promise<void> {
  await getTemplate(userId, id);
  await prisma.template.delete({ where: { id } });
}

export async function toggleFavorite(userId: string, id: string) {
  const template = await getTemplate(userId, id);
  return prisma.template.update({ where: { id }, data: { isFavorite: !template.isFavorite } });
}

export async function duplicateTemplate(userId: string, id: string) {
  const template = await getTemplate(userId, id);
  return prisma.template.create({
    data: {
      userId,
      name: `${template.name} (Copy)`,
      category: template.category,
      content: template.content,
    },
  });
}
