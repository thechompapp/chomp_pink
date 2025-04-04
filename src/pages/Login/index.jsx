// src/pages/Login/index.jsx
import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '@/stores/useAuthStore';
import useFormHandler from '@/hooks/useFormHandler';
import Button from '@/components/Button';
import { Loader2 } from 'lucide-react';

const Login = () => {
  // Removed console.log for render start
  const navigate = useNavigate();

  // Get actions and auth state from the store
  const loginAction = useAuthStore((state) => state.login);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const clearAuthError = useAuthStore((state) => state.clearError);

  // Initialize the form handler hook
  const {
    formData,
    handleChange,
    handleSubmit,
    isSubmitting,
    submitError,
  } = useFormHandler({
    email: '',
    password: '',
  });

  // Clear any lingering auth errors from the store when the component mounts
  useEffect(() => {
    clearAuthError();
  }, [clearAuthError]);

  // Redirect if user is already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      // Removed console.log for redirect
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Define the actual login logic to be passed to the hook's handleSubmit
  const performLogin = async (currentFormData) => {
    // Removed console.log for performLogin call
    const success = await loginAction(currentFormData.email, currentFormData.password);
    if (success) {
      // Removed console.log for successful login navigation (handled by useEffect)
    } else {
      // Removed console.log for failed login
      // The error from loginAction is caught by handleSubmit
      throw new Error(useAuthStore.getState().error || 'Login failed.');
    }
  };

  // Wrapper function for the form's onSubmit event
  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleSubmit(performLogin);
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-150px)] bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md border border-gray-100">
        <h2 className="text-2xl font-bold text-center text-gray-900">Log in to DOOF</h2>
        <form className="space-y-4" onSubmit={handleFormSubmit}>
          {/* Email Input */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#D1B399] focus:border-[#D1B399] sm:text-sm"
              value={formData.email}
              onChange={handleChange}
              disabled={isSubmitting}
            />
          </div>

          {/* Password Input */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#D1B399] focus:border-[#D1B399] sm:text-sm"
              value={formData.password}
              onChange={handleChange}
              disabled={isSubmitting}
            />
          </div>

          {/* Display Login Error using submitError from hook */}
          {submitError && (
             <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2 text-center">
               {submitError}
             </p>
          )}

          {/* Submit Button */}
          <div>
            <Button
              type="submit"
              variant="primary"
              className="w-full flex justify-center py-2 px-4"
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : 'Log in'}
            </Button>
          </div>
        </form>
        {/* Link to Register page */}
        <p className="text-sm text-center text-gray-600">
          Don't have an account?{' '}
          <Link to="/register" className="font-medium text-[#A78B71] hover:text-[#D1B399]">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;