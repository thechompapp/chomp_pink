// src/doof-backend/db/index.js
const { Pool } = require("pg");

// Database connection pool configuration
const pool = new Pool({
  user: "doof_user",
  host: "localhost",
  database: "doof_db",
  password: "password", // Ensure this is secure / from environment variables
  port: 5432,
});

// Export a query function to interact with the pool
module.exports = {
  query: (text, params) => pool.query(text, params),
  // Optionally export the pool directly if needed elsewhere
  // pool: pool,
  // Function to get a client for transactions
  getClient: () => pool.connect(),
};