/**
 * User Profile Store Module
 * 
 * Handles user profile management functionality
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { apiClient } from '@/services/http';
import { logInfo, logWarn, logError } from '@/utils/logger.js';
import ErrorHandler from '@/utils/ErrorHandler';
import useAuthenticationStore from './useAuthenticationStore';

// Constants
const STORAGE_KEY = 'auth-user-profile-storage';

// Create a render limiter to prevent excessive re-renders in development mode
let lastStateUpdate = 0;
const THROTTLE_INTERVAL = 500; // ms

/**
 * Centralized error handler for profile operations
 * 
 * @param {Error} error - The error object
 * @param {string} operation - Name of the operation
 * @param {Function} setFn - State setter function
 * @returns {string} - Error message for return value
 */
const handleProfileError = (error, operation, setFn) => {
  const errorInfo = ErrorHandler.handle(error, `UserProfileStore.${operation}`, {
    showToast: true,
    includeStack: process.env.NODE_ENV === 'development'
  });
  
  setFn({ 
    isLoading: false, 
    error: errorInfo.message
  });
  
  return errorInfo.message;
};

// Function to throttle state updates
const throttledSet = (originalSet) => (newState) => {
  const now = Date.now();
  if (process.env.NODE_ENV === 'development' && 
      now - lastStateUpdate < THROTTLE_INTERVAL) {
    return;
  }
  lastStateUpdate = now;
  originalSet(newState);
};

/**
 * User Profile Store
 * 
 * Handles user profile management functionality
 */
