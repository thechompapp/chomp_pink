/**
 * Integration tests for the Authentication Store modules
 * 
 * Tests the interactions between different auth store modules
 */
import { renderHook, act } from '@testing-library/react-hooks';
import useAuthenticationStore from '../../../../src/stores/auth/useAuthenticationStore';
import useUserProfileStore from '../../../../src/stores/auth/useUserProfileStore';
import useAuthSessionStore from '../../../../src/stores/auth/useAuthSessionStore';
import useSuperuserStore from '../../../../src/stores/auth/useSuperuserStore';
import useRegistrationStore from '../../../../src/stores/auth/useRegistrationStore';
import { apiClient } from '../../../../src/services/http';
import ErrorHandler from '../../../../src/utils/ErrorHandler';

// Mock dependencies
jest.mock('../../../../src/services/http', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn()
  }
}));

jest.mock('../../../../src/utils/ErrorHandler', () => ({
  handle: jest.fn(),
  isNetworkError: jest.fn()
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

// Mock sessionStorage
const sessionStorageMock = (() => {
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

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock
});

// Mock window events
window.dispatchEvent = jest.fn();
window.addEventListener = jest.fn();

// Mock setInterval and clearInterval
jest.useFakeTimers();
global.setInterval = jest.fn(() => 123);
global.clearInterval = jest.fn();

describe('Auth Stores Integration', () => {
  beforeEach(() => {
    // Clear mocks and storage before each test
    jest.clearAllMocks();
    localStorageMock.clear();
    sessionStorageMock.clear();
    
    // Reset all stores
    act(() => {
      // Reset AuthenticationStore
      useAuthenticationStore.setState({
        token: null,
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: null,
        lastAuthCheck: null
      });
      
      // Reset UserProfileStore
      useUserProfileStore.setState({
        profile: null,
        preferences: {},
        isLoading: false,
        error: null,
        lastProfileUpdate: null
      });
      
      // Reset AuthSessionStore
      useAuthSessionStore.setState({
        sessionStartTime: null,
        lastActivityTime: null,
        sessionExpiryTime: null,
        isSessionActive: false,
        sessionCheckIntervalId: null,
        isLoading: false,
        error: null
      });
      
      // Reset SuperuserStore
      useSuperuserStore.setState({
        isSuperuser: false,
        superuserStatusReady: false,
        permissions: [],
        isLoading: false,
        error: null
      });
      
      // Reset RegistrationStore
      useRegistrationStore.setState({
        registrationStep: 1,
        registrationData: {},
        verificationToken: null,
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

  describe('Login Flow', () => {
    it('should update all relevant stores when user logs in', async () => {
      // Mock successful login response
      const userData = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        account_type: 'regular',
        role: 'user'
      };
      
      apiClient.post.mockResolvedValueOnce({
        data: {
          success: true,
          data: userData,
          token: 'test-token'
        }
      });
      
      // Mock successful profile fetch
      apiClient.get.mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            ...userData,
            preferences: { theme: 'dark' }
          }
        }
      });
      
      // Render hooks
      const authHook = renderHook(() => useAuthenticationStore());
      const profileHook = renderHook(() => useUserProfileStore());
      const sessionHook = renderHook(() => useAuthSessionStore());
      const superuserHook = renderHook(() => useSuperuserStore());
      
      // Login
      await act(async () => {
        await authHook.result.current.login({
          email: 'test@example.com',
          password: 'password123'
        });
      });
      
      // Verify AuthenticationStore state
      expect(authHook.result.current.isAuthenticated).toBe(true);
      expect(authHook.result.current.user).toEqual(userData);
      expect(authHook.result.current.token).toBe('test-token');
      
      // Verify event was dispatched
      expect(window.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'auth:login_complete'
        })
      );
      
      // Simulate auth:login_complete event listener callbacks
      const loginEventCallbacks = window.addEventListener.mock.calls
        .filter(call => call[0] === 'auth:login_complete')
        .map(call => call[1]);
      
      // Execute session initialization (normally triggered by event)
      act(() => {
        sessionHook.result.current.initSession();
      });
      
      // Execute superuser check (normally triggered by event)
      await act(async () => {
        await superuserHook.result.current.checkSuperuserStatus();
      });
      
      // Fetch profile (normally triggered after login)
      await act(async () => {
        await profileHook.result.current.fetchUserProfile();
      });
      
      // Verify UserProfileStore state
      expect(profileHook.result.current.profile).toEqual({
        ...userData,
        preferences: { theme: 'dark' }
      });
      expect(profileHook.result.current.preferences).toEqual({ theme: 'dark' });
      
      // Verify AuthSessionStore state
      expect(sessionHook.result.current.isSessionActive).toBe(true);
      expect(sessionHook.result.current.sessionStartTime).toBe(Date.now());
      expect(sessionHook.result.current.lastActivityTime).toBe(Date.now());
      expect(sessionHook.result.current.sessionExpiryTime).toBe(Date.now() + 60 * 60 * 1000); // 1 hour
      
      // Verify SuperuserStore state (regular user)
      expect(superuserHook.result.current.isSuperuser).toBe(false);
      expect(superuserHook.result.current.superuserStatusReady).toBe(true);
    });

    it('should update all relevant stores when admin user logs in', async () => {
      // Mock successful admin login response
      const adminData = {
        id: 1,
        username: 'admin',
        email: 'admin@example.com',
        account_type: 'superuser',
        role: 'admin',
        permissions: ['admin', 'superuser', 'manage_users']
      };
      
      apiClient.post.mockResolvedValueOnce({
        data: {
          success: true,
          data: adminData,
          token: 'admin-token'
        }
      });
      
      // Render hooks
      const authHook = renderHook(() => useAuthenticationStore());
      const superuserHook = renderHook(() => useSuperuserStore());
      
      // Login as admin
      await act(async () => {
        await authHook.result.current.login({
          email: 'admin@example.com',
          password: 'admin123'
        });
      });
      
      // Execute superuser check (normally triggered by event)
      await act(async () => {
        await superuserHook.result.current.checkSuperuserStatus();
      });
      
      // Verify AuthenticationStore state
      expect(authHook.result.current.isAuthenticated).toBe(true);
      expect(authHook.result.current.user).toEqual(adminData);
      
      // Verify SuperuserStore state
      expect(superuserHook.result.current.isSuperuser).toBe(true);
      expect(superuserHook.result.current.superuserStatusReady).toBe(true);
      expect(superuserHook.result.current.permissions).toEqual(['admin', 'superuser', 'manage_users']);
      
      // Verify superuser event was dispatched
      expect(window.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'auth:superuser_status_changed',
          detail: { isSuperuser: true }
        })
      );
    });
  });

  describe('Logout Flow', () => {
    it('should update all relevant stores when user logs out', async () => {
      // Setup initial authenticated state
      act(() => {
        // Set AuthenticationStore state
        useAuthenticationStore.setState({
          token: 'test-token',
          isAuthenticated: true,
          user: { id: 1, username: 'testuser' },
          lastAuthCheck: Date.now()
        });
        
        // Set UserProfileStore state
        useUserProfileStore.setState({
          profile: { id: 1, username: 'testuser', preferences: { theme: 'dark' } },
          preferences: { theme: 'dark' },
          lastProfileUpdate: Date.now()
        });
        
        // Set AuthSessionStore state
        useAuthSessionStore.setState({
          sessionStartTime: Date.now() - 1000,
          lastActivityTime: Date.now() - 500,
          sessionExpiryTime: Date.now() + 1000,
          isSessionActive: true,
          sessionCheckIntervalId: 123
        });
        
        // Set SuperuserStore state
        useSuperuserStore.setState({
          isSuperuser: false,
          superuserStatusReady: true,
          permissions: ['user']
        });
      });
      
      // Mock successful logout response
      apiClient.post.mockResolvedValueOnce({
        data: {
          success: true
        }
      });
      
      // Render hooks
      const authHook = renderHook(() => useAuthenticationStore());
      const profileHook = renderHook(() => useUserProfileStore());
      const sessionHook = renderHook(() => useAuthSessionStore());
      const superuserHook = renderHook(() => useSuperuserStore());
      
      // Logout
      await act(async () => {
        await authHook.result.current.logout();
      });
      
      // Verify event was dispatched
      expect(window.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'auth:logout_complete'
        })
      );
      
      // Simulate auth:logout_complete event listener callbacks
      const logoutEventCallbacks = window.addEventListener.mock.calls
        .filter(call => call[0] === 'auth:logout_complete')
        .map(call => call[1]);
      
      // Execute profile clear (normally triggered by event)
      act(() => {
        profileHook.result.current.clearProfile();
      });
      
      // Execute session end (normally triggered by event)
      act(() => {
        sessionHook.result.current.endSession();
      });
      
      // Execute superuser clear (normally triggered by event)
      act(() => {
        superuserHook.result.current.clearSuperuserData();
      });
      
      // Verify AuthenticationStore state
      expect(authHook.result.current.isAuthenticated).toBe(false);
      expect(authHook.result.current.user).toBe(null);
      expect(authHook.result.current.token).toBe(null);
      
      // Verify UserProfileStore state
      expect(profileHook.result.current.profile).toBe(null);
      expect(profileHook.result.current.preferences).toEqual({});
      
      // Verify AuthSessionStore state
      expect(sessionHook.result.current.isSessionActive).toBe(false);
      expect(sessionHook.result.current.sessionStartTime).toBe(null);
      expect(sessionHook.result.current.sessionCheckIntervalId).toBe(null);
      expect(global.clearInterval).toHaveBeenCalledWith(123);
      
      // Verify SuperuserStore state
      expect(superuserHook.result.current.isSuperuser).toBe(false);
      expect(superuserHook.result.current.superuserStatusReady).toBe(false);
      expect(superuserHook.result.current.permissions).toEqual([]);
    });
  });

  describe('Registration Flow', () => {
    it('should register user and auto-login', async () => {
      // Mock successful registration response
      const userData = {
        id: 1,
        username: 'newuser',
        email: 'new@example.com',
        token: 'new-token'
      };
      
      apiClient.post.mockResolvedValueOnce({
        data: {
          success: true,
          data: userData
        }
      });
      
      // Render hooks
      const authHook = renderHook(() => useAuthenticationStore());
      const registrationHook = renderHook(() => useRegistrationStore());
      
      // Register
      await act(async () => {
        await registrationHook.result.current.register({
          username: 'newuser',
          email: 'new@example.com',
          password: 'password123'
        });
      });
      
      // Verify AuthenticationStore state was updated (auto-login)
      expect(useAuthenticationStore.getState().isAuthenticated).toBe(true);
      expect(useAuthenticationStore.getState().user).toEqual(userData);
      expect(useAuthenticationStore.getState().token).toBe('new-token');
      
      // Verify RegistrationStore state was reset
      expect(registrationHook.result.current.registrationData).toEqual({});
      expect(registrationHook.result.current.registrationStep).toBe(1);
      
      // Verify login event was dispatched
      expect(window.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'auth:login_complete'
        })
      );
    });
  });

  describe('Session Management', () => {
    it('should refresh session when close to expiry', async () => {
      // Setup initial authenticated state
      act(() => {
        // Set AuthenticationStore state
        useAuthenticationStore.setState({
          token: 'test-token',
          isAuthenticated: true,
          user: { id: 1, username: 'testuser' },
          lastAuthCheck: Date.now() - 4 * 60 * 1000 // 4 minutes ago
        });
        
        // Set AuthSessionStore state with session close to expiry
        useAuthSessionStore.setState({
          sessionStartTime: Date.now() - 50 * 60 * 1000, // 50 minutes ago
          lastActivityTime: Date.now() - 5 * 60 * 1000, // 5 minutes ago
          sessionExpiryTime: Date.now() + 10 * 60 * 1000, // 10 minutes until expiry
          isSessionActive: true
        });
      });
      
      // Mock successful auth check response
      apiClient.get.mockResolvedValueOnce({
        data: {
          success: true,
          data: { id: 1, username: 'testuser' }
        }
      });
      
      // Render hooks
      const authHook = renderHook(() => useAuthenticationStore());
      const sessionHook = renderHook(() => useAuthSessionStore());
      
      // Check session (should trigger refresh due to being close to expiry)
      await act(async () => {
        sessionHook.result.current.checkSession();
      });
      
      // Fast-forward timers to trigger session refresh
      act(() => {
        jest.runAllTimers();
      });
      
      // Refresh session
      await act(async () => {
        await sessionHook.result.current.refreshSession();
      });
      
      // Verify AuthenticationStore was checked
      expect(apiClient.get).toHaveBeenCalledWith('/auth/status');
      
      // Verify session was refreshed
      expect(sessionHook.result.current.sessionExpiryTime).toBe(Date.now() + 60 * 60 * 1000);
      expect(sessionHook.result.current.lastActivityTime).toBe(Date.now());
    });

    it('should end session when expired', async () => {
      // Setup initial state with expired session
      act(() => {
        // Set AuthenticationStore state
        useAuthenticationStore.setState({
          token: 'test-token',
          isAuthenticated: true,
          user: { id: 1, username: 'testuser' }
        });
        
        // Set AuthSessionStore state with expired session
        useAuthSessionStore.setState({
          sessionStartTime: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
          lastActivityTime: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
          sessionExpiryTime: Date.now() - 1000, // Expired 1 second ago
          isSessionActive: true,
          sessionCheckIntervalId: 123
        });
      });
      
      // Render hooks
      const sessionHook = renderHook(() => useAuthSessionStore());
      
      // Check session (should end due to expiry)
      await act(async () => {
        sessionHook.result.current.checkSession();
      });
      
      // Verify session was ended
      expect(sessionHook.result.current.isSessionActive).toBe(false);
      expect(sessionHook.result.current.sessionStartTime).toBe(null);
      expect(sessionHook.result.current.lastActivityTime).toBe(null);
      expect(sessionHook.result.current.sessionExpiryTime).toBe(null);
      expect(global.clearInterval).toHaveBeenCalledWith(123);
      
      // Verify session expired event was dispatched
      expect(window.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'auth:session_expired'
        })
      );
    });
  });

  describe('User Profile Management', () => {
    it('should update user profile and notify authentication store', async () => {
      // Setup initial authenticated state
      act(() => {
        // Set AuthenticationStore state
        useAuthenticationStore.setState({
          token: 'test-token',
          isAuthenticated: true,
          user: { id: 1, username: 'oldusername', email: 'test@example.com' },
          lastAuthCheck: Date.now()
        });
        
        // Set UserProfileStore state
        useUserProfileStore.setState({
          profile: { id: 1, username: 'oldusername', email: 'test@example.com' },
          lastProfileUpdate: Date.now() - 60 * 60 * 1000 // 1 hour ago
        });
      });
      
      // Mock successful profile update response
      const updatedProfile = {
        id: 1,
        username: 'newusername',
        email: 'test@example.com',
        preferences: { theme: 'dark' }
      };
      
      apiClient.put.mockResolvedValueOnce({
        data: {
          success: true,
          data: updatedProfile
        }
      });
      
      // Spy on AuthenticationStore setState
      const setStateSpy = jest.spyOn(useAuthenticationStore, 'setState');
      
      // Render hooks
      const profileHook = renderHook(() => useUserProfileStore());
      
      // Update profile
      await act(async () => {
        await profileHook.result.current.updateUserProfile({
          username: 'newusername'
        });
      });
      
      // Verify UserProfileStore state
      expect(profileHook.result.current.profile).toEqual(updatedProfile);
      expect(profileHook.result.current.preferences).toEqual({ theme: 'dark' });
      
      // Verify AuthenticationStore was notified of the update
      expect(setStateSpy).toHaveBeenCalled();
      expect(setStateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          user: expect.objectContaining({
            username: 'newusername'
          })
        })
      );
    });
  });

  describe('Superuser Status', () => {
    it('should determine superuser status from user data', async () => {
      // Setup initial authenticated state with admin user
      act(() => {
        // Set AuthenticationStore state
        useAuthenticationStore.setState({
          token: 'admin-token',
          isAuthenticated: true,
          user: {
            id: 1,
            username: 'admin',
            email: 'admin@example.com',
            account_type: 'superuser',
            role: 'admin'
          },
          lastAuthCheck: Date.now()
        });
      });
      
      // Mock successful permissions fetch
      apiClient.get.mockResolvedValueOnce({
        data: {
          success: true,
          data: ['admin', 'superuser', 'manage_users']
        }
      });
      
      // Render hooks
      const superuserHook = renderHook(() => useSuperuserStore());
      
      // Check superuser status
      await act(async () => {
        await superuserHook.result.current.checkSuperuserStatus();
      });
      
      // Verify SuperuserStore state
      expect(superuserHook.result.current.isSuperuser).toBe(true);
      expect(superuserHook.result.current.superuserStatusReady).toBe(true);
      expect(superuserHook.result.current.permissions).toEqual(['admin', 'superuser', 'manage_users']);
      
      // Verify permissions API was called
      expect(apiClient.get).toHaveBeenCalledWith('/auth/permissions');
      
      // Verify superuser event was dispatched
      expect(window.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'auth:superuser_status_changed',
          detail: { isSuperuser: true }
        })
      );
    });

    it('should check permissions correctly', () => {
      // Setup SuperuserStore state
      act(() => {
        useSuperuserStore.setState({
          isSuperuser: false,
          superuserStatusReady: true,
          permissions: ['view_reports', 'manage_content']
        });
      });
      
      // Render hook
      const superuserHook = renderHook(() => useSuperuserStore());
      
      // Check permissions
      expect(superuserHook.result.current.hasPermission('view_reports')).toBe(true);
      expect(superuserHook.result.current.hasPermission('manage_content')).toBe(true);
      expect(superuserHook.result.current.hasPermission('manage_users')).toBe(false);
      
      // Update to superuser
      act(() => {
        useSuperuserStore.setState({
          isSuperuser: true
        });
      });
      
      // Superuser should have all permissions
      expect(superuserHook.result.current.hasPermission('manage_users')).toBe(true);
      expect(superuserHook.result.current.hasPermission('any_permission')).toBe(true);
    });
  });

  describe('Compatibility Wrapper', () => {
    it('should provide backward compatibility through useAuthStore', async () => {
      // Import the compatibility wrapper
      const { default: useAuthStore } = require('../../../../src/stores/useAuthStore');
      
      // Setup initial state for individual stores
      act(() => {
        useAuthenticationStore.setState({
          token: 'test-token',
          isAuthenticated: true,
          user: { id: 1, username: 'testuser' },
          isLoading: false,
          error: null
        });
        
        useSuperuserStore.setState({
          isSuperuser: false,
          superuserStatusReady: true
        });
      });
      
      // Render the compatibility wrapper hook
      const { result } = renderHook(() => useAuthStore());
      
      // Verify it combines state from both stores
      expect(result.current.token).toBe('test-token');
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual({ id: 1, username: 'testuser' });
      expect(result.current.isSuperuser).toBe(false);
      expect(result.current.superuserStatusReady).toBe(true);
      
      // Verify it has methods from both stores
      expect(typeof result.current.login).toBe('function');
      expect(typeof result.current.logout).toBe('function');
      expect(typeof result.current.setSuperuser).toBe('function');
      expect(typeof result.current.getIsSuperuser).toBe('function');
    });
  });
});
