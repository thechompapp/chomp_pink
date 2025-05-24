/**
 * E2E Testing Database Utilities
 * 
 * This file provides utilities for setting up and tearing down the test database.
 */

import { Pool } from 'pg';
import { dbConfig } from './config.js';

// Create a connection pool
const pool = new Pool(dbConfig);

/**
 * Initialize the test database with seed data
 */
export const initializeTestDatabase = async () => {
  try {
    console.log('Initializing test database...');
    
    // Create a client from the pool
    const client = await pool.connect();
    
    try {
      // Start transaction
      await client.query('BEGIN');
      
      // Reset database to known state (truncate tables)
      await client.query(`
        DO $$ 
        DECLARE
          tables CURSOR FOR
            SELECT tablename
            FROM pg_tables
            WHERE schemaname = 'public' AND tablename != 'migrations';
        BEGIN
          FOR table_record IN tables LOOP
            EXECUTE 'TRUNCATE TABLE ' || quote_ident(table_record.tablename) || ' CASCADE;';
          END LOOP;
        END $$;
      `);
      
      // Seed users (regular and admin)
      await client.query(`
        INSERT INTO users (email, password, name, role)
        VALUES 
          ('user@example.com', '$2a$10$xVCf4Uu.YJp3YbQXIecnYOVNRZZXD5qXt0aVgZjXMHZtQHCc1JE0W', 'Test User', 'user'),
          ('admin@example.com', '$2a$10$xVCf4Uu.YJp3YbQXIecnYOVNRZZXD5qXt0aVgZjXMHZtQHCc1JE0W', 'Test Admin', 'admin');
      `);
      
      // Seed cities
      await client.query(`
        INSERT INTO cities (name, state, country)
        VALUES 
          ('New York', 'NY', 'USA'),
          ('Los Angeles', 'CA', 'USA'),
          ('Chicago', 'IL', 'USA');
      `);
      
      // Seed neighborhoods
      await client.query(`
        INSERT INTO neighborhoods (name, city_id)
        VALUES 
          ('Manhattan', 1),
          ('Brooklyn', 1),
          ('Queens', 1),
          ('Downtown', 2),
          ('Hollywood', 2),
          ('Loop', 3);
      `);
      
      // Seed restaurants
      await client.query(`
        INSERT INTO restaurants (name, cuisine, address, city_id, neighborhood_id)
        VALUES 
          ('Pizza Palace', 'Italian', '123 Main St', 1, 1),
          ('Burger Joint', 'American', '456 Broadway', 1, 2),
          ('Sushi Spot', 'Japanese', '789 5th Ave', 1, 1),
          ('Taco Town', 'Mexican', '101 Sunset Blvd', 2, 4);
      `);
      
      // Seed dishes
      await client.query(`
        INSERT INTO dishes (name, restaurant_id, price, description)
        VALUES 
          ('Margherita Pizza', 1, 12.99, 'Classic pizza with tomato sauce and mozzarella'),
          ('Pepperoni Pizza', 1, 14.99, 'Pizza with pepperoni'),
          ('Cheeseburger', 2, 10.99, 'Classic burger with cheese'),
          ('California Roll', 3, 8.99, 'Sushi roll with crab, avocado, and cucumber'),
          ('Taco Plate', 4, 9.99, 'Three tacos with rice and beans');
      `);
      
      // Seed hashtags
      await client.query(`
        INSERT INTO hashtags (name)
        VALUES 
          ('pizza'),
          ('italian'),
          ('burger'),
          ('sushi'),
          ('japanese'),
          ('taco'),
          ('mexican');
      `);
      
      // Seed lists
      await client.query(`
        INSERT INTO lists (name, description, user_id, is_public, list_type)
        VALUES 
          ('My Favorite Restaurants', 'A list of my favorite restaurants', 1, true, 'restaurant'),
          ('Must-Try Dishes', 'Dishes I want to try', 1, true, 'dish'),
          ('Admin Picks', 'Curated by admin', 2, true, 'mixed');
      `);
      
      // Seed list items
      await client.query(`
        INSERT INTO list_items (list_id, item_id, item_type, notes)
        VALUES 
          (1, 1, 'restaurant', 'Great pizza place'),
          (1, 3, 'restaurant', 'Best sushi in town'),
          (2, 1, 'dish', 'Classic pizza'),
          (2, 4, 'dish', 'Fresh and delicious'),
          (3, 2, 'restaurant', 'Great burgers'),
          (3, 5, 'dish', 'Authentic tacos');
      `);
      
      // Seed submissions
      await client.query(`
        INSERT INTO submissions (user_id, type, status, data)
        VALUES 
          (1, 'restaurant', 'pending', '{"name": "New Restaurant", "cuisine": "French", "address": "123 Test St"}'),
          (1, 'dish', 'pending', '{"name": "New Dish", "restaurant_id": 1, "price": 15.99}');
      `);
      
      // Commit transaction
      await client.query('COMMIT');
      
      console.log('Test database initialized successfully');
      return true;
    } catch (error) {
      // Rollback transaction on error
      await client.query('ROLLBACK');
      console.error('Error initializing test database:', error);
      throw error;
    } finally {
      // Release client back to pool
      client.release();
    }
  } catch (error) {
    console.error('Failed to initialize test database:', error);
    return false;
  }
};

/**
 * Clean up the test database
 */
export const cleanupTestDatabase = async () => {
  try {
    console.log('Cleaning up test database...');
    
    // Create a client from the pool
    const client = await pool.connect();
    
    try {
      // Start transaction
      await client.query('BEGIN');
      
      // Truncate all tables
      await client.query(`
        DO $$ 
        DECLARE
          tables CURSOR FOR
            SELECT tablename
            FROM pg_tables
            WHERE schemaname = 'public' AND tablename != 'migrations';
        BEGIN
          FOR table_record IN tables LOOP
            EXECUTE 'TRUNCATE TABLE ' || quote_ident(table_record.tablename) || ' CASCADE;';
          END LOOP;
        END $$;
      `);
      
      // Commit transaction
      await client.query('COMMIT');
      
      console.log('Test database cleaned up successfully');
      return true;
    } catch (error) {
      // Rollback transaction on error
      await client.query('ROLLBACK');
      console.error('Error cleaning up test database:', error);
      throw error;
    } finally {
      // Release client back to pool
      client.release();
    }
  } catch (error) {
    console.error('Failed to clean up test database:', error);
    return false;
  }
};

/**
 * Close database connections
 */
export const closeDbConnections = async () => {
  try {
    await pool.end();
    console.log('Database connections closed');
    return true;
  } catch (error) {
    console.error('Error closing database connections:', error);
    return false;
  }
};

export default {
  initializeTestDatabase,
  cleanupTestDatabase,
  closeDbConnections
};
