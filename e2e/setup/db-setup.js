/**
 * Database Setup for E2E Tests
 * 
 * This file provides utilities for setting up the test database
 * with necessary test data.
 */

import { config } from './config.js';
import axios from 'axios';
import bcrypt from 'bcryptjs'; // Changed to bcryptjs to match backend
import pg from 'pg';
import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';

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
 * Create a test user in the database
 * @param {Object} userData - User data
 * @returns {Promise<Object>} Created user data
 */
async function createUserInDb(userData) {
  try {
    // Check if user already exists
    const checkResult = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [userData.email]
    );
    
    if (checkResult.rows.length > 0) {
      console.log(`User ${userData.email} already exists in database`);
      return checkResult.rows[0];
    }
    
    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(userData.password, saltRounds);
    
    // Insert the user
    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash, role, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING *`,
      [
        userData.username,
        userData.email,
        hashedPassword,
        userData.role || 'user'
      ]
    );
    
    console.log(`User ${userData.email} created in database`);
    return result.rows[0];
  } catch (error) {
    console.error('Error creating user in database:', error.message);
    return null;
  }
}

/**
 * Create test users in the database
 * @returns {Promise<Object>} Created users
 */
async function createTestUsers() {
  try {
    // Create regular user
    const regularUser = await createUserInDb({
      email: config.testUsers.regular.email,
      password: config.testUsers.regular.password,
      username: 'testuser',
      role: 'user'
    });
    
    // Create admin user
    const adminUser = await createUserInDb({
      email: config.testUsers.admin.email,
      password: config.testUsers.admin.password,
      username: 'adminuser',
      role: 'admin'
    });
    
    return {
      regularUser,
      adminUser
    };
  } catch (error) {
    console.error('Error creating test users:', error.message);
    return null;
  }
}

/**
 * Create a test restaurant in the database
 * @param {string} userId - User ID who creates the restaurant
 * @returns {Promise<Object>} Created restaurant data
 */
async function createTestRestaurant(userId) {
  try {
    // Check if test restaurant already exists
    const checkResult = await pool.query(
      "SELECT * FROM restaurants WHERE name LIKE 'Test Restaurant%'",
      []
    );
    
    if (checkResult.rows.length > 0) {
      console.log('Test restaurant already exists in database');
      return checkResult.rows[0];
    }
    
    // Insert the restaurant
    const result = await pool.query(
      `INSERT INTO restaurants (name, description, address, cuisine, price_range, created_by, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING *`,
      [
        `Test Restaurant ${Date.now()}`,
        'A restaurant created for E2E testing',
        '123 Test Street, Test City, TS 12345',
        'Test Cuisine',
        '$$',
        userId
      ]
    );
    
    console.log('Test restaurant created in database');
    return result.rows[0];
  } catch (error) {
    console.error('Error creating test restaurant:', error.message);
    return null;
  }
}

/**
 * Create a test dish in the database
 * @param {string} restaurantId - Restaurant ID
 * @param {string} userId - User ID who creates the dish
 * @returns {Promise<Object>} Created dish data
 */
async function createTestDish(restaurantId, userId) {
  try {
    // Check if test dish already exists for this restaurant
    const checkResult = await pool.query(
      "SELECT * FROM dishes WHERE restaurant_id = $1 AND name LIKE 'Test Dish%'",
      [restaurantId]
    );
    
    if (checkResult.rows.length > 0) {
      console.log('Test dish already exists in database');
      return checkResult.rows[0];
    }
    
    // Insert the dish
    const result = await pool.query(
      `INSERT INTO dishes (name, description, price, category, restaurant_id, created_by, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING *`,
      [
        `Test Dish ${Date.now()}`,
        'A dish created for E2E testing',
        12.99,
        'Main Course',
        restaurantId,
        userId
      ]
    );
    
    console.log('Test dish created in database');
    return result.rows[0];
  } catch (error) {
    console.error('Error creating test dish:', error.message);
    return null;
  }
}

/**
 * Set up the test database with necessary test data
 * @returns {Promise<Object>} Created test data
 */
export async function setupTestDatabase() {
  try {
    console.log('Setting up test database...');
    
    // Create test users
    const users = await createTestUsers();
    
    if (!users || !users.regularUser) {
      console.error('Failed to create test users');
      return null;
    }
    
    // Create test restaurant
    const restaurant = await createTestRestaurant(users.regularUser.id);
    
    if (!restaurant) {
      console.error('Failed to create test restaurant');
      return null;
    }
    
    // Create test dish
    const dish = await createTestDish(restaurant.id, users.regularUser.id);
    
    console.log('Test database setup complete');
    
    return {
      users,
      restaurant,
      dish
    };
  } catch (error) {
    console.error('Error setting up test database:', error.message);
    return null;
  } finally {
    // Close the database connection pool
    await pool.end();
  }
}

/**
 * Main function - can be called directly to set up the database
 */
async function main() {
  try {
    await setupTestDatabase();
    console.log('Database setup complete');
    process.exit(0);
  } catch (error) {
    console.error('Database setup failed:', error.message);
    process.exit(1);
  }
}

// If this file is run directly, execute the main function
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}

export default {
  setupTestDatabase,
  createUserInDb,
  createTestUsers,
  createTestRestaurant,
  createTestDish
};
