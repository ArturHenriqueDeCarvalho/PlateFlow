import express from 'express';
import crypto from 'crypto';
import pg from 'pg';

const app = express();

// 1. CORS headers for cross-origin or preview deployments
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// 2. Vercel serverless request body normalization
app.use((req, _res, next) => {
  if (req.body) {
    if (typeof req.body === 'string') {
      try {
        req.body = JSON.parse(req.body);
      } catch {
        // keep as is
      }
    }
    // Flag to prevent body-parser from re-reading an already consumed stream
    (req as any)._body = true;
  }
  next();
});

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// 3. Serverless route prefix normalization
app.use((req, _res, next) => {
  if (req.url && !req.url.startsWith('/api') && !req.url.startsWith('/r/')) {
    req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
  }
  next();
});

// ==========================================
// DATABASE & SERVERLESS POOL CONFIGURATION
// ==========================================
function getDatabaseUrl(): string | undefined {
  const rawUrl = process.env.DATABASE_URL;
  if (!rawUrl) return undefined;

  // Remove sslmode query param if present so ssl: { rejectUnauthorized: false } in pg.Pool takes precedence
  const cleanUrl = rawUrl.replace(/([?&])sslmode=[^&]+(&|$)/, '$1').replace(/[?&]$/, '');

  // If the URL uses direct Supabase host db.<ref>.supabase.co, adapt to IPv4 pooler
  // Vercel serverless functions (AWS Lambda) do not support IPv6-only outbound connections
  const supabaseDirectRegex = /postgres(?:ql)?:\/\/([^:]+):([^@]+)@db\.([a-z0-9]+)\.supabase\.co(?::5432)?\/([^?]+)/;
  const match = cleanUrl.match(supabaseDirectRegex);
  if (match) {
    const [, user, pass, projectRef, dbName] = match;
    const poolerUser = user.includes('.') ? user : `${user}.${projectRef}`;
    return `postgresql://${poolerUser}:${pass}@aws-0-sa-east-1.pooler.supabase.com:6543/${dbName}`;
  }

  return cleanUrl;
}

export function sanitizeErrorMessage(msg: string): string {
  if (!msg) return 'Erro desconhecido';
  return msg
    .replace(/postgres(?:ql)?:\/\/[^@]+@/gi, 'postgresql://***:***@')
    .replace(/password=[^\s&]+/gi, 'password=***');
}

let poolInstance: pg.Pool | null = null;

function getPool(): pg.Pool | null {
  const connStr = getDatabaseUrl();
  if (!connStr) return null;

  if (!poolInstance) {
    poolInstance = new pg.Pool({
      connectionString: connStr,
      ssl: { rejectUnauthorized: false },
      max: 1, // Single connection per serverless instance to prevent connection starvation
      idleTimeoutMillis: 5000,
      connectionTimeoutMillis: 4000,
    });
    poolInstance.on('error', (err) => {
      console.error('Erro de conexão com o banco:', sanitizeErrorMessage(err.message));
    });
  }
  return poolInstance;
}

export const pool = {
  query: (text: string, params?: any[]) => {
    const p = getPool();
    if (!p) throw new Error('DATABASE_URL não configurada no servidor.');
    return p.query(text, params);
  },
  connect: () => {
    const p = getPool();
    if (!p) throw new Error('DATABASE_URL não configurada no servidor.');
    return p.connect();
  },
};

// Admin Authentication Secret & credentials read EXCLUSIVELY from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'nfc-qr-pro-super-secret-key-2026';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

function generateToken(payload: { email: string; role: string }) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(
    JSON.stringify({
      ...payload,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30, // 30 days
    })
  ).toString('base64url');
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${body}`)
    .digest('base64url');
  return `${header}.${body}.${signature}`;
}

function verifyToken(token: string) {
  try {
    const [header, body, signature] = token.split('.');
    if (!header || !body || !signature) return null;
    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${header}.${body}`)
      .digest('base64url');
    if (signature !== expectedSignature) return null;
    const decoded = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) return null;
    return decoded;
  } catch {
    return null;
  }
}

