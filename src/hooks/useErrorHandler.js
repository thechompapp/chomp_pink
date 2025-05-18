/**
 * useErrorHandler - React hook for standardized error handling
 * 
 * This hook provides a consistent way to handle errors in React components
 * with state management, toast notifications, and error formatting.
 */
import { useState, useCallback, useRef, useMemo } from 'react';
import ErrorHandler from '@/utils/ErrorHandler';

// Utility function to check if an error is the same as another
const isSameError = (err1, err2) => {
  if (err1 === err2) return true;
  if (!err1 || !err2) return false;
  
  // Check common error properties
  if (err1.message && err2.message && err1.message === err2.message) {
    // If message is the same, check for stack or code
    if (err1.stack && err2.stack && err1.stack === err2.stack) return true;
    if (err1.code && err2.code && err1.code === err2.code) return true;
    if (err1.name && err2.name && err1.name === err2.name) return true;
  }
  
  return false;
};

/**
 * React hook for standardized error handling
 * 
 * @param {string} [context='Component'] - Context name for error logging
 * @param {Object} [options={}] - Default error handling options
 * @returns {Object} Error handling utilities
 */
export const useErrorHandler = (context = 'Component', options = {}) => {
  // Store the error in state
  const [error, setError] = useState(null);
  
  // Keep track of the last handled error
  const lastErrorRef = useRef(null);
  
  // Memoize options to prevent unnecessary re-renders
  const errorOptions = useMemo(() => ({
    showToast: options.showToast !== false, // Default to true
    logLevel: options.logLevel || 'error',
    defaultMessage: options.defaultMessage || 'An unexpected error occurred',
    includeStack: options.includeStack || false,
    ...options
  }), [options]);
  
  /**
   * Handle an error with standardized logging and notifications
   * 
   * @param {Error|Object|string} err - The error to handle
   * @param {string} [customMessage] - Optional custom error message
   * @param {Object} [handlingOptions] - Error handling options for this specific error
   * @returns {Object} - Standardized error info
   */
  const handleError = useCallback((err, customMessage, handlingOptions = {}) => {
    // Skip if null or undefined
    if (err == null) {
      return { message: 'No error provided', hasError: false };
    }
    
    // Skip if it's the same error we just handled (prevents duplicates)
    if (isSameError(err, lastErrorRef.current) && !handlingOptions.force) {
      return { 
        message: ErrorHandler.getErrorMessage(err), 
        alreadyHandled: true,
        hasError: true 
      };
    }
    
    // Save reference to prevent duplicate handling
    lastErrorRef.current = err;
    
    // Get standardized error info
    const errorInfo = ErrorHandler.handle(err, context, {
      ...errorOptions,
      ...handlingOptions,
      defaultMessage: customMessage || errorOptions.defaultMessage
    });
    
    // Update error state
    setError(errorInfo);
    
    return errorInfo;
  }, [context, errorOptions]);
  
  /**
   * Clear the current error
   */
  const clearError = useCallback(() => {
    setError(null);
    lastErrorRef.current = null;
  }, []);
  
  /**
   * Create an error handler function that includes additional context
   * 
   * @param {string} subContext - Additional context to add
   * @param {Object} [subOptions] - Additional options to override defaults
   * @returns {Function} Contextualized error handler
   */
  const createContextHandler = useCallback((subContext, subOptions = {}) => {
    const fullContext = `${context}.${subContext}`;
    
    return (err, customMessage, handlingOptions = {}) => {
      return handleError(err, customMessage, {
        ...subOptions,
        ...handlingOptions,
        context: fullContext
      });
    };
  }, [context, handleError]);
  
  /**
   * Create a wrapped async function that handles errors automatically
   * 
   * @param {Function} asyncFn - Async function to wrap
   * @param {Object} [wrapOptions] - Options for error handling
   * @returns {Function} Wrapped function that handles errors
   */
  const withErrorHandling = useCallback((asyncFn, wrapOptions = {}) => {
    const { errorMessage, subContext } = wrapOptions;
    const handler = subContext ? createContextHandler(subContext) : handleError;
    
    return async (...args) => {
      try {
        return await asyncFn(...args);
      } catch (err) {
        handler(err, errorMessage, wrapOptions);
        return null;
      }
    };
  }, [handleError, createContextHandler]);
  
  // Memoize the return value to prevent unnecessary re-renders
  return useMemo(() => ({
    // Current error state
    error,
    errorMessage: error?.message,
    hasError: !!error,
    
    // Error handling functions
    handleError,
    clearError,
    createContextHandler,
    withErrorHandling,
    
    // Utility functions
    getErrorMessage: ErrorHandler.getErrorMessage,
    formatForDisplay: (err, displayOptions) => 
      ErrorHandler.formatForDisplay(err || error, displayOptions),
    isNetworkError: (err) => ErrorHandler.isNetworkError(err || error),
    isServerError: (err) => ErrorHandler.isServerError(err || error)
  }), [error, handleError, clearError, createContextHandler, withErrorHandling]);
};

export default useErrorHandler; 