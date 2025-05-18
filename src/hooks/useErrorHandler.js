/**
 * useErrorHandler - React hook for standardized error handling
 * 
 * This hook provides a consistent way to handle errors in React components
 * with state management, toast notifications, and error formatting.
 */
import { useState, useCallback, useRef } from 'react';
import ErrorHandler from '@/utils/ErrorHandler';

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
  
  /**
   * Handle an error with standardized logging and notifications
   * 
   * @param {Error|Object|string} err - The error to handle
   * @param {string} [customMessage] - Optional custom error message
   * @param {Object} [handlingOptions] - Error handling options for this specific error
   * @returns {Object} - Standardized error info
   */
  const handleError = useCallback((err, customMessage, handlingOptions = {}) => {
    // Skip if it's the same error we just handled (prevents duplicates)
    if (err === lastErrorRef.current && !handlingOptions.force) {
      return { message: ErrorHandler.getErrorMessage(err), alreadyHandled: true };
    }
    
    // Save reference to prevent duplicate handling
    lastErrorRef.current = err;
    
    // Get standardized error info
    const errorInfo = ErrorHandler.handle(err, context, {
      ...options,
      ...handlingOptions,
      defaultMessage: customMessage || options.defaultMessage
    });
    
    // Update error state
    setError(errorInfo);
    
    return errorInfo;
  }, [context, options]);
  
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
  
  return {
    // Current error state
    error,
    errorMessage: error?.message,
    hasError: !!error,
    
    // Error handling functions
    handleError,
    clearError,
    createContextHandler,
    
    // Utility functions
    getErrorMessage: ErrorHandler.getErrorMessage,
    formatForDisplay: (err, displayOptions) => 
      ErrorHandler.formatForDisplay(err || error, displayOptions)
  };
};

export default useErrorHandler; 