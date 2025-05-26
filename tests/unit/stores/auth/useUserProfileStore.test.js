/**
 * Unit tests for the User Profile Store
 */
import { renderHook, act } from '@testing-library/react-hooks';
import useUserProfileStore from '../../../../src/stores/auth/useUserProfileStore';
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
    get: jest.fn(),
    put: jest.fn(),
    post: jest.fn()
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

describe('useUserProfileStore', () => {
  beforeEach(() => {
    // Clear mocks and localStorage before each test
    jest.clearAllMocks();
    localStorageMock.clear();
    
    // Reset store state
    act(() => {
      useUserProfileStore.setState({
        profile: null,
        preferences: {},
        isLoading: false,
        error: null,
        lastProfileUpdate: null
      });
    });
  });

  describe('fetchUserProfile', () => {
    it('should return null when user is not authenticated', async () => {
      // Mock unauthenticated user
      useAuthenticationStore.getState.mockReturnValue({
        getIsAuthenticated: () => false
      });

      const { result } = renderHook(() => useUserProfileStore());
      
      // Call fetchUserProfile
      let profile;
      await act(async () => {
        profile = await result.current.fetchUserProfile();
      });
      
      // Verify result
      expect(profile).toBe(null);
      expect(result.current.profile).toBe(null);
      expect(result.current.error).toBe('User not authenticated');
      expect(apiClient.get).not.toHaveBeenCalled();
    });

    it('should return cached profile if available and not forced to refresh', async () => {
      // Mock authenticated user
      useAuthenticationStore.getState.mockReturnValue({
        getIsAuthenticated: () => true
      });
      
      // Setup initial state with cached profile
      const cachedProfile = { id: 1, username: 'testuser' };
      act(() => {
        useUserProfileStore.setState({
          profile: cachedProfile,
          lastProfileUpdate: Date.now() - 60000 // 1 minute ago (not expired)
        });
      });

      const { result } = renderHook(() => useUserProfileStore());
      
      // Call fetchUserProfile
      let profile;
      await act(async () => {
        profile = await result.current.fetchUserProfile();
      });
      
      // Verify cached profile is returned without API call
      expect(profile).toEqual(cachedProfile);
      expect(apiClient.get).not.toHaveBeenCalled();
    });

    it('should fetch profile from API when cache is expired', async () => {
      // Mock authenticated user
      useAuthenticationStore.getState.mockReturnValue({
        getIsAuthenticated: () => true
      });
      
      // Setup initial state with expired cached profile
      act(() => {
        useUserProfileStore.setState({
          profile: { id: 1, username: 'olduser' },
          lastProfileUpdate: Date.now() - 11 * 60 * 1000 // 11 minutes ago (expired)
        });
      });
      
      // Mock successful API response
      const newProfile = { id: 1, username: 'newuser', preferences: { theme: 'dark' } };
      apiClient.get.mockResolvedValueOnce({
        data: {
          success: true,
          data: newProfile
        }
      });

      const { result } = renderHook(() => useUserProfileStore());
      
      // Call fetchUserProfile
      let profile;
      await act(async () => {
        profile = await result.current.fetchUserProfile();
      });
      
      // Verify API was called and state was updated
      expect(apiClient.get).toHaveBeenCalledWith('/users/profile');
      expect(profile).toEqual(newProfile);
      expect(result.current.profile).toEqual(newProfile);
      expect(result.current.preferences).toEqual(newProfile.preferences);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.lastProfileUpdate).toBeDefined();
    });

    it('should force fetch profile when forceRefresh is true', async () => {
      // Mock authenticated user
      useAuthenticationStore.getState.mockReturnValue({
        getIsAuthenticated: () => true
      });
      
      // Setup initial state with fresh cached profile
      act(() => {
        useUserProfileStore.setState({
          profile: { id: 1, username: 'olduser' },
          lastProfileUpdate: Date.now() - 60000 // 1 minute ago (not expired)
        });
      });
      
      // Mock successful API response
      const newProfile = { id: 1, username: 'newuser' };
      apiClient.get.mockResolvedValueOnce({
        data: {
          success: true,
          data: newProfile
        }
      });

      const { result } = renderHook(() => useUserProfileStore());
      
      // Call fetchUserProfile with forceRefresh
      let profile;
      await act(async () => {
        profile = await result.current.fetchUserProfile(true);
      });
      
      // Verify API was called despite fresh cache
      expect(apiClient.get).toHaveBeenCalledWith('/users/profile');
      expect(profile).toEqual(newProfile);
    });

    it('should handle API error when fetching profile', async () => {
      // Mock authenticated user
      useAuthenticationStore.getState.mockReturnValue({
        getIsAuthenticated: () => true
      });
      
      // Mock API error
      const error = new Error('API error');
      apiClient.get.mockRejectedValueOnce(error);
      
      // Mock error handler
      ErrorHandler.handle.mockReturnValueOnce({
        message: 'Failed to fetch profile'
      });
      
      const { result } = renderHook(() => useUserProfileStore());
      
      // Call fetchUserProfile
      let profile;
      await act(async () => {
        profile = await result.current.fetchUserProfile();
      });
      
      // Verify error handling
      expect(apiClient.get).toHaveBeenCalledWith('/users/profile');
      expect(ErrorHandler.handle).toHaveBeenCalled();
      expect(profile).toBe('Failed to fetch profile');
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe('Failed to fetch profile');
    });
  });

  describe('updateUserProfile', () => {
    it('should return null when user is not authenticated', async () => {
      // Mock unauthenticated user
      useAuthenticationStore.getState.mockReturnValue({
        getIsAuthenticated: () => false
      });

      const { result } = renderHook(() => useUserProfileStore());
      
      // Call updateUserProfile
      let profile;
      await act(async () => {
        profile = await result.current.updateUserProfile({ username: 'newname' });
      });
      
      // Verify result
      expect(profile).toBe(null);
      expect(result.current.error).toBe('User not authenticated');
      expect(apiClient.put).not.toHaveBeenCalled();
    });

    it('should successfully update profile', async () => {
      // Mock authenticated user
      useAuthenticationStore.getState.mockReturnValue({
        getIsAuthenticated: () => true,
        getCurrentUser: () => ({ id: 1, username: 'olduser' }),
        setState: jest.fn()
      });
      
      // Mock successful API response
      const updatedProfile = { id: 1, username: 'newuser', preferences: { theme: 'dark' } };
      apiClient.put.mockResolvedValueOnce({
        data: {
          success: true,
          data: updatedProfile
        }
      });

      const { result } = renderHook(() => useUserProfileStore());
      
      // Call updateUserProfile
      let profile;
      await act(async () => {
        profile = await result.current.updateUserProfile({ username: 'newuser' });
      });
      
      // Verify API call and state updates
      expect(apiClient.put).toHaveBeenCalledWith('/users/profile', { username: 'newuser' });
      expect(profile).toEqual(updatedProfile);
      expect(result.current.profile).toEqual(updatedProfile);
      expect(result.current.preferences).toEqual(updatedProfile.preferences);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
      
      // Verify auth store update
      expect(useAuthenticationStore.getState().setState).toHaveBeenCalled();
    });

    it('should handle API error when updating profile', async () => {
      // Mock authenticated user
      useAuthenticationStore.getState.mockReturnValue({
        getIsAuthenticated: () => true,
        getCurrentUser: () => ({ id: 1, username: 'olduser' })
      });
      
      // Mock API error
      const error = new Error('API error');
      apiClient.put.mockRejectedValueOnce(error);
      
      // Mock error handler
      ErrorHandler.handle.mockReturnValueOnce({
        message: 'Failed to update profile'
      });
      
      const { result } = renderHook(() => useUserProfileStore());
      
      // Call updateUserProfile
      let errorMessage;
      await act(async () => {
        errorMessage = await result.current.updateUserProfile({ username: 'newuser' });
      });
      
      // Verify error handling
      expect(apiClient.put).toHaveBeenCalledWith('/users/profile', { username: 'newuser' });
      expect(ErrorHandler.handle).toHaveBeenCalled();
      expect(errorMessage).toBe('Failed to update profile');
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe('Failed to update profile');
    });
  });

  describe('updateUserPreferences', () => {
    it('should successfully update preferences', async () => {
      // Mock authenticated user
      useAuthenticationStore.getState.mockReturnValue({
        getIsAuthenticated: () => true
      });
      
      // Mock successful API response
      const updatedPreferences = { theme: 'dark', notifications: true };
      apiClient.put.mockResolvedValueOnce({
        data: {
          success: true,
          data: updatedPreferences
        }
      });

      const { result } = renderHook(() => useUserProfileStore());
      
      // Call updateUserPreferences
      let preferences;
      await act(async () => {
        preferences = await result.current.updateUserPreferences({ theme: 'dark' });
      });
      
      // Verify API call and state updates
      expect(apiClient.put).toHaveBeenCalledWith('/users/preferences', { theme: 'dark' });
      expect(preferences).toEqual(updatedPreferences);
      expect(result.current.preferences).toEqual(updatedPreferences);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });
  });

  describe('updateUserAvatar', () => {
    it('should successfully update avatar', async () => {
      // Mock authenticated user
      useAuthenticationStore.getState.mockReturnValue({
        getIsAuthenticated: () => true,
        getCurrentUser: () => ({ id: 1, username: 'testuser' }),
        setState: jest.fn()
      });
      
      // Mock successful API response
      const updatedProfile = { id: 1, username: 'testuser', avatar_url: 'new-avatar.jpg' };
      apiClient.post.mockResolvedValueOnce({
        data: {
          success: true,
          data: updatedProfile
        }
      });

      const { result } = renderHook(() => useUserProfileStore());
      
      // Create mock file
      const avatarFile = new File(['dummy content'], 'avatar.jpg', { type: 'image/jpeg' });
      
      // Call updateUserAvatar
      let profile;
      await act(async () => {
        profile = await result.current.updateUserAvatar(avatarFile);
      });
      
      // Verify API call and state updates
      expect(apiClient.post).toHaveBeenCalledWith('/users/avatar', expect.any(FormData), {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      expect(profile).toEqual(updatedProfile);
      expect(result.current.profile).toEqual(updatedProfile);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
      
      // Verify auth store update
      expect(useAuthenticationStore.getState().setState).toHaveBeenCalled();
    });
  });

  describe('getters', () => {
    it('should return profile', () => {
      const testProfile = { id: 1, username: 'testuser' };
      
      act(() => {
        useUserProfileStore.setState({ profile: testProfile });
      });

      const { result } = renderHook(() => useUserProfileStore());
      
      expect(result.current.getProfile()).toEqual(testProfile);
    });

    it('should return preferences', () => {
      const testPreferences = { theme: 'dark', notifications: true };
      
      act(() => {
        useUserProfileStore.setState({ preferences: testPreferences });
      });

      const { result } = renderHook(() => useUserProfileStore());
      
      expect(result.current.getPreferences()).toEqual(testPreferences);
    });
  });

  describe('clearProfile', () => {
    it('should reset profile state', () => {
      // Setup initial state
      act(() => {
        useUserProfileStore.setState({
          profile: { id: 1, username: 'testuser' },
          preferences: { theme: 'dark' },
          isLoading: true,
          error: 'Some error',
          lastProfileUpdate: Date.now()
        });
      });

      const { result } = renderHook(() => useUserProfileStore());
      
      // Call clearProfile
      act(() => {
        result.current.clearProfile();
      });
      
      // Verify state reset
      expect(result.current.profile).toBe(null);
      expect(result.current.preferences).toEqual({});
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.lastProfileUpdate).toBe(null);
    });
  });
});
