/* src/stores/useAuthStore.ts */
import { create, StoreApi } from 'zustand';
import { devtools, persist, createJSONStorage, PersistOptions } from 'zustand/middleware';
import { jwtDecode } from 'jwt-decode';
import { queryClient } from '@/queryClient';
import { authService } from '@/services/authService'; // Uses typed service now
import apiClient from '@/services/apiClient'; // Import apiClient for updateAccountType
import type { User, AuthResponseData, DecodedJwtPayload } from '@/types/User'; // Import types

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
    // Check if 'exp' exists and is a number before comparing
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
        isLoading: true, // Start true until checkAuthStatus completes
        isProcessing: false, // For login/register actions
        error: null,

        // Actions
        isSuperuser: () => get().user?.account_type === 'superuser',

        login: async (email, password) => {
          set({ isProcessing: true, error: null });
          try {
            const authData = await authService.login(email, password);
            const userAccountType = authData.user.account_type || 'user';
            set({
              token: authData.token,
              user: { ...authData.user, account_type: userAccountType },
              isAuthenticated: true,
              isLoading: false, // Initial check is done
              isProcessing: false,
              error: null,
            });
            console.log('[AuthStore Login] Success. User:', get().user);
            queryClient.invalidateQueries(); // Invalidate all queries on login
            return true;
          } catch (error: unknown) { // Catch unknown
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
             const userAccountType = authData.user.account_type || 'user';
             set({
               token: authData.token,
               user: { ...authData.user, account_type: userAccountType },
               isAuthenticated: true,
               isLoading: false, // Initial check is done
               isProcessing: false,
               error: null,
             });
             console.log('[AuthStore Register] Success. User:', get().user);
             queryClient.invalidateQueries(); // Invalidate all queries on register
             return true;
           } catch (error: unknown) { // Catch unknown
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
          console.log('[AuthStore] Performing logout action...');
          set({ token: null, user: null, isAuthenticated: false, isLoading: false, isProcessing: false, error: null }, true); // Replace state
          // More targeted invalidation might be better than removing all queries
          queryClient.invalidateQueries(); // Invalidate all queries on logout
          // queryClient.removeQueries(); // Use invalidate instead to allow refetching public data
          console.log('[AuthStore] User logged out.');
        },

        clearError: () => set({ error: null }),

        checkAuthStatus: () => {
           const token = get().token;
           if (token && isTokenValid(token)) {
               try {
                   const decoded: DecodedJwtPayload = jwtDecode(token);
                   // Validate the structure of the decoded user payload
                   if (decoded.user && typeof decoded.user.id === 'number' && typeof decoded.user.username === 'string' && typeof decoded.user.account_type === 'string') {
                       const userAccountType = decoded.user.account_type || 'user';
                       const currentUser = get().user;
                        // Update state only if necessary to avoid infinite loops if checkAuthStatus is a dependency elsewhere
                       if (!get().isAuthenticated || currentUser?.id !== decoded.user.id || currentUser?.account_type !== userAccountType) {
                           set({
                               user: { ...decoded.user, account_type: userAccountType },
                               isAuthenticated: true,
                               isLoading: false, // Finished loading/checking
                               error: null
                           });
                       } else {
                            set({ isLoading: false }); // Ensure loading is false if already authenticated and user matches
                       }
                   } else {
                       console.warn('[AuthStore checkAuthStatus] Invalid token payload structure.');
                       get().logout(); // Logout if payload structure is invalid
                   }
               } catch (error) {
                   console.error('[AuthStore checkAuthStatus] Error decoding token:', error);
                   get().logout(); // Logout on decode error
               }
           } else {
                // If token exists but is invalid, or no token exists
                if (get().isAuthenticated || get().token) { // Only logout if state is currently authenticated/has token
                    get().logout();
                } else {
                    set({ isLoading: false }); // Ensure loading is false if already logged out
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
            // Use apiClient directly as there's no dedicated service function yet
            // Expecting { data: User }
            const response = await apiClient<User>(
                `/api/auth/update-account-type/${userId}`,
                'AuthStore Update Account Type',
                {
                    method: 'PUT',
                    body: JSON.stringify({ account_type: accountType }),
                }
            );
            if (!response.data) throw new Error("Update failed: No data returned.");

            set({ isProcessing: false });
            // Invalidate the users list in the admin panel
            queryClient.invalidateQueries({ queryKey: ['adminData', 'users'] });
             // Optionally update local user state ONLY IF the updated user is the current user
             // This is generally NOT recommended as the source of truth should be the token/re-check
             // if (String(get().user?.id) === String(userId)) {
             //    set({ user: { ...get().user, account_type: accountType } });
             // }
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