import type { DynamicRedirect } from '../entities/index.js';

export interface IRedirectRepository {
  findAll(): Promise<DynamicRedirect[]>;
  findBySlug(slug: string): Promise<DynamicRedirect | null>;
  createBatch(redirects: DynamicRedirect[]): Promise<DynamicRedirect[]>;
  update(slug: string, redirect: Partial<DynamicRedirect>): Promise<DynamicRedirect | null>;
  incrementClicks(slug: string): Promise<void>;
  deleteBySlug(slug: string): Promise<boolean>;
}
