// src/pages/AuthTest/index.jsx
import React from 'react';
import { AuthProvider } from '@/contexts/auth';
import AuthSystemTest from '@/tests/auth-system-test';

/**
 * Authentication Test Page
 * 
 * This page wraps the AuthSystemTest component with the AuthProvider
 * to allow testing the new authentication system independently.
 */
const AuthTestPage = () => {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Authentication System Test Page</h1>
      <p className="text-center mb-8 text-gray-600">
        This page allows you to test the new authentication system without affecting the rest of the application.
      </p>
      
      <AuthSystemTest />
    </div>
  );
};

export default AuthTestPage;
