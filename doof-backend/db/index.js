// Filename: /root/doof-backend/db/index.js
/* Updated: Ensure ESM export syntax and config import */
import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';
import config from '../config/config.js'; // Import centralized config

dotenv.config(); // Ensure .env is loaded

// Use config values directly
const poolConfig = {
    user: process.env.DB_USER || config.DB_USER, // Use config as fallback
    host: process.env.DB_HOST || config.DB_HOST,
    database: process.env.DB_DATABASE || config.DB_DATABASE,
    password: process.env.DB_PASSWORD || config.DB_PASSWORD, // Use config
    port: parseInt(process.env.DB_PORT || String(config.DB_PORT), 10), // Ensure string conversion for parseInt
    // Add other pool config options from previous versions if needed
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 10000,
    max: 20,
};

// Password check remains important
if (!poolConfig.password && process.env.NODE_ENV !== 'test') {
    console.error('\x1b[31m%s\x1b[0m', 'FATAL ERROR: Database password (DB_PASSWORD) is not set.');
    // process.exit(1); // Consider exiting if critical
}

const pool = new Pool(poolConfig);

// Simplified connection check and logging
pool.on('connect', (client) => {
  console.log('[DB Pool] Client connected.');
  // Optional: Set properties on connected clients if needed
  // client.query('SET search_path TO my_schema');
});

pool.on('error', (err, client) => {
    console.error('\x1b[31m%s\x1b[0m', '[DB Pool] Unexpected error on idle client', err);
    process.exit(-1); // Exit if pool encounters critical error
});

// Export the query function and pool instance
const db = {
    query: (text, params) => pool.query(text, params),
    getClient: () => pool.connect(), // Use pool.connect() for transactions
    pool: pool, // Export the pool instance if needed directly
};

// Test connection on startup (optional but recommended)
(async () => {
  let client = null; // Declare client outside try
  try {
    client = await db.getClient();
    const result = await client.query('SELECT NOW()');
    console.log('\x1b[32m%s\x1b[0m', `[DB] Successfully connected. DB Time: ${result.rows[0].now}`);
  } catch (err) {
    console.error('\x1b[31m%s\x1b[0m', '[DB] Database Connection Failed on Startup!', err);
  } finally {
    if (client) {
      client.release(); // Ensure client is always released
    }
  }
})();


export default db; // Use export default