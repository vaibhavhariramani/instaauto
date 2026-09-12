import jwt from 'jsonwebtoken';
import { IG_OAUTH_AUTHORIZE_URL } from '@instaauto/shared';
import { config, metaConfigured } from '../config/env';
import { prisma } from '../lib/prisma';
import { encryptSecret, decryptSecret } from '../lib/crypto';
import { instagramService } from './instagramService';
import { notificationService } from './notificationService';
import { ApiError } from '../middleware/errors';
import { InstagramAccountStatus, NotificationType } from '@prisma/client';
import type { InstagramAccount } from '@prisma/client';

// Scopes for the Instagram API with Instagram Login (direct business login, no Facebook Page).
const OAUTH_SCOPES = [
  'instagram_business_basic',
  'instagram_business_manage_comments',
  'instagram_business_manage_messages',
].join(',');

export type OAuthReturnTo = 'onboarding' | 'settings';

export function getAuthorizationUrl(
  userId: string,
  returnTo: OAuthReturnTo = 'onboarding',
): string {
  if (!metaConfigured) {
    throw ApiError.serviceUnavailable(
      'Meta App is not configured on this server. Enable INSTAGRAM_MOCK_MODE for demo purposes, or set META_APP_ID/META_APP_SECRET.',
    );
  }
  const state = jwt.sign({ userId, returnTo }, config.JWT_ACCESS_SECRET, { expiresIn: '10m' });
  const params = new URLSearchParams({
    client_id: config.META_APP_ID!,
    redirect_uri: config.META_REDIRECT_URI!,
    state,
    scope: OAUTH_SCOPES,
    response_type: 'code',
  });
  return `${IG_OAUTH_AUTHORIZE_URL}?${params.toString()}`;
}

export function verifyOAuthState(state: string): { userId: string; returnTo: OAuthReturnTo } {
  try {
    const payload = jwt.verify(state, config.JWT_ACCESS_SECRET) as {
      userId: string;
      returnTo?: OAuthReturnTo;
    };
    return { userId: payload.userId, returnTo: payload.returnTo ?? 'onboarding' };
  } catch {
    throw ApiError.badRequest('Invalid or expired OAuth state parameter');
  }
}

async function persistConnectedAccount(
  userId: string,
  igUserId: string,
  facebookPageId: string,
  accessToken: string,
  expiresInSeconds: number,
  profile: {
    username: string;
    name: string;
    profilePictureUrl: string | null;
    followersCount: number;
  },
): Promise<InstagramAccount> {
  return prisma.instagramAccount.upsert({
    where: { instagramBusinessId: igUserId },
    create: {
      userId,
      instagramBusinessId: igUserId,
      facebookPageId,
      username: profile.username,
      name: profile.name,
      profilePictureUrl: profile.profilePictureUrl,
      followersCount: profile.followersCount,
      accessTokenEncrypted: encryptSecret(accessToken),
      tokenExpiresAt: new Date(Date.now() + expiresInSeconds * 1000),
      status: InstagramAccountStatus.CONNECTED,
    },
    update: {
      username: profile.username,
      name: profile.name,
      profilePictureUrl: profile.profilePictureUrl,
      followersCount: profile.followersCount,
      accessTokenEncrypted: encryptSecret(accessToken),
      tokenExpiresAt: new Date(Date.now() + expiresInSeconds * 1000),
      status: InstagramAccountStatus.CONNECTED,
      disconnectedAt: null,
      lastSyncedAt: new Date(),
    },
  });
}

export async function handleOAuthCallback(code: string, state: string): Promise<InstagramAccount> {
  const { userId } = verifyOAuthState(state);

  const shortLived = await instagramService.exchangeCodeForToken(code, config.META_REDIRECT_URI!);
  if (!shortLived.igUserId) {
    throw ApiError.badRequest('Instagram did not return a business account id for this login.');
  }
  const longLived = await instagramService.getLongLivedToken(shortLived.accessToken);

  // getInstagramProfile self-corrects to the id Instagram actually uses in webhook payloads,
  // which can differ from the id returned by the token exchange above — always trust this one.
  const profile = await instagramService.getInstagramProfile(
    shortLived.igUserId,
    longLived.accessToken,
  );
  const igUserId = profile.igUserId;
  await instagramService.subscribePageToWebhooks(igUserId, longLived.accessToken);

  const account = await persistConnectedAccount(
    userId,
    igUserId,
    igUserId, // no Facebook Page under direct Instagram Login; store the IG id as its own reference
    longLived.accessToken,
    longLived.expiresIn,
    {
      username: profile.username,
      name: profile.name,
      profilePictureUrl: profile.profilePictureUrl,
      followersCount: profile.followersCount,
    },
  );

  await notificationService.create(
    userId,
    NotificationType.AUTOMATION_STARTED,
    'Instagram connected',
    `@${profile.username} is now connected and ready for automations.`,
  );

  return account;
}

export async function connectMockAccount(userId: string): Promise<InstagramAccount> {
  // Deterministic per user — instagramBusinessId is globally unique, so a random id here would
  // both create a fresh duplicate row on every click and risk two different users' mock connects
  // colliding onto the same row (persistConnectedAccount's upsert never reassigns userId).
  const igUserId = `mock-ig-${userId}`;
  const profile = await instagramService.getInstagramProfile(igUserId, 'mock-token');
  const longLived = await instagramService.getLongLivedToken('mock-short');

  return persistConnectedAccount(
    userId,
    igUserId,
    'mock-fb-page-100000000000000',
    longLived.accessToken,
    longLived.expiresIn,
    profile,
  );
}

export async function disconnectAccount(userId: string, accountId: string): Promise<void> {
  const account = await prisma.instagramAccount.findFirst({ where: { id: accountId, userId } });
  if (!account) throw ApiError.notFound('Instagram account not found');

  await prisma.instagramAccount.update({
    where: { id: accountId },
    data: { status: InstagramAccountStatus.DISCONNECTED, disconnectedAt: new Date() },
  });
  await prisma.automation.updateMany({
    where: { instagramAccountId: accountId },
    data: { isActive: false },
  });

  await notificationService.create(
    userId,
    NotificationType.INSTAGRAM_DISCONNECTED,
    'Instagram disconnected',
    `@${account.username} was disconnected. Related automations were paused.`,
  );
}

export async function listAccounts(userId: string) {
  return prisma.instagramAccount.findMany({
    where: { userId, status: InstagramAccountStatus.CONNECTED },
    orderBy: { connectedAt: 'desc' },
  });
}

export function decryptAccountToken(account: InstagramAccount): string {
  return decryptSecret(account.accessTokenEncrypted);
}
