// src/doof-backend/db/index.js (Removed hardcoded password)
const { Pool } = require("pg");
require('dotenv').config(); // Ensure environment variables are loaded

// Database connection pool configuration - Reads from environment variables
const pool = new Pool({
  user: process.env.DB_USER || "doof_user", // Default user if not set
  host: process.env.DB_HOST || "localhost", // Default host if not set
  database: process.env.DB_DATABASE || "doof_db", // Default database if not set
  password: process.env.DB_PASSWORD, // **No default/fallback password**
  port: process.env.DB_PORT || 5432, // Default port if not set
});

// Check if password is provided
if (!process.env.DB_PASSWORD && process.env.NODE_ENV !== 'test') { // Allow missing password for tests maybe?
    console.error('\x1b[31m%s\x1b[0m', 'FATAL ERROR: Database password (DB_PASSWORD) is not set in environment variables.');
    // Optional: Exit the process if password is required for operation
    // process.exit(1);
}

// Test the connection on startup (optional but recommended)
pool.connect((err, client, release) => {
  if (err) {
    console.error('\x1b[31m%s\x1b[0m', 'Error acquiring database client:', err.stack);
    // Optional: Exit if connection fails on startup
    // process.exit(1);
  } else {
     console.log('\x1b[32m%s\x1b[0m', 'Successfully connected to the database pool.');
     release(); // Release the client back to the pool
  }
});


// Export a query function to interact with the pool
module.exports = {
  query: (text, params) => pool.query(text, params),
  // Optionally export the pool directly if needed elsewhere
  // pool: pool,
  // Function to get a client for transactions
  getClient: () => pool.connect(),
};