/**
 * ControllerWrapper - Centralized controller function wrapper
 * 
 * This utility provides a standardized way to wrap Express controller methods,
 * ensuring consistent:
 * - Error handling
 * - Response formatting
 * - Validation
 * - Logging
 * - Performance tracking
 */
import { validationResult } from 'express-validator';
import { logDebug, logError, logTiming } from './logger.js';
import { formatResponse, formatErrorResponse } from './serviceWrapper.js';

/**
 * Wrap an Express controller method with standardized handling
 * 
 * @param {Function} controllerFn - The controller function to wrap
 * @param {Object} options - Configuration options
 * @param {string} options.controllerName - Name of controller for logging
 * @param {boolean} options.skipValidation - Whether to skip express-validator validation
 * @returns {Function} - Wrapped controller function
 */
export function wrapController(controllerFn, {
  controllerName = 'UnknownController',
  skipValidation = false,
} = {}) {
  // Return the wrapped controller function
  return async (req, res, next) => {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // Log request received
      logDebug(`[${controllerName}] Request ${requestId} received: ${req.method} ${req.originalUrl}`);
      
      // Perform validation if enabled
      if (!skipValidation) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          logDebug(`[${controllerName}] Validation errors for ${requestId}:`, errors.array());
          return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array()
          });
        }
      }
      
      // Execute the controller function
      const result = await controllerFn(req, res, next);
      
      // If result is returned and response hasn't been sent, send it
      if (result && !res.headersSent) {
        if (typeof result === 'object' && 'success' in result) {
          // Result is already in standard format
          res.status(result.status || (result.success ? 200 : 400)).json(result);
        } else {
          // Format the result into standard response
          res.status(200).json(formatResponse(true, result));
        }
      }
      
      // Log completion time
      const duration = Date.now() - startTime;
      logTiming(`${controllerName} request ${requestId}`, duration);
      
    } catch (error) {
      // Handle and log the error
      const duration = Date.now() - startTime;
      logError(`[${controllerName}] Error handling request ${requestId} after ${duration}ms:`, error);
      
      // Don't send response if it's already been sent
      if (!res.headersSent) {
        // Create standardized error response
        const errorResponse = formatErrorResponse(
          error.message || `Error in ${controllerName}`,
          error.status || 500,
          process.env.NODE_ENV !== 'production' ? error : null
        );
        
        res.status(errorResponse.status || 500).json(errorResponse);
      }
      
      // If next is provided and we should continue error chain, call it
      if (typeof next === 'function' && error.passToNext) {
        next(error);
      }
    }
  };
}

/**
 * Create a controller object with wrapped methods
 * 
 * @param {Object} controllerConfig - Configuration for the controller
 * @param {string} controllerConfig.name - Name of the controller
 * @param {Object} controllerConfig.methods - Methods to wrap
 * @param {Object} controllerConfig.options - Default options for all methods
 * @returns {Object} - Controller with wrapped methods
 */
export function createController(controllerConfig) {
  const { name, methods, options = {} } = controllerConfig;
  
  if (!name || typeof name !== 'string') {
    throw new Error('Controller name is required');
  }
  
  if (!methods || typeof methods !== 'object') {
    throw new Error('methods must be an object');
  }
  
  const controller = {};
  
  // Create wrapped methods
  Object.entries(methods).forEach(([methodName, methodConfig]) => {
    const { fn, ...methodOptions } = methodConfig;
    
    if (typeof fn !== 'function') {
      throw new Error(`Method ${methodName} must have a function`);
    }
    
    controller[methodName] = wrapController(fn, {
      controllerName: `${name}.${methodName}`,
      ...options,
      ...methodOptions
    });
  });
  
  return controller;
}

export default {
  wrapController,
  createController
}; 