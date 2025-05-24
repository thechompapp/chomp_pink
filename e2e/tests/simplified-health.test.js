/**
 * Simplified Health Endpoint Test
 * 
 * This file contains a simplified test for the health endpoint
 * using our robust API client.
 */

import { describe, it, expect } from 'vitest';
import apiClient, { getHealth } from '../setup/robust-api-client.js';

// Test timeout (10 seconds)
const TEST_TIMEOUT = 10000;

describe('Health Endpoint', () => {
  it('should return a 200 status code and UP status', async () => {
    const result = await getHealth();
    
    console.log('Health check result:', result);
    
    expect(result.success).toBe(true);
    expect(result.status).toBe(200);
    expect(result.data).toHaveProperty('status', 'UP');
    expect(result.data).toHaveProperty('message');
    expect(result.data).toHaveProperty('timestamp');
  }, TEST_TIMEOUT);
  
  it('should include database pool information', async () => {
    const result = await getHealth();
    
    expect(result.success).toBe(true);
    expect(result.data).toHaveProperty('databasePool');
    expect(result.data.databasePool).toHaveProperty('total');
    expect(result.data.databasePool).toHaveProperty('idle');
    expect(result.data.databasePool).toHaveProperty('waiting');
  }, TEST_TIMEOUT);
  
  it('should include memory usage information', async () => {
    const result = await getHealth();
    
    expect(result.success).toBe(true);
    expect(result.data).toHaveProperty('memoryUsage');
    expect(result.data.memoryUsage).toHaveProperty('rss');
    expect(result.data.memoryUsage).toHaveProperty('heapTotal');
    expect(result.data.memoryUsage).toHaveProperty('heapUsed');
  }, TEST_TIMEOUT);
  
  it('should respond quickly (under 200ms)', async () => {
    const startTime = Date.now();
    const result = await getHealth();
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    console.log(`Health endpoint response time: ${responseTime}ms`);
    
    expect(result.success).toBe(true);
    expect(responseTime).toBeLessThan(200);
  }, TEST_TIMEOUT);
});
