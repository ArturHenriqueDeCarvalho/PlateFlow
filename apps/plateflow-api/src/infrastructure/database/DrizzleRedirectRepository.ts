import { db, redirects, eq, desc, sql } from '@plateflow/database';
import type { IRedirectRepository } from '../../core/repositories/IRedirectRepository.js';
import type { DynamicRedirect, RedirectType, RedirectStatus } from '../../core/entities/index.js';

export class DrizzleRedirectRepository implements IRedirectRepository {
  async findAll(): Promise<DynamicRedirect[]> {
    const rows = await db.select().from(redirects).orderBy(desc(redirects.created_at));
    return rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      type: (r.redirect_type as RedirectType) || 'url',
      title: r.title,
      destinationUrl: r.destination_url,
      status: (r.status as RedirectStatus) || 'virgin',
      clicks: r.clicks,
      metadata: r.metadata || {},
      createdAt: r.created_at ? r.created_at.toISOString() : new Date().toISOString(),
      updatedAt: r.updated_at ? r.updated_at.toISOString() : new Date().toISOString(),
    }));
  }

  async findBySlug(slug: string): Promise<DynamicRedirect | null> {
    const rows = await db.select().from(redirects).where(eq(redirects.slug, slug)).limit(1);
    if (!rows.length) return null;
    const r = rows[0];
    return {
      id: r.id,
      slug: r.slug,
      type: (r.redirect_type as RedirectType) || 'url',
      title: r.title,
      destinationUrl: r.destination_url,
      status: (r.status as RedirectStatus) || 'virgin',
      clicks: r.clicks,
      metadata: r.metadata || {},
      createdAt: r.created_at ? r.created_at.toISOString() : new Date().toISOString(),
      updatedAt: r.updated_at ? r.updated_at.toISOString() : new Date().toISOString(),
    };
  }

  async createBatch(redirectList: DynamicRedirect[]): Promise<DynamicRedirect[]> {
    if (!redirectList.length) return [];
    const values = redirectList.map((r) => ({
      id: r.id || `redir-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      slug: r.slug,
      destination_url: r.destinationUrl || '',
      redirect_type: r.type || 'url',
      status: r.status || 'virgin',
      title: r.title || 'Redirecionamento',
      clicks: r.clicks || 0,
      metadata: r.metadata || {},
      created_at: r.createdAt ? new Date(r.createdAt) : new Date(),
      updated_at: new Date(),
    }));

    const rows = await db.insert(redirects).values(values).returning();
    return rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      type: (r.redirect_type as RedirectType) || 'url',
      title: r.title,
      destinationUrl: r.destination_url,
      status: (r.status as RedirectStatus) || 'virgin',
      clicks: r.clicks,
      metadata: r.metadata || {},
      createdAt: r.created_at ? r.created_at.toISOString() : new Date().toISOString(),
      updatedAt: r.updated_at ? r.updated_at.toISOString() : new Date().toISOString(),
    }));
  }

  async update(slug: string, updates: Partial<DynamicRedirect>): Promise<DynamicRedirect | null> {
    const patch: Partial<typeof redirects.$inferInsert> = {
      updated_at: new Date(),
    };
    if (updates.title !== undefined) patch.title = updates.title;
    if (updates.destinationUrl !== undefined) patch.destination_url = updates.destinationUrl;
    if (updates.type !== undefined) patch.redirect_type = updates.type;
    if (updates.status !== undefined) patch.status = updates.status;
    if (updates.metadata !== undefined) patch.metadata = updates.metadata;

    const rows = await db.update(redirects).set(patch).where(eq(redirects.slug, slug)).returning();
    if (!rows.length) return null;
    const r = rows[0];
    return {
      id: r.id,
      slug: r.slug,
      type: (r.redirect_type as RedirectType) || 'url',
      title: r.title,
      destinationUrl: r.destination_url,
      status: (r.status as RedirectStatus) || 'virgin',
      clicks: r.clicks,
      metadata: r.metadata || {},
      createdAt: r.created_at ? r.created_at.toISOString() : new Date().toISOString(),
      updatedAt: r.updated_at ? r.updated_at.toISOString() : new Date().toISOString(),
    };
  }

  async incrementClicks(slug: string): Promise<void> {
    await db
      .update(redirects)
      .set({
        clicks: sql`${redirects.clicks} + 1`,
        last_accessed: new Date(),
      })
      .where(eq(redirects.slug, slug));
  }

  async deleteBySlug(slug: string): Promise<boolean> {
    const res = await db.delete(redirects).where(eq(redirects.slug, slug)).returning();
    return res.length > 0;
  }
}
