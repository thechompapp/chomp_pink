/* src/services/authService.ts */
import apiClient from '@/services/apiClient'; // Use .ts version
// Import specific types from central location
import type { User, AuthResponseData, LoginCredentials, RegisterPayload } from '@/types'; // Adjust path if needed

// Define the service functions with types
const login = async (email: string, password?: string): Promise<AuthResponseData> => {
  if (!password) { // Added runtime check, although UI should enforce
       throw new Error('Password is required for login.');
   }
  const credentials: LoginCredentials = { email, password };
  // apiClient returns the full response ApiResponse<{ token, user }>
  const response = await apiClient<AuthResponseData>(
    '/api/auth/login',
    'AuthService Login',
    {
      method: 'POST',
      body: JSON.stringify(credentials),
    }
  );
  // Ensure data exists and has the expected structure
  if (!response.data || !response.data.token || !response.data.user) {
    throw new Error('Login failed: Invalid data received from server.');
  }
  return response.data;
};

const register = async (
  username: string,
  email: string,
  password?: string // Made optional to align with LoginCredentials, but likely required
): Promise<AuthResponseData> => {
  if (!password) { // Add runtime check
       throw new Error('Password is required for registration.');
   }
  const payload: RegisterPayload = { username, email, password };
  // Expecting ApiResponse<{ token, user }>
  const response = await apiClient<AuthResponseData>(
    '/api/auth/register',
    'AuthService Register',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
   // Ensure data exists and has the expected structure
   if (!response.data || !response.data.token || !response.data.user) {
    throw new Error('Registration failed: Invalid data received from server.');
  }
  return response.data;
};

// Export the typed service object
export const authService = {
  login,
  register,
};