// src/components/ErrorBoundary.jsx
/**
 * Production-Ready Error Boundary Component
 * 
 * Comprehensive error boundary with user-friendly error displays,
 * error reporting, and recovery options.
 */
import React from 'react';
import PropTypes from 'prop-types';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { logError } from '../utils/logger';

/**
 * Error Fallback Component
 */
const ErrorFallback = ({ error, resetErrorBoundary }) => {
  const isDev = import.meta.env.DEV;

  const handleReload = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  const copyErrorToClipboard = async () => {
    try {
      const errorText = `
Error: ${error.name}
Message: ${error.message}
Stack: ${error.stack}
Timestamp: ${new Date().toISOString()}
URL: ${window.location.href}
User Agent: ${navigator.userAgent}
      `.trim();
      
      await navigator.clipboard.writeText(errorText);
      alert('Error details copied to clipboard');
    } catch (err) {
      console.error('Failed to copy error details:', err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full">
            <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-2">
          Something went wrong
        </h1>

        {/* User-friendly message */}
        <p className="text-gray-600 dark:text-gray-300 text-center mb-6">
          We encountered an unexpected error. Please try refreshing the page or go back to the home page.
        </p>

        {/* Development error details */}
        {isDev && (
          <div className="mb-6 p-3 bg-gray-100 dark:bg-gray-700 rounded-md">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Development Error Details:
            </h3>
            <p className="text-xs text-gray-700 dark:text-gray-300 font-mono break-all">
              {error.name}: {error.message}
            </p>
            {error.stack && (
              <details className="mt-2">
                <summary className="text-xs text-gray-600 dark:text-gray-400 cursor-pointer">
                  Stack Trace
                </summary>
                <pre className="text-xs text-gray-600 dark:text-gray-400 mt-1 whitespace-pre-wrap break-words max-h-32 overflow-y-auto">
                  {error.stack}
                </pre>
              </details>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="space-y-3">
          <button
            onClick={resetErrorBoundary}
            className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleReload}
              className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reload Page
            </button>

            <button
              onClick={handleGoHome}
              className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </button>
          </div>

          {/* Copy error details button (development) */}
          {isDev && (
            <button
              onClick={copyErrorToClipboard}
              className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Bug className="w-4 h-4 mr-2" />
              Copy Error Details
            </button>
          )}
        </div>

        {/* Support information */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            If this problem persists, please contact support with the error details above.
          </p>
        </div>
      </div>
    </div>
  );
};

ErrorFallback.propTypes = {
  error: PropTypes.object.isRequired,
  resetErrorBoundary: PropTypes.func.isRequired,
};

/**
 * Error Boundary Class Component
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error
    logError('[ErrorBoundary] Error caught:', error, errorInfo);
    
    // Update state with error details
    this.setState({
      error,
      errorInfo
    });

    // Call onError prop if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    
    // Call onReset prop if provided
    if (this.props.onReset) {
      this.props.onReset();
    }
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback component if provided, otherwise use default
      if (this.props.FallbackComponent) {
        return (
          <this.props.FallbackComponent
            error={this.state.error}
            resetErrorBoundary={this.handleReset}
            errorInfo={this.state.errorInfo}
          />
        );
      }

      // Default fallback
      return (
        <ErrorFallback
          error={this.state.error}
          resetErrorBoundary={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  FallbackComponent: PropTypes.elementType,
  onError: PropTypes.func,
  onReset: PropTypes.func,
};

export default ErrorBoundary;
export { ErrorFallback };