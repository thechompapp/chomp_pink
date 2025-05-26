/**
 * Authentication Flow Integration Tests
 * 
 * Integration tests for the complete authentication flow.
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/auth/context/AuthContext';
import { authService } from '@/auth/services/authService';
import { Button, Form, Input, Alert } from '@/components/common';

// Mock the auth service
jest.mock('@/auth/services/authService', () => ({
  authService: {
    getAuthStatus: jest.fn(),
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn()
  }
}));

// Mock components
const LoginPage = () => {
  const { login, isLoading, error } = useAuth();
  const [formData, setFormData] = React.useState({
    email: '',
    password: ''
  });
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    await login(formData);
  };
  
  return (
    <div data-testid="login-page">
      <h1>Login</h1>
      {error && <Alert variant="error">{error}</Alert>}
      <Form onSubmit={handleSubmit} disabled={isLoading}>
        <Input
          name="email"
          label="Email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          required
        />
        <Input
          name="password"
          label="Password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          required
        />
        <Button type="submit" isLoading={isLoading}>
          Login
        </Button>
      </Form>
    </div>
  );
};

const RegisterPage = () => {
  const { register, isLoading, error } = useAuth();
  const [formData, setFormData] = React.useState({
    username: '',
    email: '',
    password: ''
  });
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    await register(formData);
  };
  
  return (
    <div data-testid="register-page">
      <h1>Register</h1>
      {error && <Alert variant="error">{error}</Alert>}
      <Form onSubmit={handleSubmit} disabled={isLoading}>
        <Input
          name="username"
          label="Username"
          value={formData.username}
          onChange={handleChange}
          required
        />
        <Input
          name="email"
          label="Email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          required
        />
        <Input
          name="password"
          label="Password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          required
        />
        <Button type="submit" isLoading={isLoading}>
          Register
        </Button>
      </Form>
    </div>
  );
};

const Dashboard = () => {
  const { user, logout, isLoading } = useAuth();
  
  return (
    <div data-testid="dashboard-page">
      <h1>Dashboard</h1>
      <p>Welcome, {user?.username || 'User'}!</p>
      <Button onClick={logout} isLoading={isLoading}>
        Logout
      </Button>
    </div>
  );
};

const ProtectedDashboard = () => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return <Dashboard />;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route path="/dashboard" element={<ProtectedDashboard />} />
    <Route path="/" element={<Navigate to="/dashboard" />} />
  </Routes>
);

describe('Authentication Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('redirects to login when not authenticated', async () => {
    // Mock unauthenticated status
    authService.getAuthStatus.mockResolvedValueOnce({
      isAuthenticated: false,
      user: null,
      isAdmin: false
    });
    
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </MemoryRouter>
    );
    
    // Should redirect to login
    await waitFor(() => {
      expect(screen.getByTestId('login-page')).toBeInTheDocument();
    });
  });
  
  test('allows login with valid credentials', async () => {
    // Mock initial unauthenticated status
    authService.getAuthStatus.mockResolvedValueOnce({
      isAuthenticated: false,
      user: null,
      isAdmin: false
    });
    
    // Mock successful login
    const mockUser = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      role: 'user'
    };
    
    authService.login.mockResolvedValueOnce({
      success: true,
      user: mockUser,
      isAdmin: false
    });
    
    render(
      <MemoryRouter initialEntries={['/login']}>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </MemoryRouter>
    );
    
    // Wait for login page to render
    await waitFor(() => {
      expect(screen.getByTestId('login-page')).toBeInTheDocument();
    });
    
    // Fill in login form
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' }
    });
    
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' }
    });
    
    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    
    // Verify login was called with correct credentials
    expect(authService.login).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123'
    });
    
    // Mock authenticated status for redirect
    authService.getAuthStatus.mockResolvedValueOnce({
      isAuthenticated: true,
      user: mockUser,
      isAdmin: false
    });
    
    // Should redirect to dashboard
    await waitFor(() => {
      expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
    });
    
    // Should display welcome message with username
    expect(screen.getByText(`Welcome, ${mockUser.username}!`)).toBeInTheDocument();
  });
  
  test('shows error message on login failure', async () => {
    // Mock unauthenticated status
    authService.getAuthStatus.mockResolvedValueOnce({
      isAuthenticated: false,
      user: null,
      isAdmin: false
    });
    
    // Mock login failure
    authService.login.mockResolvedValueOnce({
      success: false,
      message: 'Invalid email or password'
    });
    
    render(
      <MemoryRouter initialEntries={['/login']}>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </MemoryRouter>
    );
    
    // Wait for login page to render
    await waitFor(() => {
      expect(screen.getByTestId('login-page')).toBeInTheDocument();
    });
    
    // Fill in login form
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' }
    });
    
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'wrongpassword' }
    });
    
    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    
    // Should show error message
    await waitFor(() => {
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
    });
    
    // Should still be on login page
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
  });
  
  test('allows registration with valid data', async () => {
    // Mock unauthenticated status
    authService.getAuthStatus.mockResolvedValueOnce({
      isAuthenticated: false,
      user: null,
      isAdmin: false
    });
    
    // Mock successful registration
    authService.register.mockResolvedValueOnce({
      success: true,
      message: 'Registration successful'
    });
    
    render(
      <MemoryRouter initialEntries={['/register']}>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </MemoryRouter>
    );
    
    // Wait for register page to render
    await waitFor(() => {
      expect(screen.getByTestId('register-page')).toBeInTheDocument();
    });
    
    // Fill in registration form
    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'newuser' }
    });
    
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'newuser@example.com' }
    });
    
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' }
    });
    
    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /register/i }));
    
    // Verify register was called with correct data
    expect(authService.register).toHaveBeenCalledWith({
      username: 'newuser',
      email: 'newuser@example.com',
      password: 'password123'
    });
  });
  
  test('allows logout from dashboard', async () => {
    // Mock authenticated status
    const mockUser = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      role: 'user'
    };
    
    authService.getAuthStatus.mockResolvedValueOnce({
      isAuthenticated: true,
      user: mockUser,
      isAdmin: false
    });
    
    // Mock successful logout
    authService.logout.mockResolvedValueOnce({ success: true });
    
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </MemoryRouter>
    );
    
    // Wait for dashboard to render
    await waitFor(() => {
      expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
    });
    
    // Click logout button
    fireEvent.click(screen.getByRole('button', { name: /logout/i }));
    
    // Verify logout was called
    expect(authService.logout).toHaveBeenCalledTimes(1);
    
    // Mock unauthenticated status after logout
    authService.getAuthStatus.mockResolvedValueOnce({
      isAuthenticated: false,
      user: null,
      isAdmin: false
    });
    
    // Should redirect to login
    await waitFor(() => {
      expect(screen.getByTestId('login-page')).toBeInTheDocument();
    });
  });
});
