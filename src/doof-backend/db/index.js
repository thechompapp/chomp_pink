// src/doof-backend/db/index.js
// Corrected import for pg (CommonJS module)
import pg from 'pg';
const { Pool } = pg; // Destructure Pool from the default import

import 'dotenv/config';

const pool = new Pool({
  user: process.env.DB_USER || "doof_user",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_DATABASE || "doof_db",
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT) || 5432, // Ensure port is number
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 5000,
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 10000, // Increased default idle timeout
  statement_timeout: parseInt(process.env.DB_STATEMENT_TIMEOUT) || 10000,
  max: parseInt(process.env.DB_POOL_MAX) || 20,
});

// Password check remains the same
if (!process.env.DB_PASSWORD && process.env.NODE_ENV !== 'test') {
  console.error('\x1b[31m%s\x1b[0m', 'FATAL ERROR: Database password (DB_PASSWORD) is not set in environment variables.');
  // Consider exiting if password is required and missing
  // process.exit(1);
}

// Startup connection test remains the same
pool.connect((err, client, release) => {
  if (err) {
    console.error('\x1b[31m%s\x1b[0m', 'Error acquiring database client on startup:', err.stack);
  } else {
    console.log('\x1b[32m%s\x1b[0m', 'Successfully connected to the database pool (startup check).');
    client.query('SELECT NOW()', (err, result) => {
      release(); // Release client after query
      if (err) {
        console.error('\x1b[31m%s\x1b[0m', 'Error during startup query test:', err.stack);
      } else if (result?.rows?.[0]) {
        console.log('\x1b[32m%s\x1b[0m', `Database startup query test successful. DB Time: ${result.rows[0].now}`);
      } else {
        console.warn('\x1b[33m%s\x1b[0m', 'Database startup query test ran but returned no result.');
      }
    });
  }
});

// Pool event listeners remain the same
pool.on('error', (err, client) => {
  console.error('\x1b[31m%s\x1b[0m', 'Unexpected error on idle database client', err);
});

pool.on('connect', (client) => {
  // Optional: Reduce startup verbosity unless debugging
  // console.log('[DB Pool] New client connected to the pool');
});

pool.on('remove', (client) => {
  // Optional: Reduce shutdown verbosity unless debugging
  // console.log('[DB Pool] Client removed from the pool (idle timeout or error)');
});

// Export object remains the same
export default {
  query: (text, params) => pool.query(text, params),
  // getClient is useful for transactions
  getClient: async () => {
    const client = await pool.connect();
    const query = client.query;
    const release = client.release;
    // monkey patch the query method to keep track of the last query
    // or handle errors differently if needed
    client.query = (...args) => {
      // console.log('[DB Client] Executing query:', args[0]); // Optional logging
      return query.apply(client, args);
    };
    // monkey patch the release method to log released clients
    client.release = () => {
      // console.log('[DB Client] Releasing client'); // Optional logging
      client.query = query; // Restore original methods
      client.release = release;
      return release.apply(client);
    };
    return client;
  },
  pool // Expose pool directly if needed elsewhere
};