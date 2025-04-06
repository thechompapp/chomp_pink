// src/services/authService.js
import apiClient from '@/services/apiClient.js'; // Corrected Path

const login = async (email, password) => {
  // The error context is now specific to this service function
  return await apiClient('/api/auth/login', 'AuthService Login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
};

const register = async (username, email, password) => {
  return await apiClient('/api/auth/register', 'AuthService Register', {
    method: 'POST',
    body: JSON.stringify({ username, email, password }),
  });
};

export const authService = {
  login,
  register,
};