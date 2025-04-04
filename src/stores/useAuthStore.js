// src/stores/useAuthStore.js
import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import { jwtDecode } from 'jwt-decode';
import { API_BASE_URL } from '@/config';
import { queryClient } from '@/queryClient'; // Import from the new central file

// ... rest of the store code remains the same ...
const isTokenValid = (token) => { /* ... */ };

const authStore = (set, get) => ({
  // ... state ...
  isAdmin: () => { /* ... */ },
  // --- Actions ---
  login: async (email, password) => {
    // ... login logic ...
      set({ token: data.token, user: data.user, isAuthenticated: true, isLoading: false, error: null });
      // Invalidate user-specific queries after successful login
      queryClient.invalidateQueries({ queryKey: ['userLists'] });
      console.log('[AuthStore] Invalidated userLists queries after login.');
      return true;
    // ... catch block ...
  },
  register: async (username, email, password) => {
     // ... register logic ...
     set({ token: data.token, user: data.user, isAuthenticated: true, isLoading: false, error: null });
     // Invalidate user-specific queries after successful registration
     queryClient.invalidateQueries({ queryKey: ['userLists'] });
     console.log('[AuthStore] Invalidated userLists queries after registration.');
     return true;
     // ... catch block ...
  },
  logout: () => {
    // ... set state ...
    queryClient.removeQueries();
    // ... console log ...
  },
  clearError: () => set({ error: null }),
  checkAuthStatus: () => { /* ... */ }
});

const useAuthStore = create(
  devtools(
    persist( authStore, { /* ... persist options ... */ } ),
    { name: 'AuthStore' }
  )
);

export default useAuthStore;