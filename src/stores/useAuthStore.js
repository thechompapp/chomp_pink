/* src/stores/useAuthStore.js */
/* REMOVED: All TypeScript syntax (interfaces, types, generics) */
import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import { jwtDecode } from 'jwt-decode';
import { queryClient } from '@/queryClient';
import { authService } from '@/services/authService';
import apiClient from '@/services/apiClient';
// REMOVED: import type { User, DecodedJwtPayload } from '@/types/User';

// REMOVED: interface AuthState { ... }
// REMOVED: interface AuthActions { ... }
// REMOVED: type AuthStore = AuthState & AuthActions;
// REMOVED: type PersistedAuthState = Pick<AuthState, 'token' | 'user'>;

const persistOptions/*REMOVED: : PersistOptions<AuthStore, PersistedAuthState>*/ = {
    name: 'auth-storage',
    storage: createJSONStorage(() => localStorage),
    partialize: (state) => ({ token: state.token, user: state.user }),
    onRehydrateStorage: () => {
        return (state, error) => {
            if (error) {
                console.error('[AuthStore] Hydration error:', error);
            } else {
                console.log('[AuthStore] Hydration finished.');
                setTimeout(() => state?.checkAuthStatus(), 1);
            }
        };
    },
};

const isTokenValid = (token) => { // REMOVED: : boolean
    if (!token) return false;
    try {
        const decoded/*REMOVED: : DecodedJwtPayload*/ = jwtDecode(token);
        const currentTime = Date.now() / 1000;
        const isValid = typeof decoded.exp === 'number' && decoded.exp > currentTime;
        console.log('[AuthStore] Token validation:', { token: token ? 'Present' : 'Absent', decoded, isValid }); // Log token presence instead of value
        return isValid;
    } catch (error) {
        console.error('[AuthStore] Error decoding token:', error);
        return false;
    }
};