const useUserProfileStore = create(
  persist(
    (set, get) => ({
      // Initial state
      profile: null,
      preferences: {},
      isLoading: false,
      error: null,
      lastProfileUpdate: null,
      
      // Use throttled set to prevent excessive re-renders
      set: throttledSet(set),

      /**
       * Fetch user profile
       * @param {boolean} forceRefresh - Force a fresh fetch ignoring cache
       * @returns {Promise<Object|null>} - User profile or null on error
       */
      fetchUserProfile: async (forceRefresh = false) => {
        const currentState = get();
        const isAuthenticated = useAuthenticationStore.getState().getIsAuthenticated();
        
        if (!isAuthenticated) {
          logWarn('[UserProfileStore] Cannot fetch profile: User not authenticated');
          set({ profile: null, error: 'User not authenticated' });
          return null;
        }
        
        // Check if we have a cached profile and it's not a forced refresh
        if (!forceRefresh && currentState.profile && currentState.lastProfileUpdate) {
          const now = Date.now();
          const timeSinceLastUpdate = now - currentState.lastProfileUpdate;
          const PROFILE_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
          
          if (timeSinceLastUpdate < PROFILE_CACHE_DURATION) {
            logInfo(`[UserProfileStore] Using cached profile (${Math.round(timeSinceLastUpdate/1000)}s old)`);
            return currentState.profile;
          }
        }
        
        set({ isLoading: true, error: null });
        
        try {
          const response = await apiClient.get('/users/profile');
          
          if (response.data && response.data.success && response.data.data) {
            const profileData = response.data.data;
            
            set({
              profile: profileData,
              isLoading: false,
              error: null,
              lastProfileUpdate: Date.now()
            });
            
            // Update preferences if they exist in the profile
            if (profileData.preferences) {
              set({ preferences: profileData.preferences });
            }
            
            logInfo('[UserProfileStore] Profile fetched successfully');
            return profileData;
          } else {
            throw new Error(response.data?.message || 'Failed to fetch user profile');
          }
        } catch (error) {
          return handleProfileError(error, 'fetchUserProfile', set);
        }
      },

      /**
       * Update user profile
       * @param {Object} profileData - Profile data to update
       * @returns {Promise<Object|null>} - Updated profile or null on error
       */
      updateUserProfile: async (profileData) => {
        const isAuthenticated = useAuthenticationStore.getState().getIsAuthenticated();
        
        if (!isAuthenticated) {
          logWarn('[UserProfileStore] Cannot update profile: User not authenticated');
          set({ error: 'User not authenticated' });
          return null;
        }
        
        set({ isLoading: true, error: null });
        
        try {
          const response = await apiClient.put('/users/profile', profileData);
          
          if (response.data && response.data.success && response.data.data) {
            const updatedProfile = response.data.data;
            
            set({
              profile: updatedProfile,
              isLoading: false,
              error: null,
              lastProfileUpdate: Date.now()
            });
            
            // Update preferences if they exist in the updated profile
            if (updatedProfile.preferences) {
              set({ preferences: updatedProfile.preferences });
            }
            
            // Notify authentication store about profile update
            const user = useAuthenticationStore.getState().getCurrentUser();
            if (user) {
              useAuthenticationStore.setState({
                user: { ...user, ...updatedProfile }
              });
            }
            
            logInfo('[UserProfileStore] Profile updated successfully');
            return updatedProfile;
          } else {
            throw new Error(response.data?.message || 'Failed to update user profile');
          }
        } catch (error) {
          return handleProfileError(error, 'updateUserProfile', set);
        }
      },

      /**
       * Update user preferences
       * @param {Object} preferencesData - Preferences to update
       * @returns {Promise<Object|null>} - Updated preferences or null on error
       */
      updateUserPreferences: async (preferencesData) => {
        const isAuthenticated = useAuthenticationStore.getState().getIsAuthenticated();
        
        if (!isAuthenticated) {
          logWarn('[UserProfileStore] Cannot update preferences: User not authenticated');
          set({ error: 'User not authenticated' });
          return null;
        }
        
        set({ isLoading: true, error: null });
        
        try {
          const response = await apiClient.put('/users/preferences', preferencesData);
          
          if (response.data && response.data.success && response.data.data) {
            const updatedPreferences = response.data.data;
            
            set({
              preferences: updatedPreferences,
              isLoading: false,
              error: null
            });
            
            logInfo('[UserProfileStore] Preferences updated successfully');
            return updatedPreferences;
          } else {
            throw new Error(response.data?.message || 'Failed to update user preferences');
          }
        } catch (error) {
          return handleProfileError(error, 'updateUserPreferences', set);
        }
      },

      /**
       * Update user avatar
       * @param {File} avatarFile - Avatar file to upload
       * @returns {Promise<Object|null>} - Updated profile or null on error
       */
      updateUserAvatar: async (avatarFile) => {
        const isAuthenticated = useAuthenticationStore.getState().getIsAuthenticated();
        
        if (!isAuthenticated) {
          logWarn('[UserProfileStore] Cannot update avatar: User not authenticated');
          set({ error: 'User not authenticated' });
          return null;
        }
        
        set({ isLoading: true, error: null });
        
        try {
          const formData = new FormData();
          formData.append('avatar', avatarFile);
          
          const response = await apiClient.post('/users/avatar', formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });
          
          if (response.data && response.data.success && response.data.data) {
            const updatedProfile = response.data.data;
            
            set({
              profile: updatedProfile,
              isLoading: false,
              error: null,
              lastProfileUpdate: Date.now()
            });
            
            // Notify authentication store about avatar update
            const user = useAuthenticationStore.getState().getCurrentUser();
            if (user) {
              useAuthenticationStore.setState({
                user: { ...user, avatar_url: updatedProfile.avatar_url }
              });
            }
            
            logInfo('[UserProfileStore] Avatar updated successfully');
            return updatedProfile;
          } else {
            throw new Error(response.data?.message || 'Failed to update user avatar');
          }
        } catch (error) {
          return handleProfileError(error, 'updateUserAvatar', set);
        }
      },

      /**
       * Get user profile
       * @returns {Object|null} - User profile or null if not available
       */
      getProfile: () => get().profile,

      /**
       * Get user preferences
       * @returns {Object} - User preferences
       */
      getPreferences: () => get().preferences,

      /**
       * Check if profile is loading
       * @returns {boolean} - Whether profile is loading
       */
      getIsLoading: () => get().isLoading,

      /**
       * Clear profile data (used on logout)
       */
      clearProfile: () => {
        set({
          profile: null,
          preferences: {},
          isLoading: false,
          error: null,
          lastProfileUpdate: null
        });
      }
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        profile: state.profile,
        preferences: state.preferences,
        lastProfileUpdate: state.lastProfileUpdate
      }),
    }
  )
);

// Add named exports for better IDE support
export const getProfile = () => useUserProfileStore.getState().getProfile();
export const getPreferences = () => useUserProfileStore.getState().getPreferences();

// Listen for authentication events
if (typeof window !== 'undefined') {
  window.addEventListener('auth:logout_complete', () => {
    useUserProfileStore.getState().clearProfile();
  });
}

export default useUserProfileStore;
