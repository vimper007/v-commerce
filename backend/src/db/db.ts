import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const isRemoteDb =
  process.env.NODE_ENV === 'production' ||
  process.env.DATABASE_URL?.includes('sslmode=require') ||
  process.env.DATABASE_URL?.includes('neon.tech') ||
  process.env.DATABASE_URL?.includes('supabase');

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isRemoteDb ? { rejectUnauthorized: false } : undefined,
});

export const db = drizzle({ client: pool });

export async function testDbConnection() {
  try {
    const client = await pool.connect();
    const res = await client.query('SELECT current_database() as db_name, NOW() as current_time');
    client.release();
    console.log(`[Database] Connected to PostgreSQL "${res.rows[0].db_name}" at ${res.rows[0].current_time.toISOString()}`);
  } catch (error) {
    console.error('[Database] Failed to connect to PostgreSQL:', error);
    process.exit(1);
  }
}
