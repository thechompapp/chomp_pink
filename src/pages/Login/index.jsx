/* src/pages/Login/index.jsx */
import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom'; // Import useLocation
import useAuthStore from '@/stores/useAuthStore';
import { useQueryClient } from '@tanstack/react-query';
import Button from '@/components/UI/Button';
import Input from '@/components/UI/Input';
import ErrorMessage from '@/components/UI/ErrorMessage';
import * as logger from '@/utils/logger'; // Assuming logger might be useful

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation(); // Get location object
  const queryClient = useQueryClient();
  const { login, checkAuthStatus, isAuthenticated, isLoading, error } = useAuthStore();

  const [formData, setFormData] = useState({ email: 'admin@example.com', password: 'newpass123' });
  const [localError, setLocalError] = useState(null);

  // Determine where to redirect after login
  // If user was sent here from a protected route, redirect back there. Otherwise, go to home '/'.
  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    // Redirect if already authenticated or after successful login
    if (isAuthenticated) {
      logger.logDebug(`[Login] Authenticated. Navigating to: ${from}`);
      queryClient.invalidateQueries(['userLists']); // Invalidate queries that depend on auth state
      queryClient.invalidateQueries(['results']); // Invalidate homepage results if needed
      // REMOVED: navigate('/lists');
      navigate(from, { replace: true }); // Navigate to previous location or home
    }
  }, [isAuthenticated, navigate, queryClient, from]); // Add 'from' to dependencies

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setLocalError(null); // Clear local error on change
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null); // Clear previous errors

    // Basic frontend validation (optional, backend should always validate)
    if (formData.password.length < 8 || formData.password.length > 100) {
      setLocalError('Password must be between 8 and 100 characters.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setLocalError('Please enter a valid email address.');
      return;
    }

    try {
      // Attempt login via auth store
      await login(formData.email, formData.password);
      // Note: The useEffect hook above will handle the redirect once isAuthenticated becomes true
    } catch (err) {
       logger.logError('[Login] Submit Error:', err);
       // Use the error message from the auth store or a generic message
       setLocalError(useAuthStore.getState().error || err.message || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <h2 className="text-2xl font-bold mb-6 text-center text-black">Login to DOOF</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Display local error OR the global error from auth store */}
        {(localError || (!isLoading && error)) && (
          <ErrorMessage message={localError || error} />
        )}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-black">
            Email
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
            autoComplete="email"
            className="mt-1 block w-full text-black placeholder-gray-500 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500" // Added styles
            disabled={isLoading}
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-black">
            Password
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            required
            autoComplete="current-password"
             className="mt-1 block w-full text-black placeholder-gray-500 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500" // Added styles
            disabled={isLoading}
          />
        </div>
        <Button
          type="submit"
          variant="primary"
          className="w-full"
          disabled={isLoading}
          isLoading={isLoading}
        >
          Login
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-black">
        Don't have an account?{' '}
        <Link to="/register" className="text-[#A78B71] hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
};

export default Login;