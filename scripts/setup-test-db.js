import { Pool } from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFile } from 'fs/promises';

// Get the directory name in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load test database configuration
const { default: testDbConfig } = await import(path.resolve(process.cwd(), 'tests/setup/test-db-config.js'));

// Create a new pool for database connections
const pool = new Pool({
  host: testDbConfig.host,
  port: testDbConfig.port,
  database: testDbConfig.database,
  user: testDbConfig.user,
  password: testDbConfig.password,
});

async function setupTestDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('Setting up test database schema...');
    
    // Start a transaction
    await client.query('BEGIN');
    
    // Read and execute the schema dump
    const schemaPath = path.resolve(process.cwd(), 'schema_dump_20250525.sql');
    const schemaSql = await readFile(schemaPath, 'utf8');
    
    // Split the SQL file into individual statements and execute them
    const statements = schemaSql
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);
    
    for (const statement of statements) {
      try {
        await client.query(statement);
      } catch (error) {
        console.error('Error executing statement:', statement.substring(0, 100) + '...');
        throw error;
      }
    }
    
    // Commit the transaction
    await client.query('COMMIT');
    console.log('Test database schema created successfully');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error setting up test database:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the setup
setupTestDatabase()
  .then(() => {
    console.log('Test database setup completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test database setup failed:', error);
    process.exit(1);
  });
