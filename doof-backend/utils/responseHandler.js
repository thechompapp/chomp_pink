// File: doof-backend/utils/responseHandler.js

const logger = require('./logger');

/**
 * Sends a standardized success response.
 * @param {object} res - Express response object.
 * @param {object|array|string} data - The payload to send.
 * @param {string} [message='Operation successful.'] - Optional success message.
 * @param {number} [statusCode=200] - HTTP status code.
 */
const sendSuccess = (res, data, message = 'Operation successful.', statusCode = 200) => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Sends a standardized error response and logs the error.
 * @param {object} res - Express response object.
 * @param {string} message - User-friendly error message for the response.
 * @param {number} [statusCode=500] - HTTP status code.
 * @param {string} [errorCode='INTERNAL_SERVER_ERROR'] - A specific error code string.
 * @param {Error|object|string} [originalError=null] - The original error object or details for logging.
 */
const sendError = (res, message, statusCode = 500, errorCode = 'INTERNAL_SERVER_ERROR', originalError = null) => {
  // Log the error internally
  // The logger itself will handle printing details of originalError
  logger.error(message, originalError, `(Code: ${errorCode}, Status: ${statusCode})`);

  const errorResponse = {
    success: false,
    error: {
      code: errorCode,
      message: message,
    },
  };

  // Optionally add more error details in non-production environments
  // Based on API_STANDARDIZATION.md, 'details' field is optional
  if (process.env.NODE_ENV !== 'production' && originalError) {
    if (originalError instanceof Error) {
      errorResponse.error.details = originalError.message;
    } else if (typeof originalError === 'string') {
      errorResponse.error.details = originalError;
    } else if (typeof originalError === 'object' && originalError !== null && originalError.message) {
      // Handle cases where originalError might be a custom error object with a message property
      errorResponse.error.details = originalError.message;
    }
  }

  res.status(statusCode).json(errorResponse);
};

module.exports = {
  sendSuccess,
  sendError,
};