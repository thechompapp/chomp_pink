import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

// Get the directory name in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.test
dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

// Database configuration
const dbConfig = {
  host: process.env.TEST_DB_HOST || 'localhost',
  port: parseInt(process.env.TEST_DB_PORT || '5432', 10),
  database: process.env.TEST_DB_NAME || 'doof_test',
  user: process.env.TEST_DB_USER || 'postgres',
  password: process.env.TEST_DB_PASSWORD || 'postgres',
};

// Create a new pool for database connections
const pool = new Pool(dbConfig);

// Test user data from .env.test
const testUsers = [
  {
    email: process.env.TEST_USER_EMAIL || 'testuser@example.com',
    username: process.env.TEST_USER_USERNAME || 'testuser',
    password: process.env.TEST_USER_PASSWORD || 'testpassword123',
    role: 'user',
  },
  {
    email: process.env.TEST_ADMIN_EMAIL || 'admin@example.com',
    username: process.env.TEST_ADMIN_USERNAME || 'adminuser',
    password: process.env.TEST_ADMIN_PASSWORD || 'adminpassword123',
    role: 'admin',
  },
];

async function setupTestUsers() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Clear existing test users
    await client.query(
      'DELETE FROM users WHERE email = ANY($1)',
      [testUsers.map(user => user.email)]
    );
    
    // Create test users
    for (const user of testUsers) {
      const passwordHash = await bcrypt.hash(user.password, 10);
      
      await client.query(
        `INSERT INTO users (email, username, password_hash, role, created_at, updated_at)
         VALUES ($1, $2, $3, $4, NOW(), NOW())
         ON CONFLICT (email) 
         DO UPDATE SET 
           username = EXCLUDED.username,
           password_hash = EXCLUDED.password_hash,
           role = EXCLUDED.role,
           updated_at = NOW()
         RETURNING id, email, username, role`,
        [user.email, user.username, passwordHash, user.role]
      );
      
      console.log(`User ${user.email} setup successfully`);
    }
    
    await client.query('COMMIT');
    console.log('Test users setup completed successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error setting up test users:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the setup
setupTestUsers()
  .then(() => {
    console.log('Test users setup completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test users setup failed:', error);
    process.exit(1);
  });