// Auto-seed default templates if not present
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
  <text x="600" y="280" text-anchor="middle" font-family="'Helvetica Neue', Arial, sans-serif" font-weight="800" font-size="56" fill="#ffffff">CARDÁPIO DIGITAL & PIX</text>
  <text x="600" y="340" text-anchor="middle" font-family="'Helvetica Neue', Arial, sans-serif" font-weight="500" font-size="26" fill="#94a3b8">ACESSE O CARDÁPIO OU PAGUE A CONTA</text>
  <rect x="350" y="440" width="500" height="500" rx="28" fill="#ffffff" />
  <rect x="260" y="1020" width="680" height="110" rx="55" fill="#1e293b" stroke="#3b82f6" stroke-width="2" />
  <text x="600" y="1085" text-anchor="middle" font-family="'Helvetica Neue', Arial, sans-serif" font-weight="700" font-size="24" fill="#60a5fa">APROXIME PARA ABRIR</text>
</svg>
`)}`;

    await pool.query(
      `INSERT INTO templates (
        id, name, description, width_mm, height_mm, qr_x_mm, qr_y_mm, qr_size_mm,
        background_width, background_height, qr_x, qr_y, qr_size, badge_color, background_url
      ) VALUES 
      ($1, $2, $3, 100, 150, 25, 45, 50, 1200, 1600, 380, 490, 440, '#fbbf24', $4),
      ($5, $6, $7, 100, 150, 25, 45, 50, 1200, 1600, 380, 470, 440, '#2563eb', $8)
      ON CONFLICT (id) DO NOTHING`,
      [
        'tmpl-google-gold',
        'Placa Acrílica Black & Gold - Google Reviews',
        'Template premium para mesas de restaurantes e balcões com chamada para avaliação 5 estrelas.',
        defaultSvg1,
        'tmpl-menu-pix',
        'Totem Minimalista Mesa - Cardápio & Pix',
        'Design limpo e claro com moldura reforçada para leitura rápida de pedidos e chave Pix.',
        defaultSvg2,
      ]
    );
  } catch (err: any) {
    console.error('Error checking/seeding templates:', err.message);
  }
}

// ==========================================
// 1. HEALTH & SYSTEM ENDPOINTS
// ==========================================
app.get('/api/health', async (_req, res) => {
  try {
    const dbRes = await pool.query('SELECT NOW()');
    res.json({
      status: 'ok',
      database: 'connected',
      timestamp: dbRes.rows[0].now,
    });
  } catch (err: any) {
    res.status(500).json({ status: 'error', database: sanitizeErrorMessage(err.message) });
  }
});

// ==========================================
// 2. AUTHENTICATION (SUPABASE AUTH / ADMIN)
// ==========================================
app.post(['/api/auth/login', '/auth/login'], async (req, res) => {
  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    }
    const email = body?.email;
    const password = body?.password;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanPassword = String(password);

    // Validação estrita lendo EXCLUSIVAMENTE de process.env
    const isMasterAdmin =
      Boolean(ADMIN_EMAIL) &&
      Boolean(ADMIN_PASSWORD) &&
      cleanEmail === ADMIN_EMAIL!.trim().toLowerCase() &&
      cleanPassword === ADMIN_PASSWORD!;

    if (isMasterAdmin) {
      const token = generateToken({ email: cleanEmail, role: 'admin' });
      return res.json({
        success: true,
        token,
        user: {
          email: cleanEmail,
          role: 'admin',
          name: 'Administrador Pro',
        },
      });
    }

    // Fallback: Check if user exists in auth.users in Supabase (if created via Supabase dashboard)
    try {
      const authRes = await pool.query(
        'SELECT id, email FROM auth.users WHERE email = $1 LIMIT 1',
        [cleanEmail]
      );
      if (authRes.rows.length > 0 && ADMIN_PASSWORD && cleanPassword === ADMIN_PASSWORD) {
        const token = generateToken({ email: authRes.rows[0].email, role: 'admin' });
        return res.json({
          success: true,
          token,
          user: {
            email: authRes.rows[0].email,
            role: 'admin',
            name: authRes.rows[0].email.split('@')[0],
          },
        });
      }
    } catch (dbErr: any) {
      console.error('Erro de consulta auth.users:', sanitizeErrorMessage(dbErr?.message || 'Falha de conexão'));
    }

    return res.status(401).json({ error: 'Credenciais inválidas. Verifique o email e senha digitados.' });
  } catch (err: any) {
    return res.status(500).json({
      error: 'Erro interno durante autenticação: ' + sanitizeErrorMessage(err?.message || 'Erro desconhecido'),
    });
  }
});

