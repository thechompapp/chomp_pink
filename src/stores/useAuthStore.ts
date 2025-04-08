/* src/stores/useAuthStore.ts */
import { create, StoreApi } from 'zustand';
import { devtools, persist, createJSONStorage, PersistOptions } from 'zustand/middleware';
import { jwtDecode } from 'jwt-decode';
import { queryClient } from '@/queryClient';
import { authService } from '@/services/authService';
import apiClient, { ApiResponse } from '@/services/apiClient'; // Import ApiResponse
import type { User, AuthResponseData, DecodedJwtPayload } from '@/types/User';

// Define State and Actions Interfaces
interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean; // Represents initial loading/checking state
  isProcessing: boolean; // Represents loading state for login/register/update actions
  error: string | null;
}

interface AuthActions {
  isSuperuser: () => boolean;
  login: (email: string, password?: string) => Promise<boolean>;
  register: (username: string, email: string, password?: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
  checkAuthStatus: () => void;
  updateAccountType: (userId: number | string, accountType: User['account_type']) => Promise<boolean>;
}

// Combined Store Interface
type AuthStore = AuthState & AuthActions;

// Define type for the persisted part of the state
type PersistedAuthState = Pick<AuthState, 'token' | 'user'>;

// Typed Persist options
const persistOptions: PersistOptions<AuthStore, PersistedAuthState> = {
  name: 'auth-storage',
  storage: createJSONStorage(() => localStorage),
  partialize: (state) => ({ token: state.token, user: state.user }),
  onRehydrateStorage: () => {
    return (state, error) => {
      if (error) {
        console.error('[AuthStore] Hydration error:', error);
      } else {
        console.log('[AuthStore] Hydration finished.');
        // Check auth status after state is potentially loaded
        setTimeout(() => state?.checkAuthStatus(), 1);
      }
    };
  },
};

// Helper function to check token expiry
const isTokenValid = (token: string | null): boolean => {
  if (!token) return false;
  try {
    const decoded: DecodedJwtPayload = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    return typeof decoded.exp === 'number' && decoded.exp > currentTime;
  } catch (error) {
    console.error('[AuthStore] Error decoding token:', error);
    return false;
  }
};

// Create the store with types
const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial State
        token: null,
        user: null,
        isAuthenticated: false,
        isLoading: true,
        isProcessing: false,
        error: null,

        // Actions
        isSuperuser: () => get().user?.account_type === 'superuser',

        login: async (email, password) => {
          set({ isProcessing: true, error: null });
          try {
            const authData = await authService.login(email, password);
            const userAccountType = authData.user?.account_type || 'user'; // Safer access
            // Ensure user data is valid before setting
            if (!authData.token || !authData.user || typeof authData.user.id !== 'number') {
                 throw new Error('Invalid authentication response from server.');
            }
            set({
              token: authData.token,
              user: { ...authData.user, account_type: userAccountType },
              isAuthenticated: true,
              isLoading: false,
              isProcessing: false,
              error: null,
            });
            console.log('[AuthStore Login] Success. User ID:', authData.user.id);
            await queryClient.invalidateQueries(); // Ensure invalidation completes
            return true;
          } catch (error: unknown) {
            console.error('[AuthStore Login] Error:', error);
            const message = error instanceof Error ? error.message : 'Login failed.';
            set({
              token: null, user: null, isAuthenticated: false, isLoading: false, isProcessing: false,
              error: message,
            });
            return false;
          }
        },

        register: async (username, email, password) => {
          set({ isProcessing: true, error: null });
           try {
             const authData = await authService.register(username, email, password);
             const userAccountType = authData.user?.account_type || 'user';
              if (!authData.token || !authData.user || typeof authData.user.id !== 'number') {
                 throw new Error('Invalid registration response from server.');
              }
             set({
               token: authData.token,
               user: { ...authData.user, account_type: userAccountType },
               isAuthenticated: true,
               isLoading: false,
               isProcessing: false,
               error: null,
             });
             console.log('[AuthStore Register] Success. User ID:', authData.user.id);
             await queryClient.invalidateQueries();
             return true;
           } catch (error: unknown) {
             console.error('[AuthStore Register] Error:', error);
             const message = error instanceof Error ? error.message : 'Registration failed.';
             set({
                token: null, user: null, isAuthenticated: false, isLoading: false, isProcessing: false,
                error: message,
             });
             return false;
           }
        },

