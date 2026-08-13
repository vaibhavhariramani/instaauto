import { describe, expect, it, beforeAll } from 'vitest';

beforeAll(() => {
  process.env.ENCRYPTION_KEY ??= '0'.repeat(64);
  process.env.JWT_ACCESS_SECRET ??= 'a'.repeat(32);
  process.env.JWT_REFRESH_SECRET ??= 'b'.repeat(32);
  process.env.DATABASE_URL ??= 'postgresql://user:pass@localhost:5432/db';
  process.env.GOOGLE_CLIENT_ID ??= 'test-client-id';
});

describe('encryptSecret / decryptSecret', () => {
  it('round-trips a secret', async () => {
    const { encryptSecret, decryptSecret } = await import('./crypto');
    const plaintext = 'super-secret-instagram-token';
    const encrypted = encryptSecret(plaintext);
    expect(encrypted).not.toBe(plaintext);
    expect(decryptSecret(encrypted)).toBe(plaintext);
  });
});

describe('verifyMetaSignature', () => {
  it('accepts a correctly-signed body and rejects a tampered one', async () => {
    const crypto = await import('node:crypto');
    const { verifyMetaSignature } = await import('./crypto');
    const secret = 'app-secret';
    const body = Buffer.from(JSON.stringify({ hello: 'world' }));
    const sig = 'sha256=' + crypto.createHmac('sha256', secret).update(body).digest('hex');

    expect(verifyMetaSignature(body, sig, secret)).toBe(true);
    expect(verifyMetaSignature(Buffer.from('tampered'), sig, secret)).toBe(false);
    expect(verifyMetaSignature(body, undefined, secret)).toBe(false);
  });
});
