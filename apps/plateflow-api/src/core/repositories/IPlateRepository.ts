import type { PhysicalPlate } from '../entities/index.js';

export interface IPlateRepository {
  findAll(): Promise<PhysicalPlate[]>;
  findById(id: string): Promise<PhysicalPlate | null>;
  findBySlug(slug: string): Promise<PhysicalPlate | null>;
  createBatch(plates: PhysicalPlate[]): Promise<PhysicalPlate[]>;
  update(id: string, plate: Partial<PhysicalPlate>): Promise<PhysicalPlate | null>;
  delete(id: string): Promise<boolean>;
}