app.get(['/api/auth/me', '/auth/me'], (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ authenticated: false });
    }
    const token = authHeader.substring(7);
    const user = verifyToken(token);
    if (!user) {
      return res.status(401).json({ authenticated: false });
    }
    return res.json({ authenticated: true, user });
  } catch (err: any) {
    return res.status(500).json({ authenticated: false, error: err.message });
  }
});

// ==========================================
// 3. TEMPLATES ENDPOINTS
// ==========================================
app.get('/api/templates', async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM templates ORDER BY created_at ASC');
    const templates = result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description || '',
      widthMm: parseFloat(row.width_mm || 100),
      heightMm: parseFloat(row.height_mm || 150),
      qrXMm: parseFloat(row.qr_x_mm || 25),
      qrYMm: parseFloat(row.qr_y_mm || 45),
      qrSizeMm: parseFloat(row.qr_size_mm || 50),
      backgroundWidth: parseFloat(row.background_width || row.width_mm || 1200),
      backgroundHeight: parseFloat(row.background_height || row.height_mm || 1600),
      qrX: parseFloat(row.qr_x || row.qr_x_mm || 380),
      qrY: parseFloat(row.qr_y || row.qr_y_mm || 490),
      qrSize: parseFloat(row.qr_size || row.qr_size_mm || 440),
      badgeColor: row.badge_color || '#fbbf24',
      qrColor: row.qr_color || '#0f172a',
      qrBgColor: row.qr_bg_color || '#ffffff',
      qrErrorCorrectionLevel: row.qr_error_correction_level || 'H',
      badgeText: row.badge_text || '',
      customNotes: row.custom_notes || '',
      backgroundUrl: row.background_url || null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
    res.json(templates);
  } catch (err: any) {
    res.status(500).json({ error: sanitizeErrorMessage(err.message) });
  }
});

app.post('/api/templates', async (req, res) => {
  try {
    const t = req.body;
    const bgWidth = t.backgroundWidth || t.widthMm || 1200;
    const bgHeight = t.backgroundHeight || t.heightMm || 1600;
    const qX = t.qrX !== undefined ? t.qrX : t.qrXMm || 380;
    const qY = t.qrY !== undefined ? t.qrY : t.qrYMm || 490;
    const qSize = t.qrSize !== undefined ? t.qrSize : t.qrSizeMm || 440;

    const query = `
      INSERT INTO templates (
        id, name, description, width_mm, height_mm, qr_x_mm, qr_y_mm, qr_size_mm,
        background_width, background_height, qr_x, qr_y, qr_size, badge_color,
        qr_color, qr_bg_color, qr_error_correction_level, badge_text, custom_notes, background_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        background_width = EXCLUDED.background_width,
        background_height = EXCLUDED.background_height,
        qr_x = EXCLUDED.qr_x,
        qr_y = EXCLUDED.qr_y,
        qr_size = EXCLUDED.qr_size,
        badge_color = EXCLUDED.badge_color,
        background_url = EXCLUDED.background_url,
        updated_at = NOW()
      RETURNING *;
    `;
    const values = [
      t.id,
      t.name,
      t.description || '',
      t.widthMm || 100,
      t.heightMm || 150,
      t.qrXMm || 25,
      t.qrYMm || 45,
      t.qrSizeMm || 50,
      bgWidth,
      bgHeight,
      qX,
      qY,
      qSize,
      t.badgeColor || '#fbbf24',
      t.qrColor || '#000000',
      t.qrBgColor || '#FFFFFF',
      t.qrErrorCorrectionLevel || 'H',
      t.badgeText || '',
      t.customNotes || '',
      t.backgroundUrl || null,
    ];
    await pool.query(query, values);
    res.json({ success: true, template: t });
  } catch (err: any) {
    res.status(500).json({ error: sanitizeErrorMessage(err.message) });
  }
});

app.delete('/api/templates/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM templates WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: sanitizeErrorMessage(err.message) });
  }
});

