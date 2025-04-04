import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '@/stores/useAuthStore'; // Re-enable import
import Button from '@/components/Button';
import { Loader2 } from 'lucide-react';

// Keep selector commented out for now
// const authSelector = (state) => ({...});

const Login = () => {
  console.log("[Login Page RENDER START] - Reintroducing store actions only.");
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  // *** FIX: Reintroduce ONLY store actions ***
  const login = useAuthStore((state) => state.login);
  const clearError = useAuthStore((state) => state.clearError);
  // *** Keep state selection commented out ***
  // const isLoading = useAuthStore((state) => state.isLoading);
  // const error = useAuthStore((state) => state.error);
  // const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = false; // Use dummy value
  const error = null; // Use dummy value
  // *** End FIX ***

  // Run clearError on mount (using the reintroduced action)
  useEffect(() => {
    clearError();
  }, [clearError]);

  // Keep redirect effect commented out for now
  // useEffect(() => { ... });


  const handleSubmit = async (e) => {
    e.preventDefault();
    // Use the re-introduced login action
    const success = await login(email, password);
    if (success) {
      console.log("Login successful, navigating home.");
      navigate('/'); // Navigate after successful login
    } else {
      console.log("Login failed (error state not subscribed yet).");
      // We aren't subscribing to 'error' yet, so can't display it
    }
  };

   const handleInputChange = (setter) => (e) => {
      setter(e.target.value);
      // Use the re-introduced clearError action
      // Call it cautiously - maybe only if an error state *was* being displayed
      // if (error) { // We can't check error state yet
         clearError(); // Clear error optimistically
      // }
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
              onChange={handleInputChange(setEmail)}
              disabled={isLoading} // Using dummy value
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
              onChange={handleInputChange(setPassword)}
              disabled={isLoading} // Using dummy value
            />
          </div>

          {/* Display Login Error (Error state not available yet) */}
          {/* {error && ( ... )} */}

          {/* Submit Button */}
          <div>
            <Button
              type="submit"
              variant="primary"
              className="w-full flex justify-center py-2 px-4"
              disabled={isLoading} // Using dummy value
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