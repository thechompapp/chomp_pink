/**
 * Logging Interceptor
 * 
 * Handles request/response logging for API requests.
 */
import { logDebug, logInfo, logWarn, logError } from '@/utils/logger';

/**
 * Logging Interceptor class
 */
class LoggingInterceptor {
  constructor() {
    // Logging level
    this.verbosity = 'normal'; // 'none', 'minimal', 'normal', 'verbose'
  }
  
  /**
   * Set logging verbosity level
   * @param {string} level - Verbosity level ('none', 'minimal', 'normal', 'verbose')
   */
  setVerbosity(level) {
    const validLevels = ['none', 'minimal', 'normal', 'verbose'];
    
    if (validLevels.includes(level)) {
      this.verbosity = level;
      logInfo(`[LoggingInterceptor] Verbosity set to ${level}`);
    } else {
      logWarn(`[LoggingInterceptor] Invalid verbosity level: ${level}`);
    }
  }
  
  /**
   * Log request details
   * @param {Object} config - Axios request config
   */
  logRequest(config) {
    if (this.verbosity === 'none') {
      return;
    }
    
    if (!config) {
      return;
    }
    
    const { method, url, params, data } = config;
    
    // Basic request logging
    if (this.verbosity === 'minimal') {
      logDebug(`[API] ${method?.toUpperCase() || 'REQUEST'} ${url}`);
      return;
    }
    
    // Normal request logging
    if (this.verbosity === 'normal') {
      logDebug(`[API] ${method?.toUpperCase() || 'REQUEST'} ${url}`, {
        params: params || {},
        hasData: !!data
      });
      return;
    }
    
    // Verbose request logging
    if (this.verbosity === 'verbose') {
      logDebug(`[API] ${method?.toUpperCase() || 'REQUEST'} ${url}`, {
        params: params || {},
        data: data || {},
        headers: config.headers || {},
        timestamp: new Date().toISOString()
      });
      return;
    }
  }
  
  /**
   * Log response details
   * @param {Object} response - Axios response
   */
  logResponse(response) {
    if (this.verbosity === 'none') {
      return;
    }
    
    if (!response) {
      return;
    }
    
    const { status, config } = response;
    const method = config?.method?.toUpperCase() || 'RESPONSE';
    const url = config?.url || 'unknown';
    
    // Basic response logging
    if (this.verbosity === 'minimal') {
      logDebug(`[API] ${method} ${url} - ${status}`);
      return;
    }
    
    // Normal response logging
    if (this.verbosity === 'normal') {
      logDebug(`[API] ${method} ${url} - ${status}`, {
        hasData: !!response.data,
        dataType: response.data ? typeof response.data : 'none',
        dataKeys: response.data && typeof response.data === 'object' ? Object.keys(response.data) : 'n/a'
      });
      return;
    }
    
    // Verbose response logging
    if (this.verbosity === 'verbose') {
      logDebug(`[API] ${method} ${url} - ${status}`, {
        data: response.data || {},
        headers: response.headers || {},
        timestamp: new Date().toISOString(),
        duration: response.config?.metadata?.duration || 'unknown'
      });
      return;
    }
  }
  
  /**
   * Log error details
   * @param {Error} error - Axios error
   */
  logError(error) {
    if (this.verbosity === 'none') {
      return;
    }
    
    if (!error) {
      return;
    }
    
    const { config, response } = error;
    const method = config?.method?.toUpperCase() || 'ERROR';
    const url = config?.url || 'unknown';
    const status = response?.status || 'network_error';
    
    // Basic error logging
    if (this.verbosity === 'minimal') {
      logError(`[API] ${method} ${url} - ${status}`);
      return;
    }
    
    // Normal error logging
    if (this.verbosity === 'normal') {
      logError(`[API] ${method} ${url} - ${status}`, {
        message: error.message,
        hasResponse: !!response,
        responseData: response?.data || 'none'
      });
      return;
    }
    
    // Verbose error logging
    if (this.verbosity === 'verbose') {
      logError(`[API] ${method} ${url} - ${status}`, {
        message: error.message,
        response: response ? {
          data: response.data || {},
          status: response.status,
          headers: response.headers || {}
        } : 'none',
        request: {
          method: config?.method || 'unknown',
          url: config?.url || 'unknown',
          params: config?.params || {},
          data: config?.data || {},
          headers: config?.headers || {}
        },
        timestamp: new Date().toISOString(),
        stack: error.stack
      });
      return;
    }
  }
  
  /**
   * Setup request interceptor for logging
   * @param {Object} axiosInstance - Axios instance
   * @returns {number} - Interceptor ID
   */
  setupRequestInterceptor(axiosInstance) {
    return axiosInstance.interceptors.request.use(
      (config) => {
        // Add timestamp for duration calculation
        if (!config.metadata) {
          config.metadata = {};
        }
        
        config.metadata.startTime = Date.now();
        
        // Log request
        this.logRequest(config);
        
        return config;
      },
      (error) => {
        // Log error
        this.logError(error);
        
        return Promise.reject(error);
      }
    );
  }
  
  /**
   * Setup response interceptor for logging
   * @param {Object} axiosInstance - Axios instance
   * @returns {number} - Interceptor ID
   */
  setupResponseInterceptor(axiosInstance) {
    return axiosInstance.interceptors.response.use(
      (response) => {
        // Calculate request duration
        if (response.config?.metadata?.startTime) {
          const endTime = Date.now();
          const duration = endTime - response.config.metadata.startTime;
          
          if (!response.config.metadata) {
            response.config.metadata = {};
          }
          
          response.config.metadata.duration = duration;
        }
        
        // Log response
        this.logResponse(response);
        
        return response;
      },
      (error) => {
        // Calculate request duration
        if (error.config?.metadata?.startTime) {
          const endTime = Date.now();
          const duration = endTime - error.config.metadata.startTime;
          
          if (!error.config.metadata) {
            error.config.metadata = {};
          }
          
          error.config.metadata.duration = duration;
        }
        
        // Log error
        this.logError(error);
        
        return Promise.reject(error);
      }
    );
  }
}

// Create and export singleton instance
const loggingInterceptor = new LoggingInterceptor();

export default loggingInterceptor;
