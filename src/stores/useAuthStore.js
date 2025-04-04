// src/stores/useAuthStore.js
import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import { jwtDecode } from 'jwt-decode';
import { API_BASE_URL } from '@/config';
import { queryClient } from '@/main';

// Helper Function
const isTokenValid = (token) => {
  if (!token) return false;
  try {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    // Check if expiry exists and is in the future
    return decoded.exp && decoded.exp > currentTime;
  } catch (error) {
    console.warn('[AuthStore isTokenValid] Error decoding token or token expired:', error.message);
    return false;
  }
};

// Define the store logic
const authStore = (set, get) => ({
  token: null,
  user: null, // Should contain { id, username, email, createdAt, potentially role later }
  isAuthenticated: false,
  isLoading: false,
  error: null,

  // --- Placeholder Admin Check ---
  // Replace this logic when backend provides user roles
  isAdmin: () => {
      const user = get().user;
      // Example: Check for a specific username or ID known to be admin
      // Or later: check user.role === 'admin'
      return user?.username === 'admin'; // Placeholder logic
  },

  // --- Actions ---
  login: async (email, password) => {
    if (get().isLoading) return false;
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.errors?.[0]?.msg || `Login failed (${response.status})`);
      set({ token: data.token, user: data.user, isAuthenticated: true, isLoading: false, error: null });
      queryClient.invalidateQueries({ queryKey: ['userLists'] });
      return true;
    } catch (error) {
      get().logout();
      set({ error: error.message });
      return false;
    }
  },

  register: async (username, email, password) => {
     if (get().isLoading) return false;
     set({ isLoading: true, error: null });
     try {
         const response = await fetch(`${API_BASE_URL}/api/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, email, password }) });
         const data = await response.json();
         if (!response.ok) throw new Error(data.errors?.[0]?.msg || `Registration failed (${response.status})`);
         set({ token: data.token, user: data.user, isAuthenticated: true, isLoading: false, error: null });
         queryClient.invalidateQueries({ queryKey: ['userLists'] });
         return true;
     } catch (error) {
         get().logout();
         set({ error: error.message });
         return false;
     }
  },

  logout: () => {
    const wasAuthenticated = get().isAuthenticated;
    set({ token: null, user: null, isAuthenticated: false, error: null, isLoading: false });
    queryClient.removeQueries(); // Clear cache on logout
    if (wasAuthenticated) {
        console.log('[AuthStore] User logged out and React Query cache cleared.');
    }
  },

  clearError: () => set({ error: null }),

  checkAuthStatus: () => {
      const token = get().token;
      const user = get().user;
      const isValid = isTokenValid(token);
      if (isValid && user) {
          if (!get().isAuthenticated) {
                set({ isAuthenticated: true });
          }
      } else {
          // If token invalid or user missing, ensure logged out state
          if (get().isAuthenticated || token || user) {
               console.warn("[AuthStore checkAuthStatus] Token/User invalid or missing. Correcting state via logout.");
               get().logout(); // Ensures cache is cleared too
          } else {
              // Already logged out, do nothing
          }
      }
  }
});

// Create the store
const useAuthStore = create(
  devtools(
    persist(
      authStore,
      {
        name: 'auth-storage',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({ token: state.token, user: state.user }),
         // onRehydrateStorage: () => {
         //   // Optional: Trigger checkAuthStatus after state is hydrated
         //   return (state, error) => {
         //     if (!error && state) {
         //        // Using timeout to allow initial render setup
         //        setTimeout(() => state.checkAuthStatus(), 0);
         //     }
         //   }
         // }
      }
    ),
    { name: 'AuthStore' }
  )
);

// Initial check on load (App.jsx also calls this)
// setTimeout(() => useAuthStore.getState().checkAuthStatus(), 0);

export default useAuthStore;