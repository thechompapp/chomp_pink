/**
 * Unit tests for the Auth Session Store
 */
import { renderHook, act } from '@testing-library/react-hooks';
import useAuthSessionStore from '../../../../src/stores/auth/useAuthSessionStore';
import useAuthenticationStore from '../../../../src/stores/auth/useAuthenticationStore';
import ErrorHandler from '../../../../src/utils/ErrorHandler';

// Mock dependencies
jest.mock('../../../../src/stores/auth/useAuthenticationStore', () => ({
  __esModule: true,
  default: {
    getState: jest.fn()
  }
}));

jest.mock('../../../../src/utils/ErrorHandler', () => ({
  handle: jest.fn()
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

// Mock window events
window.dispatchEvent = jest.fn();

// Mock setInterval and clearInterval
jest.useFakeTimers();
global.setInterval = jest.fn(() => 123);
global.clearInterval = jest.fn();

describe('useAuthSessionStore', () => {
  beforeEach(() => {
    // Clear mocks and localStorage before each test
    jest.clearAllMocks();
    localStorageMock.clear();
    
    // Reset store state
    act(() => {
      useAuthSessionStore.setState({
        sessionStartTime: null,
        lastActivityTime: null,
        sessionExpiryTime: null,
        isSessionActive: false,
        sessionCheckIntervalId: null,
        isLoading: false,
        error: null
      });
    });
    
    // Mock Date.now to return a fixed timestamp
    const now = 1625097600000; // 2021-07-01T00:00:00.000Z
    jest.spyOn(Date, 'now').mockImplementation(() => now);
  });

  afterEach(() => {
    // Restore Date.now
    jest.restoreAllMocks();
  });

  describe('initSession', () => {
    it('should not initialize session when user is not authenticated', () => {
      // Mock unauthenticated user
      useAuthenticationStore.getState.mockReturnValue({
        getIsAuthenticated: () => false
      });

      const { result } = renderHook(() => useAuthSessionStore());
      
      // Call initSession
      act(() => {
        result.current.initSession();
      });
      
      // Verify session was not initialized
      expect(result.current.isSessionActive).toBe(false);
      expect(result.current.sessionStartTime).toBe(null);
      expect(result.current.lastActivityTime).toBe(null);
      expect(result.current.sessionExpiryTime).toBe(null);
      expect(global.setInterval).not.toHaveBeenCalled();
    });

    it('should initialize session when user is authenticated', () => {
      // Mock authenticated user
      useAuthenticationStore.getState.mockReturnValue({
        getIsAuthenticated: () => true
      });

      const { result } = renderHook(() => useAuthSessionStore());
      
      // Call initSession
      act(() => {
        result.current.initSession();
      });
      
      // Verify session was initialized
      expect(result.current.isSessionActive).toBe(true);
      expect(result.current.sessionStartTime).toBe(Date.now());
      expect(result.current.lastActivityTime).toBe(Date.now());
      expect(result.current.sessionExpiryTime).toBe(Date.now() + 60 * 60 * 1000); // 1 hour
      expect(result.current.sessionCheckIntervalId).toBe(123);
      expect(global.setInterval).toHaveBeenCalled();
    });
  });

  describe('updateActivity', () => {
    it('should not update activity when session is not active', () => {
      // Setup initial state with inactive session
      act(() => {
        useAuthSessionStore.setState({
          isSessionActive: false,
          lastActivityTime: null,
          sessionExpiryTime: null
        });
      });

      const { result } = renderHook(() => useAuthSessionStore());
      
      // Call updateActivity
      act(() => {
        result.current.updateActivity();
      });
      
      // Verify activity was not updated
      expect(result.current.lastActivityTime).toBe(null);
      expect(result.current.sessionExpiryTime).toBe(null);
    });

    it('should update activity when session is active', () => {
      // Setup initial state with active session
      const initialTime = Date.now() - 1000; // 1 second ago
      act(() => {
        useAuthSessionStore.setState({
          isSessionActive: true,
          lastActivityTime: initialTime,
          sessionExpiryTime: initialTime + 60 * 60 * 1000
        });
      });

      const { result } = renderHook(() => useAuthSessionStore());
      
      // Call updateActivity
      act(() => {
        result.current.updateActivity();
      });
      
      // Verify activity was updated
      expect(result.current.lastActivityTime).toBe(Date.now());
      expect(result.current.sessionExpiryTime).toBe(Date.now() + 60 * 60 * 1000);
    });
  });

  describe('checkSession', () => {
    it('should end session when user is not authenticated', () => {
      // Mock unauthenticated user
      useAuthenticationStore.getState.mockReturnValue({
        getIsAuthenticated: () => false
      });
      
      // Setup initial state with active session
      act(() => {
        useAuthSessionStore.setState({
          isSessionActive: true,
          sessionStartTime: Date.now() - 1000,
          lastActivityTime: Date.now() - 1000,
          sessionExpiryTime: Date.now() + 1000,
          sessionCheckIntervalId: 123
        });
      });

      const { result } = renderHook(() => useAuthSessionStore());
      
      // Call checkSession
      let isActive;
      act(() => {
        isActive = result.current.checkSession();
      });
      
      // Verify session was ended
      expect(isActive).toBe(false);
      expect(result.current.isSessionActive).toBe(false);
      expect(result.current.sessionStartTime).toBe(null);
      expect(result.current.lastActivityTime).toBe(null);
      expect(result.current.sessionExpiryTime).toBe(null);
      expect(global.clearInterval).toHaveBeenCalledWith(123);
    });

    it('should initialize session when not active but user is authenticated', () => {
      // Mock authenticated user
      useAuthenticationStore.getState.mockReturnValue({
        getIsAuthenticated: () => true
      });
      
      // Setup initial state with inactive session
      act(() => {
        useAuthSessionStore.setState({
          isSessionActive: false,
          sessionStartTime: null,
          lastActivityTime: null,
          sessionExpiryTime: null
        });
      });

      const { result } = renderHook(() => useAuthSessionStore());
      
      // Call checkSession
      let isActive;
      act(() => {
        isActive = result.current.checkSession();
      });
      
      // Verify session was initialized
      expect(isActive).toBe(true);
      expect(result.current.isSessionActive).toBe(true);
      expect(result.current.sessionStartTime).toBe(Date.now());
      expect(result.current.lastActivityTime).toBe(Date.now());
      expect(result.current.sessionExpiryTime).toBe(Date.now() + 60 * 60 * 1000);
      expect(global.setInterval).toHaveBeenCalled();
    });

    it('should end session when it has expired', () => {
      // Mock authenticated user
      useAuthenticationStore.getState.mockReturnValue({
        getIsAuthenticated: () => true
      });
      
      // Setup initial state with expired session
      act(() => {
        useAuthSessionStore.setState({
          isSessionActive: true,
          sessionStartTime: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
          lastActivityTime: Date.now() - 2 * 60 * 60 * 1000,
          sessionExpiryTime: Date.now() - 1000, // Expired 1 second ago
          sessionCheckIntervalId: 123
        });
      });

      const { result } = renderHook(() => useAuthSessionStore());
      
      // Call checkSession
      let isActive;
      act(() => {
        isActive = result.current.checkSession();
      });
      
      // Verify session was ended
      expect(isActive).toBe(false);
      expect(result.current.isSessionActive).toBe(false);
      expect(window.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'auth:session_expired'
        })
      );
    });

    it('should refresh session when close to expiry with recent activity', () => {
      // Mock authenticated user
      useAuthenticationStore.getState.mockReturnValue({
        getIsAuthenticated: () => true
      });
      
      // Setup initial state with session close to expiry
      act(() => {
        useAuthSessionStore.setState({
          isSessionActive: true,
          sessionStartTime: Date.now() - 50 * 60 * 1000, // 50 minutes ago
          lastActivityTime: Date.now() - 5 * 60 * 1000, // 5 minutes ago (recent activity)
          sessionExpiryTime: Date.now() + 10 * 60 * 1000, // 10 minutes until expiry
          sessionCheckIntervalId: 123
        });
      });

      // Mock refreshSession
      const refreshSessionMock = jest.fn().mockResolvedValue(true);
      jest.spyOn(useAuthSessionStore.getState(), 'refreshSession').mockImplementation(refreshSessionMock);

      const { result } = renderHook(() => useAuthSessionStore());
      
      // Call checkSession
      let isActive;
      act(() => {
        isActive = result.current.checkSession();
      });
      
      // Verify session refresh was attempted
      expect(isActive).toBe(true);
      expect(refreshSessionMock).toHaveBeenCalled();
    });
  });

  describe('refreshSession', () => {
    it('should not refresh when user is not authenticated', async () => {
      // Mock unauthenticated user
      useAuthenticationStore.getState.mockReturnValue({
        getIsAuthenticated: () => false
      });

      const { result } = renderHook(() => useAuthSessionStore());
      
      // Call refreshSession
      let success;
      await act(async () => {
        success = await result.current.refreshSession();
      });
      
      // Verify refresh failed
      expect(success).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });

    it('should refresh session when auth check succeeds', async () => {
      // Mock authenticated user with successful auth check
      useAuthenticationStore.getState.mockReturnValue({
        getIsAuthenticated: () => true,
        checkAuthStatus: jest.fn().mockResolvedValue(true)
      });

      const { result } = renderHook(() => useAuthSessionStore());
      
      // Call refreshSession
      let success;
      await act(async () => {
        success = await result.current.refreshSession();
      });
      
      // Verify session was refreshed
      expect(success).toBe(true);
      expect(result.current.isSessionActive).toBe(true);
      expect(result.current.lastActivityTime).toBe(Date.now());
      expect(result.current.sessionExpiryTime).toBe(Date.now() + 60 * 60 * 1000);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should handle auth check failure', async () => {
      // Mock authenticated user with failed auth check
      useAuthenticationStore.getState.mockReturnValue({
        getIsAuthenticated: () => true,
        checkAuthStatus: jest.fn().mockResolvedValue(false)
      });

      const { result } = renderHook(() => useAuthSessionStore());
      
      // Call refreshSession
      let success;
      await act(async () => {
        success = await result.current.refreshSession();
      });
      
      // Verify refresh failed
      expect(success).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe('Failed to refresh session');
    });

    it('should handle auth check error', async () => {
      // Mock authenticated user with auth check error
      useAuthenticationStore.getState.mockReturnValue({
        getIsAuthenticated: () => true,
        checkAuthStatus: jest.fn().mockRejectedValue(new Error('Auth check error'))
      });

      const { result } = renderHook(() => useAuthSessionStore());
      
      // Call refreshSession
      let success;
      await act(async () => {
        success = await result.current.refreshSession();
      });
      
      // Verify error handling
      expect(success).toBe(false);
      expect(ErrorHandler.handle).toHaveBeenCalled();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe('Failed to refresh session');
    });
  });

  describe('endSession', () => {
    it('should end session and clear interval', () => {
      // Setup initial state with active session
      act(() => {
        useAuthSessionStore.setState({
          isSessionActive: true,
          sessionStartTime: Date.now() - 1000,
          lastActivityTime: Date.now() - 1000,
          sessionExpiryTime: Date.now() + 1000,
          sessionCheckIntervalId: 123
        });
      });

      const { result } = renderHook(() => useAuthSessionStore());
      
      // Call endSession
      act(() => {
        result.current.endSession();
      });
      
      // Verify session was ended
      expect(result.current.isSessionActive).toBe(false);
      expect(result.current.sessionStartTime).toBe(null);
      expect(result.current.lastActivityTime).toBe(null);
      expect(result.current.sessionExpiryTime).toBe(null);
      expect(result.current.sessionCheckIntervalId).toBe(null);
      expect(global.clearInterval).toHaveBeenCalledWith(123);
    });
  });

  describe('getters', () => {
    it('should return session status', () => {
      // Setup initial state
      const now = Date.now();
      act(() => {
        useAuthSessionStore.setState({
          isSessionActive: true,
          sessionStartTime: now - 1000,
          lastActivityTime: now - 500,
          sessionExpiryTime: now + 1000
        });
      });

      const { result } = renderHook(() => useAuthSessionStore());
      
      // Call getSessionStatus
      const status = result.current.getSessionStatus();
      
      // Verify status
      expect(status).toEqual({
        isActive: true,
        startTime: now - 1000,
        lastActivity: now - 500,
        expiryTime: now + 1000,
        timeUntilExpiry: 1000,
        sessionDuration: 1000
      });
    });

    it('should return session active status', () => {
      // Setup initial state
      act(() => {
        useAuthSessionStore.setState({
          isSessionActive: true
        });
      });

      const { result } = renderHook(() => useAuthSessionStore());
      
      // Call getIsSessionActive
      const isActive = result.current.getIsSessionActive();
      
      // Verify result
      expect(isActive).toBe(true);
    });
  });
});
