// src/stores/useAuthStore.js
import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import { jwtDecode } from 'jwt-decode';
import { queryClient } from '@/queryClient';
import { authService } from '@/services/authService';

// Function to check token expiration
const isTokenValid = (token) => {
  if (!token) return false;
  try {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000; // Convert to seconds
    // Add a small buffer (e.g., 60 seconds) to account for clock skew? Optional.
    return decoded.exp > currentTime;
  } catch (error) {
    // If decoding fails, token is invalid
    console.error("[AuthStore isTokenValid] Error decoding token:", error);
    return false;
  }
};

const authStore = (set, get) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  isLoading: true, // Start loading true for initial auth check
  error: null,

  // isAdmin getter remains the same
  isAdmin: () => get().user?.role === 'admin', // Example role check

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      // Removed console log
      const data = await authService.login(email, password);
      if (!data || !data.token || !data.user) throw new Error("Login failed: Invalid server response.");
      // Removed console log
      set({ token: data.token, user: data.user, isAuthenticated: true, isLoading: false, error: null });
      // Invalidate queries that depend on user authentication
      queryClient.invalidateQueries({ queryKey: ['userLists'] });
      queryClient.invalidateQueries({ queryKey: ['listDetails'] }); // Invalidate specific list details too
      queryClient.invalidateQueries({ queryKey: ['pendingSubmissions'] }); // If submissions are user-specific
      // Removed console log
      return true;
    } catch (error) {
      console.error('[AuthStore Login] Error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Login failed. Please check your credentials.';
      set({ token: null, user: null, isAuthenticated: false, isLoading: false, error: errorMessage });
      return false;
    }
  },

  register: async (username, email, password) => {
     set({ isLoading: true, error: null });
     try {
       // Removed console log
       const data = await authService.register(username, email, password);
       if (!data || !data.token || !data.user) throw new Error("Registration failed: Invalid server response.");
       // Removed console log
       set({ token: data.token, user: data.user, isAuthenticated: true, isLoading: false, error: null });
       queryClient.invalidateQueries({ queryKey: ['userLists'] }); // Invalidate after registration too
       // Removed console log
       return true;
     } catch (error) {
       console.error('[AuthStore Register] Error:', error);
       const errorMessage = error.response?.data?.error || error.response?.data?.errors?.[0]?.msg || error.message || 'Registration failed. Please try again.';
       set({ token: null, user: null, isAuthenticated: false, isLoading: false, error: errorMessage });
       return false;
     }
  },

  logout: () => {
    set({ token: null, user: null, isAuthenticated: false, isLoading: false, error: null });
    // Clear relevant query cache on logout
    queryClient.removeQueries({ queryKey: ['userLists'] });
    queryClient.removeQueries({ queryKey: ['listDetails'] });
    queryClient.removeQueries({ queryKey: ['pendingSubmissions'] });
    queryClient.removeQueries({ queryKey: ['adminData'] }); // Clear admin data too
    // Optionally clear other sensitive caches
    console.log('[AuthStore] User logged out, state reset, relevant caches cleared.');
  },

  clearError: () => set({ error: null }),

  // Check auth status on initial load or refresh
  checkAuthStatus: () => {
    const token = get().token;
    if (token && isTokenValid(token)) {
      try {
        // If token is valid, ensure user data is also present (might be lost on hard refresh without hydration)
        // Usually, persisted state handles this, but as a fallback:
        if (!get().user) {
            const decoded = jwtDecode(token);
            // This assumes the JWT payload directly contains user info or you fetch it.
            // If payload only has ID, you might need an API call here to get full user data.
            // For simplicity, assuming payload is { user: { id: ..., other_fields... } }
            if (decoded.user) {
                 set({ user: decoded.user, isAuthenticated: true, isLoading: false });
            } else {
                 // Token valid but no user data? Maybe logout.
                 console.warn("[AuthStore checkAuthStatus] Token valid but user data missing in store/token payload.");
                 get().logout(); // Logout if user data can't be recovered
            }
        } else {
            // Token valid and user exists in store
             set({ isAuthenticated: true, isLoading: false });
        }
      } catch (error) {
          console.error("[AuthStore checkAuthStatus] Error processing valid token:", error);
          get().logout(); // Logout if there's an error processing
      }
    } else {
      // Token missing or invalid
      if (get().isAuthenticated) { // Only logout if state thought it was authenticated
          get().logout();
      } else {
          set({ isLoading: false }); // Ensure loading is false if already logged out
      }
    }
  }
});

// Persist options (storage changed to localStorage for web)
const persistOptions = {
  name: 'auth-storage', // Name of the item in storage
  storage: createJSONStorage(() => localStorage), // Use localStorage
  partialize: (state) => ({ token: state.token, user: state.user }), // Only persist token and user
  // onRehydrateStorage might be needed for complex hydration logic
};

// Create the store with middleware
const useAuthStore = create(
  devtools(
    persist( authStore, persistOptions ),
    { name: 'AuthStore' } // Name for Redux DevTools
  )
);

// Initialize auth status check when store is created/loaded
useAuthStore.getState().checkAuthStatus();

export default useAuthStore;