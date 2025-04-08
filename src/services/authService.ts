/* src/services/authService.ts */
import apiClient from '@/services/apiClient';
import type { User, AuthResponseData, LoginCredentials, RegisterPayload } from '@/types';

const login = async (email: string, password?: string): Promise<AuthResponseData> => {
    if (!password) {
        throw new Error('Password is required for login.');
    }
    const credentials: LoginCredentials = { email, password };
    const response = await apiClient<AuthResponseData>(
        '/api/auth/login',
        'AuthService Login',
        {
            method: 'POST',
            body: JSON.stringify(credentials),
        }
    );
    if (!response.data || !response.data.token || !response.data.user) {
        throw new Error('Login failed: Invalid data received from server.');
    }
    return response.data;
};

const register = async (
    username: string,
    email: string,
    password?: string
): Promise<AuthResponseData> => {
    if (!password) {
        throw new Error('Password is required for registration.');
    }
    const payload: RegisterPayload = { username, email, password };
    const response = await apiClient<AuthResponseData>(
        '/api/auth/register',
        'AuthService Register',
        {
            method: 'POST',
            body: JSON.stringify(payload),
        }
    );
    if (!response.data || !response.data.token || !response.data.user) {
        throw new Error('Registration failed: Invalid data received from server.');
    }
    return response.data;
};

export const authService = {
    login,
    register,
};