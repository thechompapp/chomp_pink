/* src/hooks/useApiErrorHandler.ts */
import { useState, useCallback } from 'react';

// Define interface for the hook's return value
interface ApiErrorHandler {
  errorMessage: string | null;
  handleError: (error: unknown, defaultMessage?: string) => void; // Use 'unknown' for broader error catching
  clearError: () => void;
}

/**
 * Custom hook to manage and display API or other errors consistently.
 */
const useApiErrorHandler = (): ApiErrorHandler => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /**
   * Processes an error (from API, validation, etc.) and sets a displayable message.
   * @param {unknown} error - The error object, string, or other value.
   * @param {string} [defaultMessage='An unexpected error occurred.'] - Default message if parsing fails.
   */
  const handleError = useCallback((error: unknown, defaultMessage = 'An unexpected error occurred.') => {
    let message = defaultMessage;

    if (error instanceof Error) {
      message = error.message;
      console.error('Handling Error:', error);
    } else if (typeof error === 'string' && error.length > 0) { // Check if string is not empty
      message = error;
      console.error('Handling Error String:', error);
    } else if (typeof error === 'object' && error !== null) {
      // Check for common error message properties
      message = (error as any).error || (error as any).message || (error as any).msg || defaultMessage;
      // Log the object for inspection if message wasn't found or is default
      if (message === defaultMessage) {
          console.error('Handling Error Object (message extraction failed):', error);
      } else {
           console.error('Handling Error Object:', error);
      }
    } else {
        // Log unexpected types
        console.error('Handling Unknown Error Type:', error);
    }

    // Ensure a non-empty message is set
    setErrorMessage(message || defaultMessage);
  }, []); // Empty dependency array as useCallback doesn't depend on external state here

  /**
   * Clears the current error message.
   */
  const clearError = useCallback(() => {
    setErrorMessage(null);
  }, []); // Empty dependency array

  return {
    errorMessage,
    handleError,
    clearError,
  };
};

export default useApiErrorHandler;