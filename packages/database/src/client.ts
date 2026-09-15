import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from './schema/index.js';

// Load root or local .env
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
dotenv.config();

export function sanitizeErrorMessage(msg: string): string {
  if (!msg) return 'Erro desconhecido';
  return msg
    .replace(/postgres(?:ql)?:\/\/[^@]+@/gi, 'postgresql://***:***@')
    .replace(/password=[^\s&]+/gi, 'password=***');
}

export function getDatabaseUrl(): string {
  const rawUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres';
  const cleanUrl = rawUrl.replace(/([?&])sslmode=[^&]+(&|$)/, '$1').replace(/[?&]$/, '');
  const supabaseDirectRegex = /postgres(?:ql)?:\/\/([^:]+):([^@]+)@db\.([a-z0-9]+)\.supabase\.co(?::5432)?\/([^?]+)/;
  const match = cleanUrl.match(supabaseDirectRegex);
  if (match) {
    const [, user, pass, projectRef, dbName] = match;
    const poolerUser = user.includes('.') ? user : `${user}.${projectRef}`;
    return `postgresql://${poolerUser}:${pass}@aws-0-sa-east-1.pooler.supabase.com:6543/${dbName}`;
  }
  return cleanUrl;
}

let poolInstance: pg.Pool | null = null;

export function getPool(): pg.Pool {
  if (!poolInstance) {
    const connStr = getDatabaseUrl();
    const isLocalhost = connStr.includes('localhost') || connStr.includes('127.0.0.1');

    poolInstance = new pg.Pool({
      connectionString: connStr,
      ssl: isLocalhost ? false : { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 10000,
    });

    poolInstance.on('error', (err) => {
      console.error('[DB Pool Error]:', sanitizeErrorMessage(err.message));
    });
  }
  return poolInstance;
}

export const pool = {
  get client() {
    return getPool();
  },
  query: (text: string, params?: any[]) => getPool().query(text, params),
};

export const db: NodePgDatabase<typeof schema> = drizzle(getPool(), { schema });

export async function seedDefaultTemplates() {
  try {
    const defaultSvg1 = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1600" width="1200" height="1600">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#090d16" />
      <stop offset="50%" stop-color="#111827" />
      <stop offset="100%" stop-color="#030712" />
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#fbbf24" />
      <stop offset="50%" stop-color="#f59e0b" />
      <stop offset="100%" stop-color="#d97706" />
    </linearGradient>
  </defs>
  <rect width="1200" height="1600" rx="48" fill="url(#bgGrad)" />
  <rect x="24" y="24" width="1152" height="1552" rx="36" fill="none" stroke="url(#goldGrad)" stroke-width="4" opacity="0.6" />
  <circle cx="600" cy="140" r="48" fill="#1f2937" stroke="url(#goldGrad)" stroke-width="3" />
  <path d="M600 115 L608 132 L627 134 L613 147 L617 165 L600 156 L583 165 L587 147 L573 134 L592 132 Z" fill="#f59e0b" />
  <text x="600" y="320" text-anchor="middle" font-family="'Helvetica Neue', Arial, sans-serif" font-weight="800" font-size="52" fill="#ffffff">SUA OPINIÃO IMPORTA</text>
  <text x="600" y="375" text-anchor="middle" font-family="'Helvetica Neue', Arial, sans-serif" font-weight="500" font-size="28" fill="#9ca3af">AVALIE NOSSO ATENDIMENTO NO GOOGLE</text>
  <rect x="350" y="460" width="500" height="500" rx="32" fill="#ffffff" />
  <rect x="280" y="1020" width="640" height="120" rx="60" fill="#1e293b" stroke="#334155" stroke-width="2" />
  <text x="600" y="1090" text-anchor="middle" font-family="'Helvetica Neue', Arial, sans-serif" font-weight="700" font-size="26" fill="#38bdf8">APROXIME SEU CELULAR (NFC)</text>
</svg>
`)}`;

    const defaultSvg2 = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1600" width="1200" height="1600">
  <defs>
    <linearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#1e293b" />
    </linearGradient>
  </defs>
  <rect width="1200" height="1600" rx="40" fill="url(#blueGrad)" />
  <rect x="30" y="30" width="1140" height="1540" rx="30" fill="none" stroke="#3b82f6" stroke-width="4" opacity="0.4" />
  <text x="600" y="280" text-anchor="middle" font-family="'Helvetica Neue', Arial, sans-serif" font-weight="800" font-size="56" fill="#ffffff">CARDÁPIO DIGITAL &amp; PIX</text>
  <text x="600" y="340" text-anchor="middle" font-family="'Helvetica Neue', Arial, sans-serif" font-weight="500" font-size="26" fill="#94a3b8">ACESSE O CARDÁPIO OU PAGUE A CONTA</text>
  <rect x="350" y="440" width="500" height="500" rx="28" fill="#ffffff" />
  <rect x="260" y="1020" width="680" height="110" rx="55" fill="#1e293b" stroke="#3b82f6" stroke-width="2" />
  <text x="600" y="1085" text-anchor="middle" font-family="'Helvetica Neue', Arial, sans-serif" font-weight="700" font-size="24" fill="#60a5fa">APROXIME PARA ABRIR</text>
</svg>
`)}`;

    await db
      .insert(schema.templates)
      .values([
        {
          id: 'tmpl-google-gold',
          name: 'Placa Acrílica Black & Gold - Google Reviews',
          description: 'Template premium para mesas de restaurantes e balcões com chamada para avaliação 5 estrelas.',
          background_url: defaultSvg1,
          background_width: '1200',
          background_height: '1600',
          qr_x: '380',
          qr_y: '490',
          qr_size: '440',
          width_mm: '100',
          height_mm: '150',
          qr_x_mm: '25',
          qr_y_mm: '45',
          qr_size_mm: '50',
          badge_color: '#fbbf24',
        },
        {
          id: 'tmpl-menu-pix',
          name: 'Totem Minimalista Mesa - Cardápio & Pix',
          description: 'Design limpo e claro com moldura reforçada para leitura rápida de pedidos e chave Pix.',
          background_url: defaultSvg2,
          background_width: '1200',
          background_height: '1600',
          qr_x: '380',
          qr_y: '470',
          qr_size: '440',
          width_mm: '100',
          height_mm: '150',
          qr_x_mm: '25',
          qr_y_mm: '45',
          qr_size_mm: '50',
          badge_color: '#2563eb',
        },
      ])
      .onConflictDoNothing();
  } catch (err: any) {
    console.error('[Template Seed Warning]:', sanitizeErrorMessage(err.message));
  }
}
