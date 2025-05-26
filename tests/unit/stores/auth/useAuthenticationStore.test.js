/**
 * Unit tests for the Authentication Store
 */
import { renderHook, act } from '@testing-library/react-hooks';
import { vi, describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest';
import useAuthenticationStore from '../../../../src/stores/auth/useAuthenticationStore';
import { apiClient } from '../../../../src/services/http';
import ErrorHandler from '../../../../src/utils/ErrorHandler';

// Enable auto cleanup for hooks
afterEach(() => {
  vi.clearAllMocks();
});

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

// Mock window events
window.dispatchEvent = vi.fn();

describe('useAuthenticationStore', () => {
  beforeEach(() => {
    // Clear mocks and localStorage before each test
    vi.clearAllMocks();
    localStorageMock.clear();
    
    // Reset store state
    act(() => {
      useAuthenticationStore.setState({
        token: null,
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: null,
        lastAuthCheck: null
      });
    });
    
    // Setup default mocks
    vi.mocked(apiClient.get).mockReset();
    vi.mocked(apiClient.post).mockReset();
    vi.mocked(ErrorHandler.handle).mockReset();
    vi.mocked(ErrorHandler.isNetworkError).mockReset();
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
    it('should clear authentication state and storage on logout', async () => {
      // Setup initial authenticated state
      act(() => {
        useAuthenticationStore.setState({
          isAuthenticated: true,
          user: { id: 1, username: 'testuser' },
          token: 'test-token',
          lastAuthCheck: Date.now()
        });
      });

      // Mock authService import and logout method
      vi.mock('../../../../src/services/authService.js', () => ({
        authService: {
          logout: vi.fn().mockResolvedValue({ success: true })
        }
      }));

      const { result } = renderHook(() => useAuthenticationStore());
      
      // Call logout
      await act(async () => {
        await result.current.logout();
      });
      
      // Verify state clearing
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBe(null);
      expect(result.current.token).toBe(null);
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
    it('should return current user', () => {
      const testUser = { id: 1, username: 'testuser' };
      
      act(() => {
        useAuthenticationStore.setState({ user: testUser });
      });

      const { result } = renderHook(() => useAuthenticationStore());
      
      expect(result.current.getCurrentUser()).toEqual(testUser);
    });

    it('should return authentication status', () => {
      act(() => {
        useAuthenticationStore.setState({ isAuthenticated: true });
      });

      const { result } = renderHook(() => useAuthenticationStore());
      
      expect(result.current.getIsAuthenticated()).toBe(true);
    });

    it('should return loading status', () => {
      act(() => {
        useAuthenticationStore.setState({ isLoading: true });
      });

      const { result } = renderHook(() => useAuthenticationStore());
      
      expect(result.current.getIsLoading()).toBe(true);
    });

    it('should return token', () => {
      act(() => {
        useAuthenticationStore.setState({ token: 'test-token' });
      });

      const { result } = renderHook(() => useAuthenticationStore());
      
      expect(result.current.getToken()).toBe('test-token');
    });
  });
});
