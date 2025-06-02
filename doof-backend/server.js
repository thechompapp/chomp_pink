// doof-backend/server.js
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import pinoHttp from 'pino-http';
import pino from 'pino';
import compression from 'compression';
import helmet from 'helmet';

// Route Imports - All should be default exports from their respective files
import authRoutes from './routes/auth.js';
import restaurantRoutes from './routes/restaurants.js';
import dishRoutes from './routes/dishes.js';
import listRoutes from './routes/lists.js';
import userRoutes from './routes/users.js';
import filterRoutes from './routes/filters.js';
import hashtagRoutes from './routes/hashtags.js';
import searchRoutes from './routes/search.js';
import placesRoutes from './routes/places.js';
import submissionRoutes from './routes/submissions.js';
import adminRoutes from './routes/admin.js';
import adminLocationRoutes from './routes/adminLocations.js';
import engageRoutes from './routes/engage.js';
import trendingRoutes from './routes/trending.js';
import neighborhoodRoutes from './routes/neighborhoods.js';
import analyticsRoutes from './routes/analytics.js';
import notificationRoutes from './routes/notifications.js';

// Import simplified routes for E2E testing
import simplifiedRoutes from './routes/simplified-routes.js';

import { optionalAuth } from './middleware/auth.js';
import db from './db/index.js';
import { errorHandlerMiddleware } from './utils/errorHandler.js';
import logger from './utils/logger.js';
import { trackResponseTime, getMetrics, resetMetrics } from './middleware/performanceMetrics.js';
import { startTokenCleanupJob } from './utils/tokenCleanup.js';

dotenv.config();

// Path utility setup for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Main application configuration and initialization
 */
class AppServer {
  /**
   * Initialize Express application with all necessary configurations
   */
  constructor() {
    this.app = express();
    this.logger = this.createLogger();
    this.configureMiddleware();
    this.registerRoutes();
    this.configureStaticFiles();
    this.configureErrorHandler();
    
    // Initialize token cleanup job once (in non-test environments)
    if (process.env.NODE_ENV !== 'test') {
      startTokenCleanupJob();
      this.logger.info('Token cleanup job initialized');
    }
  }

