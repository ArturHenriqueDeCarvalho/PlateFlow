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
  findByTokenHash(tokenHash: string): Promise<RefreshSessionRecord | null>;
  revokeById(id: string): Promise<void>;
  revokeAllForUser(userId: string): Promise<void>;
}
