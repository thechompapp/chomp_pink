// Filename: /src/utils/parseApiError.js
/* Utility function to parse error objects and extract a user-friendly message */

/**
 * Parses various error formats and returns a standardized message string.
 * Based on logic from useApiErrorHandler hook.
 * @param {any} error - The error object/string to parse.
 * @param {string} [defaultMessage='An unexpected error occurred.'] - Fallback message.
 * @returns {string} - The extracted or default error message.
 */
export const parseApiError = (error, defaultMessage = 'An unexpected error occurred.') => {
    let message = defaultMessage;

    if (error instanceof Error) {
        // Prefer specific message from standardized API client error if available
        message = error.message || defaultMessage;
        // Log the full error for debugging (optional, consider context)
        // console.error('Parsing Error instance:', error);
    } else if (typeof error === 'string' && error.length > 0) {
        message = error;
        // console.error('Parsing Error String:', error);
    } else if (typeof error === 'object' && error !== null) {
        // Look for common message properties from backend or apiClient
        message = error.error || error.message || error.msg || defaultMessage;
        // Log if extraction failed or if it's just an object
        // if (message === defaultMessage) {
        //     console.error('Parsing Error Object (message extraction failed):', error);
        // } else {
        //     console.error('Parsing Error Object:', error);
        // }
    } else {
       // console.error('Parsing Unknown Error Type:', error);
    }

    // Ensure a non-empty message is returned
    return message || defaultMessage;
};