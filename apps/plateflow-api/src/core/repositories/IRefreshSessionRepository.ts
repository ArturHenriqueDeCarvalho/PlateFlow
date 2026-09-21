export interface RefreshSessionRecord {
  id: string;
  userId: string;
  tokenHash: string;
  sessionExpiresAt: Date;
  expiresAt: Date;
  revokedAt: Date | null;
}

export interface IRefreshSessionRepository {
  create(session: RefreshSessionRecord): Promise<RefreshSessionRecord>;
  findById(id: string): Promise<RefreshSessionRecord | null>;
  findByTokenHash(tokenHash: string): Promise<RefreshSessionRecord | null>;
  rotateTokenHash(id: string, tokenHash: string): Promise<void>;
  revokeById(id: string): Promise<void>;
  revokeAllForUser(userId: string): Promise<void>;
}
