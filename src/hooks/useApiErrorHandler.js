/* src/hooks/useApiErrorHandler.js */
import { useState, useCallback } from 'react';

const useApiErrorHandler = () => {
  const [errorMessage, setErrorMessage] = useState(null);

  const handleError = useCallback((error, defaultMessage = 'An unexpected error occurred.') => {
    let message = defaultMessage;

    if (error instanceof Error) {
      message = error.message;
      console.error('Handling Error:', error);
    } else if (typeof error === 'string' && error.length > 0) {
      message = error;
      console.error('Handling Error String:', error);
    } else if (typeof error === 'object' && error !== null) {
      message = error.error || error.message || error.msg || defaultMessage;
      if (message === defaultMessage) {
        console.error('Handling Error Object (message extraction failed):', error);
      } else {
        console.error('Handling Error Object:', error);
      }
    } else {
      console.error('Handling Unknown Error Type:', error);
    }

    setErrorMessage(message || defaultMessage);
  }, []);

  const clearError = useCallback(() => {
    setErrorMessage(null);
  }, []);

  return {
    errorMessage,
    handleError,
    clearError,
  };
};

export default useApiErrorHandler;