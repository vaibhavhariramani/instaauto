import {
  MAX_ACTIVE_API_KEYS,
  type ApiKeyDto,
  type CreateApiKeyInput,
  type CreatedApiKeyDto,
} from '@instaauto/shared';
import type { ApiKey, ApiKeyScope } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { generateApiKey, hashApiKey, looksLikeApiKey } from '../lib/apiKeys';
import { ApiError } from '../middleware/errors';

// lastUsedAt is informational; writing it on every MCP call would add a DB write to every request.
const LAST_USED_WRITE_INTERVAL_MS = 5 * 60_000;

export interface AuthenticatedApiKey {
  keyId: string;
  userId: string;
  scope: ApiKeyScope;
}

export function toApiKeyDto(key: ApiKey): ApiKeyDto {
  return {
    id: key.id,
    name: key.name,
    prefix: key.prefix,
    scope: key.scope,
    createdAt: key.createdAt.toISOString(),
    lastUsedAt: key.lastUsedAt?.toISOString() ?? null,
    expiresAt: key.expiresAt?.toISOString() ?? null,
    revokedAt: key.revokedAt?.toISOString() ?? null,
  };
}

export async function listApiKeys(userId: string): Promise<ApiKeyDto[]> {
  const keys = await prisma.apiKey.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  return keys.map(toApiKeyDto);
}

export async function createApiKey(
  userId: string,
  input: CreateApiKeyInput,
  ip?: string,
): Promise<CreatedApiKeyDto> {
  const now = new Date();
  const activeCount = await prisma.apiKey.count({
    where: { userId, revokedAt: null, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
  });
  if (activeCount >= MAX_ACTIVE_API_KEYS) {
    throw ApiError.badRequest(
      `You can have at most ${MAX_ACTIVE_API_KEYS} active API keys. Revoke one you no longer use first.`,
    );
  }

  const { secret, prefix, hash } = generateApiKey();
  const key = await prisma.apiKey.create({
    data: {
      userId,
      name: input.name,
      prefix,
      keyHash: hash,
      scope: input.scope,
      expiresAt: input.expiresInDays
        ? new Date(now.getTime() + input.expiresInDays * 24 * 60 * 60 * 1000)
        : null,
    },
  });
  await prisma.auditLog.create({
    data: { userId, action: 'api_key.created', metadata: { keyId: key.id, scope: key.scope }, ip },
  });

  return { ...toApiKeyDto(key), secret };
}

export async function revokeApiKey(userId: string, id: string, ip?: string): Promise<void> {
  const key = await prisma.apiKey.findFirst({ where: { id, userId } });
  if (!key) throw ApiError.notFound('API key not found');
  if (key.revokedAt) return;
  await prisma.apiKey.update({ where: { id }, data: { revokedAt: new Date() } });
  await prisma.auditLog.create({
    data: { userId, action: 'api_key.revoked', metadata: { keyId: id }, ip },
  });
}

/** Resolves a presented secret to its owner, or null for anything unknown, revoked or expired. */
export async function authenticateApiKey(secret: string): Promise<AuthenticatedApiKey | null> {
  // Cheap shape check first so garbage never costs a DB round trip.
  if (!looksLikeApiKey(secret)) return null;

  const key = await prisma.apiKey.findUnique({ where: { keyHash: hashApiKey(secret) } });
  if (!key || key.revokedAt) return null;
  const now = new Date();
  if (key.expiresAt && key.expiresAt <= now) return null;

  // Awaited (not fire-and-forget): Cloud Run only guarantees CPU while a request is in flight.
  await prisma.apiKey.updateMany({
    where: {
      id: key.id,
      OR: [
        { lastUsedAt: null },
        { lastUsedAt: { lt: new Date(now.getTime() - LAST_USED_WRITE_INTERVAL_MS) } },
      ],
    },
    data: { lastUsedAt: now },
  });

  return { keyId: key.id, userId: key.userId, scope: key.scope };
}

export async function recordAiAction(
  userId: string,
  keyId: string,
  action: string,
  metadata: Record<string, unknown>,
): Promise<void> {
  await prisma.auditLog.create({
    data: { userId, action: `mcp.${action}`, metadata: { keyId, ...metadata } as object },
  });
}
