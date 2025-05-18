// doof-backend/server.js
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import pinoHttp from 'pino-http';
import pino from 'pino';

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
import engageRoutes from './routes/engage.js';
import trendingRoutes from './routes/trending.js';
import neighborhoodRoutes from './routes/neighborhoods.js';
import analyticsRoutes from './routes/analytics.js';

import { optionalAuth } from './middleware/auth.js'; // Named import
import db from './db/index.js';

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
    // Configure HTTP logging
    const httpLogger = pinoHttp({ logger: this.logger });
    this.app.use(httpLogger);
    
    // Configure CORS
    const corsOptions = this.configureCors();
    this.app.use(cors(corsOptions));
    this.app.options('*', cors(corsOptions));
    
    // Standard middleware
    this.app.use(express.json());
    this.app.use(cookieParser());
    this.app.use(express.urlencoded({ extended: true }));
  }

  /**
   * Configure CORS options for the application
   * @returns {Object} CORS configuration options
   */
  configureCors() {
    // Allow multiple frontend origins for development flexibility
    const frontendUrls = [
      process.env.FRONTEND_URL || 'http://localhost:5173',
      'http://localhost:5174',  // In case Vite uses this port
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174'
    ];
    console.log(`Frontend URLs configured for CORS:`, frontendUrls);
    
    return {
      origin: function(origin, callback) {
        // Allow requests with no origin (like mobile apps, curl, etc)
        if (!origin) return callback(null, true);
        
        // Check if the origin is in the allowed list
        if (frontendUrls.indexOf(origin) !== -1) {
          callback(null, true);
        } else {
          console.log(`CORS blocked request from: ${origin}`);
          callback(null, false);
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id', 'X-Forwarded-Host', 'X-Auth-Authenticated'],
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
      { path: '/api/engage', router: engageRoutes },
      { path: '/api/trending', router: trendingRoutes },
      { path: '/api/neighborhoods', router: neighborhoodRoutes },
      { path: '/api/analytics', router: analyticsRoutes },
    ];
    
    // Register each route
    routes.forEach(({ path, router }) => {
      this.app.use(path, router);
    });
    
    // Register utility endpoints
    this.registerUtilityEndpoints();
  }
  
  /**
   * Register utility endpoints for monitoring and testing
   */
  registerUtilityEndpoints() {
    // Database test endpoint
    this.app.get('/api/db-test', async (req, res) => {
      try {
        const time = await db.query('SELECT NOW()');
        res.json({ success: true, dbTime: time.rows[0].now });
      } catch (err) {
        res.status(500).json({ success: false, error: err.message });
      }
    });
    
    // Health check endpoint
    this.app.get('/api/health', optionalAuth, (req, res) => {
      if (req.user) {
        this.logger.info({ user: req.user, message: 'Authenticated user accessed health check.' });
      } else {
        this.logger.info('Anonymous user accessed health check.');
      }
      res.status(200).json({ status: 'UP', message: 'Backend is healthy and running!' });
    });
  }

  /**
   * Configure static file serving for production environment
   */
  configureStaticFiles() {
    if (process.env.NODE_ENV === 'production') {
      this.app.use(express.static(path.join(__dirname, '../chomp_frontend/dist')));
      this.app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname, '../chomp_frontend/dist', 'index.html'));
      });
    }
  }

  /**
   * Configure global error handler
   */
  configureErrorHandler() {
    this.app.use((err, req, res, next) => {
      req.log.error({ err, req: req, res: res }, 'Unhandled error caught by global error handler');
      const statusCode = err.statusCode || 500;
      const message = process.env.NODE_ENV === 'production' && statusCode === 500 ?
                    'An unexpected error occurred on the server.' : err.message;
      res.status(statusCode).json({
        success: false,
        message: message || 'Internal Server Error',
        ...(process.env.NODE_ENV !== 'production' && { errorDetails: err.stack })
      });
    });
  }

  /**
   * Start the server on the configured port
   */
  start() {
    const PORT = process.env.PORT || 5001;
    this.app.listen(PORT, () => {
      console.log(`Backend server running smoothly on port ${PORT}`);
    });
  }
}

// Initialize and start the server
const server = new AppServer();
server.start();
