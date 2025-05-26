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

async function checkSchema() {
  try {
    // Check users table
    const usersTable = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users';
    `);
    
    console.log('Users table columns:');
    console.table(usersTable.rows);
    
    // Check if test user exists
    const testUser = await pool.query("SELECT * FROM users WHERE username = 'testuser' OR email = 'testuser@example.com'");
    console.log('\nTest user in database:', testUser.rows[0] || 'Not found');
    
  } catch (error) {
    console.error('Error checking schema:', error);
  } finally {
    await pool.end();
  }
}

checkSchema();
