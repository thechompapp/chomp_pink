/**
 * ApiError class - Custom error class for API-related errors
 * 
 * This class extends the built-in Error class to provide additional
 * properties relevant to API errors, such as status code and response data.
 */
export class ApiError extends Error {
  /**
   * Create a new ApiError instance
   * 
   * @param {string} message - Error message
   * @param {number} [statusCode=500] - HTTP status code
   * @param {Object} [responseData=null] - Additional response data
   */
  constructor(message, statusCode = 500, responseData = null) {
    super(message);
    
    // Set the name to match the class name
    this.name = 'ApiError';
    
    // Add API-specific properties
    this.statusCode = statusCode;
    this.responseData = responseData;
    
    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }
  
  /**
   * Create an ApiError from an Axios error response
   * 
   * @param {Error} error - Axios error object
   * @returns {ApiError} - New ApiError instance
   */
  static fromAxiosError(error) {
    const statusCode = error?.response?.status || 500;
    const responseData = error?.response?.data;
    
    // Determine the error message
    let message = 'API request failed';
    
    if (error?.message) {
      message = error.message;
    } else if (responseData?.message) {
      message = responseData.message;
    } else if (responseData?.error) {
      message = responseData.error;
    } else if (error?.response?.statusText) {
      message = `${statusCode}: ${error.response.statusText}`;
    }
    
    return new ApiError(message, statusCode, responseData);
  }
  
  /**
   * Check if this error represents a network connectivity issue
   * 
   * @returns {boolean} - Whether it's a network error
   */
  isNetworkError() {
    return (
      this.message.includes('Network Error') ||
      this.statusCode === 0 ||
      (typeof window !== 'undefined' && !window.navigator.onLine)
    );
  }
  
  /**
   * Check if this error represents a server-side error (5xx status)
   * 
   * @returns {boolean} - Whether it's a server error
   */
  isServerError() {
    return this.statusCode >= 500 && this.statusCode < 600;
  }
  
  /**
   * Get a more detailed string representation of the error
   * 
   * @returns {string} - String representation
   */
  toString() {
    return `ApiError: ${this.message} (${this.statusCode})`;
  }
}

export default ApiError; 