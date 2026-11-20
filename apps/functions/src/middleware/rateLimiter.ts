import rateLimit from 'express-rate-limit';
import { extractBearerToken, hashApiKey } from '../lib/apiKeys';

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: { message: 'Too many auth attempts, please try again later.', code: 'RATE_LIMITED' },
  },
});

// Access tokens are held in memory only, so every hard page reload (or new tab) calls
// /auth/refresh to silently restore the session — unlike login/register/google, this isn't a
// credential-guessing vector (refresh tokens are long random signed JWTs, not brute-forceable),
// so it gets a much more generous budget. Sharing authRateLimiter's 20-per-15-min here made a
// handful of page reloads (multiple tabs, a flaky connection) look identical to a spurious logout.
export const refreshRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: { message: 'Too many session refreshes, please try again later.', code: 'RATE_LIMITED' },
  },
});

export const webhookRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
});

// Per API key (not per IP): AI tools run from shared networks/cloud IPs, and a runaway agent loop
// should throttle only its own key. The key is hashed so the secret never sits in the limiter's
// in-memory store; unauthenticated requests fall back to the caller's IP.
export const mcpRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const token = extractBearerToken(req.headers.authorization);
    return token ? `key:${hashApiKey(token).slice(0, 16)}` : `ip:${req.ip ?? 'unknown'}`;
  },
  message: {
    jsonrpc: '2.0',
    id: null,
    error: { code: -32029, message: 'Rate limit exceeded: max 60 requests per minute per API key' },
  },
});
