/* src/services/authService.js */
/* REMOVED: All TypeScript syntax */
import apiClient from '@/services/apiClient';
// REMOVED: import type { User, AuthResponseData, LoginCredentials, RegisterPayload } from '@/types';

const login = async (email, password) => { // REMOVED: Type hints and Promise return type
    if (!password) {
        throw new Error('Password is required for login.');
    }
    const credentials/*REMOVED: : LoginCredentials*/ = { email, password };
    // Assume apiClient returns the structure { success: boolean, data: AuthResponseData | null, error: string | null }
    const response = await apiClient/*REMOVED: <AuthResponseData>*/(
        '/api/auth/login',
        'AuthService Login',
        {
            method: 'POST',
            body: JSON.stringify(credentials),
        }
    );
    // Check success flag and data presence
    if (!response.success || !response.data || !response.data.token || !response.data.user) {
        // Throw the error message from the API response or a default
        throw new Error(response.error || 'Login failed: Invalid data received from server.');
    }
    // Return the nested data object
    return response.data;
};

const register = async (
    username, // REMOVED: : string
    email, // REMOVED: : string
    password // REMOVED: ?: string
) => { // REMOVED: : Promise<AuthResponseData>
    if (!password) {
        throw new Error('Password is required for registration.');
    }
    const payload/*REMOVED: : RegisterPayload*/ = { username, email, password };
    // Assume apiClient returns the structure { success: boolean, data: AuthResponseData | null, error: string | null }
    const response = await apiClient/*REMOVED: <AuthResponseData>*/(
        '/api/auth/register',
        'AuthService Register',
        {
            method: 'POST',
            body: JSON.stringify(payload),
        }
    );
    // Check success flag and data presence
    if (!response.success || !response.data || !response.data.token || !response.data.user) {
         // Throw the error message from the API response or a default
        throw new Error(response.error || 'Registration failed: Invalid data received from server.');
    }
     // Return the nested data object
    return response.data;
};

export const authService = {
    login,
    register,
};