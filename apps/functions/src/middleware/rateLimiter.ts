import rateLimit from 'express-rate-limit';

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
