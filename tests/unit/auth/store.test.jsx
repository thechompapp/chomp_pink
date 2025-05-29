import React from 'react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TEST_USERS } from '../../utils/auth';
import { createTestStore } from '../../test-utils/store-test-utils';

// Mock React components to avoid JSX issues in tests
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    createContext: vi.fn(),
    useContext: vi.fn(),
  };
});

// Mock React Router
vi.mock('react-router-dom', () => ({
  MemoryRouter: ({ children }) => <div>{children}</div>,
  Route: ({ children }) => <div>{children}</div>,
  Routes: ({ children }) => <div>{children}</div>,
  useNavigate: () => vi.fn(),
  useLocation: () => ({}),
}));

// Mock Auth Context
vi.mock('@/contexts/AuthContext', () => ({
  AuthProvider: ({ children }) => <div>{children}</div>,
  useAuth: () => ({
    isAuthenticated: false,
    user: null,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

// Mock Theme Context
vi.mock('@/contexts/ThemeContext', () => ({
  ThemeProvider: ({ children }) => <div>{children}</div>,
  useTheme: () => ({
    theme: 'light',
    toggleTheme: vi.fn(),
  }),
}));

// Mock the API client
vi.mock('@/services/http', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
    defaults: {
      headers: {
        common: {}
      }
    }
  }
}));

// Mock the logger
vi.mock('@/utils/logger', () => ({
  logInfo: vi.fn(),
  logWarn: vi.fn(),
  logError: vi.fn()
}));

// Mock the error handler
vi.mock('@/utils/ErrorHandler', () => ({
  default: {
    handle: vi.fn().mockImplementation((error) => ({
      message: error.message || 'An error occurred'
    }))
  }
}));

describe('Auth Store', () => {
  let store;
  let apiClient;
  let logger;
  let errorHandler;

  // Mock localStorage
  const localStorageMock = (() => {
    let store = {};
    return {
      getItem: vi.fn((key) => store[key] || null),
      setItem: vi.fn((key, value) => {
        store[key] = String(value);
      }),
      removeItem: vi.fn((key) => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        store = {};
      }),
    };
  })();

  beforeEach(async () => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Setup global localStorage mock
    global.localStorage = localStorageMock;
    
    // Create a fresh store instance
    store = createTestStore();
    
    // Get mocked dependencies
    const http = await import('@/services/http');
    apiClient = http.apiClient;
    logger = await import('@/utils/logger');
    errorHandler = (await import('@/utils/ErrorHandler')).default;
  });

  afterEach(() => {
    // Reset the store state
    store.getState().reset();
  });

  it('should initialize with default state', () => {
    const state = store.getState();
    expect(state).toMatchObject({
      isAuthenticated: false,
      user: null,
      token: null,
      isLoading: false,
      error: null,
      initialized: false
    });
  });

  it('should handle login', async () => {
    const { user, password } = TEST_USERS.user;
    const mockResponse = {
      data: {
        user,
        token: 'test-token',
        refreshToken: 'refresh-token'
      }
    };
    
    // Mock successful API response
    apiClient.post.mockResolvedValueOnce(mockResponse);
    
    // Perform login
    await store.getState().login({ email: user.email, password });
    
    // Verify state updates
    const state = store.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toEqual(user);
    expect(state.token).toBe('test-token');
    
    // Verify API call was made
    expect(apiClient.post).toHaveBeenCalledWith('/auth/login', {
      email: user.email,
      password
    });
  });

  it('should handle login failure', async () => {
    const error = new Error('Login failed');
    apiClient.post.mockRejectedValueOnce(error);
    
    await store.getState().login({ email: 'test@example.com', password: 'wrong' });
    
    expect(store.getState().error).toBeDefined();
    expect(errorHandler.handle).toHaveBeenCalledWith(error, 'AuthStore.login');
  });

  it('should handle logout', async () => {
    // First login
    const { user } = TEST_USERS.user;
    store.getState().setUser(user, 'test-token');
    
    // Mock logout API call
    apiClient.post.mockResolvedValueOnce({});
    
    // Perform logout
    await store.getState().logout();
    
    // Verify state was reset
    const state = store.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
  });

  it('should handle token refresh', async () => {
    const newToken = 'new-test-token';
    const refreshToken = 'refresh-token';
    
    // Mock successful refresh
    apiClient.post.mockResolvedValueOnce({
      data: {
        token: newToken,
        refreshToken: 'new-refresh-token'
      }
    });
    
    // Set initial token
    store.getState().setUser(TEST_USERS.user, 'expired-token');
    
    // Perform refresh
    await store.getState().refreshToken(refreshToken);
    
    // Verify new token was set
    expect(store.getState().token).toBe(newToken);
    expect(apiClient.post).toHaveBeenCalledWith('/auth/refresh-token', { refreshToken });
  });

  it('should handle errors', () => {
    const error = new Error('Test error');
    store.getState().setError(error);
    
    expect(store.getState().error).toBe(error);
    expect(logger.logError).toHaveBeenCalledWith('AuthStore Error:', error);
  });
});
