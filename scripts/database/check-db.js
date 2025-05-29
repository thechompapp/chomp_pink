import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
const envPath = path.resolve(__dirname, '.env');
dotenv.config({ path: envPath });

// Database configuration
const poolConfig = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'doof_db',
  password: process.env.DB_PASSWORD || 'postgres',
  port: parseInt(process.env.DB_PORT || '5432', 10),
};

console.log('Connecting to database with config:', {
  ...poolConfig,
  password: poolConfig.password ? '***' : 'not set'
});

const pool = new Pool(poolConfig);

async function checkDatabase() {
  let client;
  try {
    // Test connection
    client = await pool.connect();
    console.log('Successfully connected to database');
    
    // Check if lists table exists
    const tablesRes = await client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'lists'"
    );
    
    if (tablesRes.rows.length === 0) {
      console.error('Error: lists table does not exist in the database');
      return;
    }
    
    console.log('lists table exists');
    
    // Get table structure
    const tableInfo = await client.query(
      "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'lists'"
    );
    
    console.log('\nLists table structure:');
    console.table(tableInfo.rows);
    
    // Get recent lists
    const recentLists = await client.query(
      'SELECT id, name, user_id, creator_handle, is_public, created_at FROM lists ORDER BY created_at DESC LIMIT 5'
    );
    
    console.log('\nRecent lists:');
    console.table(recentLists.rows);
    
    // Get list count
    const countRes = await client.query('SELECT COUNT(*) as count FROM lists');
    console.log('\nTotal lists in database:', countRes.rows[0].count);
    
  } catch (error) {
    console.error('Database error:', error);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

checkDatabase();
