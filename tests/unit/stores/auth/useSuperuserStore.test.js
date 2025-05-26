/**
 * Unit tests for the Superuser Store
 */
import { renderHook, act } from '@testing-library/react-hooks';
import useSuperuserStore from '../../../../src/stores/auth/useSuperuserStore';
import useAuthenticationStore from '../../../../src/stores/auth/useAuthenticationStore';
import { apiClient } from '../../../../src/services/http';
import ErrorHandler from '../../../../src/utils/ErrorHandler';

// Mock dependencies
jest.mock('../../../../src/stores/auth/useAuthenticationStore', () => ({
  __esModule: true,
  default: {
    getState: jest.fn()
  }
}));

jest.mock('../../../../src/services/http', () => ({
  apiClient: {
    get: jest.fn()
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

describe('useSuperuserStore', () => {
  beforeEach(() => {
    // Clear mocks and localStorage before each test
    jest.clearAllMocks();
    localStorageMock.clear();
    
    // Reset store state
    act(() => {
      useSuperuserStore.setState({
        isSuperuser: false,
        superuserStatusReady: false,
        permissions: [],
        isLoading: false,
        error: null
      });
    });
    
    // Mock process.env
    process.env.NODE_ENV = 'test';
  });

  describe('checkSuperuserStatus', () => {
    it('should set isSuperuser to false when user is not authenticated', async () => {
      // Mock unauthenticated user
      useAuthenticationStore.getState.mockReturnValue({
        getIsAuthenticated: () => false,
        getCurrentUser: () => null
      });

      const { result } = renderHook(() => useSuperuserStore());
      
      // Call checkSuperuserStatus
      let isSuperuser;
      await act(async () => {
        isSuperuser = await result.current.checkSuperuserStatus();
      });
      
      // Verify result
      expect(isSuperuser).toBe(false);
      expect(result.current.isSuperuser).toBe(false);
      expect(result.current.superuserStatusReady).toBe(true);
      expect(result.current.permissions).toEqual([]);
    });

    it('should set isSuperuser to true in development mode', async () => {
      // Set development mode
      process.env.NODE_ENV = 'development';
      
      // Mock authenticated user
      useAuthenticationStore.getState.mockReturnValue({
        getIsAuthenticated: () => true,
        getCurrentUser: () => ({ id: 1, username: 'testuser' })
      });

      const { result } = renderHook(() => useSuperuserStore());
      
      // Call checkSuperuserStatus
      let isSuperuser;
      await act(async () => {
        isSuperuser = await result.current.checkSuperuserStatus();
      });
      
      // Verify result
      expect(isSuperuser).toBe(true);
      expect(result.current.isSuperuser).toBe(true);
      expect(result.current.superuserStatusReady).toBe(true);
      expect(result.current.permissions).toEqual(['admin', 'superuser']);
      
      // Verify localStorage operations
      expect(localStorageMock.setItem).toHaveBeenCalledWith('admin_access_enabled', 'true');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('superuser_override', 'true');
      
      // Verify event dispatch
      expect(window.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'auth:superuser_status_changed'
        })
      );
    });

    it('should determine superuser status from user data', async () => {
      // Mock authenticated superuser
      useAuthenticationStore.getState.mockReturnValue({
        getIsAuthenticated: () => true,
        getCurrentUser: () => ({
          id: 1,
          username: 'admin',
          account_type: 'superuser',
          role: 'admin',
          permissions: ['admin', 'superuser']
        })
      });

      const { result } = renderHook(() => useSuperuserStore());
      
      // Call checkSuperuserStatus
      let isSuperuser;
      await act(async () => {
        isSuperuser = await result.current.checkSuperuserStatus();
      });
      
      // Verify result
      expect(isSuperuser).toBe(true);
      expect(result.current.isSuperuser).toBe(true);
      expect(result.current.superuserStatusReady).toBe(true);
      expect(result.current.permissions).toEqual(['admin', 'superuser']);
    });

    it('should fetch permissions if user is superuser but has no permissions', async () => {
      // Mock authenticated superuser without permissions
      useAuthenticationStore.getState.mockReturnValue({
        getIsAuthenticated: () => true,
        getCurrentUser: () => ({
          id: 1,
          username: 'admin',
          account_type: 'superuser',
          role: 'admin',
          permissions: []
        })
      });
      
      // Mock permissions API response
      apiClient.get.mockResolvedValueOnce({
        data: {
          success: true,
          data: ['admin', 'superuser', 'manage_users']
        }
      });

      const { result } = renderHook(() => useSuperuserStore());
      
      // Call checkSuperuserStatus
      let isSuperuser;
      await act(async () => {
        isSuperuser = await result.current.checkSuperuserStatus();
      });
      
      // Verify API call and result
      expect(apiClient.get).toHaveBeenCalledWith('/auth/permissions');
      expect(isSuperuser).toBe(true);
      expect(result.current.isSuperuser).toBe(true);
      expect(result.current.superuserStatusReady).toBe(true);
      expect(result.current.permissions).toEqual(['admin', 'superuser', 'manage_users']);
    });

    it('should handle API errors when fetching permissions', async () => {
      // Mock authenticated superuser without permissions
      useAuthenticationStore.getState.mockReturnValue({
        getIsAuthenticated: () => true,
        getCurrentUser: () => ({
          id: 1,
          username: 'admin',
          account_type: 'superuser',
          role: 'admin',
          permissions: []
        })
      });
      
      // Mock API error
      apiClient.get.mockRejectedValueOnce(new Error('API error'));

      const { result } = renderHook(() => useSuperuserStore());
      
      // Call checkSuperuserStatus
      let isSuperuser;
      await act(async () => {
        isSuperuser = await result.current.checkSuperuserStatus();
      });
      
      // Verify error handling and default permissions
      expect(apiClient.get).toHaveBeenCalledWith('/auth/permissions');
      expect(ErrorHandler.handle).toHaveBeenCalled();
      expect(isSuperuser).toBe(true);
      expect(result.current.isSuperuser).toBe(true);
      expect(result.current.superuserStatusReady).toBe(true);
      expect(result.current.permissions).toEqual(['admin', 'superuser']);
    });
  });

  describe('setSuperuser', () => {
    it('should set superuser status and dispatch event', () => {
      const { result } = renderHook(() => useSuperuserStore());
      
      // Call setSuperuser
      act(() => {
        result.current.setSuperuser(true);
      });
      
      // Verify state and event dispatch
      expect(result.current.isSuperuser).toBe(true);
      expect(result.current.superuserStatusReady).toBe(true);
      
      expect(window.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'auth:superuser_status_changed',
          detail: { isSuperuser: true }
        })
      );
    });
  });

  describe('hasPermission', () => {
    it('should return true for superusers regardless of permission', () => {
      // Setup superuser state
      act(() => {
        useSuperuserStore.setState({
          isSuperuser: true,
          permissions: ['admin']
        });
      });

      const { result } = renderHook(() => useSuperuserStore());
      
      // Check for permission not in the list
      expect(result.current.hasPermission('manage_users')).toBe(true);
    });

    it('should check specific permission for non-superusers', () => {
      // Setup non-superuser state with specific permissions
      act(() => {
        useSuperuserStore.setState({
          isSuperuser: false,
          permissions: ['view_reports', 'manage_content']
        });
      });

      const { result } = renderHook(() => useSuperuserStore());
      
      // Check permissions
      expect(result.current.hasPermission('view_reports')).toBe(true);
      expect(result.current.hasPermission('manage_content')).toBe(true);
      expect(result.current.hasPermission('manage_users')).toBe(false);
    });
  });

  describe('getters', () => {
    it('should return superuser status', () => {
      act(() => {
        useSuperuserStore.setState({ isSuperuser: true });
      });

      const { result } = renderHook(() => useSuperuserStore());
      
      expect(result.current.getIsSuperuser()).toBe(true);
    });

    it('should return superuser status ready flag', () => {
      act(() => {
        useSuperuserStore.setState({ superuserStatusReady: true });
      });

      const { result } = renderHook(() => useSuperuserStore());
      
      expect(result.current.getSuperuserStatusReady()).toBe(true);
    });

    it('should return permissions', () => {
      const permissions = ['admin', 'manage_users'];
      
      act(() => {
        useSuperuserStore.setState({ permissions });
      });

      const { result } = renderHook(() => useSuperuserStore());
      
      expect(result.current.getPermissions()).toEqual(permissions);
    });
  });

  describe('clearSuperuserData', () => {
    it('should reset superuser state', () => {
      // Setup initial state
      act(() => {
        useSuperuserStore.setState({
          isSuperuser: true,
          superuserStatusReady: true,
          permissions: ['admin', 'superuser'],
          isLoading: false,
          error: 'Some error'
        });
      });

      const { result } = renderHook(() => useSuperuserStore());
      
      // Call clearSuperuserData
      act(() => {
        result.current.clearSuperuserData();
      });
      
      // Verify state reset
      expect(result.current.isSuperuser).toBe(false);
      expect(result.current.superuserStatusReady).toBe(false);
      expect(result.current.permissions).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });
  });
});
