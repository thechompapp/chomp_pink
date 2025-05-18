// File: src/utils/logger.js
const getTimestamp = () => new Date().toISOString();

// Create individual logging functions
export const log = (message, ...optionalParams) => {
  console.log(`[LOG][${getTimestamp()}] ${message}`, ...optionalParams);
};

export const info = (message, ...optionalParams) => {
  console.info(`[INFO][${getTimestamp()}] ${message}`, ...optionalParams);
};

export const warn = (message, ...optionalParams) => {
  console.warn(`[WARN][${getTimestamp()}] ${message}`, ...optionalParams);
};

export const error = (message, ...optionalParams) => {
  console.error(`[ERROR][${getTimestamp()}] ${message}`, ...optionalParams);
  // Enhanced error logging for Error instances
  if (optionalParams.length > 0 && optionalParams[0] instanceof Error) {
    // Log stack trace in dev for easier debugging
    if (import.meta.env.DEV || process.env.NODE_ENV === 'development') { // Vite's import.meta.env.DEV is preferred for client-side dev checks
      console.error('Stack trace:', optionalParams[0].stack);
    }
  }
};

export const debug = (message, ...optionalParams) => {
  // Only log debug messages in development or if explicitly enabled
  if (import.meta.env.DEV || process.env.NODE_ENV === 'development' || process.env.VITE_DEBUG_LOGGING === 'true') { // Use VITE_ prefix for custom env vars
    console.debug(`[DEBUG][${getTimestamp()}] ${message}`, ...optionalParams);
  }
};

// Also provide all functions as a single object for default import
const logger = {
  log,
  info,
  warn,
  error,
  debug
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