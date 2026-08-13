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

export async function googleLogin(req: Request, res: Response): Promise<void> {
  const { idToken } = req.body as GoogleLoginInput;
  const { accessToken, refreshToken, user } = await authService.loginWithGoogle(idToken, {
    userAgent: req.headers['user-agent'],
    ip: req.ip,
  });
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, cookieOptions());
  res.json({ accessToken, user: toUserDto(user) });
}

export async function emailRegister(req: Request, res: Response): Promise<void> {
  const { email, password, name } = req.body as EmailRegisterInput;
  const { accessToken, refreshToken, user } = await authService.registerWithEmail(email, password, name, {
    userAgent: req.headers['user-agent'],
    ip: req.ip,
  });
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, cookieOptions());
  res.json({ accessToken, user: toUserDto(user) });
}

export async function emailLogin(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body as EmailLoginInput;
  const { accessToken, refreshToken, user } = await authService.loginWithEmail(email, password, {
    userAgent: req.headers['user-agent'],
    ip: req.ip,
  });
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, cookieOptions());
  res.json({ accessToken, user: toUserDto(user) });
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const token = req.cookies?.[REFRESH_COOKIE_NAME];
  if (!token) throw ApiError.unauthorized('No refresh token');

  const { accessToken, refreshToken, user } = await authService.refreshSession(token, {
    userAgent: req.headers['user-agent'],
    ip: req.ip,
  });
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, cookieOptions());
  res.json({ accessToken, user: toUserDto(user) });
}

export async function logout(req: Request, res: Response): Promise<void> {
  const token = req.cookies?.[REFRESH_COOKIE_NAME];
  if (token) await authService.logout(token);
  res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/auth' });
  res.status(204).send();
}
