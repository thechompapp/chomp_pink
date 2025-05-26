/**
 * ProtectedRoute Component Tests
 * 
 * Unit tests for the ProtectedRoute component.
 */
import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from '@/auth/context/AuthContext';
import ProtectedRoute from '@/auth/components/ProtectedRoute';
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

// Location display component for testing redirects
const LocationDisplay = () => {
  const location = useLocation();
  return <div data-testid="location-display">{location.pathname}</div>;
};

describe('ProtectedRoute Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('renders children when no auth is required', async () => {
    // Mock auth status
    authService.getAuthStatus.mockResolvedValueOnce({
      isAuthenticated: false,
      user: null,
      isAdmin: false,
      isLoading: false
    });
    
    const { getByTestId } = render(
      <MemoryRouter initialEntries={['/public']}>
        <AuthProvider>
          <ProtectedRoute allowUnauthenticated>
            <div data-testid="protected-content">Public Content</div>
          </ProtectedRoute>
          <LocationDisplay />
        </AuthProvider>
      </MemoryRouter>
    );
    
    // Wait for auth check to complete
    await waitFor(() => {
      expect(getByTestId('protected-content')).toBeInTheDocument();
    });
    
    // Should stay on the current page
    expect(getByTestId('location-display')).toHaveTextContent('/public');
  });
  
  test('redirects unauthenticated users', async () => {
    // Mock unauthenticated status
    authService.getAuthStatus.mockResolvedValueOnce({
      isAuthenticated: false,
      user: null,
      isAdmin: false,
      isLoading: false
    });
    
    const { getByTestId, queryByTestId } = render(
      <MemoryRouter initialEntries={['/protected']}>
        <AuthProvider>
          <Routes>
            <Route 
              path="/protected" 
              element={
                <ProtectedRoute redirectTo="/login">
                  <div data-testid="protected-content">Protected Content</div>
                </ProtectedRoute>
              } 
            />
            <Route path="/login" element={<div data-testid="login-page">Login Page</div>} />
          </Routes>
          <LocationDisplay />
        </AuthProvider>
      </MemoryRouter>
    );
    
    // Should redirect to login
    await waitFor(() => {
      expect(getByTestId('location-display')).toHaveTextContent('/login');
      expect(getByTestId('login-page')).toBeInTheDocument();
      expect(queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });
  
  test('allows access to authenticated users', async () => {
    // Mock authenticated status
    authService.getAuthStatus.mockResolvedValueOnce({
      isAuthenticated: true,
      user: { id: 1, role: 'user' },
      isAdmin: false,
      isLoading: false
    });
    
    const { getByTestId } = render(
      <MemoryRouter initialEntries={['/protected']}>
        <AuthProvider>
          <ProtectedRoute>
            <div data-testid="protected-content">Protected Content</div>
          </ProtectedRoute>
          <LocationDisplay />
        </AuthProvider>
      </MemoryRouter>
    );
    
    // Wait for auth check to complete
    await waitFor(() => {
      expect(getByTestId('protected-content')).toBeInTheDocument();
    });
    
    // Should stay on the current page
    expect(getByTestId('location-display')).toHaveTextContent('/protected');
  });
  
  test('redirects users without required role', async () => {
    // Mock authenticated status with insufficient role
    authService.getAuthStatus.mockResolvedValueOnce({
      isAuthenticated: true,
      user: { id: 1, role: 'user' },
      isAdmin: false,
      isLoading: false
    });
    
    const { getByTestId, queryByTestId } = render(
      <MemoryRouter initialEntries={['/admin']}>
        <AuthProvider>
          <Routes>
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute requiredRoles="admin" redirectTo="/unauthorized">
                  <div data-testid="admin-content">Admin Content</div>
                </ProtectedRoute>
              } 
            />
            <Route path="/unauthorized" element={<div data-testid="unauthorized-page">Unauthorized</div>} />
          </Routes>
          <LocationDisplay />
        </AuthProvider>
      </MemoryRouter>
    );
    
    // Should redirect to unauthorized
    await waitFor(() => {
      expect(getByTestId('location-display')).toHaveTextContent('/unauthorized');
      expect(getByTestId('unauthorized-page')).toBeInTheDocument();
      expect(queryByTestId('admin-content')).not.toBeInTheDocument();
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
          <ProtectedRoute requiredRoles="admin">
            <div data-testid="admin-content">Admin Content</div>
          </ProtectedRoute>
          <LocationDisplay />
        </AuthProvider>
      </MemoryRouter>
    );
    
    // Wait for auth check to complete
    await waitFor(() => {
      expect(getByTestId('admin-content')).toBeInTheDocument();
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
          <ProtectedRoute requiredRoles={['admin', 'moderator']}>
            <div data-testid="moderation-content">Moderation Content</div>
          </ProtectedRoute>
          <LocationDisplay />
        </AuthProvider>
      </MemoryRouter>
    );
    
    // Wait for auth check to complete
    await waitFor(() => {
      expect(getByTestId('moderation-content')).toBeInTheDocument();
    });
    
    // Should stay on the current page
    expect(getByTestId('location-display')).toHaveTextContent('/moderation');
  });
  
  test('renders nothing while auth is loading', async () => {
    // Mock loading state
    authService.getAuthStatus.mockResolvedValueOnce({
      isAuthenticated: false,
      user: null,
      isAdmin: false,
      isLoading: true
    });
    
    const { queryByTestId } = render(
      <MemoryRouter initialEntries={['/protected']}>
        <AuthProvider>
          <ProtectedRoute>
            <div data-testid="protected-content">Protected Content</div>
          </ProtectedRoute>
        </AuthProvider>
      </MemoryRouter>
    );
    
    // Should not render content while loading
    expect(queryByTestId('protected-content')).not.toBeInTheDocument();
  });
});
