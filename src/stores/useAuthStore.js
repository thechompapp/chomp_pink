/* src/stores/useAuthStore.js */
/* REFACTORED: Use parseApiError utility for consistent error messages */
import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import { jwtDecode } from 'jwt-decode';
import { queryClient } from '@/queryClient';
import { authService } from '@/services/authService.js';
import apiClient from '@/services/apiClient.js'; // Ensure apiClient is configured if needed here
import { parseApiError } from '@/utils/parseApiError.js'; // Import the utility

// persistOptions, isTokenValid remain the same
const persistOptions = { /* ... content from previous version ... */ name: 'auth-storage', storage: createJSONStorage(() => localStorage), partialize: (state) => ({ token: state.token, user: state.user }), onRehydrateStorage: () => { return (state, error) => { if (error) { console.error('[AuthStore] Hydration error:', error); } else { console.log('[AuthStore] Hydration finished.'); setTimeout(() => { if (state && typeof state.checkAuthStatus === 'function') { console.log("[AuthStore] Triggering checkAuthStatus post-hydration."); state.checkAuthStatus(); } else { console.warn("[AuthStore] Could not trigger checkAuthStatus post-hydration: state or function missing."); } }, 1); } }; }, };
const isTokenValid = (token) => { /* ... content from previous version ... */ if (!token) return false; try { const decoded = jwtDecode(token); const currentTime = Date.now() / 1000; const isValid = typeof decoded.exp === 'number' && decoded.exp > currentTime; console.log('[AuthStore] Token validation:', { token: token ? 'Present' : 'Absent', /* decoded, */ isValid }); return isValid; } catch (error) { console.error('[AuthStore] Error decoding token:', error); return false; } };

const useAuthStore = create()(
    devtools(
        persist(
            (set, get) => ({
                token: null,
                user: null,
                isAuthenticated: false,
                isLoading: true,
                isProcessing: false,
                error: null, // This will store the parsed error message string

                isSuperuser: () => get().user?.account_type === 'superuser',

                login: async (email, password) => {
                    set({ isProcessing: true, error: null }); // Clear previous error
                    try {
                        const credentials = { email, password };
                        // authService.login now propagates standardized error or resolves with success data
                        const authData = await authService.login(credentials);

                        // Validate successful response structure (as before)
                        const userAccountType = authData.user?.account_type || 'user';
                         if (!authData.token || !authData.user || typeof authData.user.id !== 'number') {
                            // This indicates a server-side issue returning unexpected success data
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
                        await queryClient.invalidateQueries();
                        return true; // Indicate success to the caller
                    } catch (error) {
                        console.error('[AuthStore Login] Error:', error);
                        // Use the utility function to parse the error
                        const message = parseApiError(error, 'Login failed.');
                        set({
                            token: null,
                            user: null,
                            isAuthenticated: false,
                            isLoading: false,
                            isProcessing: false,
                            error: message, // Set the parsed error message
                        });
                        return false; // Indicate failure to the caller
                    }
                },

                register: async (username, email, password) => {
                    set({ isProcessing: true, error: null });
                    try {
                        const registerData = { username, email, password };
                        // authService.register now propagates standardized error or resolves with success data
                        const authData = await authService.register(registerData);

                        // Validate successful response structure (as before)
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
                    } catch (error) {
                        console.error('[AuthStore Register] Error:', error);
                        // Use the utility function to parse the error
                        const message = parseApiError(error, 'Registration failed.');
                        set({
                            token: null,
                            user: null,
                            isAuthenticated: false,
                            isLoading: false,
                            isProcessing: false,
                            error: message, // Set the parsed error message
                        });
                        return false;
                    }
                },

                logout: () => { /* ... content from previous version ... */ const { isAuthenticated, token } = get(); if (!isAuthenticated && !token) { set({ isLoading: false }); return; } console.log('[AuthStore] Performing logout action...'); set({ token: null, user: null, isAuthenticated: false, isLoading: false, isProcessing: false, error: null }, true); queryClient.invalidateQueries(); console.log('[AuthStore] User logged out.'); },

                clearError: () => set({ error: null }),

                checkAuthStatus: () => { /* ... content from previous version ... */ const { token, isAuthenticated, user, isLoading } = get(); console.log('[AuthStore checkAuthStatus] Current state:', { token: token ? 'Present' : 'Not Present', isAuthenticated, user: user ? `ID: ${user.id}` : null, isLoading }); if (token && isTokenValid(token)) { try { const decoded = jwtDecode(token); if (decoded.user && typeof decoded.user.id === 'number' && typeof decoded.user.username === 'string' && typeof decoded.user.account_type === 'string') { const userAccountType = decoded.user.account_type || 'user'; const decodedUser = { ...decoded.user, account_type: userAccountType }; if (!isAuthenticated || user?.id !== decodedUser.id || user?.account_type !== decodedUser.account_type || isLoading) { console.log('[AuthStore checkAuthStatus] Token valid. Setting authenticated state.'); set({ user: decodedUser, isAuthenticated: true, isLoading: false, error: null }); } else if (isLoading) { console.log('[AuthStore checkAuthStatus] Token valid. Clearing loading state.'); set({ isLoading: false }); } } else { console.warn('[AuthStore checkAuthStatus] Invalid token payload structure.'); if (isAuthenticated || token) get().logout(); else set({ isLoading: false }); } } catch (error) { console.error('[AuthStore checkAuthStatus] Error decoding token:', error); if (isAuthenticated || token) get().logout(); else set({ isLoading: false }); } } else { console.log('[AuthStore checkAuthStatus] Token invalid or missing.'); if (isAuthenticated || token) { console.log('[AuthStore checkAuthStatus] Logging out due to invalid/missing token.'); get().logout(); } else if (isLoading) { console.log('[AuthStore checkAuthStatus] Clearing loading state (no valid token).'); set({ isLoading: false }); } } },

                 updateAccountType: async (userId, accountType) => { // Example using authService method
                    if (!get().isSuperuser()) {
                         console.warn('[AuthStore UpdateAccountType] Permission denied.');
                         set({ error: 'Permission denied.' }); // Set error directly for permission issue
                         return false;
                    }
                    set({ isProcessing: true, error: null });
                    try {
                        // authService.updateAccountType propagates errors
                        const response = await authService.updateAccountType(userId, accountType);
                        // Validate success response
                         if (!response.success || !response.data || typeof response.data.id !== 'number') {
                             throw new Error(response.error || "Update failed: No valid user data returned.");
                         }
                         set({ isProcessing: false });
                         queryClient.invalidateQueries({ queryKey: ['adminData', 'users'] }); // Assuming admin data query key
                        return true;
                    } catch (error) {
                         console.error('[AuthStore UpdateAccountType] Error:', error);
                         // Use the utility function to parse the error
                         const message = parseApiError(error, 'Update failed.');
                         set({ isProcessing: false, error: message }); // Set parsed error
                        return false;
                    }
                 }
            }),
            persistOptions
        ),
        { name: 'AuthStore' }
    )
);

// Subscribe logic remains the same (if apiClient has setToken method)
// Assuming apiClient doesn't have setToken based on its provided code
// Remove this subscription if apiClient doesn't support it directly.
// const unsub = useAuthStore.subscribe(
//     (state) => state.token,
//     (token) => {
//         console.log('[AuthStore] Token subscription triggered. Setting API client token.');
//         // Check if setToken method exists
//         if (typeof apiClient.setToken === 'function') {
//            apiClient.setToken(token);
//         } else {
//            console.warn('[AuthStore] apiClient does not have a setToken method.');
//         }
//     },
//     { fireImmediately: true }
// );

export default useAuthStore;