// ==========================================
// 4. PLATES & REDIRECTS ENDPOINTS
// ==========================================
app.get('/api/plates', async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM plates ORDER BY created_at DESC');
    const plates = result.rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      batchIdentifier: row.batch_identifier,
      plateNumber: row.plate_number,
      templateId: row.template_id,
      nfcWritten: row.nfc_written,
      customerNotes: row.customer_notes || '',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
    res.json(plates);
  } catch (err: any) {
    res.status(500).json({ error: sanitizeErrorMessage(err.message) });
  }
});

app.get('/api/redirects', async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM redirects ORDER BY created_at DESC');
    const redirects = result.rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      plateId: row.plate_id,
      destinationUrl: row.destination_url,
      type: row.redirect_type,
      status: row.status,
      title: row.title,
      clicks: row.clicks || 0,
      lastAccessed: row.last_accessed,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      metadata: row.metadata || {},
    }));
    res.json(redirects);
  } catch (err: any) {
    res.status(500).json({ error: sanitizeErrorMessage(err.message) });
  }
});

// Batch generator creation in atomic transaction
app.post('/api/plates/batch', async (req, res) => {
  const { plates, redirects } = req.body;
  if (!Array.isArray(plates) || !Array.isArray(redirects)) {
    return res.status(400).json({ error: 'Dados de placas e redirecionamentos inválidos.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Fetch all valid template IDs in the database to prevent foreign key errors
    const validTemplatesRes = await client.query('SELECT id FROM templates');
    const validTemplateIds = new Set(validTemplatesRes.rows.map((r) => r.id));

    for (const plate of plates) {
      let finalTemplateId = plate.templateId;
      if (finalTemplateId && !validTemplateIds.has(finalTemplateId)) {
        // Fallback to null or existing template to prevent foreign key constraint violation
        finalTemplateId = validTemplateIds.size > 0 ? Array.from(validTemplateIds)[0] : null;
      }

      await client.query(
        `INSERT INTO plates (id, slug, batch_identifier, plate_number, template_id, nfc_written, customer_notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (slug) DO UPDATE SET
           batch_identifier = EXCLUDED.batch_identifier,
           plate_number = EXCLUDED.plate_number,
           template_id = EXCLUDED.template_id,
           customer_notes = EXCLUDED.customer_notes,
           updated_at = NOW()`,
        [
          plate.id || `plate-${plate.slug}`,
          plate.slug,
          plate.batchIdentifier || 'LOTE-PADRAO',
          plate.plateNumber || 1,
          finalTemplateId,
          plate.nfcWritten || false,
          plate.customerNotes || '',
        ]
      );
    }

    for (const red of redirects) {
      await client.query(
        `INSERT INTO redirects (id, slug, plate_id, destination_url, redirect_type, status, title, clicks, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (slug) DO UPDATE SET
           destination_url = EXCLUDED.destination_url,
           redirect_type = EXCLUDED.redirect_type,
           status = EXCLUDED.status,
           title = EXCLUDED.title,
           metadata = EXCLUDED.metadata,
           updated_at = NOW()`,
        [
          red.id || `red-${red.slug}`,
          red.slug,
          red.plateId || null,
          red.destinationUrl || '',
          red.type || 'url',
          red.status || 'virgin',
          red.title || `Placa #${red.slug}`,
          red.clicks || 0,
          JSON.stringify(red.metadata || {}),
        ]
      );
    }

    await client.query('COMMIT');
    res.json({ success: true, count: plates.length });
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: sanitizeErrorMessage(err.message) });
  } finally {
    client.release();
  }
});

// Update Plate (NFC written flag, notes, template)
app.put('/api/plates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nfcWritten, customerNotes, templateId } = req.body;
    const query = `
      UPDATE plates
      SET nfc_written = COALESCE($1, nfc_written),
          customer_notes = COALESCE($2, customer_notes),
          template_id = COALESCE($3, template_id),
          updated_at = NOW()
      WHERE id = $4
      RETURNING *;
    `;
    const result = await pool.query(query, [nfcWritten, customerNotes, templateId, id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Placa não encontrada.' });
    }
    res.json({ success: true, plate: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: sanitizeErrorMessage(err.message) });
  }
});

