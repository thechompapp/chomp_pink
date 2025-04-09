/* src/doof-backend/db/index.ts */
// Corrected import: Import the default export, then destructure Pool
import pg from 'pg';
const { Pool } = pg;
// Import types directly (or use pg.PoolConfig, pg.QueryResult etc. later)
import type { PoolConfig, QueryResult, PoolClient, QueryResultRow } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const poolConfig: PoolConfig = {
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
}

// Use the destructured Pool constructor
const pool = new Pool(poolConfig);

pool.connect((err: Error | undefined, client: PoolClient | undefined, done: (release?: any) => void) => {
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
        client.query('SELECT NOW()', (queryErr: Error | undefined, result?: QueryResult) => {
            done();
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

pool.on('error', (err: Error, client: PoolClient) => {
    console.error('\x1b[31m%s\x1b[0m', 'Unexpected error on idle database client', err);
});

pool.on('connect', (client: PoolClient) => {});

pool.on('remove', (client: PoolClient) => {});

type QueryParams = any[];

interface Db {
    query: <T extends QueryResultRow = any>(text: string, params?: QueryParams) => Promise<QueryResult<T>>;
    getClient: () => Promise<PoolClient>;
    pool: Pool; // Use the imported Pool type here
}

const db: Db = {
    query: <T extends QueryResultRow = any>(text: string, params?: QueryParams): Promise<QueryResult<T>> => {
        return pool.query<T>(text, params);
    },

    getClient: async (): Promise<PoolClient> => {
        const client = await pool.connect();
        const originalQuery = client.query;
        const originalRelease = client.release;

        let released = false;
        client.release = (err?: Error | boolean) => {
            if (released) {
                console.warn('[DB Client] Attempted to release client multiple times.');
                return;
            }
            released = true;
            client.query = originalQuery;
            client.release = originalRelease;
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
    pool, // Use the Pool instance
};

export default db;