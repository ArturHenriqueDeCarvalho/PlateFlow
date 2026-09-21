import { db, refresh_sessions, eq } from '@plateflow/database';
import type {
  IRefreshSessionRepository,
  RefreshSessionRecord,
} from '../../core/repositories/IRefreshSessionRepository.js';

export class DrizzleRefreshSessionRepository implements IRefreshSessionRepository {
  async create(session: RefreshSessionRecord): Promise<RefreshSessionRecord> {
    const rows = await db
      .insert(refresh_sessions)
      .values({
        id: session.id,
        user_id: session.userId,
        token_hash: session.tokenHash,
        session_expires_at: session.sessionExpiresAt,
        expires_at: session.expiresAt,
        revoked_at: session.revokedAt,
      })
      .returning();
    return this.mapRow(rows[0]);
  }

  async findById(id: string): Promise<RefreshSessionRecord | null> {
    const rows = await db
      .select()
      .from(refresh_sessions)
      .where(eq(refresh_sessions.id, id))
      .limit(1);
    if (!rows.length) return null;
    return this.mapRow(rows[0]);
  }

  async findByTokenHash(tokenHash: string): Promise<RefreshSessionRecord | null> {
    const rows = await db
      .select()
      .from(refresh_sessions)
      .where(eq(refresh_sessions.token_hash, tokenHash))
      .limit(1);
    if (!rows.length) return null;
    return this.mapRow(rows[0]);
  }

  async rotateTokenHash(id: string, tokenHash: string): Promise<void> {
    await db
      .update(refresh_sessions)
      .set({ token_hash: tokenHash })
      .where(eq(refresh_sessions.id, id));
  }

  async revokeById(id: string): Promise<void> {
    await db
      .update(refresh_sessions)
      .set({ revoked_at: new Date() })
      .where(eq(refresh_sessions.id, id));
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await db
      .update(refresh_sessions)
      .set({ revoked_at: new Date() })
      .where(eq(refresh_sessions.user_id, userId));
  }

  private mapRow(r: typeof refresh_sessions.$inferSelect): RefreshSessionRecord {
    return {
      id: r.id,
      userId: r.user_id,
      tokenHash: r.token_hash,
      sessionExpiresAt: r.session_expires_at,
      expiresAt: r.expires_at,
      revokedAt: r.revoked_at,
    };
  }
}
