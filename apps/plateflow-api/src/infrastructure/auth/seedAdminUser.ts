import { db, users } from '@plateflow/database';
import { ScryptPasswordHasher } from '../crypto/ScryptPasswordHasher.js';

function isFailClosedEnv(): boolean {
  return process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);
}

export function assertIdentityEnv(): void {
  if (!isFailClosedEnv()) return;

  const secret = process.env.JWT_SECRET || '';
  if (Buffer.byteLength(secret) < 32) {
    throw new Error('JWT_SECRET must be at least 32 bytes in production.');
  }
  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD are required in production.');
  }
}

export async function seedAdminUser(): Promise<void> {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    if (isFailClosedEnv()) {
      throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD are required in production.');
    }
    return;
  }

  const hasher = new ScryptPasswordHasher();
  const passwordHash = await hasher.hash(password);

  await db
    .insert(users)
    .values({
      id: `user-admin-${email}`,
      email,
      name: 'Administrador Gráfica',
      password_hash: passwordHash,
      role: 'admin',
      active: true,
    })
    .onConflictDoNothing({ target: users.email });
}
