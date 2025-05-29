import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authService } from '@/services/authService';

// Mock the API client
vi.mock('@/services/http', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
    delete: vi.fn()
  }
}));

import { apiClient } from '@/services/http';

describe('AuthService Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear localStorage
    global.localStorage.clear();
  });

  describe('Token Management', () => {
    it('should store and retrieve auth token', () => {
      const testToken = 'test-jwt-token';
      
      authService.setToken(testToken);
      expect(authService.getToken()).toBe(testToken);
      expect(localStorage.getItem('authToken')).toBe(testToken);
    });

    it('should remove auth token', () => {
      const testToken = 'test-jwt-token';
      authService.setToken(testToken);
      
      authService.removeToken();
      expect(authService.getToken()).toBeNull();
      expect(localStorage.getItem('authToken')).toBeNull();
    });

    it('should check if user is authenticated', () => {
      expect(authService.isAuthenticated()).toBe(false);
      
      authService.setToken('test-token');
      expect(authService.isAuthenticated()).toBe(true);
      
      authService.removeToken();
      expect(authService.isAuthenticated()).toBe(false);
    });
  });

  describe('User Data Management', () => {
    it('should store and retrieve user data', () => {
      const testUser = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        role: 'user'
      };
      
      authService.setUser(testUser);
      expect(authService.getUser()).toEqual(testUser);
      expect(JSON.parse(localStorage.getItem('user'))).toEqual(testUser);
    });

    it('should remove user data', () => {
      const testUser = { id: 1, email: 'test@example.com' };
      authService.setUser(testUser);
      
      authService.removeUser();
      expect(authService.getUser()).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
    });
  });

  describe('Login Process', () => {
    it('should login successfully with valid credentials', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123'
      };
      
      const mockResponse = {
        data: {
          success: true,
          token: 'jwt-token',
          user: {
            id: 1,
            email: 'test@example.com',
            name: 'Test User',
            role: 'user'
          }
        }
      };
      
      apiClient.post.mockResolvedValue(mockResponse);
      
      const result = await authService.login(credentials);
      
      expect(apiClient.post).toHaveBeenCalledWith('/auth/login', credentials);
      expect(result.success).toBe(true);
      expect(result.user).toEqual(mockResponse.data.user);
      expect(authService.getToken()).toBe('jwt-token');
      expect(authService.getUser()).toEqual(mockResponse.data.user);
    });

    it('should handle login failure', async () => {
      const credentials = {
        email: 'wrong@example.com',
        password: 'wrongpassword'
      };
      
      const mockError = new Error('Invalid credentials');
      apiClient.post.mockRejectedValue(mockError);
      
      const result = await authService.login(credentials);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Login failed');
      expect(authService.getToken()).toBeNull();
      expect(authService.getUser()).toBeNull();
    });

    it('should validate login credentials', () => {
      expect(() => authService.login({})).rejects.toThrow();
      expect(() => authService.login({ email: 'test@example.com' })).rejects.toThrow();
      expect(() => authService.login({ password: 'password' })).rejects.toThrow();
      expect(() => authService.login({ email: 'invalid-email', password: 'password' })).rejects.toThrow();
    });
  });

  describe('Registration Process', () => {
    it('should register successfully with valid data', async () => {
      const registrationData = {
        name: 'New User',
        email: 'new@example.com',
        password: 'password123',
        confirmPassword: 'password123'
      };
      
      const mockResponse = {
        data: {
          success: true,
          message: 'Registration successful',
          user: {
            id: 2,
            name: 'New User',
            email: 'new@example.com',
            role: 'user'
          }
        }
      };
      
      apiClient.post.mockResolvedValue(mockResponse);
      
      const result = await authService.register(registrationData);
      
      expect(apiClient.post).toHaveBeenCalledWith('/auth/register', {
        name: registrationData.name,
        email: registrationData.email,
        password: registrationData.password
      });
      expect(result.success).toBe(true);
      expect(result.user).toEqual(mockResponse.data.user);
    });

    it('should handle registration failure', async () => {
      const registrationData = {
        name: 'Test User',
        email: 'existing@example.com',
        password: 'password123',
        confirmPassword: 'password123'
      };
      
      const mockError = new Error('Email already exists');
      apiClient.post.mockRejectedValue(mockError);
      
      const result = await authService.register(registrationData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Registration failed');
    });

    it('should validate registration data', () => {
      const invalidData = [
        {}, // Empty
        { email: 'test@example.com' }, // Missing fields
        { name: 'Test', email: 'invalid-email', password: 'pass' }, // Invalid email
        { name: 'Test', email: 'test@example.com', password: 'short' }, // Short password
        { name: 'Test', email: 'test@example.com', password: 'password123', confirmPassword: 'different' } // Password mismatch
      ];
      
      invalidData.forEach(data => {
        expect(() => authService.register(data)).rejects.toThrow();
      });
    });
  });

  describe('Logout Process', () => {
    it('should logout successfully', async () => {
      // Set up authenticated state
      authService.setToken('test-token');
      authService.setUser({ id: 1, email: 'test@example.com' });
      
      apiClient.post.mockResolvedValue({ data: { success: true } });
      
      const result = await authService.logout();
      
      expect(apiClient.post).toHaveBeenCalledWith('/auth/logout');
      expect(result.success).toBe(true);
      expect(authService.getToken()).toBeNull();
      expect(authService.getUser()).toBeNull();
    });

    it('should clear local data even if API call fails', async () => {
      // Set up authenticated state
      authService.setToken('test-token');
      authService.setUser({ id: 1, email: 'test@example.com' });
      
      apiClient.post.mockRejectedValue(new Error('Network error'));
      
      const result = await authService.logout();
      
      expect(result.success).toBe(true); // Should still succeed locally
      expect(authService.getToken()).toBeNull();
      expect(authService.getUser()).toBeNull();
    });
  });

  describe('Password Reset', () => {
    it('should request password reset successfully', async () => {
      const email = 'test@example.com';
      
      apiClient.post.mockResolvedValue({
        data: { success: true, message: 'Reset email sent' }
      });
      
      const result = await authService.requestPasswordReset(email);
      
      expect(apiClient.post).toHaveBeenCalledWith('/auth/password-reset', { email });
      expect(result.success).toBe(true);
    });

    it('should reset password with valid token', async () => {
      const resetData = {
        token: 'reset-token',
        password: 'newpassword123',
        confirmPassword: 'newpassword123'
      };
      
      apiClient.post.mockResolvedValue({
        data: { success: true, message: 'Password reset successful' }
      });
      
      const result = await authService.resetPassword(resetData);
      
      expect(apiClient.post).toHaveBeenCalledWith('/auth/password-reset/confirm', {
        token: resetData.token,
        password: resetData.password
      });
      expect(result.success).toBe(true);
    });
  });

  describe('Token Refresh', () => {
    it('should refresh token successfully', async () => {
      const oldToken = 'old-token';
      const newToken = 'new-token';
      
      authService.setToken(oldToken);
      
      apiClient.post.mockResolvedValue({
        data: { success: true, token: newToken }
      });
      
      const result = await authService.refreshToken();
      
      expect(apiClient.post).toHaveBeenCalledWith('/auth/refresh');
      expect(result.success).toBe(true);
      expect(authService.getToken()).toBe(newToken);
    });

    it('should handle token refresh failure', async () => {
      authService.setToken('expired-token');
      
      apiClient.post.mockRejectedValue(new Error('Token expired'));
      
      const result = await authService.refreshToken();
      
      expect(result.success).toBe(false);
      expect(authService.getToken()).toBeNull(); // Should clear invalid token
    });
  });

  describe('User Profile', () => {
    it('should fetch user profile successfully', async () => {
      const userProfile = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        role: 'user',
        preferences: {}
      };
      
      apiClient.get.mockResolvedValue({
        data: { success: true, user: userProfile }
      });
      
      const result = await authService.getProfile();
      
      expect(apiClient.get).toHaveBeenCalledWith('/auth/profile');
      expect(result.success).toBe(true);
      expect(result.user).toEqual(userProfile);
    });

    it('should update user profile successfully', async () => {
      const updates = {
        name: 'Updated Name',
        preferences: { theme: 'dark' }
      };
      
      const updatedUser = {
        id: 1,
        name: 'Updated Name',
        email: 'test@example.com',
        preferences: { theme: 'dark' }
      };
      
      apiClient.post.mockResolvedValue({
        data: { success: true, user: updatedUser }
      });
      
      const result = await authService.updateProfile(updates);
      
      expect(apiClient.post).toHaveBeenCalledWith('/auth/profile', updates);
      expect(result.success).toBe(true);
      expect(authService.getUser()).toEqual(updatedUser);
    });
  });

  describe('Role-based Access', () => {
    it('should check user permissions correctly', () => {
      // Test without user
      expect(authService.hasRole('admin')).toBe(false);
      expect(authService.hasPermission('create_restaurant')).toBe(false);
      
      // Test with regular user
      authService.setUser({ id: 1, role: 'user' });
      expect(authService.hasRole('user')).toBe(true);
      expect(authService.hasRole('admin')).toBe(false);
      
      // Test with admin user
      authService.setUser({ id: 2, role: 'admin' });
      expect(authService.hasRole('admin')).toBe(true);
      expect(authService.hasRole('user')).toBe(true); // Admins inherit user role
    });

    it('should validate admin access', () => {
      expect(authService.isAdmin()).toBe(false);
      
      authService.setUser({ id: 1, role: 'user' });
      expect(authService.isAdmin()).toBe(false);
      
      authService.setUser({ id: 2, role: 'admin' });
      expect(authService.isAdmin()).toBe(true);
    });
  });

  describe('Session Management', () => {
    it('should validate session on initialization', async () => {
      const storedToken = 'stored-token';
      const storedUser = { id: 1, email: 'test@example.com' };
      
      localStorage.setItem('authToken', storedToken);
      localStorage.setItem('user', JSON.stringify(storedUser));
      
      apiClient.get.mockResolvedValue({
        data: { success: true, valid: true, user: storedUser }
      });
      
      const result = await authService.validateSession();
      
      expect(apiClient.get).toHaveBeenCalledWith('/auth/validate');
      expect(result.valid).toBe(true);
      expect(authService.getToken()).toBe(storedToken);
      expect(authService.getUser()).toEqual(storedUser);
    });

    it('should clear invalid session', async () => {
      localStorage.setItem('authToken', 'invalid-token');
      localStorage.setItem('user', JSON.stringify({ id: 1 }));
      
      apiClient.get.mockRejectedValue(new Error('Invalid token'));
      
      const result = await authService.validateSession();
      
      expect(result.valid).toBe(false);
      expect(authService.getToken()).toBeNull();
      expect(authService.getUser()).toBeNull();
    });
  });
}); 