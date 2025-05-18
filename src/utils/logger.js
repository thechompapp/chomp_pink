// File: src/utils/logger.js
const getTimestamp = () => new Date().toISOString();

const logger = {
  log: (message, ...optionalParams) => {
    console.log(`[LOG][${getTimestamp()}] ${message}`, ...optionalParams);
  },
  info: (message, ...optionalParams) => {
    console.info(`[INFO][${getTimestamp()}] ${message}`, ...optionalParams);
  },
  warn: (message, ...optionalParams) => {
    console.warn(`[WARN][${getTimestamp()}] ${message}`, ...optionalParams);
  },
  error: (message, ...optionalParams) => {
    console.error(`[ERROR][${getTimestamp()}] ${message}`, ...optionalParams);
    // Enhanced error logging for Error instances
    if (optionalParams.length > 0 && optionalParams[0] instanceof Error) {
      // Log stack trace in dev for easier debugging
      if (import.meta.env.DEV || process.env.NODE_ENV === 'development') { // Vite's import.meta.env.DEV is preferred for client-side dev checks
        console.error('Stack trace:', optionalParams[0].stack);
      }
    }
  },
  debug: (message, ...optionalParams) => {
    // Only log debug messages in development or if explicitly enabled
    if (import.meta.env.DEV || process.env.NODE_ENV === 'development' || process.env.VITE_DEBUG_LOGGING === 'true') { // Use VITE_ prefix for custom env vars
      console.debug(`[DEBUG][${getTimestamp()}] ${message}`, ...optionalParams);
    }
  },
};

export default logger;