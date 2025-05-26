import { toast } from 'react-hot-toast';
import { CONFIG } from '../utils/config';
import { logError, logWarn } from '../utils/logger';

/**
 * Handle common API error scenarios
 * @param {Error} error - Axios error
 * @returns {Promise<Error>} Rejected promise with error
 */
export const handleResponseError = async (error) => {
  const { response, config, code, message } = error;
  const { url, method } = config || {};
  
  // Log the error
  logError(`API Error: ${method?.toUpperCase()} ${url}`, {
    status: response?.status,
    statusText: response?.statusText,
    code,
    message
  });
  
  // Handle network errors
  if (code === 'ERR_NETWORK') {
    return handleNetworkError(error);
  }
  
  // Handle timeout errors
  if (code === 'ECONNABORTED' || message?.includes('timeout')) {
    return handleTimeoutError(error);
  }
  
  // Handle HTTP errors
  if (response) {
    return handleHttpError(error);
  }
  
  // For all other errors, just reject with the original error
  return Promise.reject(error);
};

/**
 * Handle network errors
 * @param {Error} error - Network error
 * @returns {Promise<Error>} Rejected promise with error
 */
const handleNetworkError = (error) => {
  const { config } = error;
  
  // Show error toast
  toast.error(CONFIG.ERROR_MESSAGES.NETWORK_ERROR, {
    id: 'network-error'
  });
  
  // Check if we should go into offline mode
  if (navigator && !navigator.onLine) {
    logWarn('Device is offline');
  }
  
  // Reject with a more descriptive error
  const networkError = new Error(CONFIG.ERROR_MESSAGES.NETWORK_ERROR);
  networkError.isNetworkError = true;
  networkError.originalError = error;
  networkError.config = config;
  
  return Promise.reject(networkError);
};

/**
 * Handle timeout errors
 * @param {Error} error - Timeout error
 * @returns {Promise<Error>} Rejected promise with error
 */
const handleTimeoutError = (error) => {
  const { config } = error;
  
  // Show error toast
  toast.error(CONFIG.ERROR_MESSAGES.TIMEOUT_ERROR, {
    id: 'timeout-error'
  });
  
  // Create a more descriptive error
  const timeoutError = new Error(CONFIG.ERROR_MESSAGES.TIMEOUT_ERROR);
  timeoutError.isTimeoutError = true;
  timeoutError.originalError = error;
  timeoutError.config = config;
  
  return Promise.reject(timeoutError);
};

/**
 * Handle HTTP errors (4xx, 5xx)
 * @param {Error} error - HTTP error
 * @returns {Promise<Error>} Rejected promise with error
 */
const handleHttpError = (error) => {
  const { response, config } = error;
  const { status, data } = response;
  
  // Handle specific status codes
  switch (status) {
    case 400:
      return handleBadRequest(error);
    case 401:
      // Handled by auth interceptor
      break;
    case 403:
      return handleForbidden(error);
    case 404:
      return handleNotFound(error);
    case 409:
      return handleConflict(error);
    case 422:
      return handleValidationError(error);
    case 429:
      return handleRateLimit(error);
    case 500:
    case 502:
    case 503:
    case 504:
      return handleServerError(error);
    default:
      break;
  }
  
  // Default error handling
  const errorMessage = data?.message || CONFIG.ERROR_MESSAGES.SERVER_ERROR;
  
  // Show error toast
  toast.error(errorMessage, {
    id: `http-error-${status}`
  });
  
  // Enhance the error with additional context
  const httpError = new Error(errorMessage);
  httpError.status = status;
  httpError.statusText = response.statusText;
  httpError.data = data;
  httpError.config = config;
  
  return Promise.reject(httpError);
};

// Specific error handlers
const handleBadRequest = (error) => {
  const { data } = error.response;
  const errorMessage = data?.message || 'Invalid request';
  
  toast.error(errorMessage, { id: 'bad-request' });
  
  const badRequestError = new Error(errorMessage);
  badRequestError.status = 400;
  badRequestError.data = data;
  badRequestError.isBadRequest = true;
  
  return Promise.reject(badRequestError);
};

const handleForbidden = (error) => {
  const { data } = error.response;
  const errorMessage = data?.message || 'You do not have permission to perform this action';
  
  toast.error(errorMessage, { id: 'forbidden' });
  
  const forbiddenError = new Error(errorMessage);
  forbiddenError.status = 403;
  forbiddenError.data = data;
  forbiddenError.isForbidden = true;
  
  return Promise.reject(forbiddenError);
};

const handleNotFound = (error) => {
  const { config } = error;
  const errorMessage = `Resource not found: ${config?.url}`;
  
  logWarn(errorMessage);
  
  const notFoundError = new Error(errorMessage);
  notFoundError.status = 404;
  notFoundError.isNotFound = true;
  
  return Promise.reject(notFoundError);
};

const handleConflict = (error) => {
  const { data } = error.response;
  const errorMessage = data?.message || 'A conflict occurred';
  
  toast.error(errorMessage, { id: 'conflict' });
  
  const conflictError = new Error(errorMessage);
  conflictError.status = 409;
  conflictError.data = data;
  conflictError.isConflict = true;
  
  return Promise.reject(conflictError);
};

const handleValidationError = (error) => {
  const { data } = error.response;
  const errorMessage = data?.message || 'Validation failed';
  
  // Show the first validation error if available
  const firstError = data?.errors?.[0]?.msg || data?.errors?.[0]?.message;
  if (firstError) {
    toast.error(firstError, { id: 'validation-error' });
  } else {
    toast.error(errorMessage, { id: 'validation-error' });
  }
  
  const validationError = new Error(errorMessage);
  validationError.status = 422;
  validationError.data = data;
  validationError.isValidationError = true;
  
  return Promise.reject(validationError);
};

const handleRateLimit = (error) => {
  const { data } = error.response;
  const retryAfter = error.response.headers['retry-after'] || 60;
  const errorMessage = data?.message || 'Too many requests. Please try again later.';
  
  toast.error(errorMessage, { 
    id: 'rate-limit',
    duration: 5000
  });
  
  const rateLimitError = new Error(errorMessage);
  rateLimitError.status = 429;
  rateLimitError.retryAfter = parseInt(retryAfter, 10);
  rateLimitError.isRateLimit = true;
  
  return Promise.reject(rateLimitError);
};

const handleServerError = (error) => {
  const { status, data } = error.response;
  const errorMessage = data?.message || CONFIG.ERROR_MESSAGES.SERVER_ERROR;
  
  toast.error(errorMessage, { 
    id: `server-error-${status}`,
    duration: 5000
  });
  
  const serverError = new Error(errorMessage);
  serverError.status = status;
  serverError.data = data;
  serverError.isServerError = true;
  
  return Promise.reject(serverError);
};

/**
 * Setup error interceptors
 * @param {Object} axiosInstance - Axios instance
 * @returns {Function} Cleanup function to eject interceptors
 */
export const setupErrorInterceptors = (axiosInstance) => {
  // Response interceptor to handle errors
  const responseInterceptor = axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => handleResponseError(error)
  );
  
  // Return cleanup function
  return () => {
    axiosInstance.interceptors.response.eject(responseInterceptor);
  };
};
