// Filename: /root/doof-backend/db/index.js
/**
 * Database connection manager with optimized connection pooling
 * Provides centralized query execution, transaction support, and performance monitoring
 */
import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';
import config from '../config/config.js'; // Import centralized config
import logger from '../utils/logger.js';

dotenv.config(); // Ensure .env is loaded

/**
 * Database connection configuration
 */
// Determine database name based on environment
const databaseName = process.env.NODE_ENV === 'test' 
  ? 'doof_test' 
  : (process.env.DB_DATABASE || config.db.database);

const poolConfig = {
    user: process.env.DB_USER || config.db.user,
    host: process.env.DB_HOST || config.db.host,
    database: databaseName,
    password: process.env.DB_PASSWORD || config.db.password,
    port: parseInt(process.env.DB_PORT || String(config.db.port), 10),
    // Pool optimization settings
    max: process.env.DB_POOL_MAX || 20, // Maximum clients in pool
    idleTimeoutMillis: process.env.DB_IDLE_TIMEOUT || 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: process.env.DB_CONNECT_TIMEOUT || 5000, // Return an error after 5 seconds if a connection cannot be established
    maxUses: process.env.DB_MAX_USES || 7500, // Return clients to the pool after 7500 queries
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
};

// Critical check
if (!poolConfig.password && process.env.NODE_ENV !== 'test') {
    logger.error('Database password (DB_PASSWORD) is not set in environment variables or config!');
    // We'll continue but log this critical error
}

// Log database connection details for debugging
console.log('Database connection details:', {
  user: poolConfig.user,
  host: poolConfig.host,
  database: poolConfig.database,
  port: poolConfig.port,
  max: poolConfig.max,
  ssl: poolConfig.ssl
});

/**
 * Create and configure connection pool
 */
const pool = new Pool(poolConfig);

// Connection monitoring
pool.on('connect', (client) => {
    logger.debug('[DB Pool] New client connected to database');
    client.lastUseTime = Date.now();
});

pool.on('acquire', (client) => {
    logger.debug('[DB Pool] Client checked out from pool');
    client.lastUseTime = Date.now();
});

pool.on('remove', () => {
    logger.debug('[DB Pool] Client removed from pool');
});

pool.on('error', (err, client) => {
    logger.error('[DB Pool] Unexpected error on idle client', err);
    // Don't exit - let the application handle recovery
});

/**
 * Execute a query with performance tracking
 * 
 * @param {string} text - SQL query text
 * @param {Array} params - Query parameters
 * @param {Object} options - Additional options
 * @returns {Promise} Query result
 */
const query = async (text, params, options = {}) => {
    const start = Date.now();
    
    try {
        // Execute the query
        const result = await pool.query(text, params);
        
        // Log performance data for slow queries
        const duration = Date.now() - start;
        if (duration > 100) { // Log queries that take more than 100ms
            logger.debug(`[DB] Slow query (${duration}ms): ${text.substring(0, 200)}${text.length > 200 ? '...' : ''}`);
        }
        
        return result;
    } catch (error) {
        logger.error(`[DB] Query error: ${error.message}`, error);
        // Add query information to the error for better debugging
        error.query = text;
        error.params = params;
        throw error;
    }
};

/**
 * Execute a transaction with automatic rollback on error
 * 
 * @param {Function} callback - Transaction callback function that receives a client
 * @returns {Promise} Transaction result
 */
const transaction = async (callback) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error('[DB] Transaction rolled back due to error', error);
        throw error;
    } finally {
        client.release();
    }
};

/**
 * Database connection manager
 */
const db = {
    query,
    transaction,
    getClient: () => pool.connect(),
    pool,
    
    // Helper for transaction-safe batch operations
    async batch(items, batchFn, batchSize = 100) {
        if (!items || items.length === 0) return [];
        
        const results = [];
        const batches = Math.ceil(items.length / batchSize);
        
        for (let i = 0; i < batches; i++) {
            const batchItems = items.slice(i * batchSize, (i + 1) * batchSize);
            const batchResults = await batchFn(batchItems);
            results.push(...batchResults);
        }
        
        return results;
    },
    
    // Pool health check
    getPoolStatus() {
        return {
            total: pool.totalCount,
            idle: pool.idleCount,
            waiting: pool.waitingCount,
        };
    }
};

// Test connection on startup
(async () => {
    let client = null;
    try {
        client = await db.getClient();
        const result = await client.query('SELECT NOW() as now, current_user as user, current_database() as database');
        const { now, user, database } = result.rows[0];
        logger.info(`[DB] Connected to ${database} as ${user}. Server time: ${now}`);
    } catch (err) {
        logger.error('[DB] Database connection test failed!', err);
    } finally {
        if (client) client.release();
    }
})();

export default db;