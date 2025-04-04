// src/hooks/useApiErrorHandler.js
import { useState, useCallback } from 'react';

/**
 * Custom hook to manage and display API or other errors consistently.
 */
const useApiErrorHandler = () => {
  const [errorMessage, setErrorMessage] = useState(null);

  /**
   * Processes an error (from API, validation, etc.) and sets a displayable message.
   * @param {Error|string|object} error - The error object or message string.
   * @param {string} [defaultMessage='An unexpected error occurred.'] - Default message if parsing fails.
   */
  const handleError = useCallback((error, defaultMessage = 'An unexpected error occurred.') => {
    let message = defaultMessage;

    if (error instanceof Error) {
      // Standard Error object
      message = error.message;
      console.error('Handling Error:', error);
    } else if (typeof error === 'string') {
      // Simple string message
      message = error;
      console.error('Handling Error String:', error);
    } else if (typeof error === 'object' && error !== null) {
      // Attempt to parse common error structures (e.g., from backend JSON)
      message = error.error || error.message || error.msg || defaultMessage;
      console.error('Handling Error Object:', error);
    } else {
        console.error('Handling Unknown Error Type:', error);
    }

    // Ensure message is never empty
    setErrorMessage(message || defaultMessage);
  }, []); // No dependencies needed

  /**
   * Clears the current error message.
   */
  const clearError = useCallback(() => {
    setErrorMessage(null);
  }, []);

  return {
    errorMessage, // The current error message string to display, or null
    handleError,  // Function to call when an error occurs
    clearError,   // Function to manually clear the error message
  };
};

export default useApiErrorHandler;