import type { AnalyticsLog } from '../entities/index.js';

export interface IAnalyticsRepository {
  findAll(limit?: number): Promise<AnalyticsLog[]>;
  findBySlug(slug: string): Promise<AnalyticsLog[]>;
  create(log: AnalyticsLog): Promise<AnalyticsLog>;
}
