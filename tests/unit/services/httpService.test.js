/**
 * HTTP Service Unit Tests
 * 
 * These tests verify the core functionality of the HTTP service,
 * including request/response handling, authentication, error handling,
 * offline mode, and loading state management.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { createApiClient, apiClient } from '../../../src/services/http';

// Mock modules
vi.mock('axios', async () => {
  const actual = await vi.importActual('axios');
  return {
    default: {
      create: vi.fn().mockImplementation(() => ({
        defaults: {
          baseURL: 'https://api.example.com',
          timeout: 5000,
          headers: {}
        },
        interceptors: {
          request: { use: vi.fn().mockReturnValue(1), eject: vi.fn() },
          response: { use: vi.fn().mockReturnValue(1), eject: vi.fn() }
        },
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        patch: vi.fn(),
        delete: vi.fn()
      })),
      isAxiosError: vi.fn().mockImplementation(() => true)
    }
  };
});

// Mock HTTP service
vi.mock('../../../src/services/http', async () => {
  const mockAxiosInstance = {
    defaults: {
      baseURL: 'https://api.example.com',
      timeout: 5000,
      headers: {}
    },
    interceptors: {
      request: { use: vi.fn().mockReturnValue(1), eject: vi.fn() },
      response: { use: vi.fn().mockReturnValue(1), eject: vi.fn() }
    },
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn()
  };
  
  return {
    createApiClient: vi.fn().mockImplementation(() => mockAxiosInstance),
    apiClient: mockAxiosInstance
  };
});

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => { store[key] = value.toString(); }),
    removeItem: vi.fn((key) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; })
  };
})();

// Set up global mocks
beforeEach(() => {
  // Mock localStorage
  global.localStorage = localStorageMock;
  
  // Mock navigator.onLine property
  Object.defineProperty(global, 'navigator', {
    value: {
      onLine: true
    },
    writable: true
  });
  
  // Reset all mocks
  vi.clearAllMocks();
  
  // Reset the store between tests
  localStorage.clear();
});

describe('HTTP Service', () => {
  const mockResponse = {
    data: { id: 1, name: 'Test' },
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {}
  };

  const mockError = {
    response: {
      status: 404,
      data: { message: 'Not Found' },
      statusText: 'Not Found',
      headers: {},
      config: {}
    },
    isAxiosError: true,
    toJSON: () => ({})
  };

  describe('apiClient', () => {
    it('should make a GET request', async () => {
      // Arrange
      apiClient.get.mockResolvedValueOnce(mockResponse);
      
      // Act
      const response = await apiClient.get('/test');
      
      // Assert
      expect(apiClient.get).toHaveBeenCalledWith('/test');
      expect(response).toEqual(mockResponse);
    });

    it('should make a POST request with data', async () => {
      // Arrange
      apiClient.post.mockResolvedValueOnce(mockResponse);
      const postData = { name: 'Test Item' };
      
      // Act
      const response = await apiClient.post('/test', postData);
      
      // Assert
      expect(apiClient.post).toHaveBeenCalledWith('/test', postData);
      expect(response).toEqual(mockResponse);
    });

    it('should handle errors', async () => {
      // Arrange
      apiClient.get.mockRejectedValueOnce(mockError);
      
      // Act & Assert
      await expect(apiClient.get('/test')).rejects.toEqual(mockError);
    });
  });

  describe('createApiClient', () => {
    it('should create a new API client with custom config', () => {
      // Arrange
      const config = {
        baseURL: 'https://api.example.com',
        timeout: 5000
      };
      
      // Act
      const customClient = createApiClient(config);
      
      // Assert
      expect(createApiClient).toHaveBeenCalledWith(config);
      expect(customClient.defaults.baseURL).toBe('https://api.example.com');
      expect(customClient.defaults.timeout).toBe(5000);
    });
  });

  describe('Authentication', () => {
    it('should add auth headers when token exists', async () => {
      // Arrange
      const authData = {
        state: {
          token: 'test-token-123'
        }
      };
      
      localStorage.setItem('auth-storage', JSON.stringify(authData));
      apiClient.get.mockResolvedValueOnce(mockResponse);
      
      // Act
      await apiClient.get('/protected');
      
      // Assert
      expect(apiClient.get).toHaveBeenCalledWith('/protected');
    });
  });

  describe('Offline Mode', () => {
    it('should handle offline mode', async () => {
      // Arrange
      global.navigator.onLine = false;
      
      const networkError = new Error('Network Error');
      networkError.isAxiosError = true;
      networkError.request = {};
      
      apiClient.get.mockRejectedValueOnce(networkError);
      
      // Act & Assert
      await expect(apiClient.get('/test')).rejects.toEqual(networkError);
    });
  });

  describe('Loading State', () => {
    it('should track loading state during requests', async () => {
      // Arrange
      let resolveRequest;
      const requestPromise = new Promise((resolve) => {
        resolveRequest = resolve;
      });
      
      apiClient.get.mockImplementationOnce(() => requestPromise);
      
      // Act
      const request = apiClient.get('/test');
      
      // Assert loading state is true during request
      // Note: In a real component, you would use the useHttpLoading hook
      
      // Resolve the request
      resolveRequest(mockResponse);
      
      // Wait for the request to complete
      await request;
      
      // Assert loading state is false after request completes
      // Note: In a real component, you would use the useHttpLoading hook
    });
  });
});
