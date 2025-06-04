// src/pages/Login/index.jsx
/**
 * Production-Ready Login Page Component
 * 
 * Robust login component with proper error handling, loading states,
 * and seamless integration with the production authentication system.
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/auth';
import Button from '../../components/UI/Button';
import Input from '../../components/UI/Input';
import { logDebug, logInfo, logError } from '../../utils/logger';

/**
 * Login Page Component
 */
const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, isLoading: authLoading, error: authError, authReady, user } = useAuth();
  
  // Local state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
  // Refs for tracking component state
  const mountedRef = useRef(true);
  const redirectedRef = useRef(false);
  const submitAttemptRef = useRef(0);

  // Form handling
  const {
    register,
    handleSubmit,
    formState: { errors },
    setFocus,
    reset
  } = useForm({
    defaultValues: {
      email: '',
      password: ''
    }
  });

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Focus email input on mount
  useEffect(() => {
    if (authReady && !authLoading) {
      setFocus('email');
    }
  }, [setFocus, authReady, authLoading]);

  // Handle authentication redirect
  useEffect(() => {
    console.log('[Login] Redirect effect triggered', {
      authReady,
      authLoading,
      redirected: redirectedRef.current,
      isAuthenticated,
      hasUser: !!user
    });

    if (!authReady || authLoading || redirectedRef.current) {
      console.log('[Login] Redirect effect early return:', {
        authReady,
        authLoading,
        redirected: redirectedRef.current
      });
      return;
    }

    if (isAuthenticated && user) {
      const redirectTo = location.state?.from || '/';
      
      console.log('[Login] Setting redirected flag and navigating to:', redirectTo);
      logInfo(`[Login] User authenticated, redirecting to: ${redirectTo}`);
      redirectedRef.current = true;
      
      // Use setTimeout to ensure state updates are complete
      setTimeout(() => {
        if (mountedRef.current) {
          navigate(redirectTo, { replace: true });
        }
      }, 100);
    }
  }, [isAuthenticated, user, authReady, authLoading, navigate, location.state]);

  /**
   * Handle form submission
   */
  const onSubmit = useCallback(async (data) => {
    console.log('[Login] onSubmit called with data:', data);
    console.log('[Login] Ref states:', { 
      redirected: redirectedRef.current, 
      mounted: mountedRef.current,
      shouldSkip: redirectedRef.current || !mountedRef.current
    });
    
    if (redirectedRef.current || !mountedRef.current) {
      console.log('[Login] Skipping submit - redirected:', redirectedRef.current, 'mounted:', mountedRef.current);
      return;
    }
    
    try {
      setIsSubmitting(true);
      setSubmitError(null);
      setSubmitSuccess(false);
      submitAttemptRef.current += 1;
      
      console.log('[Login] Attempting login:', { email: data.email, attempt: submitAttemptRef.current });
      logDebug('[Login] Attempting login:', { email: data.email, attempt: submitAttemptRef.current });
      
      console.log('[Login] Calling login function...');
      const result = await login({
        email: data.email.trim(),
        password: data.password
      });
      console.log('[Login] Login function returned:', result);

      if (!mountedRef.current) return;

      if (result.success) {
        setSubmitSuccess(true);
        console.log('[Login] Login successful');
        logInfo('[Login] Login successful');
        
        // Clear form
        reset();
        
        // Redirect will be handled by useEffect above
      } else {
        const errorMessage = result.error || 'Login failed. Please try again.';
        setSubmitError(errorMessage);
        console.log('[Login] Login failed:', errorMessage);
        logError('[Login] Login failed:', errorMessage);
        
        // Focus back to email for retry
        setTimeout(() => setFocus('email'), 100);
      }
    } catch (error) {
      console.log('[Login] Login error caught:', error);
      if (!mountedRef.current) return;
      
      const errorMessage = error.message || 'An unexpected error occurred';
      setSubmitError(errorMessage);
      logError('[Login] Login error:', error);
    } finally {
      if (mountedRef.current) {
        setIsSubmitting(false);
      }
    }
  }, [login, reset, setFocus]);

  /**
   * Test login function directly
   */
  const testLogin = useCallback(async () => {
    console.log('[Login] Testing direct login...');
    try {
      const result = await login({
        email: 'admin@example.com',
        password: 'doof123'
      });
      console.log('[Login] Direct login result:', result);
    } catch (error) {
      console.error('[Login] Direct login error:', error);
    }
  }, [login]);

  /**
   * Toggle password visibility
   */
  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  /**
   * Clear errors when user starts typing
   */
  const clearErrors = useCallback(() => {
    if (submitError) setSubmitError(null);
    if (authError) {
      // The auth context should handle clearing its own errors
    }
  }, [submitError, authError]);

  // Show loading while auth system initializes
  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center space-x-3">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
          <span className="text-gray-600 dark:text-gray-300">Initializing...</span>
        </div>
      </div>
    );
  }

  // Don't render if already authenticated (prevents flash)
  if (isAuthenticated && user && !redirectedRef.current) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center space-x-3">
          <CheckCircle className="w-6 h-6 text-green-600" />
          <span className="text-gray-600 dark:text-gray-300">Redirecting...</span>
        </div>
      </div>
    );
  }

  // Determine which error to show
  const displayError = submitError || authError;
  const isLoading = authLoading || isSubmitting;

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
            <CheckCircle className="h-8 w-8 text-black dark:text-white" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-black dark:text-white">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Or{' '}
            <Link
              to="/register"
              className="font-medium text-black dark:text-white hover:text-gray-700 dark:hover:text-gray-300"
            >
              create a new account
            </Link>
          </p>
        </div>

        {/* Success Message */}
        {submitSuccess && (
          <div className="bg-gray-100 dark:bg-gray-800 p-4">
            <div className="flex">
              <CheckCircle className="h-5 w-5 text-black dark:text-white" />
              <div className="ml-3">
                <p className="text-sm font-medium text-black dark:text-white">
                  Login successful! Redirecting...
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {displayError && !submitSuccess && (
          <div className="bg-gray-100 dark:bg-gray-800 p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {displayError}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Login Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                placeholder="Email address"
                disabled={isLoading}
                className={errors.email ? '' : ''}
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  },
                  onChange: clearErrors
                })}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  placeholder="Password"
                  disabled={isLoading}
                  className={errors.password ? 'pr-10' : 'pr-10'}
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters'
                    },
                    onChange: clearErrors
                  })}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={togglePasswordVisibility}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {errors.password.message}
                </p>
              )}
            </div>
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-black bg-gray-100 dark:bg-gray-800 focus:ring-0 focus:ring-offset-0"
                disabled={isLoading}
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900 dark:text-gray-100">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <Link
                to="/forgot-password"
                className="font-medium text-black dark:text-white hover:text-gray-700 dark:hover:text-gray-300"
              >
                Forgot your password?
              </Link>
            </div>
          </div>

          {/* Submit Button */}
          <div>
            <Button
              type="submit"
              disabled={isLoading || submitSuccess}
              className="group relative w-full flex justify-center py-2 px-4 text-sm font-medium text-white bg-black dark:bg-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 focus:outline-none focus:ring-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              {submitSuccess ? 'Success!' : isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
          </div>

          {/* Development Helper */}
          {import.meta.env.DEV && (
            <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 space-y-2">
              <p className="text-xs text-gray-700 dark:text-gray-300">
                <strong>Dev Mode:</strong> Use admin@example.com / doof123 for testing
              </p>
              <button
                type="button"
                onClick={testLogin}
                className="w-full px-3 py-1 text-xs bg-gray-600 dark:bg-gray-400 text-white dark:text-black hover:bg-gray-700 dark:hover:bg-gray-300"
              >
                Test Direct Login
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
