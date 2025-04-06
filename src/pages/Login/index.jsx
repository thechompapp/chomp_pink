// src/pages/Login/index.jsx
import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '@/stores/useAuthStore';
import useFormHandler from '@/hooks/useFormHandler';
import Button from '@/components/Button';
import { Loader2 } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();

  // Select state and actions from the store
  const loginAction = useAuthStore((state) => state.login);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const clearAuthError = useAuthStore((state) => state.clearError);
  // We might need isLoading for initial check, but ProtectedRoute handles it
  // const isLoadingAuth = useAuthStore((state) => state.isLoading);

  // Initialize the form handler hook
  const {
    formData,
    handleChange,
    handleSubmit,
    isSubmitting,
    submitError,
    setSubmitError, // Use setSubmitError to clear form-specific errors
  } = useFormHandler({
    email: '',
    password: '',
  });

  // Clear any lingering auth errors from the store when the component mounts
  // And clear any form handler errors
  useEffect(() => {
    clearAuthError();
    setSubmitError(null);
  }, [clearAuthError, setSubmitError]); // Dependencies are stable

  // Redirect if user is already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
    // Dependency only on isAuthenticated and navigate
  }, [isAuthenticated, navigate]);

  // Define the actual login logic to be passed to the hook's handleSubmit
  const performLogin = async (currentFormData) => {
    try {
       const success = await loginAction(currentFormData.email, currentFormData.password);
       // Navigation on success is handled by the useEffect above reacting to isAuthenticated change
       if (!success) {
           // If loginAction resolves false or throws, an error occurred.
           // We rely on the error being set in the authStore and caught by handleSubmit.
           // Re-throw an error based on the store's state.
           throw new Error(useAuthStore.getState().error || 'Login failed.');
       }
       // No explicit navigation here, handled by useEffect
    } catch (error) {
        // Re-throw the error to be caught by handleSubmit
        throw error;
    }
  };

  // Wrapper function for the form's onSubmit event
  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleSubmit(performLogin); // Pass the async function directly
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-150px)] bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
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
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#D1B399] focus:border-[#D1B399] sm:text-sm disabled:opacity-50 disabled:bg-gray-100"
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
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#D1B399] focus:border-[#D1B399] sm:text-sm disabled:opacity-50 disabled:bg-gray-100"
              value={formData.password}
              onChange={handleChange}
              disabled={isSubmitting}
            />
          </div>

          {/* Display Login Error using submitError from hook */}
          {submitError && (
             <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2 text-center">
               {submitError}
             </p>
          )}

          {/* Submit Button */}
          <div>
            <Button
              type="submit"
              variant="primary"
              className="w-full flex justify-center py-2 px-4 disabled:opacity-70"
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