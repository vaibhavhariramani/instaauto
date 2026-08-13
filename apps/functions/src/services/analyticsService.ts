import type { AnalyticsQuery } from '@instaauto/shared';
import { prisma } from '../lib/prisma';
import type { AnalyticsDto, DashboardStatsDto } from '@instaauto/shared';
import { toNotificationDto } from '../utils/mappers';

function formatDayLabel(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function isoWeekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${weekNo}`;
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export async function getDashboardStats(userId: string): Promise<DashboardStatsDto> {
  const [totalAutomations, activeAutomations, sentAgg, failedAgg, notifications, trendRows] =
    await Promise.all([
      prisma.automation.count({ where: { userId } }),
      prisma.automation.count({ where: { userId, isActive: true } }),
      prisma.analyticsDaily.aggregate({ where: { userId }, _sum: { dmsSent: true, commentsDetected: true } }),
      prisma.analyticsDaily.aggregate({ where: { userId }, _sum: { dmsFailed: true } }),
      prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 8 }),
      prisma.analyticsDaily.findMany({
        where: { userId, date: { gte: new Date(Date.now() - 13 * 86400000) } },
        orderBy: { date: 'asc' },
      }),
    ]);

  const dmsSent = sentAgg._sum.dmsSent ?? 0;
  const dmsFailed = failedAgg._sum.dmsFailed ?? 0;
  const commentsDetected = sentAgg._sum.commentsDetected ?? 0;
  const successRate = dmsSent + dmsFailed > 0 ? Math.round((dmsSent / (dmsSent + dmsFailed)) * 1000) / 10 : 100;

  return {
    totalAutomations,
    activeAutomations,
    messagesSent: dmsSent,
    commentsDetected,
    successRate,
    messagesTrend: trendRows.map((r) => ({
      date: formatDayLabel(r.date),
      sent: r.dmsSent,
      failed: r.dmsFailed,
    })),
    recentActivity: notifications.map(toNotificationDto),
  };
}

export async function getAnalytics(userId: string, query: AnalyticsQuery): Promise<AnalyticsDto> {
  const rangeDays = query.range === 'daily' ? 30 : query.range === 'weekly' ? 84 : 365;
  const rows = await prisma.analyticsDaily.findMany({
    where: { userId, date: { gte: new Date(Date.now() - rangeDays * 86400000) } },
    orderBy: { date: 'asc' },
  });

  let series: AnalyticsDto['series'];
  if (query.range === 'daily') {
    series = rows.map((r) => ({
      label: formatDayLabel(r.date),
      commentsDetected: r.commentsDetected,
      dmsSent: r.dmsSent,
      dmsFailed: r.dmsFailed,
    }));
  } else {
    const keyFn = query.range === 'weekly' ? isoWeekKey : monthKey;
    const buckets = new Map<string, { commentsDetected: number; dmsSent: number; dmsFailed: number }>();
    for (const row of rows) {
      const key = keyFn(row.date);
      const bucket = buckets.get(key) ?? { commentsDetected: 0, dmsSent: 0, dmsFailed: 0 };
      bucket.commentsDetected += row.commentsDetected;
      bucket.dmsSent += row.dmsSent;
      bucket.dmsFailed += row.dmsFailed;
      buckets.set(key, bucket);
    }
    series = Array.from(buckets.entries()).map(([label, v]) => ({ label, ...v }));
  }

  const automationIds = (await prisma.automation.findMany({ where: { userId }, select: { id: true } })).map(
    (a) => a.id,
  );

  const topKeywordsRaw = automationIds.length
    ? await prisma.comment.groupBy({
        by: ['matchedKeyword'],
        where: { automationId: { in: automationIds }, matchedKeyword: { not: null } },
        _count: { matchedKeyword: true },
        orderBy: { _count: { matchedKeyword: 'desc' } },
        take: 5,
      })
    : [];

  const mostActive = await prisma.automation.findFirst({
    where: { userId },
    orderBy: { totalTriggers: 'desc' },
  });

  const totalCommentsDetected = rows.reduce((sum, r) => sum + r.commentsDetected, 0);
  const totalDmsSent = rows.reduce((sum, r) => sum + r.dmsSent, 0);

  return {
    range: query.range,
    series,
    topKeywords: topKeywordsRaw.map((k) => ({ keyword: k.matchedKeyword ?? '', count: k._count.matchedKeyword })),
    mostActiveReel: mostActive
      ? { reelId: mostActive.reelId, thumbnailUrl: mostActive.reelThumbnailUrl, triggerCount: mostActive.totalTriggers }
      : null,
    conversionRate: totalCommentsDetected > 0 ? Math.round((totalDmsSent / totalCommentsDetected) * 1000) / 10 : 0,
    totalCommentsDetected,
    totalDmsSent,
  };
}
