import { db, users, eq } from '@plateflow/database';
import type { IUserRepository, UserRecord } from '../../core/repositories/IUserRepository.js';

export class DrizzleUserRepository implements IUserRepository {
  async findById(id: string): Promise<UserRecord | null> {
    const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (!rows.length) return null;
    return this.mapRow(rows[0]);
  }

  async findByEmail(email: string): Promise<UserRecord | null> {
    const rows = await db.select().from(users).where(eq(users.email, email.trim().toLowerCase())).limit(1);
    if (!rows.length) return null;
    return this.mapRow(rows[0]);
  }

  async create(user: UserRecord): Promise<UserRecord> {
    const rows = await db
      .insert(users)
      .values({
        id: user.id,
        email: user.email.trim().toLowerCase(),
        name: user.name,
        password_hash: user.passwordHash,
        role: user.role,
        active: user.active,
      })
      .returning();
    return this.mapRow(rows[0]);
  }

  async updatePasswordHash(id: string, passwordHash: string): Promise<void> {
    await db
      .update(users)
      .set({ password_hash: passwordHash, updated_at: new Date() })
      .where(eq(users.id, id));
  }

  private mapRow(r: typeof users.$inferSelect): UserRecord {
    return {
      id: r.id,
      email: r.email,
      name: r.name,
      passwordHash: r.password_hash,
      role: r.role === 'user' ? 'user' : 'admin',
      active: r.active,
    };
  }
}
