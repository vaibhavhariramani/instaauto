import type { Request, Response } from 'express';
import type { InstagramOAuthCallbackInput, ReplyToCommentInput } from '@instaauto/shared';
import { config } from '../config/env';
import { toInstagramAccountDto } from '../utils/mappers';
import * as connectService from '../services/instagramConnectService';
import { listReelsForAccount } from '../services/reelService';
import * as commentService from '../services/commentService';
import type { AuthedRequest } from '../middleware/auth';
import { logger } from '../lib/logger';

export async function listAccounts(req: AuthedRequest, res: Response): Promise<void> {
  const accounts = await connectService.listAccounts(req.userId);
  res.json(accounts.map(toInstagramAccountDto));
}

export async function connect(req: AuthedRequest, res: Response): Promise<void> {
  if (config.INSTAGRAM_MOCK_MODE) {
    const account = await connectService.connectMockAccount(req.userId);
    res.json({ mode: 'mock', account: toInstagramAccountDto(account) });
    return;
  }
  const authUrl = connectService.getAuthorizationUrl(req.userId);
  res.json({ mode: 'redirect', authUrl });
}

export async function oauthCallback(req: Request, res: Response): Promise<void> {
  const { code, state } = req.query as unknown as InstagramOAuthCallbackInput;
  try {
    await connectService.handleOAuthCallback(code, state);
    res.redirect(`${config.FRONTEND_URL}/onboarding/instagram?connected=true`);
  } catch (err) {
    const detail = (err as { response?: { data?: unknown } })?.response?.data ?? (err as Error)?.message;
    logger.error({ err: detail }, 'Instagram OAuth callback failed');
    res.redirect(`${config.FRONTEND_URL}/onboarding/instagram?connected=false`);
  }
}

export async function disconnect(req: AuthedRequest, res: Response): Promise<void> {
  await connectService.disconnectAccount(req.userId, req.params.id!);
  res.status(204).send();
}

export async function reconnect(req: AuthedRequest, res: Response): Promise<void> {
  if (config.INSTAGRAM_MOCK_MODE) {
    const account = await connectService.connectMockAccount(req.userId);
    res.json({ mode: 'mock', account: toInstagramAccountDto(account) });
    return;
  }
  const authUrl = connectService.getAuthorizationUrl(req.userId);
  res.json({ mode: 'redirect', authUrl });
}

export async function reels(req: AuthedRequest, res: Response): Promise<void> {
  const data = await listReelsForAccount(req.userId, req.params.id!);
  res.json(data);
}

export async function recentComments(req: AuthedRequest, res: Response): Promise<void> {
  const data = await commentService.listRecentCommentsForAccount(req.userId, req.params.id!);
  res.json(data);
}

export async function replyToComment(req: AuthedRequest, res: Response): Promise<void> {
  const { message } = req.body as ReplyToCommentInput;
  const result = await commentService.replyToCommentForAccount(
    req.userId,
    req.params.id!,
    req.params.commentId!,
    message,
  );
  res.json(result);
}
