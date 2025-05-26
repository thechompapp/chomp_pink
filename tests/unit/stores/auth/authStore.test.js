/**
 * Unit tests for the Authentication Store
 */
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { create } from 'zustand';
import useAuthenticationStore from '../../../../src/stores/auth/useAuthenticationStore';

// Mock dependencies
vi.mock('@/services/http', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn()
  }
}));

vi.mock('@/utils/ErrorHandler', () => ({
  default: {
    handle: vi.fn((error) => ({
      message: error.message || 'An error occurred',
      code: error.code
    })),
    isNetworkError: vi.fn(() => false)
  }
}));

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    })
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('Authentication Store', () => {
  let store;
  let originalEnv;

  beforeEach(() => {
    // Store original process.env
    originalEnv = { ...process.env };
    
    // Create a fresh store for each test
    store = create(useAuthenticationStore);
    
    // Reset all mocks
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  afterEach(() => {
    // Restore original process.env
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      expect(store.getState().isAuthenticated).toBe(false);
      expect(store.getState().user).toBeNull();
      expect(store.getState().isLoading).toBe(false);
      expect(store.getState().error).toBeNull();
    });
  });

  describe('Authentication', () => {
    it('should set user on login', async () => {
      const mockUser = { id: 1, username: 'testuser', token: 'test-token' };
      
      // Mock successful login response
      const { apiClient } = await import('@/services/http');
      apiClient.post.mockResolvedValueOnce({
        data: { user: mockUser }
      });

      await store.getState().login({
        email: 'test@example.com',
        password: 'password123'
      });

      expect(store.getState().user).toEqual(mockUser);
      expect(store.getState().isAuthenticated).toBe(true);
      expect(store.getState().token).toBe(mockUser.token);
    });

    it('should handle login errors', async () => {
      const error = new Error('Login failed');
      
      // Mock failed login
      const { apiClient } = await import('@/services/http');
      apiClient.post.mockRejectedValueOnce(error);

      await store.getState().login({
        email: 'test@example.com',
        password: 'wrongpassword'
      });

      expect(store.getState().user).toBeNull();
      expect(store.getState().isAuthenticated).toBe(false);
      expect(store.getState().error).toBe('Login failed');
    });
  });

  describe('Logout', () => {
    it('should clear user data on logout', async () => {
      // First login
      const mockUser = { id: 1, username: 'testuser', token: 'test-token' };
      store.getState().setUser(mockUser);
      
      // Mock successful logout
      const { apiClient } = await import('@/services/http');
      apiClient.post.mockResolvedValueOnce({});

      await store.getState().logout();

      expect(store.getState().user).toBeNull();
      expect(store.getState().isAuthenticated).toBe(false);
      expect(store.getState().token).toBeNull();
      expect(localStorageMock.removeItem).toHaveBeenCalled();
    });
  });

  describe('Check Authentication Status', () => {
    it('should check auth status when cache is valid', async () => {
      // Set up initial state with recent auth check
      const recentCheckTime = Date.now() - 60000; // 1 minute ago
      store.getState().setUser({ id: 1, username: 'testuser' });
      store.getState().setLastAuthCheck(recentCheckTime);
      
      const isAuthenticated = await store.getState().checkAuthStatus();
      
      expect(isAuthenticated).toBe(true);
      // Should not call the API when cache is valid
      const { apiClient } = await import('@/services/http');
      expect(apiClient.get).not.toHaveBeenCalled();
    });
  });
});
