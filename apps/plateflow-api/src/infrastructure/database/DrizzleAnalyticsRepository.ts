import { db, analytics, eq, desc } from '@plateflow/database';
import type { IAnalyticsRepository } from '../../core/repositories/IAnalyticsRepository.js';
import type { AnalyticsLog } from '../../core/entities/index.js';

export class DrizzleAnalyticsRepository implements IAnalyticsRepository {
  async findAll(limit = 200): Promise<AnalyticsLog[]> {
    const rows = await db.select().from(analytics).orderBy(desc(analytics.timestamp)).limit(limit);
    return rows.map((r) => this.mapRow(r));
  }

  async findBySlug(slug: string): Promise<AnalyticsLog[]> {
    const rows = await db
      .select()
      .from(analytics)
      .where(eq(analytics.redirect_slug, slug))
      .orderBy(desc(analytics.timestamp));
    return rows.map((r) => this.mapRow(r));
  }

  async create(log: AnalyticsLog): Promise<AnalyticsLog> {
    const values: typeof analytics.$inferInsert = {
      id: log.id || `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      redirect_slug: log.redirectSlug || log.slug || '',
      source: log.source || 'qr',
      referrer: log.referrer || 'Direto / Desconhecido',
      user_agent: log.userAgent || '',
      device_type: log.deviceType || log.device || 'Outro',
      browser: log.browser || '',
      os: log.os || '',
      ip: log.ip || '',
      timestamp: log.timestamp ? new Date(log.timestamp) : new Date(),
    };

    const rows = await db.insert(analytics).values(values).returning();
    return this.mapRow(rows[0]);
  }

  private mapRow(r: typeof analytics.$inferSelect): AnalyticsLog {
    return {
      id: r.id,
      slug: r.redirect_slug,
      redirectSlug: r.redirect_slug,
      source: (r.source as 'qr' | 'nfc' | 'manual') || 'qr',
      referrer: r.referrer || 'Direto / Desconhecido',
      userAgent: r.user_agent || '',
      device: (r.device_type as any) || 'Outro',
      deviceType: (r.device_type as any) || 'Outro',
      browser: r.browser || '',
      os: r.os || '',
      ip: r.ip || '',
      timestamp: r.timestamp ? r.timestamp.toISOString() : new Date().toISOString(),
    };
  }
}
