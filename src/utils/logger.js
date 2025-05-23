// File: src/utils/logger.js
/**
 * Enhanced logger utility for consistent logging throughout the application
 * Features:
 * - Timestamp formatting
 * - Log level filtering
 * - Performance tracking
 * - Error enrichment
 * - Context preservation
 */

// Configuration
const config = {
  // Log levels: 0=off, 1=error, 2=warn, 3=info, 4=log, 5=debug
  logLevel: import.meta.env.DEV || process.env.NODE_ENV === 'development' ? 5 : 3,
  enableTimestamps: true,
  enableStackTraces: import.meta.env.DEV || process.env.NODE_ENV === 'development',
  enablePerformanceTracking: import.meta.env.DEV || process.env.NODE_ENV === 'development',
  // Allow overrides from environment
  ...((import.meta.env.VITE_LOGGER_CONFIG && JSON.parse(import.meta.env.VITE_LOGGER_CONFIG)) || {})
};

// Performance tracking
const performanceMarkers = new Map();

/**
 * Get formatted timestamp
 * @returns {string} Formatted timestamp
 */
const getTimestamp = () => {
  if (!config.enableTimestamps) return '';
  return `[${new Date().toISOString()}]`;
};

/**
 * Format a log message with timestamp and prefix
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @returns {string} Formatted message
 */
const formatMessage = (level, message) => {
  return `[${level}]${config.enableTimestamps ? getTimestamp() : ''} ${message}`;
};

/**
 * Process error objects to extract useful information
 * @param {Error} error - Error object
 * @returns {Object} Processed error with additional context
 */
const processError = (error) => {
  if (!(error instanceof Error)) return error;
  
  const processedError = {
    name: error.name,
    message: error.message,
    stack: config.enableStackTraces ? error.stack : undefined
  };
  
  // Extract additional properties from error
  if (error.code) processedError.code = error.code;
  if (error.status) processedError.status = error.status;
  if (error.response) processedError.response = {
    status: error.response.status,
    statusText: error.response.statusText,
    url: error.response.url,
    data: error.response.data
  };
  
  return processedError;
};

// Create individual logging functions
export const log = (message, ...optionalParams) => {
  if (config.logLevel < 4) return;
  console.log(formatMessage('LOG', message), ...optionalParams);
};

export const info = (message, ...optionalParams) => {
  if (config.logLevel < 3) return;
  console.info(formatMessage('INFO', message), ...optionalParams);
};

export const warn = (message, ...optionalParams) => {
  if (config.logLevel < 2) return;
  console.warn(formatMessage('WARN', message), ...optionalParams);
};

export const error = (message, ...optionalParams) => {
  if (config.logLevel < 1) return;
  
  // Process Error objects for better logging
  const processedParams = optionalParams.map(param => 
    param instanceof Error ? processError(param) : param
  );
  
  console.error(formatMessage('ERROR', message), ...processedParams);
};

export const debug = (message, ...optionalParams) => {
  if (config.logLevel < 5) return;
  console.debug(formatMessage('DEBUG', message), ...optionalParams);
};

/**
 * Start performance tracking for a specific operation
 * @param {string} markerId - Unique identifier for the operation
 * @param {string} description - Description of the operation
 */
export const startPerformanceTracking = (markerId, description = '') => {
  if (!config.enablePerformanceTracking) return;
  
  performanceMarkers.set(markerId, {
    startTime: performance.now(),
    description
  });
  
  debug(`Performance tracking started: ${description || markerId}`);
};

/**
 * End performance tracking and log the duration
 * @param {string} markerId - Identifier used in startPerformanceTracking
 * @param {boolean} logResult - Whether to log the result
 * @returns {number} Duration in milliseconds
 */
export const endPerformanceTracking = (markerId, logResult = true) => {
  if (!config.enablePerformanceTracking) return 0;
  
  const marker = performanceMarkers.get(markerId);
  if (!marker) {
    warn(`Performance marker not found: ${markerId}`);
    return 0;
  }
  
  const duration = performance.now() - marker.startTime;
  performanceMarkers.delete(markerId);
  
  if (logResult) {
    const description = marker.description || markerId;
    debug(`Performance tracking ended: ${description} - ${duration.toFixed(2)}ms`);
  }
  
  return duration;
};

// Also provide all functions as a single object for default import
const logger = {
  log,
  info,
  warn,
  error,
  debug,
  startPerformanceTracking,
  endPerformanceTracking
};

// Support both default and named exports
export default logger;
export { 
  log as logLog,
  info as logInfo,
  warn as logWarn,
  error as logError,
  debug as logDebug
};