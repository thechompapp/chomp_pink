/**
 * Backend Integration Tests
 * 
 * Tests the internal interactions between backend controllers, services,
 * middleware, and data access layers to ensure proper business logic flow.
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';

// Import controllers and services to test
import { listController } from '../doof-backend/controllers/listController.js';
import { authController } from '../doof-backend/controllers/authController.js';
import { placesController } from '../doof-backend/controllers/placesController.js';
import { adminController } from '../doof-backend/controllers/adminController.js';

import { listService } from '../doof-backend/services/listService.js';

// Mock database and external services
jest.mock('../doof-backend/db/database.js');
jest.mock('../doof-backend/middleware/auth.js');

import db from '../doof-backend/db/database.js';
import { authenticateToken, requireAdmin } from '../doof-backend/middleware/auth.js';

describe('Backend Integration Tests', () => {
  let app;
  let mockUser;

  beforeEach(() => {
    // Create Express app for testing
    app = express();
    app.use(express.json());

    // Mock user for authenticated requests
    mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      role: 'user'
    };

    // Mock authentication middleware
    authenticateToken.mockImplementation((req, res, next) => {
      req.user = mockUser;
      next();
    });

    requireAdmin.mockImplementation((req, res, next) => {
      if (req.user?.role === 'admin') {
        next();
      } else {
        res.status(403).json({ message: 'Admin access required' });
      }
    });

    // Setup routes
    app.use('/api/auth', authController);
    app.use('/api/lists', authenticateToken, listController);
    app.use('/api/places', authenticateToken, placesController);
    app.use('/api/admin', authenticateToken, requireAdmin, adminController);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('Authentication Controller Integration', () => {
    test('should integrate login with user validation and token generation', async () => {
      // Mock database user lookup
      db.query.mockResolvedValueOnce({
        rows: [{
          id: 'user-1',
          email: 'test@example.com',
          password: 'hashedPassword',
          role: 'user'
        }]
      });

      // Mock password validation (assuming bcrypt)
      const bcrypt = require('bcrypt');
      bcrypt.compare = jest.fn().mockResolvedValue(true);

      // Mock JWT token generation
      const jwt = require('jsonwebtoken');
      jwt.sign = jest.fn().mockReturnValue('mock-jwt-token');

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        token: 'mock-jwt-token',
        user: {
          id: 'user-1',
          email: 'test@example.com',
          role: 'user'
        }
      });

      // Verify database interaction
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        ['test@example.com']
      );

      // Verify password validation
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedPassword');

      // Verify token generation
      expect(jwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user-1' }),
        expect.any(String),
        expect.any(Object)
      );
    });

    test('should handle authentication failures at service level', async () => {
      // Mock user not found
      db.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toContain('Invalid credentials');
    });

    test('should integrate token refresh with validation', async () => {
      const jwt = require('jsonwebtoken');
      jwt.verify = jest.fn().mockReturnValue({
        userId: 'user-1',
        exp: Math.floor(Date.now() / 1000) - 100 // Expired
      });
      jwt.sign = jest.fn().mockReturnValue('new-jwt-token');

      // Mock database user lookup for refresh
      db.query.mockResolvedValueOnce({
        rows: [{
          id: 'user-1',
          email: 'test@example.com',
          role: 'user'
        }]
      });

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: 'expired-token'
        });

      expect(response.status).toBe(200);
      expect(response.body.token).toBe('new-jwt-token');
    });
  });

  describe('List Controller Integration', () => {
    test('should integrate list creation with validation and persistence', async () => {
      // Mock successful list creation
      db.query.mockResolvedValueOnce({
        rows: [{
          id: 'list-1',
          name: 'Test List',
          description: 'Test Description',
          user_id: 'user-1',
          created_at: new Date()
        }]
      });

      const response = await request(app)
        .post('/api/lists')
        .send({
          name: 'Test List',
          description: 'Test Description',
          isPublic: false
        });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        id: 'list-1',
        name: 'Test List',
        description: 'Test Description'
      });

      // Verify database integration
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO lists'),
        expect.arrayContaining(['Test List', 'Test Description', 'user-1'])
      );
    });

    test('should integrate list sharing with permission validation', async () => {
      // Mock list ownership check
      db.query
        .mockResolvedValueOnce({
          rows: [{
            id: 'list-1',
            user_id: 'user-1',
            name: 'My List'
          }]
        })
        .mockResolvedValueOnce({
          rows: [{ id: 'share-1' }]
        });

      const response = await request(app)
        .post('/api/lists/list-1/share')
        .send({
          email: 'friend@example.com',
          permission: 'read'
        });

      expect(response.status).toBe(200);

      // Verify ownership check
      expect(db.query).toHaveBeenNthCalledWith(1,
        expect.stringContaining('SELECT'),
        ['list-1', 'user-1']
      );

      // Verify share creation
      expect(db.query).toHaveBeenNthCalledWith(2,
        expect.stringContaining('INSERT INTO list_shares'),
        expect.arrayContaining(['list-1', 'friend@example.com', 'read'])
      );
    });

    test('should integrate with service layer for complex operations', async () => {
      // Mock service method
      listService.getListWithItems = jest.fn().mockResolvedValue({
        id: 'list-1',
        name: 'Test List',
        items: [
          { id: 'item-1', place_id: 'place-1', name: 'Restaurant A' }
        ],
        itemCount: 1
      });

      const response = await request(app)
        .get('/api/lists/list-1/details');

      expect(response.status).toBe(200);
      expect(response.body.items).toHaveLength(1);

      // Verify service integration
      expect(listService.getListWithItems).toHaveBeenCalledWith('list-1', 'user-1');
    });
  });

  describe('Places Controller Integration', () => {
    test('should integrate place search with Google Places API and caching', async () => {
      // Mock Google Places API response
      const mockGoogleResponse = {
        data: {
          results: [
            {
              place_id: 'ChIJ123',
              name: 'Test Restaurant',
              formatted_address: '123 Main St, NYC, NY'
            }
          ]
        }
      };

      const axios = require('axios');
      axios.get = jest.fn().mockResolvedValue(mockGoogleResponse);

      // Mock cache check (miss)
      db.query
        .mockResolvedValueOnce({ rows: [] }) // Cache miss
        .mockResolvedValueOnce({ rows: [{ id: 'cache-1' }] }); // Cache insert

      const response = await request(app)
        .get('/api/places/search')
        .query({ q: 'pizza' });

      expect(response.status).toBe(200);
      expect(response.body.places).toHaveLength(1);

      // Verify API call
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('maps.googleapis.com'),
        expect.objectContaining({
          params: expect.objectContaining({ query: 'pizza' })
        })
      );

      // Verify caching
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO search_cache'),
        expect.any(Array)
      );
    });

    test('should handle cached results and skip API calls', async () => {
      // Mock cache hit
      db.query.mockResolvedValueOnce({
        rows: [{
          id: 'cache-1',
          results: JSON.stringify([{
            place_id: 'ChIJ123',
            name: 'Cached Restaurant'
          }]),
          created_at: new Date()
        }]
      });

      const axios = require('axios');
      axios.get = jest.fn();

      const response = await request(app)
        .get('/api/places/search')
        .query({ q: 'pizza' });

      expect(response.status).toBe(200);
      expect(response.body.places[0].name).toBe('Cached Restaurant');

      // Should not call external API
      expect(axios.get).not.toHaveBeenCalled();
    });
  });

  describe('Admin Controller Integration', () => {
    beforeEach(() => {
      // Set user as admin for these tests
      mockUser.role = 'admin';
    });

    test('should integrate user management with proper authorization', async () => {
      // Mock user query
      db.query.mockResolvedValueOnce({
        rows: [
          { id: 'user-1', email: 'user1@example.com', role: 'user' },
          { id: 'user-2', email: 'user2@example.com', role: 'user' }
        ]
      });

      const response = await request(app)
        .get('/api/admin/users');

      expect(response.status).toBe(200);
      expect(response.body.users).toHaveLength(2);

      // Verify admin authorization was checked
      expect(requireAdmin).toHaveBeenCalled();
    });

    test('should integrate data cleanup operations', async () => {
      // Mock cleanup queries
      db.query
        .mockResolvedValueOnce({ rowCount: 5 }) // Deleted orphaned items
        .mockResolvedValueOnce({ rowCount: 3 }) // Deleted empty lists
        .mockResolvedValueOnce({ rowCount: 10 }); // Cleared old cache

      const response = await request(app)
        .post('/api/admin/cleanup')
        .send({
          cleanupTypes: ['orphaned_items', 'empty_lists', 'old_cache']
        });

      expect(response.status).toBe(200);
      expect(response.body.results).toMatchObject({
        orphaned_items: 5,
        empty_lists: 3,
        old_cache: 10
      });

      // Verify all cleanup queries were executed
      expect(db.query).toHaveBeenCalledTimes(3);
    });

    test('should deny access to non-admin users', async () => {
      // Set user as regular user
      mockUser.role = 'user';

      const response = await request(app)
        .get('/api/admin/users');

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('Admin access required');
    });
  });

  describe('Error Handling Integration', () => {
    test('should handle database connection errors gracefully', async () => {
      db.query.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .get('/api/lists');

      expect(response.status).toBe(500);
      expect(response.body.message).toContain('Internal server error');
    });

    test('should handle validation errors consistently', async () => {
      const response = await request(app)
        .post('/api/lists')
        .send({
          // Missing required fields
          name: '',
          description: 'Test'
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.name).toBeDefined();
    });

    test('should handle external API failures with fallbacks', async () => {
      // Mock Google Places API failure
      const axios = require('axios');
      axios.get = jest.fn().mockRejectedValue(new Error('API unavailable'));

      // Mock fallback to cached/local data
      db.query.mockResolvedValueOnce({
        rows: [{
          id: 'local-1',
          name: 'Local Restaurant',
          source: 'local'
        }]
      });

      const response = await request(app)
        .get('/api/places/search')
        .query({ q: 'pizza' });

      expect(response.status).toBe(200);
      expect(response.body.places).toBeDefined();
      expect(response.body.source).toBe('fallback');
    });
  });

  describe('Transaction Management Integration', () => {
    test('should handle complex transactions across multiple tables', async () => {
      // Mock transaction
      const mockTransaction = {
        query: jest.fn()
          .mockResolvedValueOnce({ rows: [{ id: 'list-1' }] }) // Create list
          .mockResolvedValueOnce({ rows: [{ id: 'item-1' }] }) // Add item
          .mockResolvedValueOnce({ rows: [{ id: 'share-1' }] }), // Share list
        commit: jest.fn(),
        rollback: jest.fn()
      };

      db.transaction = jest.fn().mockResolvedValue(mockTransaction);

      const response = await request(app)
        .post('/api/lists/create-and-populate')
        .send({
          name: 'New List',
          items: [{ name: 'Restaurant A', placeId: 'place-1' }],
          shareWith: ['friend@example.com']
        });

      expect(response.status).toBe(201);

      // Verify transaction was used
      expect(db.transaction).toHaveBeenCalled();
      expect(mockTransaction.query).toHaveBeenCalledTimes(3);
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    test('should rollback transactions on failures', async () => {
      const mockTransaction = {
        query: jest.fn()
          .mockResolvedValueOnce({ rows: [{ id: 'list-1' }] }) // Create list
          .mockRejectedValueOnce(new Error('Item creation failed')), // Fail
        commit: jest.fn(),
        rollback: jest.fn()
      };

      db.transaction = jest.fn().mockResolvedValue(mockTransaction);

      const response = await request(app)
        .post('/api/lists/create-and-populate')
        .send({
          name: 'New List',
          items: [{ name: 'Invalid Item' }]
        });

      expect(response.status).toBe(500);
      expect(mockTransaction.rollback).toHaveBeenCalled();
      expect(mockTransaction.commit).not.toHaveBeenCalled();
    });
  });
}); 