/* src/doof-backend/db/index.ts */
import pg, { Pool, PoolConfig, QueryResult, PoolClient, QueryResultRow } from 'pg'; // Added QueryResultRow
import 'dotenv/config'; // Ensure environment variables are loaded

// Define the configuration using PoolConfig type from 'pg'
const poolConfig: PoolConfig = {
  user: process.env.DB_USER || 'doof_user',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_DATABASE || 'doof_db',
  password: process.env.DB_PASSWORD, // Type is string | undefined
  port: parseInt(process.env.DB_PORT || '5432', 10), // Ensure base 10 parsing
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '5000', 10),
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '10000', 10),
  statement_timeout: parseInt(process.env.DB_STATEMENT_TIMEOUT || '10000', 10),
  max: parseInt(process.env.DB_POOL_MAX || '20', 10),
};

// Check for password (logic remains the same)
if (!poolConfig.password && process.env.NODE_ENV !== 'test') {
  console.error(
    '\x1b[31m%s\x1b[0m',
    'FATAL ERROR: Database password (DB_PASSWORD) is not set.'
  );
  // process.exit(1); // Consider exiting if critical
}

const pool = new Pool(poolConfig);

// Startup connection test (Corrected callback signature)
// Use err?: Error or err: Error | undefined, same for client. Use 'done' for release.
pool.connect((err: Error | undefined, client: PoolClient | undefined, done: (release?: any) => void) => {
  if (err) {
    console.error(
      '\x1b[31m%s\x1b[0m',
      'Error acquiring database client on startup:',
      err.stack
    );
    if (done) done(); // Ensure release is called even on initial connection error
  } else if (!client) {
      // Handle case where client might be undefined even without an error (unlikely but possible)
      console.error(
          '\x1b[31m%s\x1b[0m',
          'Failed to acquire database client on startup (client is undefined).'
      );
      if (done) done();
  }
   else {
    console.log(
      '\x1b[32m%s\x1b[0m',
      'Successfully connected to the database pool (startup check).'
    );
    client.query('SELECT NOW()', (queryErr: Error, result?: QueryResult) => {
      done(); // Release client using the 'done' parameter name
      if (queryErr) {
        console.error(
          '\x1b[31m%s\x1b[0m',
          'Error during startup query test:',
          queryErr.stack
        );
      } else if (result?.rows?.[0]?.now) {
        console.log(
          '\x1b[32m%s\x1b[0m',
          `Database startup query test successful. DB Time: ${result.rows[0].now}`
        );
      } else {
        console.warn(
          '\x1b[33m%s\x1b[0m',
          'Database startup query test ran but returned no result.'
        );
      }
    });
  }
});

// Pool event listeners (logic remains the same, add types to err)
pool.on('error', (err: Error, client: PoolClient) => {
  console.error('\x1b[31m%s\x1b[0m', 'Unexpected error on idle database client', err);
});

pool.on('connect', (client: PoolClient) => {
  // console.log('[DB Pool] New client connected.');
});

pool.on('remove', (client: PoolClient) => {
  // console.log('[DB Pool] Client removed.');
});

// Define type for query parameters array
type QueryParams = any[];

// Define the exported interface with generic constraint
interface Db {
  query: <T extends QueryResultRow = any>(text: string, params?: QueryParams) => Promise<QueryResult<T>>;
  getClient: () => Promise<PoolClient>;
  pool: Pool;
}

const db: Db = {
  // Add generic constraint T extends QueryResultRow
  query: <T extends QueryResultRow = any>(text: string, params?: QueryParams): Promise<QueryResult<T>> => {
    // console.log('[DB Query]', { text, params }); // Optional logging
    // Add generic constraint here too
    return pool.query<T>(text, params);
  },

  // Add types for getClient function
  getClient: async (): Promise<PoolClient> => {
    const client = await pool.connect();
    // Keep original methods
    const originalQuery = client.query;
    const originalRelease = client.release;

    // Type arguments for monkey-patched query if re-enabled
    // client.query = (...args: [any, any?] | [any]) => { ... };

    // Monkey patch release correctly
    let released = false; // Prevent double release
    client.release = (err?: Error | boolean) => {
       if (released) {
           console.warn('[DB Client] Attempted to release client multiple times.');
           return;
       }
       released = true;
      // console.log('[DB Client] Releasing client');
      // Restore original methods
      client.query = originalQuery;
      client.release = originalRelease;
      // Call original release method
      if (typeof err === 'boolean') {
          originalRelease(err); // Pass boolean for specific pool behavior
      } else if (err instanceof Error) {
          originalRelease(err); // Pass error object
      } else {
           originalRelease(); // Release without error
      }
    };
    return client;
  },
  pool, // Expose the pool instance
};

export default db;