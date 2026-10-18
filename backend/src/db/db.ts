import pg from 'pg';

const { Pool } = pg;

// Create a connection pool using the DATABASE_URL from .env
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Helper function to test database connectivity
export async function testDbConnection() {
  try {
    const res = await pool.query('SELECT NOW() as current_time, current_database() as db_name;');
    console.log(`Connected to PostgreSQL database "${res.rows[0].db_name}" at: ${res.rows[0].current_time}`);
  } catch (error) {
    console.error('Failed to connect to PostgreSQL:', error);
    process.exit(1); // Exit if database connection fails
  }
}
 