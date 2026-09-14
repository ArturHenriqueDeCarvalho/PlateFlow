import type { IAnalyticsRepository } from '../../repositories/IAnalyticsRepository.js';
import type { AnalyticsLog } from '../../entities/index.js';

export class LogAnalyticsUseCase {
  constructor(private analyticsRepo: IAnalyticsRepository) {}

  async execute(log: AnalyticsLog): Promise<AnalyticsLog> {
    return this.analyticsRepo.create(log);
  }
}
