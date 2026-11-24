import { pool } from './db';

export async function runMigrations() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS webhook_events (
        id VARCHAR(255) PRIMARY KEY,
        type VARCHAR(100) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'processed',
        payload TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      ALTER TABLE products ADD COLUMN IF NOT EXISTS brand VARCHAR(100);
      ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url VARCHAR(500);
      ALTER TABLE products ADD COLUMN IF NOT EXISTS rating NUMERIC(3, 2) DEFAULT 4.80;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 120;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS badge VARCHAR(50);
      ALTER TABLE products ADD COLUMN IF NOT EXISTS original_price NUMERIC(10, 2);
      ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS image_url VARCHAR(500);
    `);
    console.log('[Migration] Table "webhook_events" & product richness columns verified/created.');
  } catch (error) {
    console.error('[Migration] Failed to run database migrations:', error);
    throw error;
  } finally {
    client.release();
  }
}

if (process.argv[1]?.endsWith('migrate.ts')) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
