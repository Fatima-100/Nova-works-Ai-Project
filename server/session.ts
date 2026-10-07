import { SignJWT, jwtVerify } from 'jose';
import type { Request, Response } from 'express';
import { db, UserRecord } from './db.js';

const COOKIE_NAME = 'novaworks_session';
const SECRET_KEY = new TextEncoder().encode(
  process.env.SESSION_SECRET || 'novaworks-infinity-hack-super-secure-session-secret-2026'
);

export interface SessionPayload {
  userId: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'AGENT';
  name: string;
}

export async function createSessionToken(user: UserRecord): Promise<string> {
  return await new SignJWT({
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET_KEY);
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export function setSessionCookie(res: Response, token: string): void {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  });
}

/**
 * Extracts and verifies the current session user from the HTTP-only cookie or Authorization header.
 * Current user ALWAYS comes from the validated session, never from client body or query parameters!
 */
export async function getCurrentUser(req: Request): Promise<UserRecord | null> {
  let token = req.cookies?.[COOKIE_NAME];

  if (!token && req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.slice(7);
  }

  if (!token) {
    return null;
  }

  const payload = await verifySessionToken(token);
  if (!payload || !payload.userId) {
    return null;
  }

  const user = db.getUserById(payload.userId);
  return user || null;
}
