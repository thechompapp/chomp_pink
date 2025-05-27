/**
 * Unit tests for the Authentication Store
 */
import { act } from '@testing-library/react-hooks';
import { vi, describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest';
import useAuthenticationStore from '../../../../src/stores/auth/useAuthenticationStore';
import { apiClient } from '../../../../src/services/http';
import ErrorHandler from '../../../../src/utils/ErrorHandler';
import { renderHook } from '../../../setup/render-hook';

// Enable auto cleanup for hooks
afterEach(() => {
  vi.clearAllMocks();
});

// Mock dependencies
vi.mock('../../../../src/services/http', () => {
  const originalModule = vi.importActual('../../../../src/services/http');
  return {
    ...originalModule,
    apiClient: {
      ...originalModule.apiClient,
      get: vi.fn(),
      post: vi.fn(),
      defaults: {
        headers: {
          common: {}
        }
      }
    }
  };
});

vi.mock('../../../../src/utils/ErrorHandler', () => ({
  default: {
    handle: vi.fn(),
    isNetworkError: vi.fn(),
    clear: vi.fn()
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

// Mock window events
const mockAddEventListener = vi.fn();
const mockRemoveEventListener = vi.fn();

Object.defineProperty(window, 'addEventListener', {
  value: mockAddEventListener,
  configurable: true
});

Object.defineProperty(window, 'removeEventListener', {
  value: mockRemoveEventListener,
  configurable: true
});

// Mock document
const mockDocument = {
  visibilityState: 'visible',
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn()
};

Object.defineProperty(global, 'document', {
  value: mockDocument,
  writable: true,
  configurable: true
});

// Mock requestAnimationFrame
const mockRequestAnimationFrame = (callback) => {
  return setTimeout(callback, 0);
};

const mockCancelAnimationFrame = (id) => {
  clearTimeout(id);
};

Object.defineProperty(window, 'requestAnimationFrame', {
  value: mockRequestAnimationFrame,
  writable: true
});

Object.defineProperty(window, 'cancelAnimationFrame', {
  value: mockCancelAnimationFrame,
  writable: true
});

describe('useAuthenticationStore', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.resetAllMocks();
    
    // Clear localStorage
    localStorageMock.clear();
    
    // Reset the store to initial state
    act(() => {
      useAuthenticationStore.setState({
        ...useAuthenticationStore.initialState,
        isAdmin: false,
        isOffline: false,
        _hasHydrated: true // Skip hydration for tests
      }, true);
    });
    
    // Reset mocks
    if (mockAddEventListener) mockAddEventListener.mockClear();
    if (mockRemoveEventListener) mockRemoveEventListener.mockClear();
    if (mockDocument?.addEventListener) mockDocument.addEventListener.mockClear();
    if (mockDocument?.removeEventListener) mockDocument.removeEventListener.mockClear();
  });
  
  afterEach(() => {
    // Clean up any timers
    vi.clearAllTimers();
  });

  describe('checkAuthStatus', () => {
    it('should return true when user is already authenticated and cache is valid', async () => {
      // Setup initial state with authenticated user and recent lastAuthCheck
      act(() => {
        useAuthenticationStore.setState({
          isAuthenticated: true,
          user: { id: 1, username: 'testuser' },
          lastAuthCheck: Date.now() - 60000 // 1 minute ago
        });
      });

      const { result } = renderHook(() => useAuthenticationStore());
      
      // Call checkAuthStatus
      let isAuthenticated;
      await act(async () => {
        isAuthenticated = await result.current.checkAuthStatus();
      });
      
      // Verify result and that API was not called
      expect(isAuthenticated).toBe(true);
      expect(vi.mocked(apiClient.get)).not.toHaveBeenCalled();
    });

    it('should call API when cache is expired', async () => {
      // Setup initial state with authenticated user but expired lastAuthCheck
      act(() => {
        useAuthenticationStore.setState({
          isAuthenticated: true,
          user: { id: 1, username: 'testuser' },
          lastAuthCheck: Date.now() - 6000000 // 100 minutes ago (expired)
        });
      });

      // Mock successful API response
      apiClient.get.mockResolvedValueOnce({
        data: {
          success: true,
          data: { id: 1, username: 'testuser' }
        }
      });

      const { result } = renderHook(() => useAuthenticationStore());
      
      // Call checkAuthStatus
      let isAuthenticated;
      await act(async () => {
        isAuthenticated = await result.current.checkAuthStatus();
      });
      
      // Verify API was called and state was updated
      expect(apiClient.get).toHaveBeenCalledWith('/auth/status');
      expect(isAuthenticated).toBe(true);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual({ id: 1, username: 'testuser' });
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.lastAuthCheck).toBeDefined();
    });

    it('should handle API error and set unauthenticated state', async () => {
      // Setup initial state
      act(() => {
        useAuthenticationStore.setState({
          isAuthenticated: false,
          user: null,
          lastAuthCheck: null
        });
      });

      // Mock API error
      const error = new Error('API error');
      apiClient.get.mockRejectedValueOnce(error);
      
      // Mock error handler
      ErrorHandler.handle.mockReturnValueOnce({
        message: 'Authentication failed'
      });
      
      const { result } = renderHook(() => useAuthenticationStore());
      
      // Call checkAuthStatus
      let isAuthenticated;
      await act(async () => {
        isAuthenticated = await result.current.checkAuthStatus();
      });
      
      // Verify error handling and state
      expect(apiClient.get).toHaveBeenCalledWith('/auth/status');
      expect(ErrorHandler.handle).toHaveBeenCalled();
      expect(isAuthenticated).toBe(false);
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBe(null);
      expect(result.current.error).toBe('Authentication failed');
    });

    it('should handle network error and keep existing session if authenticated', async () => {
      // Setup initial state with authenticated user
      act(() => {
        useAuthenticationStore.setState({
          isAuthenticated: true,
          user: { id: 1, username: 'testuser' },
          lastAuthCheck: Date.now() - 6000000 // 100 minutes ago (expired)
        });
      });

      // Mock network error
      const error = new Error('Network error');
      apiClient.get.mockRejectedValueOnce(error);
      
      // Mock network error detection
      ErrorHandler.isNetworkError.mockReturnValueOnce(true);
      
      const { result } = renderHook(() => useAuthenticationStore());
      
      // Call checkAuthStatus
      let isAuthenticated;
      await act(async () => {
        isAuthenticated = await result.current.checkAuthStatus(true); // Force check
      });
      
      // Verify error handling and state preservation
      expect(apiClient.get).toHaveBeenCalledWith('/auth/status');
      expect(ErrorHandler.isNetworkError).toHaveBeenCalledWith(error);
      expect(isAuthenticated).toBe(true);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual({ id: 1, username: 'testuser' });
    });
  });

  describe('login', () => {
    it('should successfully login and update state', async () => {
      // Mock successful login response
      apiClient.post.mockResolvedValueOnce({
        data: {
          success: true,
          data: { id: 1, username: 'testuser', email: 'test@example.com' },
          token: 'test-token'
        }
      });

      const { result } = renderHook(() => useAuthenticationStore());
      
      // Call login
      let loginSuccess;
      await act(async () => {
        loginSuccess = await result.current.login({
          email: 'test@example.com',
          password: 'password123'
        });
      });
      
      // Verify API call and state updates
      expect(apiClient.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'password123'
      });
      
      expect(loginSuccess).toBe(true);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.token).toBe('test-token');
      expect(result.current.user).toEqual({ id: 1, username: 'testuser', email: 'test@example.com' });
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
      
      // Verify event dispatch
      expect(window.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'auth:login_complete'
        })
      );
    });

    it('should handle login failure and set error state', async () => {
      // Mock login failure
      apiClient.post.mockResolvedValueOnce({
        data: {
          success: false,
          message: 'Invalid credentials'
        }
      });

      const { result } = renderHook(() => useAuthenticationStore());
      
      // Call login
      let loginSuccess;
      await act(async () => {
        loginSuccess = await result.current.login({
          email: 'test@example.com',
          password: 'wrong-password'
        });
      });
      
      // Verify error handling
      expect(apiClient.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'wrong-password'
      });
      
      expect(loginSuccess).not.toBe(true);
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBe(null);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeDefined();
    });

    it('should handle API errors during login', async () => {
      // Mock API error
      const error = new Error('API error');
      apiClient.post.mockRejectedValueOnce(error);
      
      // Mock error handler
      ErrorHandler.handle.mockReturnValueOnce({
        message: 'Login failed due to server error'
      });
      
      const { result } = renderHook(() => useAuthenticationStore());
      
      // Call login
      let errorMessage;
      await act(async () => {
        errorMessage = await result.current.login({
          email: 'test@example.com',
          password: 'password123'
        });
      });
      
      // Verify error handling
      expect(apiClient.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'password123'
      });
      
      expect(ErrorHandler.handle).toHaveBeenCalled();
      expect(errorMessage).toBe('Login failed due to server error');
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBe(null);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe('Login failed due to server error');
    });
  });

  describe('logout', () => {
    it('should clear authentication state and storage on successful logout', async () => {
      // Set up initial authenticated state
      const mockUser = { id: '123', email: 'test@example.com', username: 'testuser' };
      const mockToken = 'test-token-123';
      
      act(() => {
        useAuthenticationStore.setState({
          isAuthenticated: true,
          user: mockUser,
          token: mockToken,
          isLoading: false,
          error: null,
          lastAuthCheck: Date.now()
        });
      });
      
      // Mock successful logout response
      apiClient.post.mockResolvedValueOnce({ data: { success: true } });
      
      // Render the hook
      const { result } = renderHookWithProviders(() => useAuthenticationStore());
      
      // Initial state should be authenticated
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockUser);
      
      // Call logout
      await act(async () => {
        await result.current.logout();
      });
      
      // Verify the API was called
      expect(apiClient.post).toHaveBeenCalledWith('/auth/logout');
      
      // Verify the state was cleared
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('authToken');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('user');
    });
    
    it('should clear state even if logout API call fails', async () => {
      // Set up initial authenticated state
      const mockUser = { id: '123', email: 'test@example.com', username: 'testuser' };
      const mockToken = 'test-token-123';
      
      act(() => {
        useAuthenticationStore.setState({
          isAuthenticated: true,
          user: mockUser,
          token: mockToken,
          isLoading: false,
          error: null
        });
      });
      
      // Mock failed logout response
      const error = new Error('Network Error');
      apiClient.post.mockRejectedValueOnce(error);
      
      // Render the hook
      const { result } = renderHookWithProviders(() => useAuthenticationStore());
      
      // Call logout
      await act(async () => {
        await result.current.logout();
      });
      
      // Verify the API was called
      expect(apiClient.post).toHaveBeenCalledWith('/auth/logout');
      
      // Verify error was handled
      expect(ErrorHandler.handle).toHaveBeenCalledWith(error, {
        context: 'useAuthenticationStore.logout',
        showNotification: true,
        defaultMessage: 'Failed to logout. Please try again.'
      });
      
      // Verify the state was still cleared despite the error
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('authToken');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('user');
    });
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
      
      // Verify localStorage operations
      expect(localStorageMock.setItem).toHaveBeenCalledWith('user_explicitly_logged_out', 'true');
      expect(localStorageMock.clear).toHaveBeenCalled();
      
      // Verify event dispatch
      expect(window.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'auth:logout_complete'
        })
      );
    });

    it('should clear state even if logout API call fails', async () => {
      // Setup initial authenticated state
      act(() => {
        useAuthenticationStore.setState({
          isAuthenticated: true,
          user: { id: 1, username: 'testuser' },
          token: 'test-token',
          lastAuthCheck: Date.now()
        });
      });

      // Mock authService import with error
      vi.mock('../../../../src/services/authService.js', () => ({
        authService: {
          logout: vi.fn().mockRejectedValue(new Error('Logout API error'))
        }
      }));

      const { result } = renderHook(() => useAuthenticationStore());
      
      // Call logout
      await act(async () => {
        await result.current.logout();
      });
      
      // Verify state clearing despite API error
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBe(null);
      expect(result.current.token).toBe(null);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
      
      // Verify localStorage operations
      expect(localStorageMock.setItem).toHaveBeenCalledWith('user_explicitly_logged_out', 'true');
      expect(localStorageMock.clear).toHaveBeenCalled();
    });
  });

  describe('getters', () => {
    beforeEach(() => {
      // Reset store state before each test
      act(() => {
        useAuthenticationStore.setState(useAuthenticationStore.initialState);
      });
    });
    
    it('should return current user', () => {
      const testUser = { id: '1', username: 'testuser', email: 'test@example.com' };
      
      act(() => {
        useAuthenticationStore.setState({ user: testUser });
      });
      
      const { result } = renderHookWithProviders(() => useAuthenticationStore());
      expect(result.current.user).toEqual(testUser);
    });
    
    it('should return authentication status', () => {
      act(() => {
        useAuthenticationStore.setState({ isAuthenticated: true });
      });
      
      const { result } = renderHookWithProviders(() => useAuthenticationStore());
      expect(result.current.isAuthenticated).toBe(true);
    });
    
    it('should return loading status', () => {
      act(() => {
        useAuthenticationStore.setState({ isLoading: true });
      });
      
      const { result } = renderHookWithProviders(() => useAuthenticationStore());
      expect(result.current.isLoading).toBe(true);
    });
    
    it('should return token', () => {
      const testToken = 'test-token-123';
      act(() => {
        useAuthenticationStore.setState({ token: testToken });
      });
      
      const { result } = renderHookWithProviders(() => useAuthenticationStore());
      expect(result.current.token).toBe(testToken);
    });
  });
  
  describe('error handling', () => {
    it('should handle network errors during login', async () => {
      const error = new Error('Network Error');
      apiClient.post.mockRejectedValueOnce(error);
      
      const { result } = renderHookWithProviders(() => useAuthenticationStore());
      
      await act(async () => {
        await result.current.login('test@example.com', 'password123');
      });
      
      expect(ErrorHandler.handle).toHaveBeenCalledWith(error, {
        context: 'useAuthenticationStore.login',
        showNotification: true,
        defaultMessage: 'Failed to login. Please check your credentials and try again.'
      });
      
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.error).toBe('Failed to login. Please check your credentials and try again.');
    });
    
    it('should handle API errors during authentication check', async () => {
      const error = new Error('API Error');
      apiClient.get.mockRejectedValueOnce(error);
      
      const { result } = renderHookWithProviders(() => useAuthenticationStore());
      
      await act(async () => {
        await result.current.checkAuthStatus();
      });
      
      expect(ErrorHandler.handle).toHaveBeenCalledWith(error, {
        context: 'useAuthenticationStore.checkAuthStatus',
        showNotification: false,
        defaultMessage: 'Failed to check authentication status.'
      });
      
      expect(result.current.isAuthenticated).toBe(false);
    });
  });
});

describe('useAuthenticationStore - Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    act(() => {
      useAuthenticationStore.setState(useAuthenticationStore.initialState, true);
    });
  });
  
  it('should handle missing localStorage gracefully', () => {
    // Temporarily remove localStorage
    const originalLocalStorage = global.localStorage;
    delete global.localStorage;
    
    // This should not throw
    const { result } = renderHookWithProviders(() => useAuthenticationStore());
    
    // Restore localStorage
    global.localStorage = originalLocalStorage;
    
    expect(result.current).toBeDefined();
  });
  
  it('should handle missing window object', () => {
    const originalWindow = global.window;
    delete global.window;
    
    // This should not throw
    const { result } = renderHookWithProviders(() => useAuthenticationStore());
    
    global.window = originalWindow;
  });

  it('should handle malformed user data in localStorage', async () => {
    localStorageMock.setItem('user', 'invalid-json');
    const result = setup();
    expect(result.current.user).toBeNull();
  });
});
