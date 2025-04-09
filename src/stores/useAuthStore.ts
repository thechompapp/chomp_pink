/* src/stores/useAuthStore.ts */
import { create } from 'zustand';
import { devtools, persist, createJSONStorage, PersistOptions } from 'zustand/middleware';
import { jwtDecode } from 'jwt-decode';
import { queryClient } from '@/queryClient';
import { authService } from '@/services/authService';
import apiClient from '@/services/apiClient';
import type { User, DecodedJwtPayload } from '@/types/User';

interface AuthState {
    token: string | null;
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    isProcessing: boolean;
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

type AuthStore = AuthState & AuthActions;

type PersistedAuthState = Pick<AuthState, 'token' | 'user'>;

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
                setTimeout(() => state?.checkAuthStatus(), 1);
            }
        };
    },
};

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

const useAuthStore = create<AuthStore>()(
    devtools(
        persist(
            (set, get) => ({
                token: null,
                user: null,
                isAuthenticated: false,
                isLoading: true,
                isProcessing: false,
                error: null,

                isSuperuser: () => get().user?.account_type === 'superuser',

                login: async (email, password) => {
                    set({ isProcessing: true, error: null });
                    try {
                        const authData = await authService.login(email, password);
                        const userAccountType = authData.user?.account_type || 'user';
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
                        await queryClient.invalidateQueries();
                        return true;
                    } catch (error: unknown) {
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
                    if (!isAuthenticated && !token) {
                        set({ isLoading: false });
                        return;
                    }
                    console.log('[AuthStore] Performing logout action...');
                    set({ token: null, user: null, isAuthenticated: false, isLoading: false, isProcessing: false, error: null }, true);
                    queryClient.invalidateQueries();
                    console.log('[AuthStore] User logged out.');
                },

                clearError: () => set({ error: null }),

                checkAuthStatus: () => {
                    const { token, isAuthenticated, user, isLoading } = get();
                    if (token && isTokenValid(token)) {
                        try {
                            const decoded: DecodedJwtPayload = jwtDecode(token);
                            if (decoded.user && typeof decoded.user.id === 'number' && typeof decoded.user.username === 'string' && typeof decoded.user.account_type === 'string') {
                                const userAccountType = decoded.user.account_type || 'user';
                                const decodedUser: User = { ...decoded.user, account_type: userAccountType };

                                // Only update if state differs or loading needs to end
                                if (!isAuthenticated || user?.id !== decodedUser.id || user?.account_type !== decodedUser.account_type || isLoading) {
                                    set({
                                        user: decodedUser,
                                        isAuthenticated: true,
                                        isLoading: false,
                                        error: null
                                    });
                                } else if (isLoading) {
                                    set({ isLoading: false }); // Ensure loading ends even if no other changes
                                }
                            } else {
                                console.warn('[AuthStore checkAuthStatus] Invalid token payload structure.');
                                if (isAuthenticated || token) get().logout();
                                else set({ isLoading: false });
                            }
                        } catch (error) {
                            console.error('[AuthStore checkAuthStatus] Error decoding token:', error);
                            if (isAuthenticated || token) get().logout();
                            else set({ isLoading: false });
                        }
                    } else {
                        if (isAuthenticated || token) {
                            get().logout();
                        } else if (isLoading) {
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
                        const response = await apiClient<User>(
                            `/api/auth/update-account-type/${userId}`,
                            'AuthStore Update Account Type',
                            {
                                method: 'PUT',
                                body: JSON.stringify({ account_type: accountType }),
                            }
                        );
                        if (!response.data || typeof response.data.id !== 'number') {
                            throw new Error("Update failed: No valid user data returned.");
                        }
                        set({ isProcessing: false });
                        await queryClient.invalidateQueries({ queryKey: ['adminData', 'users'] });
                        return true;
                    } catch (error: unknown) {
                        console.error('[AuthStore UpdateAccountType] Error:', error);
                        const message = error instanceof Error ? error.message : 'Update failed.';
                        set({ isProcessing: false, error: message });
                        return false;
                    }
                },
            }),
            persistOptions
        ),
        { name: 'AuthStore' }
    )
);

export default useAuthStore;