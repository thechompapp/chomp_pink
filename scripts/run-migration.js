// Script to run database migrations
import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';
import db from '../doof-backend/db/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Import the migration
const migration = await import('../doof-backend/migrations/20230526_create_token_blacklist_table.js');

async function runMigration() {
  console.log('Starting database migration...');
  
  try {
    // Run the migration
    await migration.up();
    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
