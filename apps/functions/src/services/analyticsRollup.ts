import { prisma } from '../lib/prisma';

function startOfDay(date = new Date()): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function bumpDailyCounters(
  userId: string,
  delta: Partial<{ commentsDetected: number; dmsSent: number; dmsFailed: number; uniqueUsersReached: number }>,
): Promise<void> {
  const date = startOfDay();
  await prisma.analyticsDaily.upsert({
    where: { userId_date: { userId, date } },
    create: {
      userId,
      date,
      commentsDetected: delta.commentsDetected ?? 0,
      dmsSent: delta.dmsSent ?? 0,
      dmsFailed: delta.dmsFailed ?? 0,
      uniqueUsersReached: delta.uniqueUsersReached ?? 0,
    },
    update: {
      commentsDetected: { increment: delta.commentsDetected ?? 0 },
      dmsSent: { increment: delta.dmsSent ?? 0 },
      dmsFailed: { increment: delta.dmsFailed ?? 0 },
      uniqueUsersReached: { increment: delta.uniqueUsersReached ?? 0 },
    },
  });
}
