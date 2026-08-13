import { InstagramAccountStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { encryptSecret } from '../lib/crypto';
import { decryptAccountToken } from '../services/instagramConnectService';
import { instagramService } from '../services/instagramService';
import { logger } from '../lib/logger';

/** Refreshes long-lived Instagram tokens that will expire within the next 7 days. */
export async function runRefreshExpiringTokens(): Promise<void> {
  const soon = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const accounts = await prisma.instagramAccount.findMany({
    where: { status: InstagramAccountStatus.CONNECTED, tokenExpiresAt: { lte: soon } },
  });

  let refreshed = 0;
  for (const account of accounts) {
    try {
      const currentToken = decryptAccountToken(account);
      const { accessToken, expiresIn } = await instagramService.refreshLongLivedToken(currentToken);
      await prisma.instagramAccount.update({
        where: { id: account.id },
        data: {
          accessTokenEncrypted: encryptSecret(accessToken),
          tokenExpiresAt: new Date(Date.now() + expiresIn * 1000),
        },
      });
      refreshed += 1;
    } catch (err) {
      logger.error({ err, accountId: account.id }, 'Failed to refresh Instagram token');
      await prisma.instagramAccount.update({
        where: { id: account.id },
        data: { status: InstagramAccountStatus.EXPIRED },
      });
    }
  }
  logger.info({ checked: accounts.length, refreshed }, 'refreshExpiringTokens job complete');
}
