/**
 * Authentication Session Store Module
 * 
 * Handles session management and persistence
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { logInfo, logWarn, logError } from '@/utils/logger.js';
import ErrorHandler from '@/utils/ErrorHandler';
import useAuthenticationStore from './useAuthenticationStore';

// Constants
const STORAGE_KEY = 'auth-session-storage';
const SESSION_TIMEOUT = 60 * 60 * 1000; // 1 hour
const SESSION_REFRESH_THRESHOLD = 45 * 60 * 1000; // 45 minutes
const SESSION_CHECK_INTERVAL = 15 * 60 * 1000; // 15 minutes (increased from 5 minutes)

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
 * Authentication Session Store
 * 
 * Handles session management and persistence
 */
const useAuthSessionStore = create(
  persist(
    (set, get) => ({
      // Initial state
      sessionStartTime: null,
      lastActivityTime: null,
      sessionExpiryTime: null,
      isSessionActive: false,
      sessionCheckIntervalId: null,
      isLoading: false,
      error: null,
      
      // Use throttled set to prevent excessive re-renders
      set: throttledSet(set),

      /**
       * Initialize session
       * @returns {void}
       */
      initSession: () => {
        const isAuthenticated = useAuthenticationStore.getState().getIsAuthenticated();
        
        if (!isAuthenticated) {
          logWarn('[AuthSessionStore] Cannot initialize session: User not authenticated');
          return;
        }
        
        const now = Date.now();
        
        set({
          sessionStartTime: now,
          lastActivityTime: now,
          sessionExpiryTime: now + SESSION_TIMEOUT,
          isSessionActive: true,
          error: null
        });
        
        // DISABLED: Session check interval causing infinite auth loops
        // Start session check interval
        // const sessionCheckIntervalId = setInterval(() => {
        //   get().checkSession();
        // }, SESSION_CHECK_INTERVAL);
        
        // set({ sessionCheckIntervalId });
        
        // Instead, just mark session as active without periodic checks
        set({ sessionCheckIntervalId: null });
        
        logInfo('[AuthSessionStore] Session initialized (without periodic checks)');
      },

      /**
       * Update last activity time
       * @returns {void}
       */
      updateActivity: () => {
        const now = Date.now();
        const currentState = get();
        
        if (!currentState.isSessionActive) {
          return;
        }
        
        set({
          lastActivityTime: now,
          sessionExpiryTime: now + SESSION_TIMEOUT
        });
      },

      /**
       * Check session status
       * @returns {boolean} - Whether session is active
       */
      checkSession: () => {
        const currentState = get();
        const isAuthenticated = useAuthenticationStore.getState().getIsAuthenticated();
        
        if (!isAuthenticated) {
          get().endSession();
          return false;
        }
        
        if (!currentState.isSessionActive || !currentState.sessionExpiryTime) {
          get().initSession();
          return true;
        }
        
        const now = Date.now();
        
        // If session has expired, end it - but be VERY lenient (6 hours instead of default)
        const effectiveExpiryTime = currentState.sessionExpiryTime + (2 * 60 * 60 * 1000); // Add 2 hour grace period
        if (now > effectiveExpiryTime) {
          logInfo('[AuthSessionStore] Session expired after grace period');
          get().endSession();
          
          // Notify user of session expiry
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('auth:session_expired', {
              detail: { timestamp: now }
            }));
          }
          
          return false;
        }
        
        // If session is close to expiry, refresh it if there's been recent activity
        const timeUntilExpiry = effectiveExpiryTime - now;
        if (timeUntilExpiry < SESSION_REFRESH_THRESHOLD) {
          const timeSinceLastActivity = now - currentState.lastActivityTime;
          
          // If there's been activity in the last 30 minutes (increased from 15), refresh the session
          if (timeSinceLastActivity < 30 * 60 * 1000) {
            logInfo('[AuthSessionStore] Refreshing session due to recent activity');
            get().refreshSession();
          } else {
            logInfo('[AuthSessionStore] Session close to expiry but no recent activity, extending anyway for UX');
            // For better UX, extend session even without recent activity
            get().refreshSession();
          }
        }
        
        return true;
      },

      /**
       * Refresh session
       * @returns {Promise<boolean>} - Whether refresh was successful
       */
      refreshSession: async () => {
        const isAuthenticated = useAuthenticationStore.getState().getIsAuthenticated();
        
        if (!isAuthenticated) {
          logWarn('[AuthSessionStore] Cannot refresh session: User not authenticated');
          return false;
        }
        
        // DISABLED: This was causing infinite auth loops
        // Check if user explicitly logged out first
        const isExplicitLogout = localStorage.getItem('user_explicitly_logged_out') === 'true';
        const isE2ETesting = localStorage.getItem('e2e_testing_mode') === 'true';
        
        if (isExplicitLogout || isE2ETesting) {
          logInfo('[AuthSessionStore] User explicitly logged out or testing mode - not refreshing session');
          get().endSession();
          return false;
        }

        set({ isLoading: true, error: null });
        
        try {
          // DISABLED: Automatic auth check causing infinite loops
          // const authSuccess = await useAuthenticationStore.getState().checkAuthStatus(true);
          
          // Instead, just extend the session without API calls
          const now = Date.now();
          
          set({
            lastActivityTime: now,
            sessionExpiryTime: now + SESSION_TIMEOUT,
            isSessionActive: true,
            isLoading: false,
            error: null
          });
          
          logInfo('[AuthSessionStore] Session refreshed successfully (without API check)');
          return true;
          
        } catch (error) {
          ErrorHandler.handle(error, 'AuthSessionStore.refreshSession', {
            showToast: false,
            logLevel: 'error'
          });
          
          set({ 
            isLoading: false, 
            error: 'Failed to refresh session'
          });
          
          return false;
        }
      },

      /**
       * End session
       * @returns {void}
       */
      endSession: () => {
        const currentState = get();
        
        // Clear session check interval
        if (currentState.sessionCheckIntervalId) {
          clearInterval(currentState.sessionCheckIntervalId);
        }
        
        set({
          sessionStartTime: null,
          lastActivityTime: null,
          sessionExpiryTime: null,
          isSessionActive: false,
          sessionCheckIntervalId: null,
          error: null
        });
        
        logInfo('[AuthSessionStore] Session ended');
      },

      /**
       * Get session status
       * @returns {Object} - Session status information
       */
      getSessionStatus: () => {
        const currentState = get();
        const now = Date.now();
        
        return {
          isActive: currentState.isSessionActive,
          startTime: currentState.sessionStartTime,
          lastActivity: currentState.lastActivityTime,
          expiryTime: currentState.sessionExpiryTime,
          timeUntilExpiry: currentState.sessionExpiryTime ? currentState.sessionExpiryTime - now : null,
          sessionDuration: currentState.sessionStartTime ? now - currentState.sessionStartTime : null
        };
      },

      /**
       * Check if session is active
       * @returns {boolean} - Whether session is active
       */
      getIsSessionActive: () => get().isSessionActive
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        sessionStartTime: state.sessionStartTime,
        lastActivityTime: state.lastActivityTime,
        sessionExpiryTime: state.sessionExpiryTime,
        isSessionActive: state.isSessionActive
      }),
    }
  )
);

// Add named exports for better IDE support
export const getSessionStatus = () => useAuthSessionStore.getState().getSessionStatus();
export const getIsSessionActive = () => useAuthSessionStore.getState().getIsSessionActive();

// Listen for authentication events
if (typeof window !== 'undefined') {
  // Initialize session when user logs in
  window.addEventListener('auth:login_complete', () => {
    useAuthSessionStore.getState().initSession();
  });
  
  // End session when user logs out
  window.addEventListener('auth:logout_complete', () => {
    useAuthSessionStore.getState().endSession();
  });
  
  // Update activity on user interactions
  const updateActivity = () => {
    useAuthSessionStore.getState().updateActivity();
  };
  
  // Attach activity listeners
  window.addEventListener('click', updateActivity);
  window.addEventListener('keypress', updateActivity);
  window.addEventListener('scroll', updateActivity);
  window.addEventListener('mousemove', updateActivity);
}

export default useAuthSessionStore;
