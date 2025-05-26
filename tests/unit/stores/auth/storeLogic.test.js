/**
 * Tests for the authentication store logic
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { create } from 'zustand/vanilla';
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

describe('Authentication Store Logic', () => {
  let store;
  
  // Create a simplified version of the store without React dependencies
  const createTestStore = () => {
    return create(useAuthenticationStore);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    store = createTestStore();
  });

  describe('Initial State', () => {
    it('should initialize with default values', () => {
      expect(store.getState().isAuthenticated).toBe(false);
      expect(store.getState().user).toBeNull();
      expect(store.getState().isLoading).toBe(false);
      expect(store.getState().error).toBeNull();
    });
  });

  describe('User Management', () => {
    it('should set and get user', () => {
      const testUser = { id: 1, username: 'testuser' };
      
      store.getState().setUser(testUser);
      
      expect(store.getState().user).toEqual(testUser);
      expect(store.getState().isAuthenticated).toBe(true);
    });

    it('should clear user on logout', () => {
      // First set a user
      store.getState().setUser({ id: 1, username: 'testuser' });
      
      // Then logout
      store.getState().logout();
      
      expect(store.getState().user).toBeNull();
      expect(store.getState().isAuthenticated).toBe(false);
      expect(localStorageMock.removeItem).toHaveBeenCalled();
    });
  });

  describe('Token Management', () => {
    it('should set and get token', () => {
      const testToken = 'test-token-123';
      
      store.getState().setToken(testToken);
      
      expect(store.getState().getToken()).toBe(testToken);
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should set and clear error', () => {
      const errorMessage = 'Test error';
      
      store.getState().setError(errorMessage);
      expect(store.getState().error).toBe(errorMessage);
      
      store.getState().clearError();
      expect(store.getState().error).toBeNull();
    });
  });
});
