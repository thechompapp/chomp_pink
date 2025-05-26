/**
 * Offline Authentication Integration Tests
 * 
 * Tests the authentication system's offline functionality.
 * Verifies that users can authenticate when offline and that data
 * is properly synchronized when coming back online.
 */
import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '@/auth/context/AuthContext';
import { authService } from '@/auth/services/authService';
import { offlineAuthService } from '@/auth/services/offlineAuthService';
import LoginPage from '@/pages/auth/LoginPage';
import ProfilePage from '@/pages/auth/ProfilePage';

// Mock API client
jest.mock('@/services/http', () => {
  const originalModule = jest.requireActual('@/services/http');
  
  return {
    ...originalModule,
    apiClient: {
      ...originalModule.apiClient,
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    }
  };
});

// Import mocked API client
import { apiClient } from '@/services/http';

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  configurable: true,
  writable: true,
  value: true
});

// Test data
const testUser = {
  id: 1,
  email: 'test@example.com',
  username: 'testuser',
  role: 'user'
};

const testCredentials = {
  email: 'test@example.com',
  password: 'password123'
};

describe('Offline Authentication', () => {
  // Clear local storage and mocks before each test
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    
    // Reset navigator.onLine to true
    Object.defineProperty(navigator, 'onLine', {
      value: true
    });
  });
  
  it('should store authentication data for offline use when logging in online', async () => {
    // Mock successful login response
    apiClient.post.mockResolvedValueOnce({
      data: {
        token: 'test-token',
        refreshToken: 'test-refresh-token',
        user: testUser,
        expiresIn: 3600
      }
    });
    
    // Mock successful auth status response
    apiClient.get.mockResolvedValueOnce({
      data: {
        isAuthenticated: true,
        user: testUser
      }
    });
    
    // Spy on offlineAuthService.saveOfflineData
    const saveOfflineDataSpy = jest.spyOn(offlineAuthService, 'saveOfflineData');
    
    // Render login page
    render(
      <MemoryRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>
    );
    
    // Fill in login form
    await userEvent.type(screen.getByLabelText(/email/i), testCredentials.email);
    await userEvent.type(screen.getByLabelText(/password/i), testCredentials.password);
    
    // Submit form
    await userEvent.click(screen.getByRole('button', { name: /login/i }));
    
    // Wait for login to complete
    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith(
        '/api/auth/login',
        testCredentials
      );
    });
    
    // Verify offline data was saved
    expect(saveOfflineDataSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        user: testUser,
        timestamp: expect.any(Number)
      })
    );
    
    // Verify tokens were stored
    expect(localStorage.getItem('auth_access_token')).toBe('test-token');
    expect(localStorage.getItem('auth_refresh_token')).toBe('test-refresh-token');
    expect(localStorage.getItem('auth_user')).toBeTruthy();
  });
  
  it('should authenticate user when offline using stored data', async () => {
    // Set up offline data
    offlineAuthService.saveOfflineData({
      user: testUser,
      timestamp: Date.now()
    });
    
    // Set navigator.onLine to false to simulate offline
    Object.defineProperty(navigator, 'onLine', {
      value: false
    });
    
    // Mock network error for API calls
    apiClient.post.mockRejectedValueOnce(new Error('Network Error'));
    apiClient.get.mockRejectedValueOnce(new Error('Network Error'));
    
    // Render login page
    render(
      <MemoryRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>
    );
    
    // Fill in login form
    await userEvent.type(screen.getByLabelText(/email/i), testCredentials.email);
    await userEvent.type(screen.getByLabelText(/password/i), testCredentials.password);
    
    // Submit form
    await userEvent.click(screen.getByRole('button', { name: /login/i }));
    
    // Wait for login to complete
    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith(
        '/api/auth/login',
        testCredentials
      );
    });
    
    // Verify user is authenticated in offline mode
    await waitFor(() => {
      expect(screen.getByText(/offline mode/i)).toBeInTheDocument();
    });
  });
  
  it('should sync pending actions when coming back online', async () => {
    // Set up offline data
    offlineAuthService.saveOfflineData({
      user: testUser,
      timestamp: Date.now()
    });
    
    // Add a pending action
    offlineAuthService.addPendingAction('updateProfile', {
      username: 'updated-username'
    });
    
    // Mock successful API responses for when we come back online
    apiClient.get.mockResolvedValueOnce({
      data: {
        isAuthenticated: true,
        user: testUser
      }
    });
    
    apiClient.put.mockResolvedValueOnce({
      data: {
        user: {
          ...testUser,
          username: 'updated-username'
        }
      }
    });
    
    // Spy on processPendingActions
    const processPendingActionsSpy = jest.spyOn(offlineAuthService, 'processPendingActions');
    
    // Render profile page with auth provider
    render(
      <MemoryRouter>
        <AuthProvider>
          <ProfilePage />
        </AuthProvider>
      </MemoryRouter>
    );
    
    // Simulate coming back online
    await act(async () => {
      Object.defineProperty(navigator, 'onLine', {
        value: true
      });
      
      // Dispatch online event
      window.dispatchEvent(new Event('online'));
    });
    
    // Wait for pending actions to be processed
    await waitFor(() => {
      expect(processPendingActionsSpy).toHaveBeenCalled();
    });
    
    // Verify the updateProfile API call was made
    await waitFor(() => {
      expect(apiClient.put).toHaveBeenCalledWith(
        '/api/auth/profile',
        { username: 'updated-username' }
      );
    });
  });
  
  it('should handle token refresh failure gracefully when offline', async () => {
    // Set up expired token
    const expiredTime = Date.now() - 1000; // 1 second in the past
    
    authService.setTokens(
      'expired-token',
      'test-refresh-token',
      expiredTime,
      testUser
    );
    
    // Set up offline data
    offlineAuthService.saveOfflineData({
      user: testUser,
      timestamp: Date.now()
    });
    
    // Mock network error for refresh token API call
    apiClient.post.mockRejectedValueOnce(new Error('Network Error'));
    
    // Set navigator.onLine to false to simulate offline
    Object.defineProperty(navigator, 'onLine', {
      value: false
    });
    
    // Spy on getOfflineAuthStatus
    const getOfflineAuthStatusSpy = jest.spyOn(offlineAuthService, 'getOfflineAuthStatus');
    
    // Render profile page with auth provider
    render(
      <MemoryRouter>
        <AuthProvider>
          <ProfilePage />
        </AuthProvider>
      </MemoryRouter>
    );
    
    // Wait for auth status check
    await waitFor(() => {
      expect(getOfflineAuthStatusSpy).toHaveBeenCalled();
    });
    
    // Verify user is authenticated in offline mode
    await waitFor(() => {
      expect(screen.getByText(/offline mode/i)).toBeInTheDocument();
    });
  });
  
  it('should clear offline data when logging out', async () => {
    // Set up auth data
    authService.setTokens(
      'test-token',
      'test-refresh-token',
      Date.now() + 3600000, // 1 hour in the future
      testUser
    );
    
    // Set up offline data
    offlineAuthService.saveOfflineData({
      user: testUser,
      timestamp: Date.now()
    });
    
    // Mock successful logout response
    apiClient.post.mockResolvedValueOnce({});
    
    // Spy on clearOfflineData
    const clearOfflineDataSpy = jest.spyOn(offlineAuthService, 'clearOfflineData');
    
    // Render profile page with logout button
    render(
      <MemoryRouter>
        <AuthProvider>
          <ProfilePage />
        </AuthProvider>
      </MemoryRouter>
    );
    
    // Click logout button
    await userEvent.click(screen.getByRole('button', { name: /logout/i }));
    
    // Wait for logout to complete
    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/api/auth/logout');
    });
    
    // Verify offline data was cleared
    expect(clearOfflineDataSpy).toHaveBeenCalled();
    expect(localStorage.getItem('offline_auth_data')).toBeNull();
  });
});
