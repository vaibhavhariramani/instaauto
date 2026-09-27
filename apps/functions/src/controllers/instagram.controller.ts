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

function redirectTarget(
  returnTo: connectService.OAuthReturnTo,
  connected: boolean,
  platform: connectService.ConnectPlatform,
): string {
  if (platform === 'mobile') {
    // Same custom scheme covers both the iOS and Android builds - they share one Expo
    // codebase/bundle identifier, so there's no separate "which mobile platform" branch needed.
    return `${config.MOBILE_APP_SCHEME}://instagram-connect?connected=${connected}`;
  }
  const base = returnTo === 'settings' ? '/instagram' : '/onboarding/instagram';
  return `${config.FRONTEND_URL}${base}?connected=${connected}`;
}

export async function connect(req: AuthedRequest, res: Response): Promise<void> {
  const returnTo: connectService.OAuthReturnTo =
    req.query.returnTo === 'settings' ? 'settings' : 'onboarding';
  const platform: connectService.ConnectPlatform =
    req.query.platform === 'mobile' ? 'mobile' : 'web';
  if (config.INSTAGRAM_MOCK_MODE) {
    const account = await connectService.connectMockAccount(req.userId);
    res.json({ mode: 'mock', account: toInstagramAccountDto(account) });
    return;
  }
  const authUrl = connectService.getAuthorizationUrl(req.userId, returnTo, platform);
  res.json({ mode: 'redirect', authUrl });
}

export async function oauthCallback(req: Request, res: Response): Promise<void> {
  const { code, state } = req.query as unknown as InstagramOAuthCallbackInput;
  // Parsed once up front (outside the try) so a failure during token exchange still redirects
  // back to whichever page/app initiated the connect, instead of always bouncing to onboarding.
  let returnTo: connectService.OAuthReturnTo = 'onboarding';
  let platform: connectService.ConnectPlatform = 'web';
  try {
    ({ returnTo, platform } = connectService.verifyOAuthState(state));
    await connectService.handleOAuthCallback(code, state);
    res.redirect(redirectTarget(returnTo, true, platform));
  } catch (err) {
    const detail =
      (err as { response?: { data?: unknown } })?.response?.data ?? (err as Error)?.message;
    logger.error({ err: detail }, 'Instagram OAuth callback failed');
    res.redirect(redirectTarget(returnTo, false, platform));
  }
}

export async function disconnect(req: AuthedRequest, res: Response): Promise<void> {
  await connectService.disconnectAccount(req.userId, req.params.id!);
  res.status(204).send();
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
