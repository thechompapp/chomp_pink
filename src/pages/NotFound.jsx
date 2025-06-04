import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AlertTriangle, Home, ArrowLeft } from 'lucide-react';
import Button from '@/components/UI/Button';

/**
 * NotFound (404) Page Component
 * Displays when users navigate to non-existent routes
 */
const NotFound = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full text-center">
        {/* 404 Icon */}
        <div className="mb-8">
          <AlertTriangle className="w-24 h-24 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h1 className="text-6xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            404
          </h1>
          <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-4">
            Page Not Found
          </h2>
        </div>

        {/* Error message */}
        <div className="mb-8">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Sorry, we couldn't find the page you're looking for.
          </p>
          {location.pathname && (
            <p className="text-sm text-gray-500 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 rounded-lg p-3 font-mono">
              {location.pathname}
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className="space-y-3">
          <Button 
            onClick={() => navigate('/')} 
            className="w-full flex items-center justify-center"
          >
            <Home className="w-4 h-4 mr-2" />
            Go to Home
          </Button>
          
          <Button 
            onClick={() => navigate(-1)} 
            variant="secondary"
            className="w-full flex items-center justify-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>

        {/* Help text */}
        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            If you think this is a mistake, please{' '}
            <button 
              onClick={() => window.location.href = 'mailto:support@doof.app'}
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 underline"
            >
              contact support
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound; 