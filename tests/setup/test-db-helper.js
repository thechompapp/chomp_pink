import { Pool } from 'pg';
import testDbConfig from './test-db-config.js';

class TestDBHelper {
  constructor() {
    this.pool = new Pool(testDbConfig);
    this.client = null;
  }

  /**
   * Connect to the test database and start a transaction
   */
  async connect() {
    this.client = await this.pool.connect();
    await this.client.query('BEGIN');
    return this.client;
  }

  /**
   * Rollback the transaction and release the client
   */
  async cleanup() {
    if (this.client) {
      try {
        await this.client.query('ROLLBACK');
      } catch (error) {
        console.error('Error rolling back transaction:', error);
      } finally {
        this.client.release();
        this.client = null;
      }
    }
  }

  /**
   * Execute a query in the current transaction
   */
  async query(text, params) {
    if (!this.client) {
      throw new Error('No active database connection. Call connect() first.');
    }
    return this.client.query(text, params);
  }

  /**
   * Truncate all tables in the test database
   */
  async truncateAll() {
    if (!this.client) {
      throw new Error('No active database connection. Call connect() first.');
    }
    
    // Disable foreign key checks temporarily
    await this.client.query('SET session_replication_role = replica;');
    
    try {
      // Get all tables
      const { rows } = await this.client.query(
        "SELECT tablename FROM pg_tables WHERE schemaname = 'public'"
      );
      
      // Truncate each table
      for (const row of rows) {
        await this.client.query(`TRUNCATE TABLE "${row.tablename}" CASCADE`);
      }
    } finally {
      // Re-enable foreign key checks
      await this.client.query('SET session_replication_role = DEFAULT;');
    }
  }
}

export default TestDBHelper;
