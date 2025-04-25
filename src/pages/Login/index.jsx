// src/pages/Login/index.jsx
/* REFACTORED: Added basic client-side email validation */
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '@/stores/useAuthStore.js'; // Use alias
import Button from '@/components/UI/Button.jsx'; // Use alias
import Input from '@/components/UI/Input.jsx'; // Use alias
import ErrorMessage from '@/components/UI/ErrorMessage.jsx'; // Use alias

// Basic email regex (adjust if needed for stricter validation)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [clientError, setClientError] = useState(''); // State for client-side validation errors
    const navigate = useNavigate();
    const location = useLocation();
    const { login, isAuthenticated, error: authError, clearError, isProcessing } = useAuthStore(state => ({
        login: state.login,
        isAuthenticated: state.isAuthenticated,
        error: state.error,
        clearError: state.clearError,
        isProcessing: state.isProcessing
    }));

    const from = location.state?.from?.pathname || "/"; // Redirect path after login

    // Clear errors when component mounts or unmounts
    useEffect(() => {
        clearError(); // Clear server errors on mount
        return () => clearError(); // Clear on unmount
    }, [clearError]);

    // Clear client error when user types
    useEffect(() => {
        if (clientError) setClientError('');
    }, [email, password, clientError]);


    const validateForm = () => {
        if (!email || !password) {
            setClientError('Email and password are required.');
            return false;
        }
        if (!EMAIL_REGEX.test(email)) {
            setClientError('Please enter a valid email address.');
            return false;
        }
        setClientError(''); // Clear any previous client error
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        clearError(); // Clear previous server errors
        setClientError(''); // Clear previous client errors

        // Perform client-side validation first
        if (!validateForm()) {
            return;
        }

        const success = await login(email, password);
        if (success) {
            console.log('[Login] Login successful, navigating to:', from);
            // Navigate to the intended page or home
             // Use replace to avoid login page in history stack
            navigate(from, { replace: true });
        }
         // If login fails, the authError from useAuthStore will be set and displayed
    };

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            console.log('[Login] Already authenticated, navigating to:', from);
            navigate(from, { replace: true });
        }
    }, [isAuthenticated, navigate, from]);


    return (
        <div className="flex items-center justify-center min-h-screen bg-background px-4">
            <div className="w-full max-w-md p-8 space-y-6 bg-card shadow-lg rounded-lg border border-border">
                <h2 className="text-2xl font-bold text-center text-foreground">Login to Doof</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-muted-foreground mb-1">
                            Email
                        </label>
                        <Input
                            type="email"
                            id="email"
                            name="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                            className="w-full"
                            aria-describedby="email-error"
                        />
                    </div>
                    <div>
                        <label
                            htmlFor="password"
                            className="block text-sm font-medium text-muted-foreground mb-1"
                        >
                            Password
                        </label>
                        <Input
                            type="password"
                            id="password"
                            name="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            className="w-full"
                            aria-describedby="password-error"
                        />
                    </div>
                    {/* Display Client-side or Server-side Error */}
                    {(clientError || authError) && (
                        <ErrorMessage
                            message={clientError || authError}
                            id="auth-error"
                            role="alert"
                         />
                     )}
                    <div>
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isProcessing}
                            isLoading={isProcessing}
                        >
                            Login
                        </Button>
                    </div>
                </form>
                <p className="text-sm text-center text-muted-foreground">
                    Don't have an account?{' '}
                    <Link to="/register" className="font-medium text-primary hover:underline">
                        Register here
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Login;