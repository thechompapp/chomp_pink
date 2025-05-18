// File: doof-backend/utils/logger.js

/**
 * Logger utility - Provides standardized logging functionality
 * with configurable log levels and environment-aware behavior
 */
import config from '../config/config.js';

const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
  trace: 5
};

// Get current log level from config or environment
const getCurrentLogLevel = () => {
  const configLevel = (config.logLevel || process.env.LOG_LEVEL || 'info').toLowerCase();
  return LOG_LEVELS[configLevel] !== undefined ? LOG_LEVELS[configLevel] : LOG_LEVELS.info;
};

const getTimestamp = () => new Date().toISOString();

// Check if we should log at the given level
const shouldLog = (level) => {
  const currentLevel = getCurrentLogLevel();
  const targetLevel = LOG_LEVELS[level];
  return targetLevel <= currentLevel;
};

/**
 * Main logger object with methods for different log levels
 */
const logger = {
  log: (message, ...args) => {
    if (shouldLog('info')) {
      console.log(`[LOG][${getTimestamp()}]`, message, ...args);
    }
  },

  info: (message, ...args) => {
    if (shouldLog('info')) {
      console.info(`[INFO][${getTimestamp()}]`, message, ...args);
    }
  },

  warn: (message, ...args) => {
    if (shouldLog('warn')) {
      console.warn(`[WARN][${getTimestamp()}]`, message, ...args);
    }
  },

  error: (message, error, ...args) => {
    if (shouldLog('error')) {
      // Log the main error message
      console.error(`[ERROR][${getTimestamp()}]`, message, ...args);

      // Log additional details from the error object
      if (error) {
        if (error instanceof Error) {
          console.error(`[ERROR][${getTimestamp()}] Error Details: ${error.message}`);
          if (error.stack && process.env.NODE_ENV !== 'production') {
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
    }
  },

  debug: (message, ...args) => {
    if (shouldLog('debug')) {
      console.debug(`[DEBUG][${getTimestamp()}]`, message, ...args);
    }
  },

  trace: (message, ...args) => {
    if (shouldLog('trace')) {
      console.trace(`[TRACE][${getTimestamp()}]`, message, ...args);
    }
  },

  // Log HTTP request details
  http: (req, res, responseTime) => {
    if (shouldLog('http')) {
      const { method, url, ip } = req;
      const statusCode = res.statusCode;
      console.log(`[HTTP][${getTimestamp()}] ${method} ${url} ${statusCode} ${responseTime}ms - ${ip}`);
    }
  },

  // Log performance timing information
  timing: (operation, durationMs) => {
    if (shouldLog('debug')) {
      console.debug(`[TIMING][${getTimestamp()}] ${operation}: ${durationMs}ms`);
    }
  }
};

// Named exports for individual functions
export const logDebug = logger.debug;
export const logInfo = logger.info;
export const logWarn = logger.warn;
export const logError = logger.error;
export const logTiming = logger.timing;
export const logHttp = logger.http;
export const logTrace = logger.trace;

// Default export for the full logger
export default logger;