import { createHash, randomBytes } from 'node:crypto';
import type { AuthUser } from '../../entities/index.js';
import type { IUserRepository } from '../../repositories/IUserRepository.js';
import type { IRefreshSessionRepository } from '../../repositories/IRefreshSessionRepository.js';

export interface RefreshResult {
  user: AuthUser;
  refreshToken: string;
  sessionId: string;
  sessionExpiresAt: Date;
}

const SESSION_INVALID = 'Sessão inválida ou expirada.';

export class RefreshSessionUseCase {
  constructor(
    private userRepo: IUserRepository,
    private refreshSessionRepo: IRefreshSessionRepository,
  ) {}

  async execute(opaqueRefreshToken: string): Promise<RefreshResult> {
    if (!opaqueRefreshToken) {
      throw new Error(SESSION_INVALID);
    }

    const tokenHash = createHash('sha256').update(opaqueRefreshToken).digest('hex');
    const session = await this.refreshSessionRepo.findByTokenHash(tokenHash);
    if (!session || session.revokedAt) {
      throw new Error(SESSION_INVALID);
    }

    const now = new Date();
    if (now >= session.sessionExpiresAt) {
      throw new Error(SESSION_INVALID);
    }

    const refreshToken = randomBytes(32).toString('base64url');
    const nextHash = createHash('sha256').update(refreshToken).digest('hex');
    await this.refreshSessionRepo.rotateTokenHash(session.id, nextHash);

    const user = await this.userRepo.findById(session.userId);
    if (!user || !user.active) {
      throw new Error(SESSION_INVALID);
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name ?? undefined,
        role: user.role,
      },
      refreshToken,
      sessionId: session.id,
      sessionExpiresAt: session.sessionExpiresAt,
    };
  }
}
