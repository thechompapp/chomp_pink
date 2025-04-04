// src/pages/Login/index.jsx
import React, { useEffect } from 'react'; // Keep useEffect for potential future use or initial checks if needed
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '@/stores/useAuthStore';
import useFormHandler from '@/hooks/useFormHandler'; // Import the custom hook
import Button from '@/components/Button';
import { Loader2 } from 'lucide-react';

const Login = () => {
  console.log("[Login Page RENDER START] Refactored with useFormHandler.");
  const navigate = useNavigate();

  // Get actions and auth state from the store
  const loginAction = useAuthStore((state) => state.login);
  // We still need isAuthenticated to redirect if already logged in
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  // Clear potential previous auth errors when component mounts
  const clearAuthError = useAuthStore((state) => state.clearError);

  // Initialize the form handler hook
  const {
    formData,       // Contains { email: '', password: '' }
    handleChange,   // Handles onChange for inputs
    handleSubmit,   // Wraps the form submission logic
    isSubmitting,   // Loading state from the hook
    submitError,    // Error message from the hook's submission attempt
    // setSubmitError // Can be used to manually clear error if needed
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
      console.log("[Login Page] Already authenticated, redirecting to home.");
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Define the actual login logic to be passed to the hook's handleSubmit
  const performLogin = async (currentFormData) => {
    console.log('[Login Page] performLogin called with:', currentFormData);
    // The loginAction comes from useAuthStore
    const success = await loginAction(currentFormData.email, currentFormData.password);
    if (success) {
      console.log("Login successful (via hook), navigating home.");
      // Navigation happens automatically due to the isAuthenticated useEffect above
      // navigate('/'); // No longer needed here if useEffect handles it
    } else {
      console.log("Login failed (via hook). Error should be in hook state or auth store.");
      // The error from loginAction is caught by handleSubmit and stored in submitError
      // We might still need to get the specific error from useAuthStore if the hook doesn't capture it how we want
      // For now, rely on the hook's error catching.
      // Throwing an error here will ensure handleSubmit catches it
      throw new Error(useAuthStore.getState().error || 'Login failed.');
    }
  };

  // Wrapper function for the form's onSubmit event
  const handleFormSubmit = (e) => {
    e.preventDefault();
    // Call the hook's handleSubmit, passing our async login logic
    handleSubmit(performLogin);
  };

  return (
    // Keep existing outer div structure
    <div className="flex items-center justify-center min-h-[calc(100vh-150px)] bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md border border-gray-100">
        <h2 className="text-2xl font-bold text-center text-gray-900">Log in to DOOF</h2>
        {/* Use the handleFormSubmit wrapper */}
        <form className="space-y-4" onSubmit={handleFormSubmit}>
          {/* Email Input */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email address
            </label>
            <input
              id="email"
              name="email" // Name must match the key in initialValues/formData
              type="email"
              autoComplete="email"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#D1B399] focus:border-[#D1B399] sm:text-sm"
              value={formData.email}    // Use value from hook's formData
              onChange={handleChange}   // Use handleChange from hook
              disabled={isSubmitting} // Use isSubmitting from hook
            />
          </div>

          {/* Password Input */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              name="password" // Name must match the key in initialValues/formData
              type="password"
              autoComplete="current-password"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#D1B399] focus:border-[#D1B399] sm:text-sm"
              value={formData.password} // Use value from hook's formData
              onChange={handleChange}    // Use handleChange from hook
              disabled={isSubmitting}  // Use isSubmitting from hook
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
              disabled={isSubmitting} // Use isSubmitting from hook
            >
              {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : 'Log in'}
            </Button>
          </div>
        </form>
        {/* Link to Register page (remains same) */}
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