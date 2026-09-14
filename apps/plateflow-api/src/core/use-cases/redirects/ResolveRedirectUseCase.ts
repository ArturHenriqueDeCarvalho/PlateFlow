import type { IRedirectRepository } from '../../repositories/IRedirectRepository.js';
import type { IAnalyticsRepository } from '../../repositories/IAnalyticsRepository.js';
import type { DynamicRedirect, AnalyticsLog } from '../../entities/index.js';

export class ResolveRedirectUseCase {
  constructor(
    private redirectRepo: IRedirectRepository,
    private analyticsRepo: IAnalyticsRepository
  ) {}

  async execute(slug: string, logMeta?: Partial<AnalyticsLog>): Promise<DynamicRedirect | null> {
    const redirect = await this.redirectRepo.findBySlug(slug);
    if (!redirect) return null;

    // Asynchronously log analytics and increment clicks without blocking resolution
    this.redirectRepo.incrementClicks(slug).catch((err) => {
      console.error('[Clicks Increment Error]:', err.message);
    });

    if (logMeta) {
      this.analyticsRepo
        .create({
          id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          redirectSlug: slug,
          timestamp: new Date().toISOString(),
          source: logMeta.source || 'qr',
          referrer: logMeta.referrer || 'Direto / Desconhecido',
          userAgent: logMeta.userAgent || '',
          deviceType: logMeta.deviceType || 'Outro',
          browser: logMeta.browser || '',
          os: logMeta.os || '',
          ip: logMeta.ip || '',
        })
        .catch((err) => {
          console.error('[Analytics Log Error]:', err.message);
        });
    }

    return redirect;
  }
}
