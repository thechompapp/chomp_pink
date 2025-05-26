/**
 * Authentication Service Tests
 * 
 * Unit tests for the authentication service.
 */
import { authService } from '@/auth/services/authService';
import { apiClient } from '@/services/http';

// Mock the HTTP client
jest.mock('@/services/http', () => ({
  apiClient: {
    post: jest.fn(),
    get: jest.fn(),
    put: jest.fn()
  }
}));

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  
  return {
    getItem: jest.fn(key => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn(key => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    })
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock logger
jest.mock('@/utils/logger', () => ({
  logDebug: jest.fn(),
  logError: jest.fn(),
  logInfo: jest.fn(),
  logWarn: jest.fn()
}));

describe('Authentication Service', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    localStorageMock.clear();
  });
  
  describe('login', () => {
    test('should login successfully with valid credentials', async () => {
      // Mock successful login response
      const mockResponse = {
        data: {
          token: 'test-token',
          refreshToken: 'test-refresh-token',
          user: {
            id: 1,
            username: 'testuser',
            email: 'test@example.com',
            role: 'user'
          },
          expiresIn: 3600
        }
      };
      
      apiClient.post.mockResolvedValueOnce(mockResponse);
      
      const result = await authService.login({
        email: 'test@example.com',
        password: 'password123'
      });
      
      // Check API call
      expect(apiClient.post).toHaveBeenCalledWith('/api/auth/login', {
        email: 'test@example.com',
        password: 'password123'
      });
      
      // Check result
      expect(result).toEqual({
        success: true,
        user: mockResponse.data.user,
        isAdmin: false
      });
      
      // Check localStorage
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'auth_access_token',
        'test-token'
      );
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'auth_refresh_token',
        'test-refresh-token'
      );
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'auth_user',
        JSON.stringify(mockResponse.data.user)
      );
    });
    
    test('should return error with invalid credentials', async () => {
      // Mock failed login response
      const mockError = {
        response: {
          data: {
            message: 'Invalid email or password'
          }
        }
      };
      
      apiClient.post.mockRejectedValueOnce(mockError);
      
      const result = await authService.login({
        email: 'test@example.com',
        password: 'wrongpassword'
      });
      
      // Check result
      expect(result).toEqual({
        success: false,
        message: 'Invalid email or password'
      });
      
      // Check localStorage (should not be called)
      expect(localStorageMock.setItem).not.toHaveBeenCalledWith(
        'auth_access_token',
        expect.any(String)
      );
    });
    
    test('should return error with missing credentials', async () => {
      const result = await authService.login({});
      
      // Check result
      expect(result).toEqual({
        success: false,
        message: 'Email and password are required'
      });
      
      // Check API call (should not be called)
      expect(apiClient.post).not.toHaveBeenCalled();
    });
  });
  
  describe('logout', () => {
    test('should logout successfully', async () => {
      // Setup initial state
      localStorageMock.setItem('auth_access_token', 'test-token');
      localStorageMock.setItem('auth_refresh_token', 'test-refresh-token');
      localStorageMock.setItem('auth_user', JSON.stringify({ id: 1 }));
      
      // Mock successful logout response
      apiClient.post.mockResolvedValueOnce({});
      
      const result = await authService.logout();
      
      // Check API call
      expect(apiClient.post).toHaveBeenCalledWith('/api/auth/logout');
      
      // Check result
      expect(result).toEqual({ success: true });
      
      // Check localStorage (should be cleared)
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_access_token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_refresh_token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_user');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_token_expiry');
    });
    
    test('should clear tokens even if API call fails', async () => {
      // Setup initial state
      localStorageMock.setItem('auth_access_token', 'test-token');
      localStorageMock.setItem('auth_refresh_token', 'test-refresh-token');
      localStorageMock.setItem('auth_user', JSON.stringify({ id: 1 }));
      
      // Mock failed logout response
      apiClient.post.mockRejectedValueOnce(new Error('Network error'));
      
      const result = await authService.logout();
      
      // Check result (should still be success)
      expect(result).toEqual({ success: true });
      
      // Check localStorage (should be cleared)
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_access_token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_refresh_token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_user');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_token_expiry');
    });
  });
  
  describe('getAuthStatus', () => {
    test('should return authenticated status when token is valid', async () => {
      // Setup initial state
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: 'user'
      };
      
      localStorageMock.setItem('auth_access_token', 'test-token');
      localStorageMock.setItem('auth_user', JSON.stringify(mockUser));
      localStorageMock.setItem('auth_token_expiry', (Date.now() + 3600000).toString());
      
      // Mock successful status response
      apiClient.get.mockResolvedValueOnce({
        data: {
          isAuthenticated: true,
          user: mockUser
        }
      });
      
      const result = await authService.getAuthStatus();
      
      // Check API call
      expect(apiClient.get).toHaveBeenCalledWith('/api/auth/status');
      
      // Check result
      expect(result).toEqual({
        isAuthenticated: true,
        user: mockUser,
        isAdmin: false
      });
    });
    
    test('should return unauthenticated status when no token exists', async () => {
      const result = await authService.getAuthStatus();
      
      // Check result
      expect(result).toEqual({
        isAuthenticated: false,
        user: null,
        isAdmin: false
      });
      
      // Check API call (should not be called)
      expect(apiClient.get).not.toHaveBeenCalled();
    });
    
    test('should try to refresh token when token is expired', async () => {
      // Setup initial state with expired token
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: 'user'
      };
      
      localStorageMock.setItem('auth_access_token', 'expired-token');
      localStorageMock.setItem('auth_refresh_token', 'test-refresh-token');
      localStorageMock.setItem('auth_user', JSON.stringify(mockUser));
      localStorageMock.setItem('auth_token_expiry', (Date.now() - 1000).toString());
      
      // Mock successful refresh response
      apiClient.post.mockResolvedValueOnce({
        data: {
          token: 'new-token',
          expiresIn: 3600
        }
      });
      
      // Mock successful status response
      apiClient.get.mockResolvedValueOnce({
        data: {
          isAuthenticated: true,
          user: mockUser
        }
      });
      
      const result = await authService.getAuthStatus();
      
      // Check refresh API call
      expect(apiClient.post).toHaveBeenCalledWith('/api/auth/refresh', {
        refreshToken: 'test-refresh-token'
      });
      
      // Check status API call
      expect(apiClient.get).toHaveBeenCalledWith('/api/auth/status');
      
      // Check result
      expect(result).toEqual({
        isAuthenticated: true,
        user: mockUser,
        isAdmin: false
      });
      
      // Check localStorage (should be updated with new token)
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'auth_access_token',
        'new-token'
      );
    });
  });
  
  describe('token management', () => {
    test('should store and retrieve tokens correctly', () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com'
      };
      
      // Store tokens
      authService.setTokens('test-token', 'test-refresh', 1234567890, mockUser);
      
      // Check localStorage
      expect(localStorageMock.setItem).toHaveBeenCalledWith('auth_access_token', 'test-token');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('auth_refresh_token', 'test-refresh');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('auth_token_expiry', '1234567890');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('auth_user', JSON.stringify(mockUser));
      
      // Get tokens
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'auth_access_token') return 'test-token';
        if (key === 'auth_refresh_token') return 'test-refresh';
        if (key === 'auth_token_expiry') return '1234567890';
        if (key === 'auth_user') return JSON.stringify(mockUser);
        return null;
      });
      
      expect(authService.getAccessToken()).toBe('test-token');
      expect(authService.getRefreshToken()).toBe('test-refresh');
      expect(authService.getTokenExpiry()).toBe(1234567890);
      expect(authService.getUser()).toEqual(mockUser);
      
      // Clear tokens
      authService.clearTokens();
      
      // Check localStorage
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_access_token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_refresh_token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_token_expiry');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_user');
    });
    
    test('should check token expiry correctly', () => {
      // Expired token
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'auth_token_expiry') return (Date.now() - 1000).toString();
        return null;
      });
      
      expect(authService.isTokenExpired()).toBe(true);
      
      // Valid token
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'auth_token_expiry') return (Date.now() + 3600000).toString();
        return null;
      });
      
      expect(authService.isTokenExpired()).toBe(false);
      
      // No expiry
      localStorageMock.getItem.mockImplementation(() => null);
      
      expect(authService.isTokenExpired()).toBe(true);
    });
  });
});
