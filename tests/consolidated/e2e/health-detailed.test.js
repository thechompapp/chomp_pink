/**
 * Detailed API Health Tests
 * 
 * This file contains comprehensive tests for the API health endpoint,
 * including performance metrics, response structure validation, and
 * response time measurements.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import axios from 'axios';

// Test timeout (10 seconds)
const TEST_TIMEOUT = 10000;

// Base URL for the API
const API_BASE_URL = 'http://localhost:5001';

// Create a simple API client
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 8000,
  headers: {
    'Content-Type': 'application/json'
  }
});

describe('Detailed API Health Tests', () => {
  describe('Response Structure', () => {
    let healthResponse;
    
    beforeAll(async () => {
      // Make a single request for all tests in this describe block
      healthResponse = await apiClient.get('/api/health');
    });
    
    it('should return a 200 status code', () => {
      expect(healthResponse.status).toBe(200);
    });
    
    it('should have the correct content type header', () => {
      expect(healthResponse.headers['content-type']).toContain('application/json');
    });
    
    it('should have a status field with value "UP"', () => {
      expect(healthResponse.data).toHaveProperty('status', 'UP');
    });
    
    it('should have a message field with a non-empty string', () => {
      expect(healthResponse.data).toHaveProperty('message');
      expect(typeof healthResponse.data.message).toBe('string');
      expect(healthResponse.data.message.length).toBeGreaterThan(0);
    });
    
    it('should have a timestamp field with a valid ISO date string', () => {
      expect(healthResponse.data).toHaveProperty('timestamp');
      expect(typeof healthResponse.data.timestamp).toBe('string');
      
      // Validate ISO date format
      const timestamp = new Date(healthResponse.data.timestamp);
      expect(timestamp.toISOString()).toBe(healthResponse.data.timestamp);
    });
  });
  
  describe('Database Pool Information', () => {
    let healthResponse;
    
    beforeAll(async () => {
      healthResponse = await apiClient.get('/api/health');
    });
    
    it('should include database pool information', () => {
      expect(healthResponse.data).toHaveProperty('databasePool');
      expect(healthResponse.data.databasePool).toHaveProperty('total');
      expect(healthResponse.data.databasePool).toHaveProperty('idle');
      expect(healthResponse.data.databasePool).toHaveProperty('waiting');
    });
    
    it('should have numeric values for database pool metrics', () => {
      expect(typeof healthResponse.data.databasePool.total).toBe('number');
      expect(typeof healthResponse.data.databasePool.idle).toBe('number');
      expect(typeof healthResponse.data.databasePool.waiting).toBe('number');
    });
  });
  
  describe('Memory Usage Information', () => {
    let healthResponse;
    
    beforeAll(async () => {
      healthResponse = await apiClient.get('/api/health');
    });
    
    it('should include memory usage information', () => {
      expect(healthResponse.data).toHaveProperty('memoryUsage');
      expect(healthResponse.data.memoryUsage).toHaveProperty('rss');
      expect(healthResponse.data.memoryUsage).toHaveProperty('heapTotal');
      expect(healthResponse.data.memoryUsage).toHaveProperty('heapUsed');
      expect(healthResponse.data.memoryUsage).toHaveProperty('external');
      expect(healthResponse.data.memoryUsage).toHaveProperty('arrayBuffers');
    });
    
    it('should have numeric values for memory usage metrics', () => {
      expect(typeof healthResponse.data.memoryUsage.rss).toBe('number');
      expect(typeof healthResponse.data.memoryUsage.heapTotal).toBe('number');
      expect(typeof healthResponse.data.memoryUsage.heapUsed).toBe('number');
      expect(typeof healthResponse.data.memoryUsage.external).toBe('number');
      expect(typeof healthResponse.data.memoryUsage.arrayBuffers).toBe('number');
    });
    
    it('should have reasonable memory usage values', () => {
      // RSS should be positive and less than 1GB (reasonable for a Node.js app)
      expect(healthResponse.data.memoryUsage.rss).toBeGreaterThan(0);
      expect(healthResponse.data.memoryUsage.rss).toBeLessThan(1024 * 1024 * 1024);
      
      // Heap used should be less than heap total
      expect(healthResponse.data.memoryUsage.heapUsed).toBeLessThanOrEqual(
        healthResponse.data.memoryUsage.heapTotal
      );
    });
  });
  
  describe('Performance', () => {
    it('should respond within 200ms', async () => {
      const startTime = Date.now();
      await apiClient.get('/api/health');
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      console.log(`Health endpoint response time: ${responseTime}ms`);
      expect(responseTime).toBeLessThan(200);
    }, TEST_TIMEOUT);
    
    it('should handle 10 consecutive requests', async () => {
      const requests = Array(10).fill().map(() => apiClient.get('/api/health'));
      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('status', 'UP');
      });
    }, TEST_TIMEOUT);
  });
});