// Update Redirect (Destination URL, status, title, type)
app.put('/api/redirects/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const { destinationUrl, status, title, type, metadata } = req.body;
    const query = `
      UPDATE redirects
      SET destination_url = COALESCE($1, destination_url),
          status = COALESCE($2, status),
          title = COALESCE($3, title),
          redirect_type = COALESCE($4, redirect_type),
          metadata = COALESCE($5, metadata),
          updated_at = NOW()
      WHERE slug = $6
      RETURNING *;
    `;
    const result = await pool.query(query, [
      destinationUrl,
      status,
      title,
      type,
      metadata ? JSON.stringify(metadata) : null,
      slug,
    ]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Redirecionamento não encontrado.' });
    }
    res.json({ success: true, redirect: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: sanitizeErrorMessage(err.message) });
  }
});

// Delete Plate and associated Redirect
app.delete('/api/plates/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const plateRes = await client.query('SELECT slug FROM plates WHERE id = $1', [req.params.id]);
    if (plateRes.rows.length > 0) {
      const slug = plateRes.rows[0].slug;
      await client.query('DELETE FROM redirects WHERE slug = $1', [slug]);
    }
    await client.query('DELETE FROM plates WHERE id = $1', [req.params.id]);
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: sanitizeErrorMessage(err.message) });
  } finally {
    client.release();
  }
});

// ==========================================
// 5. ANALYTICS LOGS & REPORTING
// ==========================================
app.get('/api/analytics', async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM analytics ORDER BY timestamp DESC LIMIT 200');
    const logs = result.rows.map((row) => ({
      id: row.id,
      redirectSlug: row.redirect_slug,
      timestamp: row.timestamp,
      source: row.source,
      userAgent: row.user_agent,
      deviceType: row.device_type,
      browser: row.browser,
      os: row.os,
      ip: row.ip,
      referrer: row.referrer,
    }));
    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ error: sanitizeErrorMessage(err.message) });
  }
});

