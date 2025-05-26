/**
 * useAuthRedirect Hook Tests
 * 
 * Unit tests for the useAuthRedirect custom hook.
 */
import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from '@/auth/context/AuthContext';
import useAuthRedirect from '@/auth/hooks/useAuthRedirect';
import { authService } from '@/auth/services/authService';

// Mock the auth service
jest.mock('@/auth/services/authService', () => ({
  authService: {
    getAuthStatus: jest.fn()
  }
}));

// Mock logger
jest.mock('@/utils/logger', () => ({
  logDebug: jest.fn(),
  logError: jest.fn()
}));

// Test component that uses the hook
const TestComponent = ({ 
  requireAuth = false, 
  requiredRoles = null,
  redirectTo = '/login',
  redirectAuthenticated = false,
  authenticatedRedirectTo = '/'
}) => {
  const meetsRequirements = useAuthRedirect({
    requireAuth,
    requiredRoles,
    redirectTo,
    redirectAuthenticated,
    authenticatedRedirectTo
  });
  
  return (
    <div data-testid="test-component">
      {meetsRequirements ? 'Authorized' : 'Loading...'}
    </div>
  );
};

// Location display component for testing redirects
const LocationDisplay = () => {
  const location = useLocation();
  return <div data-testid="location-display">{location.pathname}</div>;
};

describe('useAuthRedirect Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('allows access when no auth is required', async () => {
    // Mock auth status
    authService.getAuthStatus.mockResolvedValueOnce({
      isAuthenticated: false,
      user: null,
      isAdmin: false,
      isLoading: false
    });
    
    const { getByTestId } = render(
      <MemoryRouter initialEntries={['/']}>
        <AuthProvider>
          <TestComponent />
          <LocationDisplay />
        </AuthProvider>
      </MemoryRouter>
    );
    
    // Wait for auth check to complete
    await waitFor(() => {
      expect(getByTestId('test-component')).toHaveTextContent('Authorized');
    });
    
    // Should stay on the current page
    expect(getByTestId('location-display')).toHaveTextContent('/');
  });
  
  test('redirects unauthenticated users from protected routes', async () => {
    // Mock unauthenticated status
    authService.getAuthStatus.mockResolvedValueOnce({
      isAuthenticated: false,
      user: null,
      isAdmin: false,
      isLoading: false
    });
    
    const { getByTestId } = render(
      <MemoryRouter initialEntries={['/protected']}>
        <AuthProvider>
          <Routes>
            <Route 
              path="/protected" 
              element={
                <TestComponent 
                  requireAuth={true} 
                  redirectTo="/login" 
                />
              } 
            />
            <Route path="/login" element={<div>Login Page</div>} />
          </Routes>
          <LocationDisplay />
        </AuthProvider>
      </MemoryRouter>
    );
    
    // Should redirect to login
    await waitFor(() => {
      expect(getByTestId('location-display')).toHaveTextContent('/login');
    });
  });
  
  test('redirects authenticated users from login page', async () => {
    // Mock authenticated status
    authService.getAuthStatus.mockResolvedValueOnce({
      isAuthenticated: true,
      user: { id: 1, role: 'user' },
      isAdmin: false,
      isLoading: false
    });
    
    const { getByTestId } = render(
      <MemoryRouter initialEntries={['/login']}>
        <AuthProvider>
          <Routes>
            <Route 
              path="/login" 
              element={
                <TestComponent 
                  redirectAuthenticated={true} 
                  authenticatedRedirectTo="/dashboard" 
                />
              } 
            />
            <Route path="/dashboard" element={<div>Dashboard</div>} />
          </Routes>
          <LocationDisplay />
        </AuthProvider>
      </MemoryRouter>
    );
    
    // Should redirect to dashboard
    await waitFor(() => {
      expect(getByTestId('location-display')).toHaveTextContent('/dashboard');
    });
  });
  
  test('redirects users without required role', async () => {
    // Mock authenticated status with insufficient role
    authService.getAuthStatus.mockResolvedValueOnce({
      isAuthenticated: true,
      user: { id: 1, role: 'user' },
      isAdmin: false,
      isLoading: false
    });
    
    const { getByTestId } = render(
      <MemoryRouter initialEntries={['/admin']}>
        <AuthProvider>
          <Routes>
            <Route 
              path="/admin" 
              element={
                <TestComponent 
                  requireAuth={true} 
                  requiredRoles="admin" 
                  redirectTo="/unauthorized" 
                />
              } 
            />
            <Route path="/unauthorized" element={<div>Unauthorized</div>} />
          </Routes>
          <LocationDisplay />
        </AuthProvider>
      </MemoryRouter>
    );
    
    // Should redirect to unauthorized
    await waitFor(() => {
      expect(getByTestId('location-display')).toHaveTextContent('/unauthorized');
    });
  });
  
  test('allows access with required role', async () => {
    // Mock authenticated status with sufficient role
    authService.getAuthStatus.mockResolvedValueOnce({
      isAuthenticated: true,
      user: { id: 1, role: 'admin' },
      isAdmin: true,
      isLoading: false
    });
    
    const { getByTestId } = render(
      <MemoryRouter initialEntries={['/admin']}>
        <AuthProvider>
          <TestComponent 
            requireAuth={true} 
            requiredRoles="admin" 
          />
          <LocationDisplay />
        </AuthProvider>
      </MemoryRouter>
    );
    
    // Wait for auth check to complete
    await waitFor(() => {
      expect(getByTestId('test-component')).toHaveTextContent('Authorized');
    });
    
    // Should stay on the current page
    expect(getByTestId('location-display')).toHaveTextContent('/admin');
  });
  
  test('allows access with one of multiple required roles', async () => {
    // Mock authenticated status with one of the required roles
    authService.getAuthStatus.mockResolvedValueOnce({
      isAuthenticated: true,
      user: { id: 1, role: 'moderator' },
      isAdmin: false,
      isLoading: false
    });
    
    const { getByTestId } = render(
      <MemoryRouter initialEntries={['/moderation']}>
        <AuthProvider>
          <TestComponent 
            requireAuth={true} 
            requiredRoles={['admin', 'moderator']} 
          />
          <LocationDisplay />
        </AuthProvider>
      </MemoryRouter>
    );
    
    // Wait for auth check to complete
    await waitFor(() => {
      expect(getByTestId('test-component')).toHaveTextContent('Authorized');
    });
    
    // Should stay on the current page
    expect(getByTestId('location-display')).toHaveTextContent('/moderation');
  });
  
  test('does not redirect while auth is loading', async () => {
    // First return loading state, then unauthenticated
    authService.getAuthStatus.mockResolvedValueOnce({
      isAuthenticated: false,
      user: null,
      isAdmin: false,
      isLoading: true
    });
    
    const { getByTestId } = render(
      <MemoryRouter initialEntries={['/protected']}>
        <AuthProvider>
          <TestComponent requireAuth={true} />
          <LocationDisplay />
        </AuthProvider>
      </MemoryRouter>
    );
    
    // Should not redirect immediately while loading
    expect(getByTestId('location-display')).toHaveTextContent('/protected');
    expect(getByTestId('test-component')).toHaveTextContent('Loading...');
  });
});
