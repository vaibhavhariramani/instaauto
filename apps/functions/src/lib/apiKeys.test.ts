import { Writable } from 'node:stream';
import pino from 'pino';
import { describe, expect, it } from 'vitest';
import { extractBearerToken, generateApiKey, hashApiKey, looksLikeApiKey } from './apiKeys';
import { LOG_REDACTION } from './logger';

describe('API key generation', () => {
  it('produces well-formed, unique secrets whose hash matches', () => {
    const a = generateApiKey();
    const b = generateApiKey();
    expect(looksLikeApiKey(a.secret)).toBe(true);
    expect(a.secret).not.toBe(b.secret);
    expect(a.hash).toBe(hashApiKey(a.secret));
    expect(a.hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('exposes only a short prefix, never enough to reconstruct the secret', () => {
    const { secret, prefix } = generateApiKey();
    expect(secret.startsWith(prefix)).toBe(true);
    expect(prefix).toHaveLength(12);
    expect(prefix.length).toBeLessThan(secret.length / 3);
  });

  it('rejects malformed tokens before any lookup', () => {
    expect(looksLikeApiKey('')).toBe(false);
    expect(looksLikeApiKey('iak_short')).toBe(false);
    expect(looksLikeApiKey('eyJhbGciOiJIUzI1NiJ9.session.jwt')).toBe(false);
    expect(looksLikeApiKey(`xxx_${'a'.repeat(43)}`)).toBe(false);
    expect(looksLikeApiKey(`iak_${'a'.repeat(44)}`)).toBe(false);
  });
});

describe('extractBearerToken', () => {
  it('parses a bearer header case-insensitively', () => {
    expect(extractBearerToken('Bearer abc')).toBe('abc');
    expect(extractBearerToken('bearer   abc ')).toBe('abc');
  });
  it('returns null for anything else', () => {
    expect(extractBearerToken(undefined)).toBeNull();
    expect(extractBearerToken('Basic abc')).toBeNull();
    expect(extractBearerToken('Bearer')).toBeNull();
    expect(extractBearerToken('Bearer a b')).toBeNull();
  });
});

describe('log redaction', () => {
  it('never writes credentials from request headers to the log output', () => {
    let out = '';
    const sink = new Writable({
      write(chunk, _enc, cb) {
        out += chunk.toString();
        cb();
      },
    });
    const log = pino({ redact: LOG_REDACTION }, sink);
    const secret = generateApiKey().secret;
    log.info(
      {
        req: {
          method: 'POST',
          url: '/api/mcp',
          headers: {
            authorization: `Bearer ${secret}`,
            cookie: 'session=topsecret',
            'content-type': 'application/json',
          },
        },
        res: { statusCode: 200, headers: { 'set-cookie': 'refresh=topsecret2' } },
      },
      'request completed',
    );
    expect(out).not.toContain(secret);
    expect(out).not.toContain('topsecret');
    expect(out).toContain('[redacted]');
    expect(out).toContain('application/json');
  });
});
