/* src/services/authService.ts */
import apiClient from '@/services/apiClient'; // Use .ts version
// Import specific types from central location
import type { User, AuthResponseData, LoginCredentials, RegisterPayload } from '@/types/User';

// Define the service functions with types
const login = async (email: string, password?: string): Promise<AuthResponseData> => {
  const credentials: LoginCredentials = { email, password };
  // apiClient now returns the full response ApiResponse<{ token, user }>
  const response = await apiClient<AuthResponseData>(
    '/api/auth/login',
    'AuthService Login',
    {
      method: 'POST',
      body: JSON.stringify(credentials),
    }
  );
  // Ensure data exists before returning (apiClient throws on network/HTTP error)
  // Backend sends { data: { token, user } } on success
  if (!response.data) {
    throw new Error('Login failed: No data received from server.');
  }
  return response.data;
};

const register = async (
  username: string,
  email: string,
  password?: string // Made optional to align with LoginCredentials, but likely required
): Promise<AuthResponseData> => {
  if (!password) {
       throw new Error('Password is required for registration.'); // Add runtime check
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
   // Backend sends { data: { token, user } } on success
   if (!response.data) {
    throw new Error('Registration failed: No data received from server.');
  }
  return response.data;
};

// Export the typed service object
export const authService = {
  login,
  register,
};