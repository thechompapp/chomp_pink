// File: doof-backend/utils/logger.js

const getTimestamp = () => new Date().toISOString();

const logger = {
  log: (message, ...args) => {
    console.log(`[LOG][${getTimestamp()}]`, message, ...args);
  },
  info: (message, ...args) => {
    console.info(`[INFO][${getTimestamp()}]`, message, ...args);
  },
  warn: (message, ...args) => {
    console.warn(`[WARN][${getTimestamp()}]`, message, ...args);
  },
  error: (message, error, ...args) => {
    // Log the main error message
    console.error(`[ERROR][${getTimestamp()}]`, message, ...args);

    // Log additional details from the error object
    if (error) {
      if (error instanceof Error) {
        console.error(`[ERROR][${getTimestamp()}] Error Details: ${error.message}`);
        if (error.stack && process.env.NODE_ENV !== 'production') {
          // Stack traces can be verbose and might contain sensitive info,
          // so typically logged only in dev/debug modes.
          console.error(`[ERROR][${getTimestamp()}] Stack: ${error.stack}`);
        }
      } else if (typeof error === 'object' && error !== null) {
        // If it's an object but not an Error instance, stringify it.
        try {
          const errorDetailsString = JSON.stringify(error, Object.getOwnPropertyNames(error));
          console.error(`[ERROR][${getTimestamp()}] Error Details (object): ${errorDetailsString}`);
        } catch (e) {
          console.error(`[ERROR][${getTimestamp()}] Error Details (unserializable object):`, error);
        }
      } else {
        // For primitive types or other non-Error objects
        console.error(`[ERROR][${getTimestamp()}] Error Details:`, error);
      }
    }
  },
  debug: (message, ...args) => {
    // Only log debug messages if not in production or if explicitly enabled
    if (process.env.NODE_ENV !== 'production' || process.env.DEBUG_LOGGING === 'true') {
      console.debug(`[DEBUG][${getTimestamp()}]`, message, ...args);
    }
  },
};

module.exports = logger;