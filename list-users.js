import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.test' });

const pool = new pg.Pool({
  user: process.env.DB_USER || 'doof_user',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_DATABASE || 'doof_db',
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432', 10),
});

async function listUsers() {
  try {
    const result = await pool.query('SELECT id, email, username, first_name, last_name FROM users');
    console.log('Users in the database:');
    console.table(result.rows);
  } catch (error) {
    console.error('Error listing users:', error);
  } finally {
    await pool.end();
  }
}

listUsers();
