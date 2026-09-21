import type { FastifyReply } from 'fastify';

export const ACCESS_COOKIE = 'plateflow_access';
export const REFRESH_COOKIE = 'plateflow_refresh';
export const ACCESS_TTL_MS = 15 * 60 * 1000;

export function cookieSecure(): boolean {
  return process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);
}

export function accessExpiresAt(sessionExpiresAt: Date, now = new Date()): Date {
  return new Date(Math.min(now.getTime() + ACCESS_TTL_MS, sessionExpiresAt.getTime()));
}

export function setSessionCookies(
  reply: FastifyReply,
  params: {
    accessToken: string;
    refreshToken: string;
    accessExpiresAt: Date;
    sessionExpiresAt: Date;
  },
): void {
  const secure = cookieSecure();
  reply.setCookie(ACCESS_COOKIE, params.accessToken, {
    path: '/',
    httpOnly: true,
    secure,
    sameSite: 'lax',
    expires: params.accessExpiresAt,
  });
  reply.setCookie(REFRESH_COOKIE, params.refreshToken, {
    path: '/api/auth',
    httpOnly: true,
    secure,
    sameSite: 'lax',
    expires: params.sessionExpiresAt,
  });
}

export function clearSessionCookies(reply: FastifyReply): void {
  const secure = cookieSecure();
  reply.clearCookie(ACCESS_COOKIE, {
    path: '/',
    httpOnly: true,
    secure,
    sameSite: 'lax',
  });
  reply.clearCookie(REFRESH_COOKIE, {
    path: '/api/auth',
    httpOnly: true,
    secure,
    sameSite: 'lax',
  });
}
