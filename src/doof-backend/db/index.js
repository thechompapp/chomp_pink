/* src/doof-backend/db/index.js */
// Corrected import: Import the default export, then destructure Pool
import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';

dotenv.config();

const poolConfig = { // No TS type needed here
    user: process.env.DB_USER || 'doof_user',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_DATABASE || 'doof_db',
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '5000', 10),
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '10000', 10),
    statement_timeout: parseInt(process.env.DB_STATEMENT_TIMEOUT || '10000', 10),
    max: parseInt(process.env.DB_POOL_MAX || '20', 10),
};

if (!poolConfig.password && process.env.NODE_ENV !== 'test') {
    console.error(
        '\x1b[31m%s\x1b[0m',
        'FATAL ERROR: Database password (DB_PASSWORD) is not set.'
    );
    // Optionally exit process if password is truly required
    // process.exit(1);
}

// Use the destructured Pool constructor
const pool = new Pool(poolConfig);

pool.connect((err, client, done) => {
    if (err) {
        console.error(
            '\x1b[31m%s\x1b[0m',
            'Error acquiring database client on startup:',
            err.stack
        );
        if (done) done();
    } else if (!client) {
        console.error(
            '\x1b[31m%s\x1b[0m',
            'Failed to acquire database client on startup (client is undefined).'
        );
        if (done) done();
    } else {
        console.log(
            '\x1b[32m%s\x1b[0m',
            'Successfully connected to the database pool (startup check).'
        );
        client.query('SELECT NOW()', (queryErr, result) => {
            done(); // Release client
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

pool.on('error', (err, client) => {
    console.error('\x1b[31m%s\x1b[0m', 'Unexpected error on idle database client', err);
    // Optional: Attempt to remove the client from the pool or log more details
});

// Removed pool.on('connect') and pool.on('remove') as they were empty

const db = {
    query: (text, params) => {
        const start = Date.now();
        // Optional: Add logging for all queries
        // console.log('[DB Query]', { text, params: params?.map(p => typeof p === 'string' && p.length > 50 ? p.substring(0, 50) + '...' : p) });
        return pool.query(text, params)
          .catch(err => {
            // Log DB errors centrally
            console.error('[DB Query Error]', { text, params, error: err.message, code: err.code, detail: err.detail });
            throw err; // Re-throw the error after logging
          })
          .finally(() => {
            // Optional: Log slow queries
            // const duration = Date.now() - start;
            // if (duration > 500) { // Log queries longer than 500ms
            //     console.warn('[DB Slow Query]', { duration, text, params });
            // }
          });
    },

    getClient: async () => {
        const client = await pool.connect();
        const originalQuery = client.query;
        const originalRelease = client.release;

        let released = false;
        // Monkey-patch release to prevent double release
        client.release = (err) => {
            if (released) {
                console.warn('[DB Client] Attempted to release client multiple times.');
                return;
            }
            released = true;
            // Restore original methods
            client.query = originalQuery;
            client.release = originalRelease;
            // Call original release
            if (typeof err === 'boolean') {
                originalRelease(err);
            } else if (err instanceof Error) {
                originalRelease(err);
            } else {
                originalRelease();
            }
        };
        return client;
    },
    pool, // Export the pool instance itself if needed elsewhere
};

export default db;