// src/pages/Login/index.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import useAuthStore from '@/stores/useAuthStore';
import Input from '@/components/UI/Input';
import Button from '@/components/UI/Button';
import BaseCard from '@/components/UI/BaseCard';
import { Label } from '@/components/UI/Label';
import { logDebug, logInfo, logError } from '@/utils/logger';
import { syncAdminAuthWithStore, initializeAdminAuth } from '@/utils/adminAuth';

const LoginPage = () => {
  // Simple state and form setup to avoid any potential issues
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isSuperuser = useAuthStore((state) => state.isSuperuser);
  const isLoading = useAuthStore((state) => state.isLoading);
  
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [submitError, setSubmitError] = useState('');
  
  // Simple redirect if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      // If already authenticated, sync admin auth and navigate
      if (process.env.NODE_ENV === 'development') {
        // More aggressive sync to ensure admin auth is properly set
        syncAdminAuthWithStore(useAuthStore);
        
        // If the user is a superuser, explicitly set admin auth
        if (isSuperuser || useAuthStore.getState().user?.account_type === 'superuser') {
          logInfo('[Login Page] Superuser authenticated, initializing admin auth');
          initializeAdminAuth();
        }
      }
      navigate('/');
    }
    
    // Log on mount for debugging
    logInfo('[Login Page] Component mounted');
    
    // Empty cleanup function that doesn't reference store
    return () => {
      logInfo('[Login Page] Component unmounting');
    };
  }, [isAuthenticated, navigate, isSuperuser]);
  
  // Simplified submit handler
  const onSubmit = async (data) => {
    setSubmitError('');
    
    try {
      logDebug('[Login Page] Login attempt with:', data);
      const success = await login(data);
      
      if (success) {
        logInfo('[Login Page] Login successful');
        
        // Get fresh state after login
        const currentState = useAuthStore.getState();
        
        // Sync admin auth after successful login with more aggressive approach
        if (process.env.NODE_ENV === 'development') {
          syncAdminAuthWithStore(useAuthStore);
          
          // If superuser, explicitly initialize admin auth
          if (currentState.isSuperuser || currentState.user?.account_type === 'superuser') {
            logInfo('[Login Page] Superuser logged in, initializing admin auth');
            initializeAdminAuth();
            
            // Force a state update to trigger UI refresh
            useAuthStore.setState({
              isSuperuser: true,
              isAuthenticated: true
            });
          }
        }
        
        navigate('/');
      } else {
        const errorMessage = useAuthStore.getState().error || 'Login failed';
        setSubmitError(errorMessage);
      }
    } catch (error) {
      logError('[Login Page] Error during login:', error);
      setSubmitError('An unexpected error occurred');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <BaseCard className="w-full max-w-md overflow-hidden shadow-lg">
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
              <Label htmlFor="email">Email</Label>
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
              <Label htmlFor="password">Password</Label>
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
        </div>
      </BaseCard>
    </div>
  );
};

export default LoginPage;