const useAuthStore = create/*REMOVED: <AuthStore>*/()(
    devtools(
        persist(
            (set, get) => ({
                token: null,
                user: null,
                isAuthenticated: false,
                isLoading: true, // Start loading to check auth status
                isProcessing: false, // For login/register spinners
                error: null,

                isSuperuser: () => get().user?.account_type === 'superuser',

                login: async (email, password) => {
                    set({ isProcessing: true, error: null });
                    try {
                        const authData = await authService.login(email, password);
                        const userAccountType = authData.user?.account_type || 'user'; // Default to 'user'
                        if (!authData.token || !authData.user || typeof authData.user.id !== 'number') {
                            throw new Error('Invalid authentication response from server.');
                        }
                        set({
                            token: authData.token,
                            user: { ...authData.user, account_type: userAccountType }, // Ensure account_type is set
                            isAuthenticated: true,
                            isLoading: false, // Finished loading state
                            isProcessing: false, // Finished processing login
                            error: null,
                        });
                        console.log('[AuthStore Login] Success. User ID:', authData.user.id);
                        await queryClient.invalidateQueries(); // Invalidate all queries on login
                        return true;
                    } catch (error/*REMOVED: : unknown*/) {
                        console.error('[AuthStore Login] Error:', error);
                        const message = error instanceof Error ? error.message : 'Login failed.';
                        set({
                            token: null,
                            user: null,
                            isAuthenticated: false,
                            isLoading: false,
                            isProcessing: false,
                            error: message,
                        });
                        return false;
                    }
                },

                register: async (username, email, password) => {
                    set({ isProcessing: true, error: null });
                    try {
                        const authData = await authService.register(username, email, password);
                         const userAccountType = authData.user?.account_type || 'user'; // Default to 'user'
                        if (!authData.token || !authData.user || typeof authData.user.id !== 'number') {
                            throw new Error('Invalid registration response from server.');
                        }
                        set({
                            token: authData.token,
                            user: { ...authData.user, account_type: userAccountType }, // Ensure account_type is set
                            isAuthenticated: true,
                            isLoading: false,
                            isProcessing: false,
                            error: null,
                        });
                        console.log('[AuthStore Register] Success. User ID:', authData.user.id);
                        await queryClient.invalidateQueries(); // Invalidate all queries on register
                        return true;
                    } catch (error/*REMOVED: : unknown*/) {
                        console.error('[AuthStore Register] Error:', error);
                        const message = error instanceof Error ? error.message : 'Registration failed.';
                        set({
                            token: null,
                            user: null,
                            isAuthenticated: false,
                            isLoading: false,
                            isProcessing: false,
                            error: message,
                        });
                        return false;
                    }
                },

                logout: () => {
                     const { isAuthenticated, token } = get();
                     // Optimization: If already logged out, just ensure loading is false
                     if (!isAuthenticated && !token) {
                          set({ isLoading: false }); // Ensure loading state is correct
                          return;
                     }
                     console.log('[AuthStore] Performing logout action...');
                     // Reset state and mark persistence for removal
                     set({ token: null, user: null, isAuthenticated: false, isLoading: false, isProcessing: false, error: null }, true); // 'true' forces replacement
                     queryClient.invalidateQueries(); // Invalidate queries on logout
                     console.log('[AuthStore] User logged out.');
                 },

                clearError: () => set({ error: null }),

                checkAuthStatus: () => {
                    const { token, isAuthenticated, user, isLoading } = get();
                    console.log('[AuthStore checkAuthStatus] Current state:', { token: token ? 'Present' : 'Not Present', isAuthenticated, user: user ? `ID: ${user.id}` : null, isLoading });

                    if (token && isTokenValid(token)) {
                        try {
                            const decoded/*REMOVED: : DecodedJwtPayload*/ = jwtDecode(token);
                             // Perform stricter check on decoded user payload
                            if (decoded.user && typeof decoded.user.id === 'number' && typeof decoded.user.username === 'string' && typeof decoded.user.account_type === 'string') {
                                 const userAccountType = decoded.user.account_type || 'user'; // Default type
                                 const decodedUser/*REMOVED: : User*/ = { ...decoded.user, account_type: userAccountType };

                                 // Update state only if necessary or if still loading
                                if (!isAuthenticated || user?.id !== decodedUser.id || user?.account_type !== decodedUser.account_type || isLoading) {
                                    console.log('[AuthStore checkAuthStatus] Token valid. Setting authenticated state.');
                                    set({
                                        user: decodedUser,
                                        isAuthenticated: true,
                                        isLoading: false, // Mark loading as complete
                                        error: null // Clear any previous errors
                                    });
                                } else if (isLoading) {
                                     // Already authenticated and matches, just ensure loading is off
                                     console.log('[AuthStore checkAuthStatus] Token valid. Clearing loading state.');
                                     set({ isLoading: false });
                                }
                            } else {
                                console.warn('[AuthStore checkAuthStatus] Invalid token payload structure.');
                                if (isAuthenticated || token) get().logout(); // Logout if state is inconsistent
                                else set({ isLoading: false }); // Ensure loading is off
                            }
                        } catch (error) {
                            console.error('[AuthStore checkAuthStatus] Error decoding token during status check:', error);
                            if (isAuthenticated || token) get().logout(); // Logout on decoding error
                            else set({ isLoading: false }); // Ensure loading is off
                        }
                    } else {
                        console.log('[AuthStore checkAuthStatus] Token invalid or missing.');
                        if (isAuthenticated || token) {
                            console.log('[AuthStore checkAuthStatus] Logging out due to invalid/missing token.');
                            get().logout(); // Logout if token becomes invalid
                        } else if (isLoading) {
                            console.log('[AuthStore checkAuthStatus] Clearing loading state (no valid token).');
                            set({ isLoading: false }); // Ensure loading is off
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
                        // Use generic type parameter <User> if possible with your apiClient setup
                        const response = await apiClient/*REMOVED: <User>*/(
                            `/api/auth/update-account-type/${userId}`,
                            'AuthStore Update Account Type',
                            {
                                method: 'PUT',
                                body: JSON.stringify({ account_type: accountType }),
                            }
                        );
                        // Check if the backend response includes the updated user data
                         if (!response.success || !response.data || typeof response.data.id !== 'number') {
                             throw new Error(response.error || "Update failed: No valid user data returned.");
                         }
                         set({ isProcessing: false });
                         // Invalidate admin queries that show user lists
                         queryClient.invalidateQueries({ queryKey: ['adminData', 'users'] });
                        return true;
                    } catch (error/*REMOVED: : unknown*/) {
                         console.error('[AuthStore UpdateAccountType] Error:', error);
                         const message = error instanceof Error ? error.message : 'Update failed.';
                         set({ isProcessing: false, error: message });
                        return false;
                    }
                 }
            }),
            persistOptions
        ),
        { name: 'AuthStore' }
    )
);

export default useAuthStore;