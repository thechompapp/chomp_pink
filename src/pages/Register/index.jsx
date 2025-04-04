// src/pages/Register/index.jsx
import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '@/stores/useAuthStore';
import useFormHandler from '@/hooks/useFormHandler';
import Button from '@/components/Button';
import { Loader2 } from 'lucide-react';

const Register = () => {
  const navigate = useNavigate();

  // Get actions and auth state from the store
  const registerAction = useAuthStore((state) => state.register);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const clearAuthError = useAuthStore((state) => state.clearError);

  // Initialize the form handler hook
  const {
    formData,
    handleChange,
    handleSubmit,
    isSubmitting,
    submitError,
    setSubmitError,
  } = useFormHandler({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  // Clear any lingering auth errors from the store when the component mounts
  useEffect(() => {
    clearAuthError();
    setSubmitError(null);
  }, [clearAuthError, setSubmitError]);

  // Redirect if user is already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      // Removed console.log for redirect
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Define the actual registration logic to be passed to the hook's handleSubmit
  const performRegistration = async (currentFormData) => {
    // Removed console.log for performRegistration call

    // --- Local Validation ---
    if (currentFormData.password !== currentFormData.confirmPassword) {
      setSubmitError("Passwords do not match.");
      throw new Error("Passwords do not match.");
    }
    if (currentFormData.password.length < 6) {
      setSubmitError("Password must be at least 6 characters long.");
      throw new Error("Password must be at least 6 characters long.");
    }
    // --- End Local Validation ---

    // Call the register action from the store
    const success = await registerAction(
      currentFormData.username,
      currentFormData.email,
      currentFormData.password
    );

    if (success) {
       // Removed console.log for successful registration
    } else {
      // Removed console.log for failed registration
      throw new Error(useAuthStore.getState().error || 'Registration failed.');
    }
  };

  // Wrapper function for the form's onSubmit event
  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleSubmit(performRegistration);
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-150px)] bg-gray-50 py-12">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md border border-gray-100">
        <h2 className="text-2xl font-bold text-center text-gray-900">Create your DOOF Account</h2>
        <form className="space-y-4" onSubmit={handleFormSubmit}>
          {/* Username Input */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700"> Username </label>
            <input id="username" name="username" type="text" autoComplete="username" required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#D1B399] focus:border-[#D1B399] sm:text-sm"
              value={formData.username} onChange={handleChange} disabled={isSubmitting}
            />
          </div>
          {/* Email Input */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700"> Email address </label>
            <input id="email" name="email" type="email" autoComplete="email" required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#D1B399] focus:border-[#D1B399] sm:text-sm"
              value={formData.email} onChange={handleChange} disabled={isSubmitting}
            />
          </div>
          {/* Password Input */}
          <div>
            <label htmlFor="password"className="block text-sm font-medium text-gray-700"> Password (min. 6 characters) </label>
            <input id="password" name="password" type="password" autoComplete="new-password" required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#D1B399] focus:border-[#D1B399] sm:text-sm"
              value={formData.password} onChange={handleChange} disabled={isSubmitting}
            />
          </div>
          {/* Confirm Password Input */}
           <div>
              <label htmlFor="confirmPassword"className="block text-sm font-medium text-gray-700"> Confirm Password </label>
              <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#D1B399] focus:border-[#D1B399] sm:text-sm"
                  value={formData.confirmPassword} onChange={handleChange} disabled={isSubmitting}
              />
          </div>
          {/* Display Error from hook */}
          {submitError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2 text-center"> {submitError} </p>
          )}
          {/* Submit Button */}
          <div>
              <Button type="submit" variant="primary" className="w-full flex justify-center py-2 px-4" disabled={isSubmitting} >
                  {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : 'Create Account'}
              </Button>
          </div>
        </form>
        <p className="text-sm text-center text-gray-600"> Already have an account?{' '} <Link to="/login" className="font-medium text-[#A78B71] hover:text-[#D1B399]"> Log in </Link> </p>
      </div>
    </div>
  );
};

export default Register;