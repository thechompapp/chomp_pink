import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import { TEST_USERS } from '../../utils/auth';

// Mock API calls
const mockLogin = vi.fn();
const mockGetUser = vi.fn();

vi.mock('@/services/authService', () => ({
  login: (credentials) => mockLogin(credentials),
  getCurrentUser: () => mockGetUser(),
}));

describe('Auth Flow', () => {
  let queryClient;
  
  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    
    mockLogin.mockReset();
    mockGetUser.mockReset();
  });
  
  afterEach(() => {
    vi.clearAllMocks();
  });

  const renderAuthFlow = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/login']}>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/dashboard" element={<Dashboard />} />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>
    );
  };

  it('should allow user to log in with valid credentials', async () => {
    // Mock successful login
    mockLogin.mockResolvedValueOnce({
      user: TEST_USERS.user,
      token: 'test-token',
    });
    
    // Mock successful user fetch
    mockGetUser.mockResolvedValueOnce(TEST_USERS.user);

    const { container } = renderAuthFlow();
    
    // Fill in login form
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /log in/i });

    await userEvent.type(emailInput, TEST_USERS.user.email);
    await userEvent.type(passwordInput, TEST_USERS.user.password);
    await userEvent.click(submitButton);

    // Verify loading state
    expect(submitButton).toBeDisabled();
    
    // Wait for login to complete
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: TEST_USERS.user.email,
        password: TEST_USERS.user.password,
      });
    });

    // Verify redirect to dashboard
    expect(container.ownerDocument.location.pathname).toBe('/dashboard');
    
    // Verify user data is displayed
    await waitFor(() => {
      expect(screen.getByText(new RegExp(`Welcome, ${TEST_USERS.user.username}`, 'i'))).toBeInTheDocument();
    });
  });

  it('should show error with invalid credentials', async () => {
    // Mock failed login
    mockLogin.mockRejectedValueOnce(new Error('Invalid credentials'));

    renderAuthFlow();
    
    // Fill in login form with invalid credentials
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /log in/i });

    await userEvent.type(emailInput, 'wrong@example.com');
    await userEvent.type(passwordInput, 'wrongpassword');
    await userEvent.click(submitButton);

    // Verify error message is shown
    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });
});
