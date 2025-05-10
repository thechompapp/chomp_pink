// src/utils/logger.js
/* eslint-disable no-console */

export const logToConsole = (level, message, ...optionalParams) => {
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
      if (import.meta.env.DEV) {
        console.debug(logPrefix, message, ...optionalParams);
      }
      break;
    default:
      console.log(logPrefix, message, ...optionalParams);
  }
};

export const logInfo = (message, ...optionalParams) => logToConsole('info', message, ...optionalParams);
export const logWarn = (message, ...optionalParams) => logToConsole('warn', message, ...optionalParams);
export const logError = (message, ...optionalParams) => logToConsole('error', message, ...optionalParams);
export const logDebug = (message, ...optionalParams) => logToConsole('debug', message, ...optionalParams);

/* eslint-enable no-console */
