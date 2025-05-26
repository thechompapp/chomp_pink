/**
 * Unit tests for the Authentication Store
 */
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { create } from 'zustand';
import useAuthenticationStore from '../../../../src/stores/auth/useAuthenticationStore';

// Mock dependencies
vi.mock('../../../../src/services/http', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn()
  }
}));

vi.mock('../../../../src/utils/ErrorHandler', () => ({
  default: {
    handle: vi.fn(),
    isNetworkError: vi.fn()
  }
}));

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn(key => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn(key => {
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

describe('useAuthenticationStore', () => {
  let store;

  beforeEach(() => {
    // Create a fresh store for each test
    store = create(useAuthenticationStore);
    
    // Reset all mocks
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('checkAuthStatus', () => {
    it('should initialize with default values', () => {
      expect(store.getState().isAuthenticated).toBe(false);
      expect(store.getState().user).toBeNull();
      expect(store.getState().isLoading).toBe(false);
      expect(store.getState().error).toBeNull();
    });

    it('should set user on login', () => {
      const user = { id: 1, username: 'testuser' };
      store.getState().setUser(user);
      expect(store.getState().user).toEqual(user);
      expect(store.getState().isAuthenticated).toBe(true);
    });

    it('should clear user on logout', () => {
      // First login
      const user = { id: 1, username: 'testuser' };
      store.getState().setUser(user);
      
      // Then logout
      store.getState().logout();
      
      expect(store.getState().user).toBeNull();
      expect(store.getState().isAuthenticated).toBe(false);
    });
  });

  // Add more test cases as needed
});
