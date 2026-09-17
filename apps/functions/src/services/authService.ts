import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { prisma } from '../lib/prisma';
import { config } from '../config/env';
import { hashToken } from '../lib/crypto';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../lib/jwt';
import { ApiError } from '../middleware/errors';
import type { User } from '@prisma/client';

const BCRYPT_ROUNDS = 12;

const googleClient = new OAuth2Client(config.GOOGLE_CLIENT_ID);

// Web (Google Identity Services) and mobile (native Google Sign-In) each need their
// own OAuth client type, so a token can legitimately be audienced to either one.
const googleTokenAudiences = [config.GOOGLE_CLIENT_ID, config.GOOGLE_MOBILE_CLIENT_ID].filter(
  (id): id is string => Boolean(id),
);

interface SessionMeta {
  userAgent?: string;
  ip?: string;
}

async function issueSession(user: User, meta: SessionMeta) {
  const accessToken = signAccessToken({ sub: user.id, email: user.email });

  // Create the session row first so we can bind the JWT's sessionId to it, then rotate.
  // refreshTokenHash is @unique, so the placeholder must be unique per call too — a shared
  // literal here (e.g. 'pending') collides under concurrent logins/refreshes (two requests
  // both insert before either has updated to its real hash), throwing a Prisma unique-constraint
  // error that surfaces to the client as a failed refresh — i.e. a spurious logout.
  const session = await prisma.session.create({
    data: {
      userId: user.id,
      refreshTokenHash: `pending-${crypto.randomUUID()}`,
      userAgent: meta.userAgent,
      ip: meta.ip,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });
  const refreshToken = signRefreshToken({ sub: user.id, sessionId: session.id });
  await prisma.session.update({
    where: { id: session.id },
    data: { refreshTokenHash: hashToken(refreshToken) },
  });

  return { accessToken, refreshToken, user };
}

export async function loginWithGoogle(idToken: string, meta: SessionMeta) {
  let ticket;
  try {
    ticket = await googleClient.verifyIdToken({ idToken, audience: googleTokenAudiences });
  } catch (err) {
    // Wrong/expired token, or the token's audience doesn't match GOOGLE_CLIENT_ID or
    // GOOGLE_MOBILE_CLIENT_ID (e.g. one of them is missing, or in the wrong GCP
    // project) - surface as a clear 401 instead of an opaque 500.
    throw ApiError.unauthorized(
      `Invalid Google credential: ${err instanceof Error ? err.message : 'verification failed'}`,
    );
  }
  const payload = ticket.getPayload();
  if (!payload?.email || !payload.sub) {
    throw ApiError.unauthorized('Invalid Google credential');
  }

  // Look up by googleId first (returning Google user), then fall back to email so an
  // existing email/password account gets linked instead of hitting the unique email
  // constraint on create — without this, "Continue with Google" 500s for anyone who
  // already has an account under that email.
  let user = await prisma.user.findUnique({ where: { googleId: payload.sub } });

  if (!user) {
    const existingByEmail = await prisma.user.findUnique({ where: { email: payload.email } });
    user = existingByEmail
      ? await prisma.user.update({
          where: { id: existingByEmail.id },
          data: {
            googleId: payload.sub,
            name: existingByEmail.name ?? payload.name,
            avatarUrl: existingByEmail.avatarUrl ?? payload.picture,
          },
        })
      : await prisma.user.create({
          data: {
            googleId: payload.sub,
            email: payload.email,
            name: payload.name ?? payload.email.split('@')[0]!,
            avatarUrl: payload.picture,
          },
        });
  } else {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: payload.name ?? undefined,
        avatarUrl: payload.picture ?? undefined,
      },
    });
  }

  await prisma.auditLog.create({
    data: { userId: user.id, action: 'auth.google_login', ip: meta.ip },
  });

  return issueSession(user, meta);
}

export async function registerWithEmail(
  email: string,
  password: string,
  name: string,
  meta: SessionMeta,
) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw ApiError.badRequest('An account with this email already exists');

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const user = await prisma.user.create({
    data: { email, name, passwordHash },
  });

  await prisma.auditLog.create({
    data: { userId: user.id, action: 'auth.email_register', ip: meta.ip },
  });

  return issueSession(user, meta);
}

export async function loginWithEmail(email: string, password: string, meta: SessionMeta) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user?.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  await prisma.auditLog.create({
    data: { userId: user.id, action: 'auth.email_login', ip: meta.ip },
  });

  return issueSession(user, meta);
}

export async function refreshSession(refreshToken: string, meta: SessionMeta) {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }

  const session = await prisma.session.findUnique({ where: { id: payload.sessionId } });
  if (!session || session.revokedAt || session.expiresAt < new Date()) {
    throw ApiError.unauthorized('Session no longer valid');
  }
  if (session.refreshTokenHash !== hashToken(refreshToken)) {
    // Possible token reuse/theft — revoke the whole session defensively.
    await prisma.session.update({ where: { id: session.id }, data: { revokedAt: new Date() } });
    throw ApiError.unauthorized('Refresh token mismatch');
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.userId } });

  await prisma.session.update({ where: { id: session.id }, data: { revokedAt: new Date() } });
  return issueSession(user, meta);
}

export async function logout(refreshToken: string): Promise<void> {
  try {
    const payload = verifyRefreshToken(refreshToken);
    await prisma.session
      .update({
        where: { id: payload.sessionId },
        data: { revokedAt: new Date() },
      })
      .catch(() => undefined);
  } catch {
    // Already invalid/expired — nothing to revoke.
  }
}

export async function getUserById(userId: string): Promise<User> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw ApiError.notFound('User not found');
  return user;
}
