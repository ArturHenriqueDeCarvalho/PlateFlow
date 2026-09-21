import type { AuthUser } from '../../entities/index.js';
import type { IPasswordHasher } from '../../ports/IPasswordHasher.js';
import type { IUserRepository } from '../../repositories/IUserRepository.js';
import type { IRefreshSessionRepository } from '../../repositories/IRefreshSessionRepository.js';
import { createHash, randomBytes, randomUUID } from 'node:crypto';

export interface LoginResult {
  user: AuthUser;
  refreshToken: string;
  sessionId: string;
  sessionExpiresAt: Date;
}

const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const INVALID_CREDENTIALS = 'Credenciais inválidas.';

export class LoginUseCase {
  constructor(
    private userRepo: IUserRepository,
    private passwordHasher: IPasswordHasher,
    private refreshSessionRepo: IRefreshSessionRepository,
  ) {}

  async execute(email: string, password: string): Promise<LoginResult> {
    const user = await this.userRepo.findByEmail(email.trim().toLowerCase());
    if (!user || !user.active) {
      throw new Error(INVALID_CREDENTIALS);
    }

    const ok = await this.passwordHasher.verify(password, user.passwordHash);
    if (!ok) {
      throw new Error(INVALID_CREDENTIALS);
    }

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
