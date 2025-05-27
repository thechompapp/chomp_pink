import { describe, it, expect } from 'vitest';
import axios from 'axios';

// Test configuration
const API_BASE_URL = 'http://localhost:5001/api';
const TEST_TIMEOUT = 10000; // 10 seconds

describe('API Health Check (Vitest)', () => {
  it('should return 200 and server status', async () => {
    const response = await axios.get(`${API_BASE_URL}/health`);
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('status');
    expect(response.data).toHaveProperty('timestamp');
  }, TEST_TIMEOUT);

  it('should return database connection status', async () => {
    const response = await axios.get(`${API_BASE_URL}/health`);
    expect(response.data).toHaveProperty('databasePool');
    expect(response.data.databasePool).toHaveProperty('total');
    expect(response.data.databasePool).toHaveProperty('idle');
    expect(response.data.databasePool).toHaveProperty('waiting');
  }, TEST_TIMEOUT);

  it('should include memory usage information', async () => {
    const response = await axios.get(`${API_BASE_URL}/health`);
    expect(response.data).toHaveProperty('memoryUsage');
    expect(response.data.memoryUsage).toHaveProperty('rss');
    expect(response.data.memoryUsage).toHaveProperty('heapTotal');
    expect(response.data.memoryUsage).toHaveProperty('heapUsed');
  }, TEST_TIMEOUT);
});
