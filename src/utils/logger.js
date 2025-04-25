// Filename: root/src/utils/logger.js
/* eslint-disable no-console */

/**
 * Basic console logger utility for frontend.
 * Can be expanded later (e.g., different log levels, integration with remote logging).
 */

const logToConsole = (level, message, ...optionalParams) => {
    const timestamp = new Date().toISOString();
    const logPrefix = `[${timestamp}] [${level.toUpperCase()}]`;
  
    switch (level) {
      case 'info':
        console.info(logPrefix, message, ...optionalParams);
        break;
      case 'warn':
        console.warn(logPrefix, message, ...optionalParams);
        break;
      case 'error':
        console.error(logPrefix, message, ...optionalParams);
        break;
      case 'debug':
        // Only log debug messages in development environment
        if (import.meta.env.DEV) {
          console.debug(logPrefix, message, ...optionalParams);
        }
        break;
      default:
        console.log(logPrefix, message, ...optionalParams);
    }
  };
  
  // Export specific functions if needed, e.g.:
  export const logInfo = (message, ...optionalParams) => logToConsole('info', message, ...optionalParams);
  export const logWarn = (message, ...optionalParams) => logToConsole('warn', message, ...optionalParams);
  export const logError = (message, ...optionalParams) => logToConsole('error', message, ...optionalParams);
  export const logDebug = (message, ...optionalParams) => logToConsole('debug', message, ...optionalParams);
  
  // Default export for convenience if only one main function is typically used
  // export default logToConsole;
  
  // Or export all as named exports
  export { logToConsole };
  
  /* eslint-enable no-console */