  /**
   * Create and configure Pino logger
   * @returns {Object} Configured logger instance
   */
  createLogger() {
    return pino({
      level: process.env.LOG_LEVEL || 'info',
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      },
    });
  }

  /**
   * Configure all middleware for the application
   */
  configureMiddleware() {
    // Security enhancements
    this.app.use(helmet());
    
    // Response compression
    this.app.use(compression());
    
    // Add request ID middleware
    this.app.use((req, res, next) => {
      req.id = req.headers['x-request-id'] || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      res.setHeader('X-Request-ID', req.id);
      next();
    });
    
    // Configure HTTP logging
    const httpLogger = pinoHttp({ 
      logger: this.logger,
      // Include request ID in logs
      genReqId: (req) => req.id,
      // Custom request logging
      customLogLevel: (req, res, err) => {
        if (res.statusCode >= 500 || err) return 'error';
        if (res.statusCode >= 400) return 'warn';
        return 'info';
      },
      // Custom serializers
      serializers: {
        req: (req) => ({
          id: req.id,
          method: req.method,
          url: req.url,
          user: req.user ? req.user.id : 'anonymous',
        }),
      },
    });
    this.app.use(httpLogger);
    
    // Configure CORS
    const corsOptions = this.configureCors();
    this.app.use(cors(corsOptions));
    this.app.options('*', cors(corsOptions));
    
    // Request parsing middleware
    this.app.use(express.json({ limit: '1mb' }));
    this.app.use(cookieParser());
    this.app.use(express.urlencoded({ extended: true }));
    
    // Performance monitoring middleware
    this.app.use(trackResponseTime);
  }

  /**
   * Configure CORS options for the application
   * @returns {Object} CORS configuration options
   */
  configureCors() {
    // Allow multiple frontend origins for development flexibility
    const frontendUrls = [
      process.env.FRONTEND_URL || 'http://localhost:5173',
      'http://localhost:5173',
      'http://localhost:5174',  // In case Vite uses this port
      'http://localhost:5175',  // Updated port for frontend
      'http://localhost:5176',  // Additional Vite port
      'http://localhost:5177',  // Additional Vite port
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
      'http://127.0.0.1:5175',
      'http://127.0.0.1:5176',
      'http://127.0.0.1:5177',
      'http://localhost:3000',   // For test environments
      'http://127.0.0.1:3000'    // For test environments
    ];
    logger.info(`Frontend URLs configured for CORS:`, frontendUrls);
    
    // For testing environments, allow all origins if TEST_MODE is enabled
    const isTestMode = process.env.NODE_ENV === 'test' || process.env.TEST_MODE === 'true';
    
    if (isTestMode) {
      logger.info('Test mode enabled: CORS allowing all origins');
      return {
        origin: '*',
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
      };
    }
    
    return {
      origin: function(origin, callback) {
        // Allow requests with no origin (like mobile apps, curl, etc)
        if (!origin) return callback(null, true);
        
        // Check if the origin is in the allowed list
        if (frontendUrls.indexOf(origin) !== -1) {
          callback(null, true);
        } else {
          logger.warn(`CORS blocked request from: ${origin}`);
          callback(null, false);
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type', 
        'Authorization', 
        'X-Request-Id', 
        'X-Forwarded-Host', 
        'X-Auth-Authenticated',
        // Admin-specific headers
        'X-Admin-API-Key',
        'X-Bypass-Auth',
        'X-Superuser-Override',
        'X-Admin-Access',
        // Places API headers
        'X-Places-API-Request'
      ],
    };
  }

  /**
   * Register all API routes for the application
   */
  registerRoutes() {
    // API route configuration
    const routes = [
      { path: '/api/auth', router: authRoutes },
      { path: '/api/restaurants', router: restaurantRoutes },
      { path: '/api/dishes', router: dishRoutes },
      { path: '/api/lists', router: listRoutes },
      { path: '/api/users', router: userRoutes },
      { path: '/api/filters', router: filterRoutes },
      { path: '/api/hashtags', router: hashtagRoutes },
      { path: '/api/search', router: searchRoutes },
      { path: '/api/places', router: placesRoutes },
      { path: '/api/submissions', router: submissionRoutes },
      { path: '/api/admin', router: adminRoutes },
      { path: '/api/admin/locations', router: adminLocationRoutes },
      { path: '/api/engage', router: engageRoutes },
      { path: '/api/trending', router: trendingRoutes },
      { path: '/api/neighborhoods', router: neighborhoodRoutes },
      { path: '/api/analytics', router: analyticsRoutes },
      { path: '/api/notifications', router: notificationRoutes },
      { path: '/api/test', router: simplifiedRoutes } // Test routes for E2E testing
    ];
    
    // Register each route
    routes.forEach(({ path, router }) => {
      this.app.use(path, router);
    });
    
    // Register utility endpoints
    this.registerUtilityEndpoints();
    
    // Register 404 handler for unmatched routes
    this.app.use((req, res, next) => {
      const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
      error.statusCode = 404;
      next(error);
    });
  }
  
  /**
   * Register utility endpoints for monitoring and testing
   */
  registerUtilityEndpoints() {
    // Database test endpoint
    this.app.get('/api/db-test', async (req, res, next) => {
      try {
        const time = await db.query('SELECT NOW()');
        res.json({ success: true, dbTime: time.rows[0].now });
      } catch (err) {
        next(err);
      }
    });
    
    // Health check endpoint
    this.app.get('/api/health', optionalAuth, (req, res) => {
      const healthData = {
        status: 'UP',
        message: 'Backend is healthy and running!',
        timestamp: new Date().toISOString(),
        databasePool: db.getPoolStatus(),
        memoryUsage: process.memoryUsage()
      };
      
      if (req.user) {
        this.logger.info({ user: req.user.id, message: 'Authenticated user accessed health check.' });
      }
      
      res.status(200).json(healthData);
    });
    
    // Metrics endpoint (admin only)
    this.app.get('/api/metrics', requireAdminAuth, (req, res) => {
      const metrics = getMetrics();
      res.json({ success: true, data: metrics });
    });
    
    // Reset metrics endpoint (admin only)
    this.app.post('/api/metrics/reset', requireAdminAuth, (req, res) => {
      const result = resetMetrics();
      res.json(result);
    });
  }

  /**
   * Configure static file serving for production environment
   */
  configureStaticFiles() {
    if (process.env.NODE_ENV === 'production') {
      // Set cache headers for static assets
      this.app.use(express.static(path.join(__dirname, '../chomp_frontend/dist'), {
        etag: true,
        lastModified: true,
        setHeaders: (res, path) => {
          const hashRegex = /\.[0-9a-f]{8}\.(js|css|png|jpg|jpeg|gif|webp|svg)$/;
          if (hashRegex.test(path)) {
            // If filename contains hash, cache for a longer period
            res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year
          } else {
            // For other assets, use a shorter cache time
            res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 day
          }
        }
      }));
      
      this.app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname, '../chomp_frontend/dist', 'index.html'));
      });
    }
  }

  /**
   * Configure global error handler
   */
  configureErrorHandler() {
    // Use the centralized error handler middleware
    this.app.use(errorHandlerMiddleware);
  }

  /**
   * Start the server on the configured port
   */
  start() {
    const PORT = process.env.PORT || 5001;
    
    const server = this.app.listen(PORT, () => {
      logger.info(`Backend server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    });
    
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      logger.error('Unhandled Promise Rejection:', err);
      // Don't exit the server - let it continue to run
    });
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (err) => {
      logger.error('Uncaught Exception:', err);
      // In production, it's safer to crash and restart with a process manager
      if (process.env.NODE_ENV === 'production') {
        logger.error('Uncaught exception detected. Shutting down gracefully...');
        server.close(() => {
          process.exit(1);
        });
        
        // If server doesn't close in 10 seconds, force exit
        setTimeout(() => {
          process.exit(1);
        }, 10000);
      }
    });
    
    // Graceful shutdown
    const gracefulShutdown = () => {
      logger.info('Received shutdown signal. Closing server...');
      server.close(() => {
        logger.info('Server closed. Shutting down...');
        process.exit(0);
      });
      
      // If server doesn't close in 30 seconds, force exit
      setTimeout(() => {
        logger.error('Server did not close gracefully. Forcing exit...');
        process.exit(1);
      }, 30000);
    };
    
    // Listen for termination signals
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
    
    return server;
  }
}

/**
 * Admin authentication middleware for metrics
 */
function requireAdminAuth(req, res, next) {
  // Get API key from request header
  const apiKey = req.header('X-Admin-API-Key');
  
  // Check if API key is provided and valid
  if (!apiKey || apiKey !== process.env.ADMIN_API_KEY) {
    return res.status(401).json({
      success: false,
      message: 'Admin authentication required'
    });
  }
  
  next();
}

// Initialize and start the server
const server = new AppServer();
server.start();
