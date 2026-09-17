import type { Request, Response } from 'express';
import type { EmailLoginInput, EmailRegisterInput, GoogleLoginInput } from '@instaauto/shared';
import * as authService from '../services/authService';
import { toUserDto } from '../utils/mappers';
import { REFRESH_COOKIE_MAX_AGE_MS, REFRESH_COOKIE_NAME } from '../lib/jwt';
import { isProduction, config } from '../config/env';
import { ApiError } from '../middleware/errors';

function cookieOptions() {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax' as const,
    path: '/api/auth',
    maxAge: REFRESH_COOKIE_MAX_AGE_MS,
    domain: config.COOKIE_DOMAIN,
  };
}

// Web relies on the httpOnly cookie alone. Mobile has no shared cookie jar per
// account - each saved account needs its own refresh token in hand so the app
// can hold several signed-in accounts at once and switch between them without
// re-authenticating, so the raw value is also returned in the body for it to
// store (in SecureStore) alongside the cookie, which keeps working for web.
export async function googleLogin(req: Request, res: Response): Promise<void> {
  const { idToken } = req.body as GoogleLoginInput;
  const { accessToken, refreshToken, user } = await authService.loginWithGoogle(idToken, {
    userAgent: req.headers['user-agent'],
    ip: req.ip,
  });
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, cookieOptions());
  res.json({ accessToken, refreshToken, user: toUserDto(user) });
}

export async function emailRegister(req: Request, res: Response): Promise<void> {
  const { email, password, name } = req.body as EmailRegisterInput;
  const { accessToken, refreshToken, user } = await authService.registerWithEmail(
    email,
    password,
    name,
    {
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    },
  );
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, cookieOptions());
  res.json({ accessToken, refreshToken, user: toUserDto(user) });
}

export async function emailLogin(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body as EmailLoginInput;
  const { accessToken, refreshToken, user } = await authService.loginWithEmail(email, password, {
    userAgent: req.headers['user-agent'],
    ip: req.ip,
  });
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, cookieOptions());
  res.json({ accessToken, refreshToken, user: toUserDto(user) });
}

export async function refresh(req: Request, res: Response): Promise<void> {
  // Mobile passes the specific saved account's refresh token explicitly (it's
  // switching between several); web has only the one cookie.
  const token =
    (req.body?.refreshToken as string | undefined) || req.cookies?.[REFRESH_COOKIE_NAME];
  if (!token) throw ApiError.unauthorized('No refresh token');

  const { accessToken, refreshToken, user } = await authService.refreshSession(token, {
    userAgent: req.headers['user-agent'],
    ip: req.ip,
  });
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, cookieOptions());
  res.json({ accessToken, refreshToken, user: toUserDto(user) });
}

export async function logout(req: Request, res: Response): Promise<void> {
  // Mobile signing out of one saved (not necessarily currently-active-cookie)
  // account passes that account's own refresh token to revoke specifically.
  const token =
    (req.body?.refreshToken as string | undefined) || req.cookies?.[REFRESH_COOKIE_NAME];
  if (token) await authService.logout(token);
  res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/auth' });
  res.status(204).send();
}
