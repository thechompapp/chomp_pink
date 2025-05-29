/**
 * Admin Panel Error Boundary Component
 * 
 * Extracted error boundary specifically for AdminPanel with enhanced error handling.
 * Located in components directory following React component organization conventions.
 */

import React from 'react';
import { AlertTriangle } from 'lucide-react';

/**
 * Error fallback component for admin panel
 * @param {Object} props - Error boundary props
 * @param {Error} props.error - The error that occurred
 * @param {Function} props.resetErrorBoundary - Function to reset the error boundary
 * @returns {JSX.Element} Error UI
 */
export function AdminPanelErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5" aria-hidden="true" />
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-red-800">
              Something went wrong in the Admin Panel
            </h3>
            <div className="mt-2 text-sm text-red-700 space-y-2">
              <p>
                <span className="font-medium">Error:</span>{' '}
                {error?.message || 'An unknown error occurred.'}
              </p>
              
              {process.env.NODE_ENV === 'development' && (
                <details className="mt-2 text-xs bg-red-50 p-2 rounded overflow-auto max-h-40">
                  <summary className="font-medium cursor-pointer mb-1">
                    Error Details (Development)
                  </summary>
                  <pre className="whitespace-pre-wrap">
                    {error?.stack || 'No stack trace available'}
                  </pre>
                </details>
              )}
            </div>
            
            <div className="mt-4 flex space-x-3">
              <button
                type="button"
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                onClick={resetErrorBoundary}
              >
                Try again
              </button>
              <a
                href="/"
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Go to Home
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminPanelErrorFallback; 