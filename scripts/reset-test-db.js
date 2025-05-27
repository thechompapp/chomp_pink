import { Pool } from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load test database configuration
const { default: testDbConfig } = await import(path.resolve(process.cwd(), 'tests/setup/test-db-config.js'));

// Create a new pool for database connections with postgres database
const adminPool = new Pool({
  host: testDbConfig.host,
  port: testDbConfig.port,
  database: 'postgres', // Connect to default postgres database
  user: testDbConfig.user,
  password: testDbConfig.password,
});

async function resetTestDatabase() {
  const client = await adminPool.connect();
  
  try {
    console.log('Dropping existing test database...');
    
    // Terminate all connections to the test database
    await client.query(`
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE pg_stat_activity.datname = $1
      AND pid <> pg_backend_pid();
    `, [testDbConfig.database]);
    
    // Drop the test database if it exists
    await client.query(`DROP DATABASE IF EXISTS ${testDbConfig.database}`);
    
    // Create a new test database
    console.log('Creating new test database...');
    await client.query(`CREATE DATABASE ${testDbConfig.database}`);
    
    console.log('Test database reset successfully');
    return true;
  } catch (error) {
    console.error('Error resetting test database:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the reset
resetTestDatabase()
  .then(() => {
    console.log('Test database reset completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test database reset failed:', error);
    process.exit(1);
  });
