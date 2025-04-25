// src/pages/Register/index.jsx
/* REFACTORED: Added client-side email validation and password match check */
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '@/stores/useAuthStore.js';
import Button from '@/components/UI/Button.jsx';
import Input from '@/components/UI/Input.jsx';
import ErrorMessage from '@/components/UI/ErrorMessage.jsx';

// Basic email regex (consistent with Login)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Register = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [clientError, setClientError] = useState(''); // State for client-side validation errors
    const navigate = useNavigate();
    const { register, isAuthenticated, error: authError, clearError, isProcessing } = useAuthStore(state => ({
        register: state.register,
        isAuthenticated: state.isAuthenticated,
        error: state.error,
        clearError: state.clearError,
        isProcessing: state.isProcessing
    }));

    // Clear errors on mount/unmount
    useEffect(() => {
        clearError();
        return () => clearError();
    }, [clearError]);

     // Clear client error when user types
     useEffect(() => {
         if (clientError) setClientError('');
     }, [username, email, password, confirmPassword, clientError]);


    const validateForm = () => {
        if (!username || !email || !password || !confirmPassword) {
            setClientError('All fields are required.');
            return false;
        }
        if (!EMAIL_REGEX.test(email)) {
            setClientError('Please enter a valid email address.');
            return false;
        }
         // Basic password length check (mirror backend if possible)
         if (password.length < 8) {
             setClientError('Password must be at least 8 characters long.');
             return false;
         }
        if (password !== confirmPassword) {
            setClientError('Passwords do not match.');
            return false;
        }
        setClientError(''); // Clear errors if valid
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

        const success = await register(username, email, password);
        if (success) {
             console.log('[Register] Registration successful, navigating to home.');
            navigate('/'); // Navigate to home or dashboard after successful registration
        }
        // If registration fails, authError will be set and displayed
    };

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
             console.log('[Register] Already authenticated, navigating to home.');
            navigate('/');
        }
    }, [isAuthenticated, navigate]);


    return (
        <div className="flex items-center justify-center min-h-screen bg-background px-4">
            <div className="w-full max-w-md p-8 space-y-6 bg-card shadow-lg rounded-lg border border-border">
                <h2 className="text-2xl font-bold text-center text-foreground">Register for Doof</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-muted-foreground mb-1">
                            Username
                        </label>
                        <Input
                            type="text"
                            id="username"
                            name="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Choose a username"
                            required
                            className="w-full"
                            aria-describedby="username-error"
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
                            placeholder="•••••••• (min. 8 characters)"
                            required
                            className="w-full"
                            aria-describedby="password-error"
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