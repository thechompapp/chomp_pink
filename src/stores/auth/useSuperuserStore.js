/**
 * Superuser Store Module
 * 
 * Handles superuser/admin status and permissions
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { getDefaultApiClient } from '@/services/http';
import { logInfo, logWarn, logError } from '@/utils/logger.js';
import ErrorHandler from '@/utils/ErrorHandler';
import useAuthenticationStore from './useAuthenticationStore';

// Constants
const STORAGE_KEY = 'auth-superuser-storage';

// Create a render limiter to prevent excessive re-renders in development mode
let lastStateUpdate = 0;
const THROTTLE_INTERVAL = 500; // ms

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
 * Superuser Store
 * 
 * Handles superuser/admin status and permissions
 */
const useSuperuserStore = create(
  persist(
    (set, get) => ({
      // Initial state
      isSuperuser: false,
      superuserStatusReady: false,
      permissions: [],
      isLoading: false,
      error: null,
      
      // Use throttled set to prevent excessive re-renders
      set: throttledSet(set),

      /**
       * Check superuser status
       * @param {boolean} forceCheck - Force a fresh check ignoring cache
       * @returns {Promise<boolean>} - Whether the user is a superuser
       */
      checkSuperuserStatus: async (forceCheck = false) => {
        const isAuthenticated = useAuthenticationStore.getState().getIsAuthenticated();
        const user = useAuthenticationStore.getState().getCurrentUser();
        
        if (!isAuthenticated || !user) {
          set({ 
            isSuperuser: false, 
            superuserStatusReady: true,
            permissions: []
          });
          return false;
        }
        
        // In development mode, always set as superuser
        if (process.env.NODE_ENV === 'development') {
          const isSuperuser = true;
          
          set({
            isSuperuser,
            superuserStatusReady: true,
            permissions: ['admin', 'superuser'],
            error: null
          });
          
          // Force admin flags in development mode
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('admin_access_enabled', 'true');
            localStorage.setItem('superuser_override', 'true');
            localStorage.setItem('admin_api_key', 'doof-admin-secret-key-dev');
          }
          
          // Dispatch superuser status event
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('auth:superuser_status_changed', {
              detail: { isSuperuser }
            }));
          }
          
          return true;
        }
        
        // Check if we already determined superuser status and it's not a forced check
        if (!forceCheck && get().superuserStatusReady) {
          return get().isSuperuser;
        }
        
        set({ isLoading: true, error: null });
        
        try {
          // Determine superuser status from user data
          const isSuperuser = user.account_type === 'superuser' || 
                             user.role === 'admin';
          
          // Get permissions from user data or fetch them
          let permissions = user.permissions || [];
          
          // If user has superuser status but no permissions, fetch them
          if (isSuperuser && (!permissions || permissions.length === 0)) {
            try {
              const response = await apiClient.get('/auth/permissions');
              
              if (response.data && response.data.success && response.data.data) {
                permissions = response.data.data;
              }
            } catch (permissionsError) {
              logWarn('[SuperuserStore] Failed to fetch permissions:', permissionsError);
              
              // Default superuser permissions if fetch fails
              if (isSuperuser) {
                permissions = ['admin', 'superuser'];
              }
            }
          }
          
          set({
            isSuperuser,
            superuserStatusReady: true,
            permissions,
            isLoading: false,
            error: null
          });
          
          // Dispatch superuser status event
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('auth:superuser_status_changed', {
              detail: { isSuperuser }
            }));
          }
          
          return isSuperuser;
        } catch (error) {
          ErrorHandler.handle(error, 'SuperuserStore.checkSuperuserStatus', {
            showToast: false,
            logLevel: 'error'
          });
          
          set({ 
            isLoading: false, 
            error: 'Failed to check superuser status'
          });
          
          return false;
        }
      },

      /**
       * Set superuser status
       * @param {boolean} isSuperuser - Whether the user is a superuser
       * @returns {void}
       */
      setSuperuser: (isSuperuser) => {
        set({ 
          isSuperuser, 
          superuserStatusReady: true 
        });
        
        // Dispatch superuser status event
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth:superuser_status_changed', {
            detail: { isSuperuser }
          }));
        }
        
        logInfo('[SuperuserStore] Superuser status set:', isSuperuser);
      },

      /**
       * Check if user has a specific permission
       * @param {string} permission - Permission to check
       * @returns {boolean} - Whether the user has the permission
       */
      hasPermission: (permission) => {
        const { isSuperuser, permissions } = get();
        
        // Superusers have all permissions
        if (isSuperuser) {
          return true;
        }
        
        // Check if user has the specific permission
        return permissions.includes(permission);
      },

      /**
       * Get all user permissions
       * @returns {string[]} - User permissions
       */
      getPermissions: () => get().permissions,

      /**
       * Check if user is a superuser
       * @returns {boolean} - Whether the user is a superuser
       */
      getIsSuperuser: () => get().isSuperuser,

      /**
       * Check if superuser status is ready
       * @returns {boolean} - Whether superuser status is ready
       */
      getSuperuserStatusReady: () => get().superuserStatusReady,

      /**
       * Clear superuser data (used on logout)
       */
      clearSuperuserData: () => {
        set({
          isSuperuser: false,
          superuserStatusReady: false,
          permissions: [],
          isLoading: false,
          error: null
        });
      }
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        isSuperuser: state.isSuperuser,
        superuserStatusReady: state.superuserStatusReady,
        permissions: state.permissions
      }),
    }
  )
);

// Add named exports for better IDE support
export const getIsSuperuser = () => useSuperuserStore.getState().getIsSuperuser();
export const getSuperuserStatusReady = () => useSuperuserStore.getState().getSuperuserStatusReady();
export const hasPermission = (permission) => useSuperuserStore.getState().hasPermission(permission);

// Listen for authentication events
if (typeof window !== 'undefined') {
  // Check superuser status when user logs in
  window.addEventListener('auth:login_complete', () => {
    useSuperuserStore.getState().checkSuperuserStatus();
  });
  
  // Clear superuser data when user logs out
  window.addEventListener('auth:logout_complete', () => {
    useSuperuserStore.getState().clearSuperuserData();
  });
}

export default useSuperuserStore;
