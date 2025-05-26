import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs/promises';
import pg from 'pg';
import dotenv from 'dotenv';
import { promisify } from 'util';
import { exec } from 'child_process';

// Load environment variables
dotenv.config();

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database configuration
const dbConfig = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'doof_db',
  password: process.env.DB_PASSWORD || '',
  port: parseInt(process.env.DB_PORT || '5432', 10),
};

// Create a new pool
const pool = new pg.Pool(dbConfig);

/**
 * Run a SQL file against the database
 * @param {string} filePath - Path to the SQL file
 */
async function runSqlFile(filePath) {
  const client = await pool.connect();
  try {
    const sql = await fs.readFile(filePath, 'utf8');
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log(`✅ Successfully executed ${path.basename(filePath)}`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`❌ Error executing ${path.basename(filePath)}:`, error.message);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Check if a table exists in the database
 * @param {string} tableName - Name of the table to check
 * @returns {Promise<boolean>} True if the table exists
 */
async function tableExists(tableName) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = $1)',
      [tableName]
    );
    return result.rows[0].exists;
  } finally {
    client.release();
  }
}

/**
 * Run the database migrations
 */
async function runMigrations() {
  console.log('🚀 Starting database migrations...');
  
  try {
    // Check if migrations table exists, create if not
    const migrationsTableExists = await tableExists('migrations');
    
    if (!migrationsTableExists) {
      console.log('Creating migrations table...');
      await pool.query(`
        CREATE TABLE migrations (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          run_on TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `);
    }

    // Get list of migration files
    const migrationsDir = path.join(__dirname, '../migrations');
    const files = await fs.readdir(migrationsDir);
    const migrationFiles = files
      .filter(file => file.endsWith('.sql'))
      .sort();

    // Run each migration
    for (const file of migrationFiles) {
      const migrationName = path.basename(file, '.sql');
      
      // Check if migration has already been run
      const result = await pool.query(
        'SELECT 1 FROM migrations WHERE name = $1',
        [migrationName]
      );
      
      if (result.rows.length === 0) {
        console.log(`\n🔹 Running migration: ${migrationName}`);
        const filePath = path.join(migrationsDir, file);
        await runSqlFile(filePath);
        
        // Record the migration
        await pool.query(
          'INSERT INTO migrations (name) VALUES ($1)',
          [migrationName]
        );
        
        console.log(`✅ Migration ${migrationName} completed successfully`);
      } else {
        console.log(`⏩ Migration ${migrationName} already applied, skipping`);
      }
    }
    
    console.log('\n🎉 All migrations completed successfully!');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the migrations
runMigrations().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
