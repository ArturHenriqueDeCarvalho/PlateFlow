import { createHash, randomBytes, randomUUID } from 'node:crypto';
import type { AuthUser } from '../../entities/index.js';
import type { IPasswordHasher } from '../../ports/IPasswordHasher.js';
import type { IUserRepository } from '../../repositories/IUserRepository.js';
import type { IRefreshSessionRepository } from '../../repositories/IRefreshSessionRepository.js';

export interface ChangePasswordResult {
  user: AuthUser;
  refreshToken: string;
  sessionId: string;
  sessionExpiresAt: Date;
}

const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const WRONG_CURRENT = 'Senha atual incorreta.';
const VALIDATION = 'Informe a senha atual e a nova senha.';

export class ChangePasswordUseCase {
  constructor(
    private userRepo: IUserRepository,
    private passwordHasher: IPasswordHasher,
    private refreshSessionRepo: IRefreshSessionRepository,
  ) {}

  async execute(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<ChangePasswordResult> {
    const current = (currentPassword ?? '').trim();
    const next = (newPassword ?? '').trim();
    if (!userId || !current || !next) {
      throw new Error(VALIDATION);
    }

    const user = await this.userRepo.findById(userId);
    if (!user || !user.active) {
      throw new Error(WRONG_CURRENT);
    }

    const ok = await this.passwordHasher.verify(current, user.passwordHash);
    if (!ok) {
      throw new Error(WRONG_CURRENT);
    }

    const passwordHash = await this.passwordHasher.hash(next);
    await this.userRepo.updatePasswordHash(user.id, passwordHash);
    await this.refreshSessionRepo.revokeAllForUser(user.id);

    const refreshToken = randomBytes(32).toString('base64url');
    const tokenHash = createHash('sha256').update(refreshToken).digest('hex');
    const now = new Date();
    const sessionExpiresAt = new Date(now.getTime() + SESSION_TTL_MS);
    const sessionId = randomUUID();

    await this.refreshSessionRepo.create({
      id: sessionId,
      userId: user.id,
      tokenHash,
      sessionExpiresAt,
      expiresAt: sessionExpiresAt,
      revokedAt: null,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name ?? undefined,
        role: user.role,
      },
      refreshToken,
      sessionId,
      sessionExpiresAt,
    };
  }
}
