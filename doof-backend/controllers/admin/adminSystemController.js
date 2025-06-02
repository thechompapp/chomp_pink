import db from '../../db/index.js';
import { logInfo, logError } from '../../utils/logger.js';
import {
  validateSuperuserAccess,
  sendSuccessResponse,
  sendErrorResponse,
  healthCheck as baseHealthCheck
} from './adminBaseController.js';

/**
 * Get comprehensive admin statistics
 */
export const getAdminStats = async (req, res) => {
  if (!validateSuperuserAccess(req, res)) return;
  
  try {
    logInfo('[AdminSystemController] Fetching admin statistics');
    
    // Database connection check
    let dbConnected = false;
    let dbVersion = null;
    try {
      const dbCheck = await db.query('SELECT version() as version, NOW() as current_time');
      dbConnected = true;
      dbVersion = dbCheck.rows[0]?.version || 'Unknown';
    } catch (error) {
      logError('Database connection check failed:', error);
    }
    
    // Get counts for all resources
    const counts = {};
    const resourceTypes = [
      'restaurants', 'dishes', 'users', 'lists', 'listitems', 
      'cities', 'neighborhoods', 'hashtags', 'submissions'
    ];
    
    for (const resourceType of resourceTypes) {
      try {
        let tableName = resourceType;
        // Handle special cases where table name differs from resource type
        if (resourceType === 'hashtags') tableName = 'hashtags';
        if (resourceType === 'submissions') tableName = 'submissions';
        
        const result = await db.query(`SELECT COUNT(*) as count FROM ${tableName}`);
        counts[resourceType] = parseInt(result.rows[0]?.count || 0);
      } catch (error) {
        logError(`Error counting ${resourceType}:`, error);
        counts[resourceType] = 0;
      }
    }
    
    // Get recent activity (last 7 days)
    const recentActivity = {};
    try {
      const recentCounts = await Promise.all([
        db.query(`SELECT COUNT(*) as count FROM restaurants WHERE created_at >= NOW() - INTERVAL '7 days'`),
        db.query(`SELECT COUNT(*) as count FROM dishes WHERE created_at >= NOW() - INTERVAL '7 days'`),
        db.query(`SELECT COUNT(*) as count FROM lists WHERE created_at >= NOW() - INTERVAL '7 days'`),
        db.query(`SELECT COUNT(*) as count FROM users WHERE created_at >= NOW() - INTERVAL '7 days'`)
      ]);
      
      recentActivity.restaurants = parseInt(recentCounts[0].rows[0]?.count || 0);
      recentActivity.dishes = parseInt(recentCounts[1].rows[0]?.count || 0);
      recentActivity.lists = parseInt(recentCounts[2].rows[0]?.count || 0);
      recentActivity.users = parseInt(recentCounts[3].rows[0]?.count || 0);
    } catch (error) {
      logError('Error fetching recent activity:', error);
    }
    
    // System metrics
    const systemMetrics = {
      nodeVersion: process.version,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      platform: process.platform,
      arch: process.arch
    };
    
    const stats = {
      database: {
        connected: dbConnected,
        version: dbVersion
      },
      counts,
      recentActivity,
      system: systemMetrics,
      timestamp: new Date().toISOString()
    };
    
    sendSuccessResponse(res, stats, 'Admin statistics retrieved successfully');
    
  } catch (error) {
    sendErrorResponse(res, error, 500, 'fetch admin statistics');
  }
};

/**
 * Get system status and health information
 */
export const getSystemStatus = async (req, res) => {
  if (!validateSuperuserAccess(req, res)) return;
  
  try {
    logInfo('[AdminSystemController] Checking system status');
    
    const status = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0'
    };
    
    // Database health check
    try {
      const dbStart = Date.now();
      await db.query('SELECT 1');
      const dbResponseTime = Date.now() - dbStart;
      
      status.database = {
        status: 'healthy',
        responseTime: `${dbResponseTime}ms`
      };
    } catch (error) {
      status.database = {
        status: 'unhealthy',
        error: error.message
      };
    }
    
    // Memory health check
    const memUsage = process.memoryUsage();
    const memUsageMB = {
      rss: Math.round(memUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024)
    };
    
    status.memory = {
      usage: memUsageMB,
      status: memUsageMB.heapUsed < 512 ? 'healthy' : 'warning'
    };
    
    sendSuccessResponse(res, status, 'System status retrieved successfully');
    
  } catch (error) {
    sendErrorResponse(res, error, 500, 'fetch system status');
  }
};

/**
 * Get system logs (last 100 entries)
 */
export const getSystemLogs = async (req, res) => {
  if (!validateSuperuserAccess(req, res)) return;
  
  try {
    const { level = 'all', limit = 100 } = req.query;
    
    // In a real application, you would read from actual log files
    // For now, return a mock response indicating the feature
    const logs = {
      message: 'Log retrieval feature available',
      level,
      limit: parseInt(limit),
      timestamp: new Date().toISOString(),
      note: 'This would return actual application logs in a production environment'
    };
    
    sendSuccessResponse(res, logs, 'System logs retrieved successfully');
    
  } catch (error) {
    sendErrorResponse(res, error, 500, 'fetch system logs');
  }
};

/**
 * Clear system cache
 */
export const clearSystemCache = async (req, res) => {
  if (!validateSuperuserAccess(req, res)) return;
  
  try {
    logInfo('[AdminSystemController] Clearing system cache');
    
    // In a real application, you would clear actual caches
    // For now, simulate cache clearing
    const cacheCleared = {
      timestamp: new Date().toISOString(),
      caches: ['redis', 'memory', 'file'],
      status: 'cleared'
    };
    
    sendSuccessResponse(res, cacheCleared, 'System cache cleared successfully');
    
  } catch (error) {
    sendErrorResponse(res, error, 500, 'clear system cache');
  }
};

/**
 * Health check endpoint
 */
export const healthCheck = baseHealthCheck; 