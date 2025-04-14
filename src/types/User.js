/* src/types/User.js */
/* REMOVED: All TypeScript interfaces and types */
// This file defined TypeScript interfaces. In JS, it can serve as documentation.

/*
Expected shape for User:
{
  id: number;
  username: string;
  email: string;
  account_type: 'user' | 'contributor' | 'superuser';
  created_at?: string; // ISO string
  createdAt?: string; // Optional alias
  updated_at?: string; // Optional
  last_login?: string; // Optional
  // password_hash should NOT typically be exposed to frontend
}

Expected shape for AuthResponseData:
{
  token: string;
  user: User; // (without password_hash)
}

Expected shape for DecodedJwtPayload (Internal):
{
  user: {
    id: number;
    username: string;
    account_type: string;
  };
  iat?: number;
  exp?: number;
}

Expected shape for UserPayload (API input, optional):
{
  username: string;
  email: string;
  password?: string;
  account_type?: 'user' | 'contributor' | 'superuser';
}
*/

// You can remove this file if it's not needed for documentation purposes.