// src/pages/Register/index.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth';
import Button from '@/components/UI/Button.jsx';
import Input from '@/components/UI/Input.jsx';
import ErrorMessage from '@/components/UI/ErrorMessage.jsx';
import { logDebug, logInfo, logError } from '@/utils/logger';
import offlineModeGuard from '@/utils/offlineModeGuard';

// Basic email regex for validation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Register Page Component
 * Uses the new authentication context for registration functionality
 */
const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [clientError, setClientError] = useState('');
    
    const navigate = useNavigate();
    const { register, isAuthenticated, isLoading, error } = useAuth();

    // Clear client error when user types
    useEffect(() => {
        if (clientError) setClientError('');
    }, [name, email, password, confirmPassword, clientError]);

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            logInfo('[Register] Already authenticated, navigating to home');
            navigate('/');
        }
    }, [isAuthenticated, navigate]);

    /**
     * Validate form inputs
     * @returns {boolean} True if form is valid
     */
    const validateForm = () => {
        if (!name || !email || !password || !confirmPassword) {
            setClientError('All fields are required.');
            return false;
        }
        
        if (!EMAIL_REGEX.test(email)) {
            setClientError('Please enter a valid email address.');
            return false;
        }
        
        if (password.length < 6) {
            setClientError('Password must be at least 6 characters long.');
            return false;
        }
        
        if (password !== confirmPassword) {
            setClientError('Passwords do not match.');
            return false;
        }
        
        setClientError(''); // Clear errors if valid
        return true;
    };

    /**
     * Handle form submission
     * @param {Event} e - Form submit event
     */
    const handleSubmit = async (e) => {
        e.preventDefault();
        setClientError(''); // Clear previous client errors

        // Clear offline mode flags before registration attempt
        if (offlineModeGuard && typeof offlineModeGuard.clearOfflineModeFlags === 'function') {
            logDebug('[Register] Clearing offline mode flags before registration');
            offlineModeGuard.clearOfflineModeFlags();
        }

        // Perform client-side validation first
        if (!validateForm()) {
            return;
        }

        try {
            logDebug('[Register] Registration attempt with:', { email, name });
            
            // Attempt registration with user data
            await register({
                name,
                email,
                password
            });
            
            // If we get here, registration was successful (otherwise it would throw)
            logInfo('[Register] Registration successful');
            
            // Force UI refresh event
            window.dispatchEvent(new CustomEvent('forceUiRefresh', {
                detail: { timestamp: Date.now() }
            }));
            
            // Navigate to home after successful registration
            navigate('/');
        } catch (error) {
            logError('[Register] Error during registration:', error);
            
            // Display user-friendly error message
            setClientError(error.message || 'An unexpected error occurred');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-background px-4">
            <div className="w-full max-w-md p-8 space-y-6 bg-card shadow-lg rounded-lg border border-border">
                <h2 className="text-2xl font-bold text-center text-foreground">Register for Chomp</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-muted-foreground mb-1">
                            Name
                        </label>
                        <Input
                            type="text"
                            id="name"
                            name="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Your full name"
                            required
                            className="w-full"
                            aria-describedby="name-error"
                            data-testid="name-input"
                        />
                    </div>
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
                            data-testid="email-input"
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
                            placeholder="•••••••• (min. 6 characters)"
                            required
                            className="w-full"
                            aria-describedby="password-error"
                            data-testid="password-input"
                        />
                    </div>
                    <div>
                        <label
                            htmlFor="confirmPassword"
                            className="block text-sm font-medium text-muted-foreground mb-1"
                        >
                            Confirm Password
                        </label>
                        <Input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            className="w-full"
                            aria-describedby="confirmPassword-error"
                            data-testid="confirm-password-input"
                        />
                    </div>
                    
                    {/* Display Client-side or Server-side Error */}
                    {(clientError || error) && (
                        <ErrorMessage
                            message={clientError || (error && error.message)}
                            id="auth-error"
                            role="alert"
                        />
                    )}
                    
                    <div>
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isLoading}
                            isLoading={isLoading}
                            data-testid="register-button"
                        >
                            Register
                        </Button>
                    </div>
                </form>
                <p className="text-sm text-center text-muted-foreground">
                    Already have an account?{' '}
                    <Link to="/login" className="font-medium text-primary hover:underline">
                        Login here
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
