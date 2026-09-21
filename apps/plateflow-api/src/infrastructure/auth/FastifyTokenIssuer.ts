import type { FastifyInstance } from 'fastify';
import type { AccessTokenClaims, ITokenIssuer } from '../../core/ports/ITokenIssuer.js';

export class FastifyTokenIssuer implements ITokenIssuer {
  constructor(private app: FastifyInstance) {}

  async signAccess(claims: AccessTokenClaims, expiresAt: Date): Promise<string> {
    const expiresIn = Math.max(1, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
    return this.app.jwt.sign(
      {
        sub: claims.sub,
        role: claims.role,
        email: claims.email,
        sid: claims.sid,
      },
      { expiresIn },
    );
  }
}
