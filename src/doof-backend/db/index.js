// src/doof-backend/db/index.js
// ADDED: Timeout configurations to the connection pool
const { Pool } = require("pg");
require('dotenv').config(); // Ensure environment variables are loaded

// Database connection pool configuration - Reads from environment variables
const pool = new Pool({
  user: process.env.DB_USER || "doof_user",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_DATABASE || "doof_db",
  password: process.env.DB_PASSWORD, // **No default/fallback password**
  port: process.env.DB_PORT || 5432,

  // --- ADDED TIMEOUTS ---
  // Timeout for acquiring a client from the pool (e.g., 5 seconds)
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 5000,
  // Timeout for idle clients in the pool (e.g., 10 seconds)
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 10000,
  // Default timeout for any query executed via the pool (e.g., 10 seconds)
  // This will cause queries taking longer than this to error
  statement_timeout: parseInt(process.env.DB_STATEMENT_TIMEOUT) || 10000,
  // --- END ADDED TIMEOUTS ---

  // Optional: Max number of clients in the pool
  // max: parseInt(process.env.DB_POOL_MAX) || 10,
});

// Check if password is provided
if (!process.env.DB_PASSWORD && process.env.NODE_ENV !== 'test') {
    console.error('\x1b[31m%s\x1b[0m', 'FATAL ERROR: Database password (DB_PASSWORD) is not set in environment variables.');
    // process.exit(1); // Consider exiting if password is required
}

// Test the connection on startup
pool.connect((err, client, release) => {
  if (err) {
    console.error('\x1b[31m%s\x1b[0m', 'Error acquiring database client on startup:', err.stack);
  } else {
     console.log('\x1b[32m%s\x1b[0m', 'Successfully connected to the database pool (startup check).');
     client.query('SELECT NOW()', (err, result) => { // Test with a simple query
        release(); // Release client!
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


// Export a query function to interact with the pool
module.exports = {
  query: (text, params) => {
     // Using the pool's query method implicitly handles client checkout/release for single queries
     return pool.query(text, params);
  },
  // Function to get a client for transactions (requires explicit release)
  getClient: async () => {
     const client = await pool.connect();
     return client;
  },
};