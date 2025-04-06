const { Pool } = require("pg");
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || "doof_user",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_DATABASE || "doof_db",
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,

  // Timeout configurations
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 5000,
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 1000, // Reduced to 1 second to force fresh connections
  statement_timeout: parseInt(process.env.DB_STATEMENT_TIMEOUT) || 10000,
  max: parseInt(process.env.DB_POOL_MAX) || 20, // Set a reasonable max to prevent excessive connections
});

// Check if password is provided
if (!process.env.DB_PASSWORD && process.env.NODE_ENV !== 'test') {
  console.error('\x1b[31m%s\x1b[0m', 'FATAL ERROR: Database password (DB_PASSWORD) is not set in environment variables.');
}

// Test the connection on startup
pool.connect((err, client, release) => {
  if (err) {
    console.error('\x1b[31m%s\x1b[0m', 'Error acquiring database client on startup:', err.stack);
  } else {
    console.log('\x1b[32m%s\x1b[0m', 'Successfully connected to the database pool (startup check).');
    client.query('SELECT NOW()', (err, result) => {
      release();
      if (err) {
        console.error('\x1b[31m%s\x1b[0m', 'Error during startup query test:', err.stack);
      } else if (result && result.rows && result.rows.length > 0) {
        console.log('\x1b[32m%s\x1b[0m', `Database startup query test successful. DB Time: ${result.rows[0].now}`);
      } else {
        console.warn('\x1b[33m%s\x1b[0m', 'Database startup query test ran but returned no result.');
      }
    });
  }
});

// Log pool errors
pool.on('error', (err, client) => {
  console.error('\x1b[31m%s\x1b[0m', 'Unexpected error on idle database client', err);
});

// Log connection usage
pool.on('connect', (client) => {
  console.log('[DB Pool] New client connected to the pool');
});

pool.on('remove', (client) => {
  console.log('[DB Pool] Client removed from the pool (idle timeout or error)');
});

module.exports = {
  query: (text, params) => {
    return pool.query(text, params);
  },
  getClient: async () => {
    const client = await pool.connect();
    return client;
  },
  // Expose the pool for direct access if needed
  pool: pool
};