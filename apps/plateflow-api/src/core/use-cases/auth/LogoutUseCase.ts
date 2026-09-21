import { createHash } from 'node:crypto';
import type { IRefreshSessionRepository } from '../../repositories/IRefreshSessionRepository.js';

export interface LogoutInput {
  opaqueRefreshToken?: string | null;
  sessionId?: string | null;
  userId?: string | null;
}

export class LogoutUseCase {
  constructor(private refreshSessionRepo: IRefreshSessionRepository) {}

  async execute(input: LogoutInput): Promise<void> {
    if (input.opaqueRefreshToken) {
      const tokenHash = createHash('sha256').update(input.opaqueRefreshToken).digest('hex');
      const session = await this.refreshSessionRepo.findByTokenHash(tokenHash);
      if (session) {
        await this.refreshSessionRepo.revokeById(session.id);
        return;
      }
    }

    if (input.sessionId) {
      await this.refreshSessionRepo.revokeById(input.sessionId);
      return;
    }

    if (input.userId) {
      await this.refreshSessionRepo.revokeAllForUser(input.userId);
    }
  }
}
