// src/stores/useAuthStore.js
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { API_BASE_URL } from '@/config';

// Helper to get token from storage (adjust key as needed)
const getTokenFromStorage = () => localStorage.getItem('doof_token');
// Helper to set token in storage
const setTokenInStorage = (token) => localStorage.setItem('doof_token', token);
// Helper to remove token from storage
const removeTokenFromStorage = () => localStorage.removeItem('doof_token');

const useAuthStore = create(
  devtools(
    (set, get) => ({
      token: getTokenFromStorage(), // Load initial token from storage
      user: null,                   // User details { id, username, email, createdAt }
      isAuthenticated: !!getTokenFromStorage(), // Initial auth state based on token presence
      isLoading: false,
      error: null,                   // Stores login/registration errors

      // --- Login Action ---
      login: async (email, password) => {
        if (get().isLoading) return;
        set({ isLoading: true, error: null });
        console.log(`[AuthStore] Attempting login for: ${email}`);

        try {
          const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });

          const data = await response.json();

          if (!response.ok) {
             // Use error message from backend response if available
             const errorMsg = data.errors?.[0]?.msg || `Login failed (${response.status})`;
             console.error(`[AuthStore] Login failed: ${errorMsg}`);
             throw new Error(errorMsg);
          }

          console.log(`[AuthStore] Login successful for: ${data.user?.email}`);
          setTokenInStorage(data.token); // Store token
          set({
            token: data.token,
            user: data.user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          return true; // Indicate success

        } catch (error) {
          console.error('[AuthStore] Login error:', error);
          removeTokenFromStorage(); // Ensure token is removed on error
          set({
            token: null,
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: error.message || 'An unknown error occurred during login.',
          });
          return false; // Indicate failure
        }
      },

      // --- Registration Action ---
      register: async (username, email, password) => {
          if (get().isLoading) return;
          set({ isLoading: true, error: null });
          console.log(`[AuthStore] Attempting registration for: ${email}`);

          try {
              const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ username, email, password }),
              });

              const data = await response.json();

              if (!response.ok) {
                  const errorMsg = data.errors?.[0]?.msg || `Registration failed (${response.status})`;
                  console.error(`[AuthStore] Registration failed: ${errorMsg}`);
                  throw new Error(errorMsg);
              }

              console.log(`[AuthStore] Registration successful for: ${data.user?.email}`);
              setTokenInStorage(data.token); // Store token upon successful registration
              set({
                  token: data.token,
                  user: data.user,
                  isAuthenticated: true,
                  isLoading: false,
                  error: null,
              });
              return true; // Indicate success

          } catch (error) {
              console.error('[AuthStore] Registration error:', error);
              removeTokenFromStorage(); // Ensure token is removed on error
              set({
                  token: null,
                  user: null,
                  isAuthenticated: false,
                  isLoading: false,
                  error: error.message || 'An unknown error occurred during registration.',
              });
              return false; // Indicate failure
          }
      },


      // --- Logout Action ---
      logout: () => {
        console.log('[AuthStore] Logging out user.');
        removeTokenFromStorage(); // Remove token
        set({
          token: null,
          user: null,
          isAuthenticated: false,
          error: null,
          isLoading: false, // Ensure loading is reset
        });
        // Optional: Add logic to clear other user-related state/caches
        // e.g., queryClient.clear(); from React Query
      },

      // --- Action to potentially load user data if token exists but user state is lost ---
      // (Could be called on app load)
      loadUser: async () => {
          const token = get().token;
          if (!token || get().user) {
              // No token or user already loaded
              if (!token) set({ isAuthenticated: false }); // Ensure consistency
              return;
          }
          // TODO: Implement an endpoint like GET /api/auth/me to fetch user data using the token
          // For now, we just set isAuthenticated based on token presence
          // set({ isLoading: true });
          // try {
          //    const response = await fetch(`${API_BASE_URL}/api/auth/me`, { headers: { 'Authorization': `Bearer ${token}` }});
          //    // ... handle response, set user ...
          // } catch (error) {
          //    // ... handle error, potentially logout ...
          // } finally {
          //    set({ isLoading: false });
          // }
          console.log("[AuthStore] Token found, assuming authenticated (loadUser action needs backend endpoint).");
          set({ isAuthenticated: true }); // Assume authenticated if token exists
      },

      // Utility to clear errors
      clearError: () => set({ error: null }),

    }),
    { name: 'AuthStore' }
  )
);

// Call loadUser on initial store creation/load (optional, needs backend endpoint)
// useAuthStore.getState().loadUser();

export default useAuthStore;