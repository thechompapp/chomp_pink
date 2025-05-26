/**
 * Database Initialization for Tests
 * 
 * This module provides functions to initialize and clean up the test database.
 * It ensures a clean state before and after tests.
 */

import { Pool } from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import test database configuration
const testDbConfig = (await import(path.resolve(process.cwd(), 'tests/setup/test-db-config.js'))).default;

// Create a new pool for test database connections
const testPool = new Pool({
  host: testDbConfig.host,
  port: testDbConfig.port,
  database: testDbConfig.database,
  user: testDbConfig.user,
  password: testDbConfig.password,
  max: testDbConfig.max,
  idleTimeoutMillis: testDbConfig.idleTimeoutMillis,
  connectionTimeoutMillis: testDbConfig.connectionTimeoutMillis
});

/**
 * Initialize the test database
 * @returns {Promise<void>}
 */
export async function initializeDatabase() {
  try {
    console.log('Initializing test database...');
    
    // Connect to the database
    const client = await testPool.connect();
    
    try {
      // Start a transaction
      await client.query('BEGIN');
      
      // Clear all data from tables (in the correct order to respect foreign key constraints)
      await client.query('TRUNCATE TABLE list_items, lists, restaurants, dishes, users RESTART IDENTITY CASCADE');
      
      // Commit the transaction
      await client.query('COMMIT');
      console.log('Test database initialized successfully');
    } catch (error) {
      // Rollback in case of error
      await client.query('ROLLBACK');
      console.error('Error initializing test database:', error);
      throw error;
    } finally {
      // Release the client back to the pool
      client.release();
    }
  } catch (error) {
    console.error('Failed to connect to test database:', error);
    throw error;
  }
}

/**
 * Clean up test data from the database
 * @returns {Promise<void>}
 */
export async function cleanupTestData() {
  try {
    console.log('Cleaning up test data...');
    const client = await testPool.connect();
    
    try {
      await client.query('BEGIN');
      // Clear all data from tables
      await client.query('TRUNCATE TABLE list_items, lists, restaurants, dishes, users RESTART IDENTITY CASCADE');
      await client.query('COMMIT');
      console.log('Test data cleaned up successfully');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error cleaning up test data:', error);
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Failed to clean up test data:', error);
    throw error;
  }
}

/**
 * Close the database connection pool
 * @returns {Promise<void>}
 */
export async function closeDatabase() {
  console.log('Closing database connections...');
  await testPool.end();
  console.log('Database connections closed');
}

export default {
  initializeDatabase,
  cleanupTestData,
  closeDatabase,
  pool: testPool
};
