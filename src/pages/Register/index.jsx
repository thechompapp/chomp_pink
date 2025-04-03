// src/pages/Register/index.jsx
import React, { useState, useEffect } from 'react'; // Added useEffect
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '@/stores/useAuthStore'; // Import auth store
import Button from '@/components/Button';
import { Loader2 } from 'lucide-react';

const Register = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [localError, setLocalError] = useState(''); // For local validation like password match
    const navigate = useNavigate();

    // *** FIX: Select state and actions correctly using Zustand's selector pattern ***
    // This prevents re-renders just because the store object reference changes.
    const register = useAuthStore((state) => state.register);
    const isLoading = useAuthStore((state) => state.isLoading);
    const authError = useAuthStore((state) => state.error);
    const clearError = useAuthStore((state) => state.clearError);
    // *** END FIX ***

    // *** FIX: Clear errors when the component mounts or when inputs change significantly ***
    // This helps prevent stale errors from persisting if the user navigates away and back.
    useEffect(() => {
        clearError();
        setLocalError(''); // Clear local errors on mount as well
    }, [clearError]); // Depend on clearError function reference

    const handleInputChange = (setter) => (e) => {
        setter(e.target.value);
        // Optionally clear errors when user starts typing again
        if (localError || authError) {
            clearError();
            setLocalError('');
        }
    };
    // *** END FIX ***

    const handleSubmit = async (e) => {
        e.preventDefault();
        // It's good practice to clear errors at the start of submission attempt
        clearError();
        setLocalError('');

        // Local validation
        if (password !== confirmPassword) {
            setLocalError("Passwords do not match.");
            return;
        }
        if (password.length < 6) {
            setLocalError("Password must be at least 6 characters long.");
            return;
        }

        // Call the register action from the store
        const success = await register(username, email, password);
        if (success) {
            console.log("Registration successful, navigating home.");
            navigate('/'); // Redirect to home page on successful registration
        } else {
            // Auth error state (authError) is updated by the store action and will be displayed
            console.log("Registration failed.");
        }
    };

    // Combine local and auth errors for display
    const displayError = localError || authError;

    return (
        // Keep existing outer div structure
        <div className="flex items-center justify-center min-h-[calc(100vh-150px)] bg-gray-50 py-12">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md border border-gray-100">
                <h2 className="text-2xl font-bold text-center text-gray-900">Create your DOOF Account</h2>
                <form className="space-y-4" onSubmit={handleSubmit}>
                    {/* Username Input - Use handleInputChange */}
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                            Username
                        </label>
                        <input
                            id="username"
                            name="username"
                            type="text"
                            autoComplete="username"
                            required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#D1B399] focus:border-[#D1B399] sm:text-sm"
                            value={username}
                            onChange={handleInputChange(setUsername)} // FIX: Use change handler
                            disabled={isLoading}
                        />
                    </div>

                    {/* Email Input - Use handleInputChange */}
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
                            onChange={handleInputChange(setEmail)} // FIX: Use change handler
                            disabled={isLoading}
                        />
                    </div>

                    {/* Password Input - Use handleInputChange */}
                    <div>
                        <label htmlFor="password"className="block text-sm font-medium text-gray-700">
                            Password (min. 6 characters)
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="new-password"
                            required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#D1B399] focus:border-[#D1B399] sm:text-sm"
                            value={password}
                            onChange={handleInputChange(setPassword)} // FIX: Use change handler
                            disabled={isLoading}
                        />
                    </div>

                    {/* Confirm Password Input - Use handleInputChange */}
                     <div>
                        <label htmlFor="confirm-password"className="block text-sm font-medium text-gray-700">
                            Confirm Password
                        </label>
                        <input
                            id="confirm-password"
                            name="confirm-password"
                            type="password"
                            autoComplete="new-password"
                            required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#D1B399] focus:border-[#D1B399] sm:text-sm"
                            value={confirmPassword}
                            onChange={handleInputChange(setConfirmPassword)} // FIX: Use change handler
                            disabled={isLoading}
                        />
                    </div>

                    {/* Display Combined Error */}
                    {displayError && (
                        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2 text-center">
                            {displayError}
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
                            {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Create Account'}
                        </Button>
                    </div>
                </form>
                {/* Keep existing link */}
                <p className="text-sm text-center text-gray-600">
                    Already have an account?{' '}
                    <Link to="/login" className="font-medium text-[#A78B71] hover:text-[#D1B399]">
                        Log in
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Register;