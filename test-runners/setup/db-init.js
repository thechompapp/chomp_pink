/**
 * Database Initialization Script for E2E Tests
 * 
 * This script creates the necessary database tables for E2E tests if they don't exist.
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get database config from backend config if possible
let dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'doof_db',
  user: process.env.DB_USER || 'doof_user',
  password: process.env.DB_PASSWORD || 'doof_password',
  max: 5, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000 // How long a client is allowed to remain idle before being closed
};

// Try to read database config from backend .env file
try {
  const envPath = path.resolve(process.cwd(), 'doof-backend', '.env');
  if (fs.existsSync(envPath)) {
    console.log('Reading database config from backend .env file');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envLines = envContent.split('\n');
    
    for (const line of envLines) {
      if (line.trim() && !line.startsWith('#')) {
        const [key, value] = line.split('=');
        if (key && value) {
          if (key === 'DB_HOST') dbConfig.host = value.trim();
          if (key === 'DB_PORT') dbConfig.port = parseInt(value.trim(), 10);
          if (key === 'DB_NAME' || key === 'DB_DATABASE') dbConfig.database = value.trim();
          if (key === 'DB_USER') dbConfig.user = value.trim();
          if (key === 'DB_PASSWORD') dbConfig.password = value.trim();
        }
      }
    }
  }
} catch (error) {
  console.warn('Error reading backend .env file:', error.message);
}

console.log('Using database config:', {
  host: dbConfig.host,
  port: dbConfig.port,
  database: dbConfig.database,
  user: dbConfig.user,
  password: dbConfig.password ? '******' : 'not set'
});

// Create a database connection pool
const pool = new pg.Pool(dbConfig);

/**
 * Initialize the database tables
 */
async function initializeDatabase() {
  try {
    console.log('Initializing database tables...');
    
    // First, check the existing schema
    console.log('Checking existing database schema...');
    
    // Check if users table exists and its structure
    const usersTableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      );
    `);
    
    const usersTableExists = usersTableCheck.rows[0].exists;
    console.log(`Users table exists: ${usersTableExists}`);
    
    if (usersTableExists) {
      // Check if the role column exists in users table
      const roleColumnCheck = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'role'
        );
      `);
      
      const roleColumnExists = roleColumnCheck.rows[0].exists;
      console.log(`Role column exists in users table: ${roleColumnExists}`);
      
      // Check if account_type column exists in users table
      const accountTypeColumnCheck = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'account_type'
        );
      `);
      
      const accountTypeColumnExists = accountTypeColumnCheck.rows[0].exists;
      console.log(`Account_type column exists in users table: ${accountTypeColumnExists}`);
      
      // If account_type exists but role doesn't, add role column and copy values
      if (accountTypeColumnExists && !roleColumnExists) {
        console.log('Adding role column to users table...');
        await pool.query(`
          ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'user';
          UPDATE users SET role = account_type;
        `);
        console.log('Role column added and populated from account_type');
      }
      
      // If neither exists, add role column
      if (!accountTypeColumnExists && !roleColumnExists) {
        console.log('Adding role column to users table...');
        await pool.query(`
          ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'user';
        `);
        console.log('Role column added with default value');
      }
    } else {
      // Create Users table if it doesn't exist
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(50) UNIQUE NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          role VARCHAR(20) NOT NULL DEFAULT 'user',
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP
        );
      `);
      console.log('Users table created');
    }
    
    // Check if restaurants table exists
    const restaurantsTableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'restaurants'
      );
    `);
    
    const restaurantsTableExists = restaurantsTableCheck.rows[0].exists;
    console.log(`Restaurants table exists: ${restaurantsTableExists}`);
    
    if (!restaurantsTableExists) {
      // Create Restaurants table if it doesn't exist
      await pool.query(`
        CREATE TABLE IF NOT EXISTS restaurants (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          description TEXT,
          address VARCHAR(255),
          cuisine VARCHAR(50),
          price_range VARCHAR(10),
          created_by INTEGER REFERENCES users(id),
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP
        );
      `);
      console.log('Restaurants table created');
    }
    
    // Check if dishes table exists
    const dishesTableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'dishes'
      );
    `);
    
    const dishesTableExists = dishesTableCheck.rows[0].exists;
    console.log(`Dishes table exists: ${dishesTableExists}`);
    
    if (!dishesTableExists) {
      // Create Dishes table if it doesn't exist
      await pool.query(`
        CREATE TABLE IF NOT EXISTS dishes (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          description TEXT,
          price DECIMAL(10, 2) NOT NULL,
          category VARCHAR(50),
          restaurant_id INTEGER REFERENCES restaurants(id) ON DELETE CASCADE,
          created_by INTEGER REFERENCES users(id),
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP
        );
      `);
      console.log('Dishes table created');
    }
    
    console.log('Database initialization complete');
  } catch (error) {
    console.error('Error initializing database:', error.message);
    throw error;
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Main function
async function main() {
  try {
    await initializeDatabase();
    console.log('Database initialization successful');
    process.exit(0);
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  }
}

// If this file is run directly, execute the main function
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}

export { initializeDatabase };
