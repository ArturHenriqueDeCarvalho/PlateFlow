import type { IAnalyticsRepository } from '../../repositories/IAnalyticsRepository.js';
import type { AnalyticsLog } from '../../entities/index.js';

export class GetAnalyticsUseCase {
  constructor(private analyticsRepo: IAnalyticsRepository) {}

  async execute(limit = 200): Promise<AnalyticsLog[]> {
    return this.analyticsRepo.findAll(limit);
  }
}
