import { createHash, randomBytes } from 'node:crypto';

export const API_KEY_PREFIX = 'iak_';
// Enough of the secret to recognise a key in a list ("iak_AbCd1234…") without it being usable.
const DISPLAY_PREFIX_LENGTH = API_KEY_PREFIX.length + 8;
// 32 random bytes → 43 base64url characters.
const API_KEY_PATTERN = /^iak_[A-Za-z0-9_-]{43}$/;

// Keys are 256 bits of CSPRNG output, so a plain SHA-256 is sufficient (and lets us look a key up
// by hash with an index): there's no low-entropy secret to brute-force, unlike a password.
export function hashApiKey(secret: string): string {
  return createHash('sha256').update(secret).digest('hex');
}

export function generateApiKey(): { secret: string; prefix: string; hash: string } {
  const secret = `${API_KEY_PREFIX}${randomBytes(32).toString('base64url')}`;
  return { secret, prefix: secret.slice(0, DISPLAY_PREFIX_LENGTH), hash: hashApiKey(secret) };
}

export function looksLikeApiKey(token: string): boolean {
  return API_KEY_PATTERN.test(token);
}

export function extractBearerToken(header: string | undefined): string | null {
  if (!header) return null;
  const match = /^Bearer\s+(\S+)$/i.exec(header.trim());
  return match?.[1] ?? null;
}
