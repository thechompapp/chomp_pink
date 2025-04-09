/* src/types/User.ts */
export interface User {
  id: number;
  username: string;
  email: string;
  account_type: 'user' | 'contributor' | 'superuser';
  created_at?: string; // ISO string (e.g., '2023-01-01T12:00:00Z'), optional
  createdAt?: string; // Alias for created_at, optional (camelCase for consistency with some JS conventions)
  updated_at?: string; // Added for completeness, optional
  last_login?: string; // Added for potential auth usage, optional
}

export interface AuthResponseData {
  token: string;
  user: User;
}

// Optional: Array type for multiple users, if needed elsewhere
export type UserArray = User[];

// Optional: Type for user creation/update payloads, if needed by API calls
export interface UserPayload {
  username: string;
  email: string;
  password?: string; // Optional for updates, required for creation elsewhere
  account_type?: 'user' | 'contributor' | 'superuser'; // Optional, default might be set in backend
}