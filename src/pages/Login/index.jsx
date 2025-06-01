// src/pages/Login/index.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../contexts/auth';
import Button from '../../components/UI/Button';
import Input from '../../components/UI/Input';
import { logDebug, logInfo, logError } from '../../utils/logger';
import offlineModeGuard from '../../utils/offlineModeGuard';

/**
 * Login Page Component
 * Optimized for stability and performance
 */
const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, isLoading, error, user } = useAuth();
  
  // Use refs for form elements to prevent detachment
  const formRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    mode: 'onBlur', // Validate on blur to reduce re-renders
    defaultValues: {
      email: '',
      password: ''
    }
  });
  
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Stable redirect handler
  const handleRedirect = useCallback((targetPath) => {
    const from = location.state?.from?.pathname || targetPath || '/';
    logInfo(`[Login Page] Redirecting to ${from}`);
    navigate(from, { replace: true });
  }, [navigate, location.state]);
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isSubmitting) {
      // Check if user has admin/superuser role and redirect accordingly
      const userRole = user?.role;
      const userAccountType = user?.account_type;
      
      // If user is admin/superuser, redirect to admin panel by default
      if (userRole === 'superuser' || userAccountType === 'superuser' || userRole === 'admin') {
        const adminPath = '/admin';
        logInfo(`[Login Page] Redirecting superuser to admin panel: ${adminPath}`);
        navigate(adminPath, { replace: true });
        return;
      }
      
      // For regular users, use normal redirect logic
      handleRedirect();
    }
  }, [isAuthenticated, isSubmitting, user, handleRedirect, navigate]);
  
  // Stable form submission handler
  const onSubmit = useCallback(async (data) => {
    // Prevent multiple submissions
    if (isSubmitting || isLoading) {
      logDebug('[Login Page] Submission already in progress, ignoring');
      return;
    }
    
    setIsSubmitting(true);
    setSubmitError('');
    
    // Clear offline mode flags before login attempt
    if (offlineModeGuard && typeof offlineModeGuard.clearOfflineModeFlags === 'function') {
      logDebug('[Login Page] Clearing offline mode flags before login');
      offlineModeGuard.clearOfflineModeFlags();
    }
    
    try {
      logDebug('[Login Page] Login attempt with:', { email: data.email });
      
      // Attempt login with credentials
      const result = await login(data);
      
      if (result && result.success) {
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
        
        // Small delay to ensure state updates
        setTimeout(() => {
          // Check if user has admin/superuser role for redirect
          const loginResult = result;
          const userData = loginResult?.data?.user || result?.user;
          const userRole = userData?.role;
          const userAccountType = userData?.account_type;
          
          // If user is admin/superuser, redirect to admin panel
          if (userRole === 'superuser' || userAccountType === 'superuser' || userRole === 'admin') {
            const adminPath = '/admin';
            logInfo(`[Login Page] Redirecting superuser to admin panel after login: ${adminPath}`);
            navigate(adminPath, { replace: true });
            return;
          }
          
          // For regular users, use normal redirect logic
          handleRedirect();
        }, 100);
      } else {
        throw new Error(result?.error || 'Login failed');
      }
    } catch (error) {
      logError('[Login Page] Error during login:', error);
      
      // Display user-friendly error message
      setSubmitError(error.message || 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  }, [login, isSubmitting, isLoading, handleRedirect]);

  // Stable error clearing handler
  const clearSubmitError = useCallback(() => {
    if (submitError) {
      setSubmitError('');
    }
  }, [submitError]);

  // Clear submit error when user starts typing
  useEffect(() => {
    const form = formRef.current;
    if (!form) return;

    const handleInput = () => clearSubmitError();
    
    form.addEventListener('input', handleInput);
    return () => form.removeEventListener('input', handleInput);
  }, [clearSubmitError]);

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
          <form 
            ref={formRef}
            onSubmit={handleSubmit(onSubmit)} 
            className="space-y-5"
            noValidate
          >
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-muted-foreground">
                Email
              </label>
              <Input
                ref={emailRef}
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                className="bg-input text-foreground border-border"
                autoComplete="email"
                data-testid="email-input"
                {...register("email", { 
                  required: "Email is required",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Invalid email address"
                  }
                })}
              />
              {errors.email && (
                <p className="text-sm text-destructive" role="alert">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-muted-foreground">
                Password
              </label>
              <Input
                ref={passwordRef}
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                className="bg-input text-foreground border-border"
                autoComplete="current-password"
                data-testid="password-input"
                {...register("password", { required: "Password is required" })}
              />
              {errors.password && (
                <p className="text-sm text-destructive" role="alert">
                  {errors.password.message}
                </p>
              )}
            </div>

            {(submitError || error) && (
              <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md" role="alert">
                {submitError || error}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={isSubmitting || isLoading}
              data-testid="submit-button"
            >
              {isSubmitting || isLoading ? 'Signing in...' : 'Sign In'}
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
