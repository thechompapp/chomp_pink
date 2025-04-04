// src/hooks/useApiErrorHandler.js
import React from 'react'; // Keep React import

/**
 * Custom hook to manage and display API or other errors consistently.
 */
const useApiErrorHandler = () => {
  // Use React.useState directly
  const [errorMessage, setErrorMessage] = React.useState(null);

  /**
   * Processes an error (from API, validation, etc.) and sets a displayable message.
   * @param {Error|string|object} error - The error object or message string.
   * @param {string} [defaultMessage='An unexpected error occurred.'] - Default message if parsing fails.
   */
  // Use React.useCallback directly
  const handleError = React.useCallback((error, defaultMessage = 'An unexpected error occurred.') => {
    let message = defaultMessage;

    if (error instanceof Error) {
      message = error.message;
      console.error('Handling Error:', error);
    } else if (typeof error === 'string') {
      message = error;
      console.error('Handling Error String:', error);
    } else if (typeof error === 'object' && error !== null) {
      message = error.error || error.message || error.msg || defaultMessage;
      console.error('Handling Error Object:', error);
    } else {
        console.error('Handling Unknown Error Type:', error);
    }

    setErrorMessage(message || defaultMessage);
  }, []); // Keep empty dependency array for setErrorMessage

  /**
   * Clears the current error message.
   */
  // Use React.useCallback directly
  const clearError = React.useCallback(() => {
    setErrorMessage(null);
  }, []); // Keep empty dependency array for setErrorMessage

  return {
    errorMessage,
    handleError,
    clearError,
  };
};

export default useApiErrorHandler;