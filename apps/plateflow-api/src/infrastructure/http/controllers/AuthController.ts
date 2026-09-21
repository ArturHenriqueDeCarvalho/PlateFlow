import type { FastifyRequest, FastifyReply } from 'fastify';
import type { LoginUseCase } from '../../../core/use-cases/auth/LoginUseCase.js';
import type { ITokenIssuer } from '../../../core/ports/ITokenIssuer.js';
import { accessExpiresAt, setSessionCookies } from '../../auth/sessionCookies.js';

export class AuthController {
  constructor(
    private loginUseCase: LoginUseCase,
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

  async me(req: FastifyRequest, reply: FastifyReply) {
    const user = req.authUser;
    if (!user?.id) {
      return reply.status(401).send({ error: 'Sessão inválida ou expirada.' });
    }
    return reply.send({ user });
  }
}
