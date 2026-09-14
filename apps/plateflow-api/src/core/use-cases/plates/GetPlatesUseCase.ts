import type { IPlateRepository } from '../../repositories/IPlateRepository.js';
import type { PhysicalPlate } from '../../entities/index.js';

export class GetPlatesUseCase {
  constructor(private plateRepo: IPlateRepository) {}

  async execute(): Promise<PhysicalPlate[]> {
    return this.plateRepo.findAll();
  }
}
