/* src/types/User.ts */
export interface User {
  id: number;
  username: string;
  email: string;
  account_type: 'user' | 'contributor' | 'superuser';
  created_at?: string; // Or Date
  createdAt?: string; // Alias sometimes used
}

export interface AuthResponseData {
  token: string;
  user: User;
}