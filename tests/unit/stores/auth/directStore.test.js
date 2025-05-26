/**
 * Direct tests for the authentication store logic
 * This test file avoids React hooks and tests the store directly
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { create } from 'zustand';

// Import the actual store implementation
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

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock
});

describe('Authentication Store - Direct Tests', () => {
  let store;
  
  // Helper function to create a test store
  const createTestStore = () => {
    // Create a store with the actual implementation
    return create(useAuthenticationStore);
  };

  beforeEach(() => {
    // Clear all mocks and create a fresh store
    vi.clearAllMocks();
    localStorageMock.clear();
    store = createTestStore();
  });

  describe('Basic State Management', () => {
    it('should initialize with default values', () => {
      const state = store.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should update user state', () => {
      const testUser = { id: 1, username: 'testuser' };
      
      // Set user directly
      store.getState().setUser(testUser);
      
      // Check the updated state
      expect(store.getState().user).toEqual(testUser);
      expect(store.getState().isAuthenticated).toBe(true);
    });

    it('should clear user on logout', () => {
      // First set a user
      store.getState().setUser({ id: 1, username: 'testuser' });
      
      // Then logout
      store.getState().logout();
      
      // Check the state was cleared
      expect(store.getState().user).toBeNull();
      expect(store.getState().isAuthenticated).toBe(false);
    });
  });

  describe('Token Management', () => {
    it('should set and get token', () => {
      const testToken = 'test-token-123';
      
      // Set token
      store.getState().setToken(testToken);
      
      // Check token was set
      expect(store.getState().getToken()).toBe(testToken);
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should set and clear errors', () => {
      const errorMessage = 'Test error';
      
      // Set error
      store.getState().setError(errorMessage);
      expect(store.getState().error).toBe(errorMessage);
      
      // Clear error
      store.getState().clearError();
      expect(store.getState().error).toBeNull();
    });
  });
});