        logout: () => {
            // Check if already logged out to prevent unnecessary updates/invalidate calls
            if (!get().isAuthenticated && !get().token) {
                 set({ isLoading: false }); // Ensure loading is false
                 return;
            }
          console.log('[AuthStore] Performing logout action...');
          // Clear state completely
          set({ token: null, user: null, isAuthenticated: false, isLoading: false, isProcessing: false, error: null }, true);
          // Use invalidateQueries instead of removeQueries to allow refetching of public data
          queryClient.invalidateQueries();
          // Optionally clear specific caches if needed
          // queryClient.clear(); // More aggressive cache clearing
          console.log('[AuthStore] User logged out.');
        },

        clearError: () => set({ error: null }),

        checkAuthStatus: () => {
           const currentState = get(); // Get current state once
           const token = currentState.token;

           if (token && isTokenValid(token)) {
               try {
                   const decoded: DecodedJwtPayload = jwtDecode(token);
                   // Validate payload structure more thoroughly
                   if (decoded.user && typeof decoded.user.id === 'number' && typeof decoded.user.username === 'string' && typeof decoded.user.account_type === 'string') {
                       const userAccountType = decoded.user.account_type || 'user';
                       const decodedUser: User = { ...decoded.user, account_type: userAccountType };

                       // *** Infinite loop prevention: Only set state if it actually changes ***
                       if (!currentState.isAuthenticated || currentState.user?.id !== decodedUser.id || currentState.user?.account_type !== decodedUser.account_type || currentState.isLoading) {
                           set({
                               user: decodedUser,
                               isAuthenticated: true,
                               isLoading: false, // Finished loading/checking
                               error: null
                           });
                       }
                       // If state is already correct, do nothing to avoid potential loops
                   } else {
                       console.warn('[AuthStore checkAuthStatus] Invalid token payload structure.');
                       get().logout(); // Call logout action
                   }
               } catch (error) {
                   console.error('[AuthStore checkAuthStatus] Error decoding token:', error);
                   get().logout(); // Call logout action
               }
           } else {
                // If token exists but invalid, or no token exists
                // *** Infinite loop prevention: Only call logout if currently authenticated ***
                if (currentState.isAuthenticated || currentState.token) {
                    get().logout(); // Call logout action
                } else if (currentState.isLoading) {
                     // If not authenticated and still loading, mark loading as false
                     set({ isLoading: false });
                }
           }
        },

        updateAccountType: async (userId, accountType) => {
          if (!get().isSuperuser()) {
              console.warn('[AuthStore UpdateAccountType] Permission denied.');
              set({ error: 'Permission denied.' });
              return false;
          }
          set({ isProcessing: true, error: null });
          try {
            // Use apiClient directly - Expecting { data: User } from backend
            const response = await apiClient<User>(
                `/api/auth/update-account-type/${userId}`,
                'AuthStore Update Account Type',
                {
                    method: 'PUT',
                    body: JSON.stringify({ account_type: accountType }),
                }
            );
            // Check if response.data contains the updated user
            if (!response.data || typeof response.data.id !== 'number') {
                 throw new Error("Update failed: No valid user data returned.");
            }

            set({ isProcessing: false });
            // Invalidate the users list in the admin panel to reflect changes
            await queryClient.invalidateQueries({ queryKey: ['adminData', 'users'] });
            return true;
          } catch (error: unknown) { // Catch unknown
             console.error('[AuthStore UpdateAccountType] Error:', error);
             const message = error instanceof Error ? error.message : 'Update failed.';
             set({ isProcessing: false, error: message });
             return false;
          }
        },
      }),
      persistOptions
    ),
    { name: 'AuthStore' } // Devtools name
  )
);

export default useAuthStore;