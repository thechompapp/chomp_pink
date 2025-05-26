/**
 * Authentication Context Tests
 * 
 * Unit tests for the AuthContext and AuthProvider components.
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/auth/context/AuthContext';
import { authService } from '@/auth/services/authService';

// Mock the auth service
jest.mock('@/auth/services/authService', () => ({
  authService: {
    getAuthStatus: jest.fn(),
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    updateProfile: jest.fn(),
    changePassword: jest.fn(),
    requestPasswordReset: jest.fn(),
    resetPassword: jest.fn()
  }
}));

// Mock logger
jest.mock('@/utils/logger', () => ({
  logDebug: jest.fn(),
  logError: jest.fn()
}));

// Test component that uses the auth context
const TestComponent = () => {
  const {
    isAuthenticated,
    isAdmin,
    user,
    isLoading,
    error,
    login,
    logout,
    register,
    updateProfile
  } = useAuth();
  
  return (
    <div>
      <div data-testid="auth-status">
        {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
      </div>
      <div data-testid="admin-status">
        {isAdmin ? 'Admin' : 'Not Admin'}
      </div>
      <div data-testid="user-info">
        {user ? JSON.stringify(user) : 'No User'}
      </div>
      <div data-testid="loading-status">
        {isLoading ? 'Loading' : 'Not Loading'}
      </div>
      <div data-testid="error-message">
        {error || 'No Error'}
      </div>
      <button
        data-testid="login-button"
        onClick={() => login({ email: 'test@example.com', password: 'password' })}
      >
        Login
      </button>
      <button
        data-testid="logout-button"
        onClick={() => logout()}
      >
        Logout
      </button>
      <button
        data-testid="register-button"
        onClick={() => register({ email: 'test@example.com', password: 'password', username: 'testuser' })}
      >
        Register
      </button>
      <button
        data-testid="update-profile-button"
        onClick={() => updateProfile({ name: 'Updated Name' })}
      >
        Update Profile
      </button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('provides initial authentication state', async () => {
    // Mock successful auth status check
    authService.getAuthStatus.mockResolvedValueOnce({
      isAuthenticated: false,
      user: null,
      isAdmin: false
    });
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Initially loading
    expect(screen.getByTestId('loading-status')).toHaveTextContent('Loading');
    
    // Wait for auth initialization to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading-status')).toHaveTextContent('Not Loading');
    });
    
    // Check initial state
    expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
    expect(screen.getByTestId('admin-status')).toHaveTextContent('Not Admin');
    expect(screen.getByTestId('user-info')).toHaveTextContent('No User');
    expect(screen.getByTestId('error-message')).toHaveTextContent('No Error');
    
    // Verify auth service was called
    expect(authService.getAuthStatus).toHaveBeenCalledTimes(1);
  });
  
  test('handles login success', async () => {
    // Mock auth status and login
    authService.getAuthStatus.mockResolvedValueOnce({
      isAuthenticated: false,
      user: null,
      isAdmin: false
    });
    
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      username: 'testuser',
      role: 'user'
    };
    
    authService.login.mockResolvedValueOnce({
      success: true,
      user: mockUser,
      isAdmin: false
    });
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Wait for initial loading to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading-status')).toHaveTextContent('Not Loading');
    });
    
    // Click login button
    fireEvent.click(screen.getByTestId('login-button'));
    
    // Should show loading state
    expect(screen.getByTestId('loading-status')).toHaveTextContent('Loading');
    
    // Wait for login to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading-status')).toHaveTextContent('Not Loading');
    });
    
    // Check updated state
    expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
    expect(screen.getByTestId('user-info')).toHaveTextContent(JSON.stringify(mockUser));
    
    // Verify login was called with correct credentials
    expect(authService.login).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password'
    });
  });
  
  test('handles login failure', async () => {
    // Mock auth status and login failure
    authService.getAuthStatus.mockResolvedValueOnce({
      isAuthenticated: false,
      user: null,
      isAdmin: false
    });
    
    authService.login.mockResolvedValueOnce({
      success: false,
      message: 'Invalid credentials'
    });
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Wait for initial loading to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading-status')).toHaveTextContent('Not Loading');
    });
    
    // Click login button
    fireEvent.click(screen.getByTestId('login-button'));
    
    // Wait for login to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading-status')).toHaveTextContent('Not Loading');
    });
    
    // Check error state
    expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
    expect(screen.getByTestId('error-message')).toHaveTextContent('Invalid credentials');
  });
  
  test('handles logout', async () => {
    // Mock authenticated initial state
    authService.getAuthStatus.mockResolvedValueOnce({
      isAuthenticated: true,
      user: { id: 1, username: 'testuser' },
      isAdmin: false
    });
    
    authService.logout.mockResolvedValueOnce({ success: true });
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Wait for initial loading to complete
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
    });
    
    // Click logout button
    fireEvent.click(screen.getByTestId('logout-button'));
    
    // Wait for logout to complete
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
    });
    
    // Check updated state
    expect(screen.getByTestId('user-info')).toHaveTextContent('No User');
    
    // Verify logout was called
    expect(authService.logout).toHaveBeenCalledTimes(1);
  });
  
  test('handles registration', async () => {
    // Mock auth status and registration
    authService.getAuthStatus.mockResolvedValueOnce({
      isAuthenticated: false,
      user: null,
      isAdmin: false
    });
    
    authService.register.mockResolvedValueOnce({
      success: true,
      message: 'Registration successful'
    });
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Wait for initial loading to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading-status')).toHaveTextContent('Not Loading');
    });
    
    // Click register button
    fireEvent.click(screen.getByTestId('register-button'));
    
    // Wait for registration to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading-status')).toHaveTextContent('Not Loading');
    });
    
    // Verify register was called with correct data
    expect(authService.register).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password',
      username: 'testuser'
    });
  });
  
  test('handles profile update', async () => {
    // Mock authenticated initial state
    const initialUser = { id: 1, username: 'testuser', name: 'Test User' };
    const updatedUser = { ...initialUser, name: 'Updated Name' };
    
    authService.getAuthStatus.mockResolvedValueOnce({
      isAuthenticated: true,
      user: initialUser,
      isAdmin: false
    });
    
    authService.updateProfile.mockResolvedValueOnce({
      success: true,
      user: updatedUser
    });
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Wait for initial loading to complete
    await waitFor(() => {
      expect(screen.getByTestId('user-info')).toHaveTextContent(JSON.stringify(initialUser));
    });
    
    // Click update profile button
    fireEvent.click(screen.getByTestId('update-profile-button'));
    
    // Wait for update to complete
    await waitFor(() => {
      expect(screen.getByTestId('user-info')).toHaveTextContent(JSON.stringify(updatedUser));
    });
    
    // Verify updateProfile was called with correct data
    expect(authService.updateProfile).toHaveBeenCalledWith({ name: 'Updated Name' });
  });
  
  test('handles auth initialization error', async () => {
    // Mock auth status error
    authService.getAuthStatus.mockRejectedValueOnce(new Error('Network error'));
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Wait for initialization to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading-status')).toHaveTextContent('Not Loading');
    });
    
    // Check error state
    expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
    expect(screen.getByTestId('error-message')).toHaveTextContent('Failed to initialize authentication');
  });
});
