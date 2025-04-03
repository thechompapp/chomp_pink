import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '@/stores/useAuthStore'; // Default export
import Button from '@/components/Button'; // Default export
import { Loader2 } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const { login, isLoading, error, clearError } = useAuthStore((state) => ({
    login: state.login,
    isLoading: state.isLoading,
    error: state.error,
    clearError: state.clearError,
  }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    const success = await login(email, password);
    if (success) {
      console.log("Login successful, navigating home.");
      navigate('/'); // Redirect to home page on successful login
    } else {
      console.log("Login failed.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-150px)] bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md border border-gray-100">
        <h2 className="text-2xl font-bold text-center text-gray-900">Log in to DOOF</h2>
        <form className="space-y-4" onSubmit={handleSubmit}>
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {/* Display Login Error */}
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2 text-center">
              {error}
            </p>
          )}

          {/* Submit Button */}
          <div>
            <Button
              type="submit"
              variant="primary"
              className="w-full flex justify-center py-2 px-4"
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Log in'}
            </Button>
          </div>
        </form>
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