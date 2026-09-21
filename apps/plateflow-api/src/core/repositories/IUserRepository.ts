import type { AuthUser } from '../entities/index.js';

export interface UserRecord {
  id: string;
  email: string;
  name: string | null;
  passwordHash: string;
  role: AuthUser['role'];
  active: boolean;
}

export interface IUserRepository {
  findById(id: string): Promise<UserRecord | null>;
  findByEmail(email: string): Promise<UserRecord | null>;
  create(user: UserRecord): Promise<UserRecord>;
  updatePasswordHash(id: string, passwordHash: string): Promise<void>;
}
