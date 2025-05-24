// src/pages/Login/Login.test.jsx
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'; // Import QueryClientProvider


// Component under test
import Login from './index';

// Test Query Client
const testQueryClient = new QueryClient();

// Helper function to include QueryClientProvider
const renderWithProviders = (ui, { route = '/', initialEntries = [route] } = {}) => {
  return render(
    <QueryClientProvider client={testQueryClient}>
        <MemoryRouter initialEntries={initialEntries}>
        <Routes>
            <Route path={route} element={ui} />
            <Route path="/" element={<div>Home Page Mock</div>} />
        </Routes>
        </MemoryRouter>
    </QueryClientProvider>
  );
};


describe('Login Page Integration Test', () => {

    beforeEach(() => {
        // Reset mocks and state before each test
        vi.clearAllMocks();
        mockIsAuthenticated = false;
        mockAuthError = null; // Reset mock error
        mockLoginAction.mockReset();
        mockClearError.mockReset();
        testQueryClient.clear(); // Clear query client cache
    });

    it('should render the login form', () => {
        renderWithProviders(<Login />, { route: '/login' });
        expect(screen.getByRole('heading', { name: /log in to doof/i })).toBeInTheDocument();
        expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
    });

    it('should allow typing in email and password fields', async () => {
        const user = userEvent.setup();
        renderWithProviders(<Login />, { route: '/login' });
        const emailInput = screen.getByLabelText(/email address/i);
        const passwordInput = screen.getByLabelText(/password/i);
        await user.type(emailInput, 'test@example.com');
        await user.type(passwordInput, 'password123');
        expect(emailInput).toHaveValue('test@example.com');
        expect(passwordInput).toHaveValue('password123');
    });

    it('should call login action on successful login attempt', async () => {
        const user = userEvent.setup();
        // Simulate successful login action
        mockLoginAction.mockResolvedValue(true);

        renderWithProviders(<Login />, { route: '/login' });

        await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
        await user.type(screen.getByLabelText(/password/i), 'password123');
        await user.click(screen.getByRole('button', { name: /log in/i }));

        expect(mockLoginAction).toHaveBeenCalledTimes(1);
        expect(mockLoginAction).toHaveBeenCalledWith('test@example.com', 'password123');

        // Should not display error
        await waitFor(() => {
            expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        });
        // Note: Navigation is handled by useEffect based on isAuthenticated,
        // which we can't easily test here without more complex mock setup.
    });

    it('should display error message on failed login', async () => {
        const user = userEvent.setup();
        const errorMessage = 'Invalid test credentials via rejection.';
        // Simulate failure by REJECTING the promise and setting the store error
        mockLoginAction.mockRejectedValue(new Error(errorMessage));
        // Set the mockAuthError so getState().error returns it in performLogin
        mockAuthError = errorMessage;

        renderWithProviders(<Login />, { route: '/login' });

        await user.type(screen.getByLabelText(/email address/i), 'wrong@example.com');
        await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
        await user.click(screen.getByRole('button', { name: /log in/i }));

        expect(mockLoginAction).toHaveBeenCalledTimes(1);

        // Check if the error message (caught by useFormHandler from the rejected promise) is displayed
        await waitFor(() => {
            expect(screen.getByRole('alert')).toHaveTextContent(errorMessage);
        });

        expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should disable button while submitting', async () => {
        const user = userEvent.setup();
        // Simulate a delay in login action
        mockLoginAction.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(true), 50)));

        renderWithProviders(<Login />, { route: '/login' });
        await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
        await user.type(screen.getByLabelText(/password/i), 'password123');
        const submitButton = screen.getByRole('button', { name: /log in/i });

        await user.click(submitButton);

        // Check if button is disabled and shows spinner
        expect(submitButton).toBeDisabled();
        expect(submitButton.querySelector('.animate-spin')).toBeInTheDocument();

        // Wait for submission to complete and button to be enabled again
        await waitFor(() => expect(submitButton).not.toBeDisabled());
        expect(submitButton.querySelector('.animate-spin')).not.toBeInTheDocument();
    });

    it('should redirect if already authenticated', () => {
        mockIsAuthenticated = true; // Set authenticated state before rendering
        renderWithProviders(<Login />, { route: '/login' });
        // Check if navigate was called to redirect
        expect(mockNavigate).toHaveBeenCalledTimes(1);
        expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
    });

    it('should call clearError on mount', () => {
        renderWithProviders(<Login />, { route: '/login' });
        expect(mockClearError).toHaveBeenCalledTimes(1);
    });

});