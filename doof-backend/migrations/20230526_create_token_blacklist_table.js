import db from '../db/index.js';

export const up = async () => {
  const client = await db.getClient();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS token_blacklist (
        id SERIAL PRIMARY KEY,
        token TEXT NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT token_unique UNIQUE (token)
      );
      CREATE INDEX IF NOT EXISTS idx_token_blacklist_expires_at ON token_blacklist (expires_at);
    `);
    console.log('Created token_blacklist table');
  } catch (error) {
    console.error('Error creating token_blacklist table:', error);
    throw error;
  } finally {
    client.release();
  }
};

export const down = async () => {
  const client = await db.getClient();
  try {
    await client.query('DROP TABLE IF EXISTS token_blacklist CASCADE');
    console.log('Dropped token_blacklist table');
  } catch (error) {
    console.error('Error dropping token_blacklist table:', error);
    throw error;
  } finally {
    client.release();
  }
};
