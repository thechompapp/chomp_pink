// src/stores/useAuthStore.js
import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import { jwtDecode } from 'jwt-decode';
import { queryClient } from '@/queryClient'; // Use alias
import { authService } from '@/services/authService'; // Use alias
import apiClient from '@/services/apiClient'; // Use alias

// Helper to check token validity (including expiration)
const isTokenValid = (token) => {
  if (!token) return false;
  try {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000; // seconds
    // Check if expiration exists and is in the future
    if (decoded.exp && decoded.exp > currentTime) {
        // console.log("[isTokenValid] Token is valid and not expired.");
        return true;
    } else {
        console.warn("[isTokenValid] Token is expired or expiration is missing.");
        return false;
    }
  } catch (error) {
    console.error("[isTokenValid] Error decoding token:", error);
    return false;
  }
};

const authStore = (set, get) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  isLoading: true, // Start as true until first check completes
  error: null,

  isSuperuser: () => get().user?.account_type === 'superuser',

  // login: remains the same as previous version...
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authService.login(email, password);
      if (!data || !data.token || !data.user) throw new Error("Login failed: Invalid server response.");
      // Ensure account_type defaults to 'user' if missing
      const userAccountType = data.user.account_type || 'user';
      set({
          token: data.token,
          user: { ...data.user, account_type: userAccountType },
          isAuthenticated: true,
          isLoading: false,
          error: null
      });
      console.log("[AuthStore Login] Success. User:", get().user); // Log user state after login
      // Invalidate queries that depend on user authentication or role
      queryClient.invalidateQueries({ queryKey: ['userProfile'] }); // Ensure profile refetches
      queryClient.invalidateQueries({ queryKey: ['userLists'] });
      queryClient.invalidateQueries({ queryKey: ['listDetails'] }); // Might depend on auth for follow status
      queryClient.invalidateQueries({ queryKey: ['pendingSubmissions'] });
      queryClient.invalidateQueries({ queryKey: ['adminData'] });
      return true;
    } catch (error) {
      console.error('[AuthStore Login] Error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Login failed. Please check your credentials.';
      set({ token: null, user: null, isAuthenticated: false, isLoading: false, error: errorMessage });
      return false;
    }
  },

  // register: remains the same as previous version...
  register: async (username, email, password) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authService.register(username, email, password);
      if (!data || !data.token || !data.user) throw new Error("Registration failed: Invalid server response.");
       // Ensure account_type defaults to 'user' on registration
       const userAccountType = data.user.account_type || 'user';
      set({
          token: data.token,
          user: { ...data.user, account_type: userAccountType },
          isAuthenticated: true,
          isLoading: false,
          error: null
      });
      console.log("[AuthStore Register] Success. User:", get().user);
      // Invalidate queries that might change after registration/login
      queryClient.invalidateQueries({ queryKey: ['userLists'] });
      return true;
    } catch (error) {
      console.error('[AuthStore Register] Error:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.errors?.[0]?.msg || error.message || 'Registration failed. Please try again.';
      set({ token: null, user: null, isAuthenticated: false, isLoading: false, error: errorMessage });
      return false;
    }
  },

  // logout: remains the same...
  logout: () => {
    console.log('[AuthStore] Performing logout action...');
    set({ token: null, user: null, isAuthenticated: false, isLoading: false, error: null });
    // Clear relevant React Query caches on logout
    queryClient.removeQueries(); // Consider removing all queries or be more specific
    // Example specific removal:
    // queryClient.removeQueries({ queryKey: ['userProfile'] });
    // queryClient.removeQueries({ queryKey: ['userLists'] });
    // queryClient.removeQueries({ queryKey: ['listDetails'] });
    // queryClient.removeQueries({ queryKey: ['pendingSubmissions'] });
    // queryClient.removeQueries({ queryKey: ['adminData'] });
    console.log('[AuthStore] User logged out, state reset, relevant caches cleared.');
  },

  // clearError: remains the same...
  clearError: () => set({ error: null }),

  // checkAuthStatus: Enhanced to explicitly logout if token exists but is invalid/expired
  checkAuthStatus: () => {
    console.log("[AuthStore checkAuthStatus] Checking authentication status...");
    const token = get().token;
    if (token) {
        console.log("[AuthStore checkAuthStatus] Token found in store.");
        if (isTokenValid(token)) {
            console.log("[AuthStore checkAuthStatus] Token is valid.");
            // Token is valid, ensure user object is populated correctly from token
            try {
                const decoded = jwtDecode(token);
                // Ensure payload structure is as expected from backend login/register
                if (decoded.user && decoded.user.id) {
                     // Ensure account_type defaults to 'user' if missing in token
                    const userAccountType = decoded.user.account_type || 'user';
                    // Update state only if user data is different or missing
                    const currentUser = get().user;
                    if (!currentUser || currentUser.id !== decoded.user.id || currentUser.account_type !== userAccountType) {
                         console.log("[AuthStore checkAuthStatus] Updating user state from valid token.");
                         set({
                             user: { ...decoded.user, account_type: userAccountType },
                             isAuthenticated: true,
                             isLoading: false,
                             error: null
                         });
                    } else {
                         console.log("[AuthStore checkAuthStatus] User state already up-to-date.");
                         set({ isAuthenticated: true, isLoading: false }); // Ensure loading is false
                    }
                } else {
                    console.error("[AuthStore checkAuthStatus] Token decoded but user data (id) is missing in payload:", decoded);
                    get().logout(); // Logout if payload is invalid
                }
            } catch (error) {
                console.error("[AuthStore checkAuthStatus] Error processing valid token:", error);
                get().logout(); // Logout on processing error
            }
        } else {
            console.warn("[AuthStore checkAuthStatus] Token found but is invalid or expired. Logging out.");
            get().logout(); // *** Explicitly logout if token is invalid ***
        }
    } else {
        console.log("[AuthStore checkAuthStatus] No token found. Ensuring logged out state.");
        // If no token, ensure user is logged out
        if (get().isAuthenticated) {
            get().logout(); // Logout if store thought user was authenticated without a token
        } else {
            set({ isLoading: false }); // Ensure loading is false if already logged out
        }
    }
  },

  // updateAccountType: remains the same...
  updateAccountType: async (userId, accountType) => {
    if (!['user', 'contributor', 'superuser'].includes(accountType)) {
      set({ error: 'Invalid account type' });
      return false;
    }
    if (!get().isSuperuser()) {
      set({ error: 'Only superusers can update account types' });
      return false;
    }
    set({ isLoading: true, error: null }); // Indicate loading
    try {
      const response = await apiClient(`/api/auth/update-account-type/${userId}`, 'Update Account Type', {
        method: 'PUT',
        body: JSON.stringify({ account_type: accountType }),
      });
       console.log(`[AuthStore UpdateAccountType] Success for user ${userId}. Response:`, response);
      // If the updated user is the current user, update local state
      if (String(get().user?.id) === String(userId)) {
          console.log(`[AuthStore UpdateAccountType] Updating current user's account type in store.`);
          set({ user: { ...get().user, account_type: accountType }, isLoading: false });
      } else {
           set({ isLoading: false });
      }
      // Optionally invalidate admin user list query cache here
      return true;
    } catch (error) {
      console.error('[AuthStore UpdateAccountType] Error:', error);
      set({ isLoading: false, error: error.message || 'Failed to update account type' });
      return false;
    }
  },
});

// Persistence options remain the same...
const persistOptions = {
  name: 'auth-storage',
  storage: createJSONStorage(() => localStorage),
  // Only persist token and user object
  partialize: (state) => ({ token: state.token, user: state.user }),
  // Custom function executed on rehydration
  onRehydrateStorage: (state) => {
    console.log('[AuthStore] Hydration finished.');
    // You can run logic after state is hydrated, e.g., trigger checkAuthStatus
    // return (state, error) => {
    //   if (error) {
    //     console.error('[AuthStore] Hydration error:', error);
    //   } else {
    //     // state.checkAuthStatus(); // Trigger check after hydration (optional, might run twice)
    //   }
    // }
  }
};

// Initialize store with middleware
const useAuthStore = create(
  devtools(
    persist(authStore, persistOptions),
    { name: 'AuthStore' }
  )
);

// Initial check on application load after hydration might have completed
// Run checkAuthStatus slightly delayed to ensure hydration is fully settled if needed
// setTimeout(() => useAuthStore.getState().checkAuthStatus(), 10);
// Or rely on components calling it via useEffect

export default useAuthStore;