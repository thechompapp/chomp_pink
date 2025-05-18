/**
 * Hook for managing component-level errors with standardized handling
 * 
 * This hook leverages ErrorHandler to provide consistent error handling
 * across components with appropriate UI feedback and logging.
 */
import { useState, useCallback, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import ErrorHandler from '@/utils/ErrorHandler';

/**
 * Custom hook for component-level error handling
 * 
 * @param {Object} options - Configuration options 
 * @param {string} [options.componentName='Component'] - Component name for error context
 * @param {boolean} [options.showToast=true] - Whether to automatically show toast messages
 * @param {boolean} [options.clearOnUnmount=true] - Whether to clear errors when component unmounts
 * @param {Function} [options.onError] - Optional callback when errors occur
 * @returns {Object} Error handling utilities
 */
function useComponentError(options = {}) {
  const {
    componentName = 'Component',
    showToast = true,
    clearOnUnmount = true,
    onError = null
  } = options;
  
  const [error, setError] = useState(null);
  const [errorDetails, setErrorDetails] = useState(null);
  
  /**
   * Clear the current error
   */
  const clearError = useCallback(() => {
    setError(null);
    setErrorDetails(null);
  }, []);

  /**
   * Handle an error with standardized logging and UI feedback
   * 
   * @param {Error|string} err - Error object or message
   * @param {string} [context] - Additional context about where the error occurred
   * @param {Object} [handlingOptions] - Additional error handling options
   * @returns {Object} Standardized error info
   */
  const handleError = useCallback((err, context = '', handlingOptions = {}) => {
    // Skip if the provided error is the same as the current error
    if (err === error && !handlingOptions.force) {
      return;
    }
    
    const fullContext = context ? `${componentName}.${context}` : componentName;
    
    // Use ErrorHandler to standardize error handling
    const errorInfo = ErrorHandler.handle(err, fullContext, {
      showToast: showToast && !handlingOptions.suppressToast,
      ...handlingOptions
    });
    
    // Update component state
    setError(errorInfo.message);
    setErrorDetails(errorInfo);
    
    // Call optional error callback
    if (onError && typeof onError === 'function') {
      onError(errorInfo);
    }
    
    return errorInfo;
  }, [componentName, error, onError, showToast]);

  /**
   * Create an async error wrapper for try/catch blocks
   * 
   * @param {Function} fn - Function to wrap with error handling
   * @param {string} [context] - Context for the operation
   * @param {Object} [options] - Additional options
   * @returns {Function} Wrapped function with error handling
   */
  const withErrorHandling = useCallback((fn, context = '', options = {}) => {
    return async (...args) => {
      try {
        return await fn(...args);
      } catch (err) {
        handleError(err, context, options);
        if (options.rethrow) {
          throw err;
        }
        return null;
      }
    };
  }, [handleError]);

  /**
   * Display a custom error message with standard formatting
   * 
   * @param {string} message - Error message to display
   * @param {string} [context] - Optional context
   * @param {Object} [options] - Additional options
   */
  const showError = useCallback((message, context = '', options = {}) => {
    const errorObj = { message };
    handleError(errorObj, context, options);
  }, [handleError]);

  /**
   * Create an error boundary fallback renderer
   * 
   * @param {Object} errorBoundaryProps - Props from ErrorBoundary component
   * @returns {JSX.Element} Error UI component
   */
  const createErrorFallback = useCallback(({ error, resetErrorBoundary }) => {
    // Handle the error through our standard mechanism
    const errorInfo = ErrorHandler.formatForDisplay(error);
    
    // Return a component that displays the error
    return (
      <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
        <h3 className="text-lg font-semibold mb-2">Something went wrong</h3>
        <p className="mb-4">{errorInfo.message}</p>
        {resetErrorBoundary && (
          <button 
            onClick={resetErrorBoundary}
            className="px-4 py-2 bg-red-100 hover:bg-red-200 rounded-md text-red-800 transition-colors"
          >
            Try again
          </button>
        )}
      </div>
    );
  }, []);

  // Clear error when component unmounts if configured
  useEffect(() => {
    return () => {
      if (clearOnUnmount) {
        clearError();
      }
    };
  }, [clearError, clearOnUnmount]);

  return {
    // State
    error,
    errorDetails,
    hasError: !!error,
    
    // Actions
    handleError,
    clearError,
    showError,
    withErrorHandling,
    createErrorFallback,
    
    // Toast helpers for consistency
    showSuccessToast: (message) => toast.success(message),
    showInfoToast: (message) => toast.custom((t) => (
      <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} bg-blue-500 text-white p-4 rounded-lg shadow-lg`}>
        <span>{message}</span>
      </div>
    )),
  };
}

export default useComponentError; 