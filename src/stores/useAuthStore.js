// src/stores/useAuthStore.js
import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import { jwtDecode } from 'jwt-decode';
import { API_BASE_URL } from '@/config'; // Assuming config is in src folder relative to stores

// --- Helper Function ---
const isTokenValid = (token) => {
  if (!token) return false;
  try {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    if (decoded.exp && decoded.exp > currentTime) return true;
    console.warn('[AuthStore isTokenValid] Token is expired.');
    return false;
  } catch (error) {
    // console.error('[AuthStore isTokenValid] Error decoding token:', error);
    return false;
  }
};

// Define the store logic
const authStore = (set, get) => ({
  token: null, // Initial state null, persist middleware hydrates
  user: null,  // Initial state null, persist middleware hydrates
  // Initial state false. Will be updated by checkAuthStatus after hydration.
  isAuthenticated: false,
  isLoading: false,
  error: null,

  // --- Actions ---
  login: async (email, password) => {
    if (get().isLoading) return false;
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.errors?.[0]?.msg || `Login failed (${response.status})`);
      // Set state, persist middleware saves token and user
      set({ token: data.token, user: data.user, isAuthenticated: true, isLoading: false, error: null });
      return true;
    } catch (error) {
      get().logout(); // Logout clears persisted state via set
      set({ error: error.message }); // Set error after logout
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
         // Set state, persist middleware saves token and user
         set({ token: data.token, user: data.user, isAuthenticated: true, isLoading: false, error: null });
         return true;
     } catch (error) {
         get().logout(); // Logout clears persisted state via set
         set({ error: error.message }); // Set error after logout
         return false;
     }
  },

  logout: () => {
    const wasAuthenticated = get().isAuthenticated;
    if (wasAuthenticated) {
        console.log('[AuthStore] Logging out user.');
    }
    // Setting state triggers persist to clear storage for token/user
    set({ token: null, user: null, isAuthenticated: false, error: null, isLoading: false });
    // No console log here, can be misleading if called during init errors
  },

  clearError: () => set({ error: null }),

  // --- Action to check status explicitly after hydration ---
  checkAuthStatus: () => {
      // This function assumes the store has been hydrated by persist middleware
      const token = get().token;
      const user = get().user;
      const isValid = isTokenValid(token);

      console.log(`[AuthStore checkAuthStatus] Running check. Token Valid: ${isValid}, User Exists: ${!!user}`);

      if (isValid && user) {
          // Only update if the current state is incorrect
          if (!get().isAuthenticated) {
                console.log("[AuthStore checkAuthStatus] Setting isAuthenticated = true");
                set({ isAuthenticated: true });
          }
      } else {
          // If token/user is invalid/missing, ensure logged out state
          if (get().isAuthenticated) {
               console.warn("[AuthStore checkAuthStatus] Token/User invalid or missing. Correcting state via logout.");
               get().logout();
          }
      }
  }
});

// Create the store with persist middleware
const useAuthStore = create(
  devtools(
    persist(
      authStore,
      {
        name: 'auth-storage', // LocalStorage key
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({ token: state.token, user: state.user }), // Only persist token and user
        // Removed the problematic onRehydrateStorage option
      }
    ),
    { name: 'AuthStore' }
  )
);

// We no longer use setTimeout here. Validation is triggered by App.jsx

export default useAuthStore;