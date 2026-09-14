import type { PlateTemplate } from '../entities/index.js';

export interface ITemplateRepository {
  findAll(): Promise<PlateTemplate[]>;
  findById(id: string): Promise<PlateTemplate | null>;
  create(template: PlateTemplate): Promise<PlateTemplate>;
  delete(id: string): Promise<boolean>;
}
