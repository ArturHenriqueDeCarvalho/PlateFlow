import { eq, desc } from 'drizzle-orm';
import { db, plates } from '@plateflow/database';
import type { IPlateRepository } from '../../core/repositories/IPlateRepository.js';
import type { PhysicalPlate } from '../../core/entities/index.js';

export class DrizzlePlateRepository implements IPlateRepository {
  async findAll(): Promise<PhysicalPlate[]> {
    const rows = await db.select().from(plates).orderBy(desc(plates.created_at));
    return rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      templateId: r.template_id,
      batchIdentifier: r.batch_identifier,
      plateNumber: r.plate_number,
      customerNotes: r.customer_notes || '',
      nfcWritten: r.nfc_written,
      createdAt: r.created_at ? r.created_at.toISOString() : new Date().toISOString(),
    }));
  }

  async findById(id: string): Promise<PhysicalPlate | null> {
    const rows = await db.select().from(plates).where(eq(plates.id, id)).limit(1);
    if (!rows.length) return null;
    const r = rows[0];
    return {
      id: r.id,
      slug: r.slug,
      templateId: r.template_id,
      batchIdentifier: r.batch_identifier,
      plateNumber: r.plate_number,
      customerNotes: r.customer_notes || '',
      nfcWritten: r.nfc_written,
      createdAt: r.created_at ? r.created_at.toISOString() : new Date().toISOString(),
    };
  }

  async findBySlug(slug: string): Promise<PhysicalPlate | null> {
    const rows = await db.select().from(plates).where(eq(plates.slug, slug)).limit(1);
    if (!rows.length) return null;
    const r = rows[0];
    return {
      id: r.id,
      slug: r.slug,
      templateId: r.template_id,
      batchIdentifier: r.batch_identifier,
      plateNumber: r.plate_number,
      customerNotes: r.customer_notes || '',
      nfcWritten: r.nfc_written,
      createdAt: r.created_at ? r.created_at.toISOString() : new Date().toISOString(),
    };
  }

  async createBatch(plateList: PhysicalPlate[]): Promise<PhysicalPlate[]> {
    if (!plateList.length) return [];
    const values = plateList.map((p) => ({
      id: p.id,
      slug: p.slug,
      template_id: p.templateId,
      batch_identifier: p.batchIdentifier,
      plate_number: p.plateNumber,
      customer_notes: p.customerNotes,
      nfc_written: p.nfcWritten ?? false,
      created_at: p.createdAt ? new Date(p.createdAt) : new Date(),
      updated_at: new Date(),
    }));

    const rows = await db.insert(plates).values(values).returning();
    return rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      templateId: r.template_id,
      batchIdentifier: r.batch_identifier,
      plateNumber: r.plate_number,
      customerNotes: r.customer_notes || '',
      nfcWritten: r.nfc_written,
      createdAt: r.created_at ? r.created_at.toISOString() : new Date().toISOString(),
    }));
  }

  async update(id: string, updates: Partial<PhysicalPlate>): Promise<PhysicalPlate | null> {
    const patch: Partial<typeof plates.$inferInsert> = {
      updated_at: new Date(),
    };
    if (updates.customerNotes !== undefined) patch.customer_notes = updates.customerNotes;
    if (updates.nfcWritten !== undefined) patch.nfc_written = updates.nfcWritten;
    if (updates.templateId !== undefined) patch.template_id = updates.templateId;

    const rows = await db.update(plates).set(patch).where(eq(plates.id, id)).returning();
    if (!rows.length) return null;
    const r = rows[0];
    return {
      id: r.id,
      slug: r.slug,
      templateId: r.template_id,
      batchIdentifier: r.batch_identifier,
      plateNumber: r.plate_number,
      customerNotes: r.customer_notes || '',
      nfcWritten: r.nfc_written,
      createdAt: r.created_at ? r.created_at.toISOString() : new Date().toISOString(),
    };
  }

  async delete(id: string): Promise<boolean> {
    const res = await db.delete(plates).where(eq(plates.id, id)).returning();
    return res.length > 0;
  }
}
