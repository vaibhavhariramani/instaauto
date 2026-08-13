import type { Response } from 'express';
import type { AnalyticsQuery } from '@instaauto/shared';
import * as analyticsService from '../services/analyticsService';
import type { AuthedRequest } from '../middleware/auth';

export async function dashboard(req: AuthedRequest, res: Response): Promise<void> {
  const stats = await analyticsService.getDashboardStats(req.userId);
  res.json(stats);
}

export async function analytics(req: AuthedRequest, res: Response): Promise<void> {
  const data = await analyticsService.getAnalytics(req.userId, req.query as unknown as AnalyticsQuery);
  res.json(data);
}
