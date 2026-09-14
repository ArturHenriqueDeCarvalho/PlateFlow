import pg from 'pg';

const passwords = ['Qr-code!1234', '[Qr-code!1234]'];
const host = 'db.yjwlyaaumicsjjspttuc.supabase.co';
const user = 'postgres';
const database = 'postgres';
const port = 5432;

async function testAndMigrate() {
  let connectedClient: pg.Client | null = null;

  for (const pwd of passwords) {
    console.log(`Trying connection with password variation...`);
    const client = new pg.Client({
      host,
      user,
      password: pwd,
      database,
      port,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
    });

    try {
      await client.connect();
      console.log(`Successfully connected with password!`);
      connectedClient = client;
      break;
    } catch (err: any) {
      console.error(`Failed with password: ${err.message}`);
    }
  }

  if (!connectedClient) {
    console.error('Could not connect with any password variation.');
    process.exit(1);
  }

  const schemaSQL = `
    -- Enable UUID extension if not enabled
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

    -- Templates Table
    CREATE TABLE IF NOT EXISTS templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      width_mm NUMERIC NOT NULL DEFAULT 100,
      height_mm NUMERIC NOT NULL DEFAULT 150,
      qr_x_mm NUMERIC NOT NULL DEFAULT 25,
      qr_y_mm NUMERIC NOT NULL DEFAULT 35,
      qr_size_mm NUMERIC NOT NULL DEFAULT 50,
      qr_color TEXT NOT NULL DEFAULT '#000000',
      qr_bg_color TEXT NOT NULL DEFAULT '#FFFFFF',
      qr_error_correction_level TEXT NOT NULL DEFAULT 'H',
      badge_text TEXT,
      custom_notes TEXT,
      background_url TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Physical Plates Table
    CREATE TABLE IF NOT EXISTS plates (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      batch_identifier TEXT NOT NULL,
      plate_number INTEGER NOT NULL,
      template_id TEXT REFERENCES templates(id) ON DELETE SET NULL,
      nfc_written BOOLEAN NOT NULL DEFAULT FALSE,
      customer_notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Dynamic Redirects Table
    CREATE TABLE IF NOT EXISTS redirects (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      plate_id TEXT,
      destination_url TEXT NOT NULL,
      redirect_type TEXT NOT NULL DEFAULT 'custom',
      status TEXT NOT NULL DEFAULT 'active',
      title TEXT NOT NULL,
      clicks INTEGER NOT NULL DEFAULT 0,
      last_accessed TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      metadata JSONB DEFAULT '{}'::jsonb
    );

    -- Analytics Logs Table
    CREATE TABLE IF NOT EXISTS analytics (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      redirect_slug TEXT NOT NULL,
      timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      source TEXT NOT NULL DEFAULT 'qr',
      user_agent TEXT,
      device_type TEXT,
      browser TEXT,
      os TEXT,
      ip TEXT,
      referrer TEXT
    );

    -- Templates Table columns enhancement
    ALTER TABLE templates ADD COLUMN IF NOT EXISTS background_width NUMERIC DEFAULT 1200;
    ALTER TABLE templates ADD COLUMN IF NOT EXISTS background_height NUMERIC DEFAULT 1600;
    ALTER TABLE templates ADD COLUMN IF NOT EXISTS qr_x NUMERIC DEFAULT 380;
    ALTER TABLE templates ADD COLUMN IF NOT EXISTS qr_y NUMERIC DEFAULT 490;
    ALTER TABLE templates ADD COLUMN IF NOT EXISTS qr_size NUMERIC DEFAULT 440;
    ALTER TABLE templates ADD COLUMN IF NOT EXISTS badge_color TEXT DEFAULT '#fbbf24';

    CREATE INDEX IF NOT EXISTS idx_plates_slug ON plates(slug);
    CREATE INDEX IF NOT EXISTS idx_redirects_slug ON redirects(slug);
    CREATE INDEX IF NOT EXISTS idx_analytics_slug ON analytics(redirect_slug);
    CREATE INDEX IF NOT EXISTS idx_analytics_timestamp ON analytics(timestamp);

    -- Enable RLS (Row Level Security) and add public read/write or authenticated policies
    ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
    ALTER TABLE plates ENABLE ROW LEVEL SECURITY;
    ALTER TABLE redirects ENABLE ROW LEVEL SECURITY;
    ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;

    -- Drop existing policies if any to ensure clean state
    DO $$ 
    BEGIN
      DROP POLICY IF EXISTS "Public access templates" ON templates;
      DROP POLICY IF EXISTS "Public access plates" ON plates;
      DROP POLICY IF EXISTS "Public access redirects" ON redirects;
      DROP POLICY IF EXISTS "Public access analytics" ON analytics;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END $$;

    -- Policies allowing app access (using anon key or authenticated users)
    CREATE POLICY "Public access templates" ON templates FOR ALL USING (true) WITH CHECK (true);
    CREATE POLICY "Public access plates" ON plates FOR ALL USING (true) WITH CHECK (true);
    CREATE POLICY "Public access redirects" ON redirects FOR ALL USING (true) WITH CHECK (true);
    CREATE POLICY "Public access analytics" ON analytics FOR ALL USING (true) WITH CHECK (true);
  `;

  console.log('Running schema creation...');
  await connectedClient.query(schemaSQL);
  console.log('Schema successfully created!');

  // Check if initial templates need to be seeded if empty
  const countResult = await connectedClient.query('SELECT count(*) FROM templates');
  console.log(`Current templates count: ${countResult.rows[0].count}`);

  await connectedClient.end();
}

testAndMigrate().catch((err) => {
  console.error('Fatal migration error:', err);
  process.exit(1);
});
