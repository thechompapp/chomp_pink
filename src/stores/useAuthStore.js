// src/stores/useAuthStore.js
import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import { jwtDecode } from 'jwt-decode';
import { API_BASE_URL } from '@/config';
import { queryClient } from '@/queryClient'; // Import from the new central file
import apiClient from '@/utils/apiClient'; // Import apiClient for consistency

// Function to check if token is expired
const isTokenValid = (token) => {
  if (!token) return false;
  try {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000; // Convert to seconds
    return decoded.exp > currentTime;
  } catch (error) {
    console.error("Error decoding token:", error);
    return false;
  }
};

const authStore = (set, get) => ({
  // --- State ---
  token: null,
  user: null,
  isAuthenticated: false,
  isLoading: false, // For login/register/check operations
  error: null, // For login/register/check errors

  // Derived state function (selector-like)
  isAdmin: () => {
      const user = get().user;
      // Example: Check for a specific role or username
      // Adjust this logic based on how admin status is actually determined
      return user?.role === 'admin' || user?.username === 'admin'; // Example check
  },

  // --- Actions ---
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      console.log(`[AuthStore] Attempting login for: ${email}`);
      // Use apiClient
      // ** FIX: Ensure the response is assigned to 'data' **
      const data = await apiClient('/api/auth/login', 'Auth Login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      // ** FIX: Check if data and expected properties exist **
      if (!data || !data.token || !data.user) {
          console.error("[AuthStore Login] Invalid response structure from API:", data);
          throw new Error("Login failed: Invalid server response.");
      }

      console.log(`[AuthStore Login] Success for ${email}. User:`, data.user);
      set({ token: data.token, user: data.user, isAuthenticated: true, isLoading: false, error: null });

      // Invalidate user-specific queries after successful login
      queryClient.invalidateQueries({ queryKey: ['userLists'] });
      console.log('[AuthStore] Invalidated userLists queries after login.');
      return true; // Indicate success

    } catch (error) {
      console.error('[AuthStore Login] Error:', error);
      const errorMessage = error.message || 'Login failed. Please check your credentials.';
      set({ token: null, user: null, isAuthenticated: false, isLoading: false, error: errorMessage });
      return false; // Indicate failure
    }
  },

  register: async (username, email, password) => {
     set({ isLoading: true, error: null });
     try {
       console.log(`[AuthStore] Attempting registration for: ${email}`);
       // Use apiClient
       // ** FIX: Ensure the response is assigned to 'data' **
       const data = await apiClient('/api/auth/register', 'Auth Register', {
         method: 'POST',
         body: JSON.stringify({ username, email, password }),
       });

       // ** FIX: Check if data and expected properties exist **
       if (!data || !data.token || !data.user) {
           console.error("[AuthStore Register] Invalid response structure from API:", data);
           throw new Error("Registration failed: Invalid server response.");
       }

       console.log(`[AuthStore Register] Success for ${email}. User:`, data.user);
       set({ token: data.token, user: data.user, isAuthenticated: true, isLoading: false, error: null });

       // Invalidate user-specific queries after successful registration
       queryClient.invalidateQueries({ queryKey: ['userLists'] });
       console.log('[AuthStore] Invalidated userLists queries after registration.');
       return true; // Indicate success

     } catch (error) {
       console.error('[AuthStore Register] Error:', error);
       const errorMessage = error.message || 'Registration failed. Please try again.';
       set({ token: null, user: null, isAuthenticated: false, isLoading: false, error: errorMessage });
       return false; // Indicate failure
     }
  },

  logout: () => {
    console.log('[AuthStore] Logging out.');
    set({ token: null, user: null, isAuthenticated: false, isLoading: false, error: null });
    // Remove user-specific data from React Query cache
    queryClient.removeQueries({ queryKey: ['userLists'] }); // Example user-specific query
    queryClient.removeQueries({ queryKey: ['listDetails'] }); // May contain user-specific info
    // Optionally clear other specific queries or the entire cache if appropriate
    // queryClient.clear();
    console.log('[AuthStore] Cleared user-specific queries after logout.');
    // Note: Persisted state (token, user) will be cleared by the persist middleware on next update if configured correctly
  },

  clearError: () => set({ error: null }),

  // Check token validity on app load/refresh
  checkAuthStatus: () => {
    const token = get().token;
    console.log('[AuthStore] checkAuthStatus called. Token present:', !!token);
    if (token && isTokenValid(token)) {
      // Token exists and is valid, ensure user data is consistent (optional: re-fetch user?)
      console.log('[AuthStore] Token is valid.');
      // Decode again to ensure user state matches token payload
       try {
           const decoded = jwtDecode(token);
           // If user state is missing or doesn't match token, update it
           if (!get().user || get().user.id !== decoded.user?.id) {
               console.log('[AuthStore] Updating user state from valid token.');
               // Ideally, fetch fresh user data here instead of relying solely on token
               set({ user: decoded.user, isAuthenticated: true, isLoading: false, error: null });
           } else {
               // Already authenticated and user state seems consistent
               set({ isAuthenticated: true, isLoading: false, error: null });
           }
       } catch (error) {
           console.error("[AuthStore checkAuthStatus] Error decoding existing token:", error);
           get().logout(); // Logout if token is invalid
       }
    } else if (token) {
      // Token exists but is invalid/expired
      console.log('[AuthStore] Token is invalid/expired. Logging out.');
      get().logout();
    } else {
      // No token
      console.log('[AuthStore] No token found.');
      set({ isAuthenticated: false, isLoading: false }); // Ensure not authenticated
    }
  }
});

// Persist configuration - only persist token and user
const persistOptions = {
  name: 'auth-storage', // Unique name for auth persistence
  storage: createJSONStorage(() => localStorage), // Or sessionStorage
  partialize: (state) => ({
    token: state.token,
    user: state.user, // Persist user info for rehydration
  }),
  // Optional: onRehydrate callback to run checkAuthStatus after state is loaded
  onRehydrateStorage: (state) => {
    console.log("[AuthStore Persist] Hydration finished.");
    // Return a function to run after rehydration is complete
    return (hydratedState, error) => {
      if (error) {
        console.error("[AuthStore Persist] Error during rehydration:", error);
      } else {
        console.log("[AuthStore Persist] Running checkAuthStatus post-hydration.");
        // Use setTimeout to ensure it runs after initial state is set
        setTimeout(() => useAuthStore.getState().checkAuthStatus(), 0);
      }
    }
  }
};

const useAuthStore = create(
  devtools(
    persist( authStore, persistOptions ),
    { name: 'AuthStore' }
  )
);

// Initial check on load (if not handled by onRehydrate)
// This might be redundant if onRehydrateStorage works reliably
// setTimeout(() => useAuthStore.getState().checkAuthStatus(), 10);


export default useAuthStore;