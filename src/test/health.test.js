import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import axios from 'axios';

describe('API Health Check', () => {
  const API_URL = 'http://localhost:5001/api/health';

  it('should return 200 and server status', async () => {
    const response = await axios.get(API_URL);
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('status', 'ok');
    expect(response.data).toHaveProperty('timestamp');
  });

  it('should return database connection status', async () => {
    const response = await axios.get(API_URL);
    expect(response.data).toHaveProperty('database');
    expect(response.data.database).toHaveProperty('status', 'connected');
  });
});
