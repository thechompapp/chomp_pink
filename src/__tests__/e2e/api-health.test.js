/**
 * API Health Test
 * 
 * This file contains tests for the API health endpoint, which is the only
 * endpoint that we've confirmed is working correctly.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import axios from 'axios';

// Test timeout (10 seconds)
const TEST_TIMEOUT = 10000;

// Base URL for the API
const API_BASE_URL = 'http://localhost:5173';

// Create a simple API client
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 8000,
  headers: {
    'Content-Type': 'application/json'
  }
});

describe('API Health', () => {
  describe('Health Endpoint', () => {
    it('should return a 200 status code and UP status', async () => {
      const response = await apiClient.get('/api/health');
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('status', 'UP');
      expect(response.data).toHaveProperty('message');
      expect(response.data).toHaveProperty('timestamp');
      expect(response.data).toHaveProperty('databasePool');
      expect(response.data).toHaveProperty('memoryUsage');
    }, TEST_TIMEOUT);
    
    it('should include database pool information', async () => {
      const response = await apiClient.get('/api/health');
      
      expect(response.data.databasePool).toHaveProperty('total');
      expect(response.data.databasePool).toHaveProperty('idle');
      expect(response.data.databasePool).toHaveProperty('waiting');
    }, TEST_TIMEOUT);
    
    it('should include memory usage information', async () => {
      const response = await apiClient.get('/api/health');
      
      expect(response.data.memoryUsage).toHaveProperty('rss');
      expect(response.data.memoryUsage).toHaveProperty('heapTotal');
      expect(response.data.memoryUsage).toHaveProperty('heapUsed');
      expect(response.data.memoryUsage).toHaveProperty('external');
      expect(response.data.memoryUsage).toHaveProperty('arrayBuffers');
    }, TEST_TIMEOUT);
  });
});
