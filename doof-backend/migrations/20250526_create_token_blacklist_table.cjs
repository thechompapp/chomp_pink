// Using CommonJS for compatibility with the migration runner
const { Pool } = require('pg');
require('dotenv').config();

// Database connection configuration
const pool = new Pool({
  user: process.env.DB_USER || 'doof_user',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.NODE_ENV === 'test' ? 'doof_test' : (process.env.DB_DATABASE || 'doof_db'),
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432', 10),
});

async function query(text, params) {
  const client = await pool.connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
}

async function up() {
  try {
    console.log('Creating token_blacklist table...');
    
    await query(`
      CREATE TABLE IF NOT EXISTS token_blacklist (
        id SERIAL PRIMARY KEY,
        token TEXT NOT NULL UNIQUE,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    
    await query('CREATE INDEX IF NOT EXISTS idx_token_blacklist_token ON token_blacklist(token)');
    await query('CREATE INDEX IF NOT EXISTS idx_token_blacklist_expires_at ON token_blacklist(expires_at)');
    
    console.log('Successfully created token_blacklist table and indexes');
  } catch (error) {
    console.error('Error creating token_blacklist table:', error);
    throw error;
  }
}

async function down() {
  try {
    console.log('Dropping token_blacklist table...');
    await query('DROP TABLE IF EXISTS token_blacklist CASCADE');
    console.log('Successfully dropped token_blacklist table');
  } catch (error) {
    console.error('Error dropping token_blacklist table:', error);
    throw error;
  }
}

// Run the migration if this file is executed directly
if (require.main === module) {
  up()
    .then(() => pool.end())
    .catch(err => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}

module.exports = { up, down };
