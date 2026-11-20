import type { NotificationType, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { sendPushNotifications } from '../lib/pushNotifications';

// Only these events are worth an OS-level push - the rest (webhook pings,
// automation-started, etc.) still show up in the in-app activity feed but
// would just be noise as push notifications.
const PUSH_NOTIFIED_TYPES: NotificationType[] = ['KEYWORD_MATCHED', 'DM_SENT'];

export const notificationService = {
  async create(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    metadata?: Record<string, unknown>,
  ) {
    const notification = await prisma.notification.create({
      data: { userId, type, title, message, metadata: metadata as Prisma.InputJsonValue },
    });

    if (PUSH_NOTIFIED_TYPES.includes(type)) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { pushTokens: true },
      });
      if (user?.pushTokens.length) {
        void sendPushNotifications(user.pushTokens, title, message, {
          type,
          notificationId: notification.id,
        });
      }
    }

    return notification;
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
    return {
      items,
      total,
      unreadCount,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  },

  async markRead(userId: string, id: string) {
    await prisma.notification.updateMany({ where: { id, userId }, data: { isRead: true } });
  },

  async markAllRead(userId: string) {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  },
};
