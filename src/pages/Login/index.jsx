// src/pages/Login/index.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../contexts/auth';
import Button from '../../components/UI/Button';
import Input from '../../components/UI/Input';
import { logDebug, logInfo, logError } from '../../utils/logger';
import offlineModeGuard from '../../utils/offlineModeGuard';

/**
 * Login Page Component
 * Uses the new authentication context for login functionality
 */
const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, isLoading, error } = useAuth();
  
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [submitError, setSubmitError] = useState('');
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      // Redirect to the page the user was trying to access, or home
      const from = location.state?.from?.pathname || '/';
      logInfo(`[Login Page] User already authenticated, redirecting to ${from}`);
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);
  
  // Form submission handler
  const onSubmit = async (data) => {
    setSubmitError('');
    
    // Clear offline mode flags before login attempt
    if (offlineModeGuard && typeof offlineModeGuard.clearOfflineModeFlags === 'function') {
      logDebug('[Login Page] Clearing offline mode flags before login');
      offlineModeGuard.clearOfflineModeFlags();
    }
    
    try {
      logDebug('[Login Page] Login attempt with:', { email: data.email });
      
      // Attempt login with credentials
      await login(data);
      
      // If we get here, login was successful (otherwise it would throw)
      logInfo('[Login Page] Login successful');
      
      // Clear offline mode flags after successful login
      if (offlineModeGuard && typeof offlineModeGuard.clearOfflineModeFlags === 'function') {
        logDebug('[Login Page] Clearing offline mode flags after successful login');
        offlineModeGuard.clearOfflineModeFlags();
      }
      
      // Force UI refresh event
      window.dispatchEvent(new CustomEvent('forceUiRefresh', {
        detail: { timestamp: Date.now() }
      }));
      
      // Redirect to the page the user was trying to access, or home
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch (error) {
      logError('[Login Page] Error during login:', error);
      
      // Display user-friendly error message
      setSubmitError(error.message || 'An unexpected error occurred');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-md overflow-hidden shadow-lg">
        {/* Header section */}
        <div className="p-6 text-center border-b border-border">
          <h3 className="text-2xl font-bold tracking-tight text-primary">
            Welcome Back
          </h3>
          <p className="text-sm text-muted-foreground mt-1">Sign in to continue to Chomp</p>
        </div>
        
        {/* Content section */}
        <div className="p-6 bg-card">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-muted-foreground">Email</label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                className="bg-input text-foreground border-border"
                {...register("email", { 
                  required: "Email is required",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Invalid email address"
                  }
                })}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-muted-foreground">Password</label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="bg-input text-foreground border-border"
                {...register("password", { required: "Password is required" })}
                autoComplete="current-password"
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            {submitError && (
              <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md">
                {submitError}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </div>
        
        {/* Footer section */}
        <div className="p-6 text-center bg-muted border-t border-border">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-primary hover:text-primary/80">
              Sign up
            </Link>
          </p>
          
          {/* Development mode helper */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 p-2 bg-yellow-100 text-yellow-800 text-xs rounded">
              <p><strong>Dev Mode:</strong> Use admin@example.com / doof123 for admin access</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
