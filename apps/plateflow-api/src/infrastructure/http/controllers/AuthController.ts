import type { FastifyRequest, FastifyReply } from 'fastify';
import type { LoginUseCase } from '../../../core/use-cases/auth/LoginUseCase.js';
import type { RefreshSessionUseCase } from '../../../core/use-cases/auth/RefreshSessionUseCase.js';
import type { LogoutUseCase } from '../../../core/use-cases/auth/LogoutUseCase.js';
import type { ChangePasswordUseCase } from '../../../core/use-cases/auth/ChangePasswordUseCase.js';
import type { ITokenIssuer } from '../../../core/ports/ITokenIssuer.js';
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  accessExpiresAt,
  clearSessionCookies,
  setSessionCookies,
} from '../../auth/sessionCookies.js';

export class AuthController {
  constructor(
    private loginUseCase: LoginUseCase,
    private refreshSessionUseCase: RefreshSessionUseCase,
    private logoutUseCase: LogoutUseCase,
    private changePasswordUseCase: ChangePasswordUseCase,
    private tokenIssuer: ITokenIssuer,
  ) {}

  async login(req: FastifyRequest<{ Body: { email?: string; password?: string } }>, reply: FastifyReply) {
    try {
      const email = req.body?.email || '';
      const password = req.body?.password || '';
      const result = await this.loginUseCase.execute(email, password);
      const accessExp = accessExpiresAt(result.sessionExpiresAt);
      const accessToken = await this.tokenIssuer.signAccess(
        {
          sub: result.user.id,
          role: result.user.role,
          email: result.user.email,
          sid: result.sessionId,
        },
        accessExp,
      );
      setSessionCookies(reply, {
        accessToken,
        refreshToken: result.refreshToken,
        accessExpiresAt: accessExp,
        sessionExpiresAt: result.sessionExpiresAt,
      });
      return reply.send({ user: result.user });
    } catch (err: any) {
      return reply.status(401).send({ error: err.message || 'Credenciais inválidas.' });
    }
  }

  async refresh(req: FastifyRequest, reply: FastifyReply) {
    try {
      const opaque = req.cookies?.[REFRESH_COOKIE] || '';
      const result = await this.refreshSessionUseCase.execute(opaque);
      const accessExp = accessExpiresAt(result.sessionExpiresAt);
      const accessToken = await this.tokenIssuer.signAccess(
        {
          sub: result.user.id,
          role: result.user.role,
          email: result.user.email,
          sid: result.sessionId,
        },
        accessExp,
      );
      setSessionCookies(reply, {
        accessToken,
        refreshToken: result.refreshToken,
        accessExpiresAt: accessExp,
        sessionExpiresAt: result.sessionExpiresAt,
      });
      return reply.send({ user: result.user });
    } catch (err: any) {
      clearSessionCookies(reply);
      return reply.status(401).send({ error: err.message || 'Sessão inválida ou expirada.' });
    }
  }

  async logout(req: FastifyRequest, reply: FastifyReply) {
    const opaqueRefreshToken = req.cookies?.[REFRESH_COOKIE] || null;
    let sessionId: string | null = null;
    let userId: string | null = null;
    try {
      await req.jwtVerify({ onlyCookie: true });
      sessionId = req.user?.sid ?? null;
      userId = req.user?.sub ?? null;
    } catch {
      // Access may already be expired; still revoke via refresh cookie when present.
    }

    await this.logoutUseCase.execute({ opaqueRefreshToken, sessionId, userId });
    clearSessionCookies(reply);
    // Ensure inject clients see Max-Age=0 even if clearCookie shape differs
    if (!reply.getHeader('set-cookie')) {
      reply.setCookie(ACCESS_COOKIE, '', { path: '/', maxAge: 0 });
      reply.setCookie(REFRESH_COOKIE, '', { path: '/api/auth', maxAge: 0 });
    }
    return reply.send({ ok: true });
  }

  async me(req: FastifyRequest, reply: FastifyReply) {
    const user = req.authUser;
    if (!user?.id) {
      return reply.status(401).send({ error: 'Sessão inválida ou expirada.' });
    }
    return reply.send({ user });
  }

  async changePassword(
    req: FastifyRequest<{ Body: { currentPassword?: string; newPassword?: string } }>,
    reply: FastifyReply,
  ) {
    const userId = req.user?.sub;
    if (!userId) {
      return reply.status(401).send({ error: 'Sessão inválida ou expirada.' });
    }

    try {
      const currentPassword = req.body?.currentPassword ?? '';
      const newPassword = req.body?.newPassword ?? '';
      const result = await this.changePasswordUseCase.execute(userId, currentPassword, newPassword);
      const accessExp = accessExpiresAt(result.sessionExpiresAt);
      const accessToken = await this.tokenIssuer.signAccess(
        {
          sub: result.user.id,
          role: result.user.role,
          email: result.user.email,
          sid: result.sessionId,
        },
        accessExp,
      );
      setSessionCookies(reply, {
        accessToken,
        refreshToken: result.refreshToken,
        accessExpiresAt: accessExp,
        sessionExpiresAt: result.sessionExpiresAt,
      });
      return reply.send({ user: result.user });
    } catch (err: any) {
      const message = err?.message || 'Não foi possível alterar a senha.';
      if (
        message === 'Senha atual incorreta.' ||
        message === 'Informe a senha atual e a nova senha.'
      ) {
        return reply.status(400).send({ error: message });
      }
      return reply.status(500).send({ error: message });
    }
  }
}