app.post('/api/analytics', async (req, res) => {
  try {
    const { redirectSlug, source, deviceType, browser, os, userAgent, referrer } = req.body;
    await pool.query(
      `INSERT INTO analytics (redirect_slug, source, device_type, browser, os, user_agent, referrer)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [redirectSlug, source || 'qr', deviceType, browser, os, userAgent, referrer]
    );
    await pool.query('UPDATE redirects SET clicks = clicks + 1, last_accessed = NOW() WHERE slug = $1', [
      redirectSlug,
    ]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: sanitizeErrorMessage(err.message) });
  }
});

// ==========================================
// 6. PRODUCTION FAST REDIRECT HANDLER (/r/:slug)
// ==========================================
app.get(['/r/:slug', '/api/r/:slug'], async (req, res) => {
  const { slug } = req.params;
  const userAgent = req.headers['user-agent'] || '';
  const referrer = (req.headers['referer'] || req.headers['referrer'] || '') as string;
  const source = req.query.src === 'nfc' ? 'nfc' : 'qr';

  // Basic device detection
  const isMobile = /Android|iPhone|iPad|iPod/i.test(userAgent);
  const isIOS = /iPhone|iPad|iPod/i.test(userAgent);
  const deviceType = isMobile ? (isIOS ? 'iOS' : 'Android') : 'Desktop';

  try {
    const result = await pool.query(
      'SELECT id, slug, destination_url, status, title FROM redirects WHERE slug = $1',
      [slug]
    );

    if (result.rows.length === 0) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Placa Não Encontrada</title>
          <style>
            body { font-family: sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; padding: 20px; text-align: center; }
            .box { background: #1e293b; border: 1px solid #334155; padding: 32px; border-radius: 16px; max-width: 400px; }
            h1 { font-size: 20px; color: #ef4444; margin-top: 0; }
            p { font-size: 14px; color: #94a3b8; }
            a { display: inline-block; margin-top: 16px; background: #6366f1; color: white; padding: 10px 20px; border-radius: 10px; text-decoration: none; font-size: 13px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="box">
            <h1>Placa não encontrada</h1>
            <p>O identificador <strong>${slug}</strong> não está cadastrado em nosso sistema.</p>
            <a href="/">Acessar Painel</a>
          </div>
        </body>
        </html>
      `);
    }

    const redirect = result.rows[0];

    // Check if plate is virgin
    if (redirect.status === 'virgin' || !redirect.destination_url) {
      return res.send(`
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Placa Virgem - Pronto para Vinculação</title>
          <style>
            body { font-family: sans-serif; background: #020617; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; }
            .box { background: #0f172a; border: 1px solid #1e293b; padding: 32px; border-radius: 20px; max-width: 440px; text-align: center; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); }
            .badge { display: inline-block; background: rgba(245, 158, 11, 0.1); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.2); padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: bold; margin-bottom: 16px; }
            h1 { font-size: 22px; font-weight: 800; margin: 0 0 8px; }
            p { font-size: 14px; color: #94a3b8; line-height: 1.5; margin-bottom: 24px; }
            .slug-card { background: #1e293b; border-radius: 12px; padding: 12px; font-family: monospace; font-size: 16px; color: #38bdf8; font-weight: bold; margin-bottom: 24px; }
            a.btn { display: block; background: #4f46e5; color: white; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-size: 14px; font-weight: bold; transition: 0.2s; }
            a.btn:hover { background: #4338ca; }
          </style>
        </head>
        <body>
          <div class="box">
            <span class="badge">PLACA VIRGEM</span>
            <h1>Pronta para ser Vinculada</h1>
            <p>Esta placa física já foi fabricada e programada via NFC/QR Code, mas ainda não possui um link de destino associado.</p>
            <div class="slug-card">slug: /r/${slug}</div>
            <a class="btn" href="/?activate=${slug}">Ativar no Painel de Controle</a>
          </div>
        </body>
        </html>
      `);
    }

    // Check if plate is paused
    if (redirect.status === 'paused') {
      return res.send(`
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Serviço Temporariamente Pausado</title>
          <style>
            body { font-family: sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; padding: 20px; text-align: center; }
            .box { background: #1e293b; border: 1px solid #334155; padding: 32px; border-radius: 16px; max-width: 400px; }
            h1 { font-size: 20px; color: #f59e0b; margin-top: 0; }
            p { font-size: 14px; color: #94a3b8; line-height: 1.5; }
          </style>
        </head>
        <body>
          <div class="box">
            <h1>Serviço Temporariamente Indisponível</h1>
            <p>Este cardápio ou serviço está temporariamente desativado pelo estabelecimento.</p>
          </div>
        </body>
        </html>
      `);
    }

    // Plate is ACTIVE: Log analytics asynchronously in background & redirect immediately with 307
    pool.query(
      `INSERT INTO analytics (redirect_slug, source, device_type, user_agent, referrer)
       VALUES ($1, $2, $3, $4, $5)`,
      [slug, source, deviceType, userAgent, referrer]
    ).catch((e) => console.error('Analytics log error:', e.message));

    pool.query(
      'UPDATE redirects SET clicks = clicks + 1, last_accessed = NOW() WHERE slug = $1',
      [slug]
    ).catch((e) => console.error('Clicks increment error:', e.message));

    // HTTP 307 Temporary Redirect: Fast, preserves query params, prevents browser permanent caching
    return res.redirect(307, redirect.destination_url);
  } catch (err: any) {
    console.error('Redirect handler error:', err.message);
    return res.status(500).send('Erro interno ao processar redirecionamento.');
  }
});

// Global Error Handler to guarantee JSON responses and prevent unhandled 500s
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Global application error:', err);
  if (res.headersSent) return;
  res.status(err.status || 500).json({
    error: err.message || 'Erro interno no servidor.',
    code: err.code || 'INTERNAL_ERROR',
  });
});

// ==========================================
// VERCEL SERVERLESS HANDLER
// ==========================================
export default function handler(req: any, res: any) {
  // Support rewritten paths (__route), custom headers, or default url
  const targetRoute = req.query?.__route || req.headers['x-forwarded-uri'];
  if (targetRoute && typeof targetRoute === 'string') {
    const [routePath, routeQuery] = targetRoute.split('?');
    const existingParams = new URLSearchParams(routeQuery || '');
    for (const [key, value] of Object.entries(req.query || {})) {
      if (key !== '__route' && typeof value === 'string') {
        existingParams.set(key, value);
      }
    }
    const fullQuery = existingParams.toString();
    req.url = fullQuery ? `${routePath}?${fullQuery}` : routePath;
  }
  return app(req, res);
}

export { app };
