import { db, templates, eq, desc, sql } from '@plateflow/database';
import type { ITemplateRepository } from '../../core/repositories/ITemplateRepository.js';
import type { PlateTemplate } from '../../core/entities/index.js';

export class DrizzleTemplateRepository implements ITemplateRepository {
  async findAll(): Promise<PlateTemplate[]> {
    const rows = await db.select().from(templates).orderBy(desc(templates.created_at));
    return rows.map((r) => this.mapRow(r));
  }

  async findById(id: string): Promise<PlateTemplate | null> {
    const rows = await db.select().from(templates).where(eq(templates.id, id)).limit(1);
    if (!rows.length) return null;
    return this.mapRow(rows[0]);
  }

  async create(templateData: PlateTemplate): Promise<PlateTemplate> {
    const values: typeof templates.$inferInsert = {
      id: templateData.id,
      name: templateData.name,
      description: templateData.description || '',
      background_url: templateData.backgroundUrl,
      background_width: String(templateData.backgroundWidth || 1200),
      background_height: String(templateData.backgroundHeight || 1600),
      qr_x: String(templateData.qrX || 380),
      qr_y: String(templateData.qrY || 490),
      qr_size: String(templateData.qrSize || 440),
      width_mm: templateData.widthMm ? String(templateData.widthMm) : '100',
      height_mm: templateData.heightMm ? String(templateData.heightMm) : '150',
      qr_x_mm: templateData.qrXMm ? String(templateData.qrXMm) : '25',
      qr_y_mm: templateData.qrYMm ? String(templateData.qrYMm) : '45',
      qr_size_mm: templateData.qrSizeMm ? String(templateData.qrSizeMm) : '50',
      badge_color: templateData.badgeColor || '#fbbf24',
      badge_text: templateData.badgeText || '',
      custom_notes: templateData.customNotes || '',
      created_at: templateData.createdAt ? new Date(templateData.createdAt) : new Date(),
      updated_at: new Date(),
    };

    const rows = await db
      .insert(templates)
      .values(values)
      .onConflictDoUpdate({
        target: templates.id,
        set: {
          name: sql`excluded.name`,
          description: sql`excluded.description`,
          background_url: sql`excluded.background_url`,
          background_width: sql`excluded.background_width`,
          background_height: sql`excluded.background_height`,
          qr_x: sql`excluded.qr_x`,
          qr_y: sql`excluded.qr_y`,
          qr_size: sql`excluded.qr_size`,
          width_mm: sql`excluded.width_mm`,
          height_mm: sql`excluded.height_mm`,
          qr_x_mm: sql`excluded.qr_x_mm`,
          qr_y_mm: sql`excluded.qr_y_mm`,
          qr_size_mm: sql`excluded.qr_size_mm`,
          badge_color: sql`excluded.badge_color`,
          badge_text: sql`excluded.badge_text`,
          custom_notes: sql`excluded.custom_notes`,
          updated_at: sql`now()`,
        },
      })
      .returning();
    return this.mapRow(rows[0]);
  }

  async delete(id: string): Promise<boolean> {
    const res = await db.delete(templates).where(eq(templates.id, id)).returning();
    return res.length > 0;
  }

  private mapRow(r: typeof templates.$inferSelect): PlateTemplate {
    return {
      id: r.id,
      name: r.name,
      description: r.description || '',
      backgroundUrl: r.background_url,
      backgroundWidth: Number(r.background_width) || 1200,
      backgroundHeight: Number(r.background_height) || 1600,
      qrX: Number(r.qr_x) || 380,
      qrY: Number(r.qr_y) || 490,
      qrSize: Number(r.qr_size) || 440,
      widthMm: r.width_mm ? Number(r.width_mm) : undefined,
      heightMm: r.height_mm ? Number(r.height_mm) : undefined,
      qrXMm: r.qr_x_mm ? Number(r.qr_x_mm) : undefined,
      qrYMm: r.qr_y_mm ? Number(r.qr_y_mm) : undefined,
      qrSizeMm: r.qr_size_mm ? Number(r.qr_size_mm) : undefined,
      badgeColor: r.badge_color || undefined,
      badgeText: r.badge_text || undefined,
      customNotes: r.custom_notes || undefined,
      createdAt: r.created_at ? r.created_at.toISOString() : new Date().toISOString(),
      updatedAt: r.updated_at ? r.updated_at.toISOString() : undefined,
    };
  }
}
