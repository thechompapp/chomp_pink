/**
 * Performance Metrics Middleware
 * 
 * Provides middleware for tracking response times and other performance metrics
 */
import { logTiming } from '../utils/logger.js';

// Metrics storage
const metrics = {
  // Response time metrics by route
  responseTimes: {},
  // Request counts by route
  requestCounts: {},
  // Slow request tracking
  slowRequests: [],
  // Error counts by route
  errorCounts: {}
};

// Threshold for slow requests (in ms)
const SLOW_REQUEST_THRESHOLD = process.env.SLOW_REQUEST_THRESHOLD 
  ? parseInt(process.env.SLOW_REQUEST_THRESHOLD, 10) 
  : 500;

// Maximum slow requests to store
const MAX_SLOW_REQUESTS = process.env.MAX_SLOW_REQUESTS
  ? parseInt(process.env.MAX_SLOW_REQUESTS, 10)
  : 100;

/**
 * Middleware to track response time
 */
export const trackResponseTime = (req, res, next) => {
  // Record start time
  req.startTime = Date.now();
  
  // Store the original end function
  const originalEnd = res.end;
  
  // Override end function
  res.end = function(...args) {
    // Calculate response time
    const responseTime = Date.now() - req.startTime;
    
    // Add X-Response-Time header
    res.setHeader('X-Response-Time', `${responseTime}ms`);
    
    // Get route identifier
    const route = `${req.method} ${req.route ? req.route.path : req.path}`;
    
    // Store metrics
    updateMetrics(route, responseTime, res.statusCode);
    
    // Log timing information
    logTiming(`${req.method} ${req.originalUrl}`, responseTime);
    
    // Call the original end function
    return originalEnd.apply(this, args);
  };
  
  next();
};

/**
 * Update metrics with new data point
 */
function updateMetrics(route, responseTime, statusCode) {
  // Initialize metrics for this route if they don't exist
  if (!metrics.responseTimes[route]) {
    metrics.responseTimes[route] = {
      count: 0,
      total: 0,
      min: Number.MAX_SAFE_INTEGER,
      max: 0,
      avg: 0
    };
  }
  
  // Update response times
  const routeMetrics = metrics.responseTimes[route];
  routeMetrics.count++;
  routeMetrics.total += responseTime;
  routeMetrics.min = Math.min(routeMetrics.min, responseTime);
  routeMetrics.max = Math.max(routeMetrics.max, responseTime);
  routeMetrics.avg = Math.round(routeMetrics.total / routeMetrics.count);
  
  // Update request counts
  if (!metrics.requestCounts[route]) {
    metrics.requestCounts[route] = 0;
  }
  metrics.requestCounts[route]++;
  
  // Track slow requests
  if (responseTime > SLOW_REQUEST_THRESHOLD) {
    metrics.slowRequests.push({
      route,
      responseTime,
      timestamp: new Date(),
      statusCode
    });
    
    // Limit the number of slow requests stored
    if (metrics.slowRequests.length > MAX_SLOW_REQUESTS) {
      metrics.slowRequests.shift();
    }
  }
  
  // Track errors
  if (statusCode >= 400) {
    if (!metrics.errorCounts[route]) {
      metrics.errorCounts[route] = {
        '4xx': 0,
        '5xx': 0,
        total: 0
      };
    }
    
    metrics.errorCounts[route].total++;
    
    if (statusCode >= 500) {
      metrics.errorCounts[route]['5xx']++;
    } else {
      metrics.errorCounts[route]['4xx']++;
    }
  }
}

/**
 * Get performance metrics
 */
export const getMetrics = () => {
  return {
    ...metrics,
    summary: {
      totalRoutes: Object.keys(metrics.responseTimes).length,
      totalRequests: Object.values(metrics.requestCounts).reduce((sum, count) => sum + count, 0),
      totalErrors: Object.values(metrics.errorCounts).reduce((sum, counts) => sum + counts.total, 0),
      slowRequestCount: metrics.slowRequests.length,
      routesWithHighestAvgResponseTime: getTopRoutesByAvgResponseTime(5),
      routesWithMostRequests: getTopRoutesByRequestCount(5),
      routesWithMostErrors: getTopRoutesByErrorCount(5)
    }
  };
};

/**
 * Reset performance metrics
 */
export const resetMetrics = () => {
  metrics.responseTimes = {};
  metrics.requestCounts = {};
  metrics.slowRequests = [];
  metrics.errorCounts = {};
  return { success: true, message: 'Performance metrics reset successfully' };
};

/**
 * Get top routes by average response time
 */
function getTopRoutesByAvgResponseTime(limit = 5) {
  return Object.entries(metrics.responseTimes)
    .sort((a, b) => b[1].avg - a[1].avg)
    .slice(0, limit)
    .map(([route, data]) => ({
      route,
      avgResponseTime: data.avg,
      maxResponseTime: data.max,
      requestCount: data.count
    }));
}

/**
 * Get top routes by request count
 */
function getTopRoutesByRequestCount(limit = 5) {
  return Object.entries(metrics.requestCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([route, count]) => ({
      route,
      requestCount: count,
      avgResponseTime: metrics.responseTimes[route]?.avg || 0
    }));
}

/**
 * Get top routes by error count
 */
function getTopRoutesByErrorCount(limit = 5) {
  return Object.entries(metrics.errorCounts)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, limit)
    .map(([route, counts]) => ({
      route,
      totalErrors: counts.total,
      clientErrors: counts['4xx'],
      serverErrors: counts['5xx']
    }));
}

export default {
  trackResponseTime,
  getMetrics,
  resetMetrics
}; 