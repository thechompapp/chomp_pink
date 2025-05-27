import { db } from '../db/index.js';

export const up = async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS token_blacklist (
        id SERIAL PRIMARY KEY,
        token TEXT NOT NULL UNIQUE,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      
      -- Add index on token for faster lookups
      CREATE INDEX IF NOT EXISTS idx_token_blacklist_token ON token_blacklist(token);
      
      -- Add index on expires_at for cleanup operations
      CREATE INDEX IF NOT EXISTS idx_token_blacklist_expires_at ON token_blacklist(expires_at);
    `);
    
    console.log('Created token_blacklist table');
  } catch (error) {
    console.error('Error creating token_blacklist table:', error);
    throw error;
  }
};

export const down = async () => {
  try {
    await db.query('DROP TABLE IF EXISTS token_blacklist CASCADE');
    console.log('Dropped token_blacklist table');
  } catch (error) {
    console.error('Error dropping token_blacklist table:', error);
    throw error;
  }
};
