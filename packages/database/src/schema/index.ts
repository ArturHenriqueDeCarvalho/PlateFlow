import { pgTable, text, numeric, integer, boolean, timestamp, jsonb } from 'drizzle-orm/pg-core';
import type { DynamicRedirectMetadata } from '@plateflow/types';

export const templates = pgTable('templates', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  background_url: text('background_url').notNull(),
  background_width: numeric('background_width').notNull(),
  background_height: numeric('background_height').notNull(),
  qr_x: numeric('qr_x').notNull(),
  qr_y: numeric('qr_y').notNull(),
  qr_size: numeric('qr_size').notNull(),
  width_mm: numeric('width_mm'),
  height_mm: numeric('height_mm'),
  qr_x_mm: numeric('qr_x_mm'),
  qr_y_mm: numeric('qr_y_mm'),
  qr_size_mm: numeric('qr_size_mm'),
  badge_color: text('badge_color'),
  badge_text: text('badge_text'),
  qr_color: text('qr_color'),
  qr_bg_color: text('qr_bg_color'),
  qr_error_correction_level: text('qr_error_correction_level'),
  custom_notes: text('custom_notes'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const redirects = pgTable('redirects', {
  id: text('id').primaryKey(),
  slug: text('slug').unique().notNull(),
  plate_id: text('plate_id'),
  destination_url: text('destination_url').notNull(),
  redirect_type: text('redirect_type').default('url').notNull(),
  status: text('status').default('virgin').notNull(),
  title: text('title').notNull(),
  clicks: integer('clicks').default(0).notNull(),
  last_accessed: timestamp('last_accessed', { withTimezone: true }),
  metadata: jsonb('metadata').$type<DynamicRedirectMetadata>().default({}).notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const plates = pgTable('plates', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull(),
  batch_identifier: text('batch_identifier').notNull(),
  template_id: text('template_id').notNull(),
  plate_number: integer('plate_number').notNull(),
  customer_notes: text('customer_notes'),
  nfc_written: boolean('nfc_written').default(false).notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const analytics = pgTable('analytics', {
  id: text('id').primaryKey(),
  redirect_slug: text('redirect_slug').notNull(),
  source: text('source').default('qr'),
  referrer: text('referrer'),
  user_agent: text('user_agent'),
  device_type: text('device_type'),
  browser: text('browser'),
  os: text('os'),
  ip: text('ip'),
  timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow(),
});

export type TemplateSelect = typeof templates.$inferSelect;
export type TemplateInsert = typeof templates.$inferInsert;
export type RedirectSelect = typeof redirects.$inferSelect;
export type RedirectInsert = typeof redirects.$inferInsert;
export type PlateSelect = typeof plates.$inferSelect;
export type PlateInsert = typeof plates.$inferInsert;
export type AnalyticsSelect = typeof analytics.$inferSelect;
export type AnalyticsInsert = typeof analytics.$inferInsert;
