// Database configuration and connection setup
import db from '../db/index.js';

/**
 * Execute a database query with error handling
 * @param {string} query - SQL query string
 * @param {Array} params - Query parameters
 * @returns {Promise<Object>} Query result
 */
export async function execute(query, params = []) {
  try {
    const result = await db.query(query, params);
    return result.rows;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

export default {
  execute,
  query: db.query,
  getClient: db.getClient,
  pool: db.pool,
  transaction: db.transaction,
  batch: db.batch,
  getPoolStatus: db.getPoolStatus
};
