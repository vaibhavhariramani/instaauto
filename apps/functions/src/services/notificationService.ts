import type { NotificationType, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';

export const notificationService = {
  async create(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    metadata?: Record<string, unknown>,
  ) {
    return prisma.notification.create({
      data: { userId, type, title, message, metadata: metadata as Prisma.InputJsonValue },
    });
  },

  async list(userId: string, page = 1, pageSize = 20) {
    const [items, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.notification.count({ where: { userId } }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);
    return { items, total, unreadCount, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
  },

  async markRead(userId: string, id: string) {
    await prisma.notification.updateMany({ where: { id, userId }, data: { isRead: true } });
  },

  async markAllRead(userId: string) {
    await prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
  },
};
