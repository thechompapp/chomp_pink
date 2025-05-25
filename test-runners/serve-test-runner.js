/**
 * Test Runner Server
 * * This server serves the API test runner page and provides a proxy
 * to bypass CORS restrictions when making API requests.
 */

import express from 'express';
import axios from 'axios';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join, resolve as pathResolve } from 'path'; // Using pathResolve for clarity
import fs from 'fs'; // Ensure fs is imported
import { spawn } from 'child_process';

// Get __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename); // This will be the 'public' directory

// Configuration object
const CONFIG = {
  PORT: 8080,
  BACKEND_URL: 'http://localhost:5001',
  BACKEND_DIR: pathResolve(__dirname, '../doof-backend'), // Corrected path using pathResolve
  TIMEOUT: 30000,
  PROXY_TIMEOUT: 30000
};

// Simplified Logger for server-side
class Logger {
  static #log(level, requestId, message, data) {
    const dataStr = (data && typeof data === 'object' && Object.keys(data).length > 0) ? JSON.stringify(data) : (data || '');
    console.log(`[${requestId || 'SERVER'}] [${level}] ${message} ${dataStr}`);
  }
  static info(requestId, message, data) { this.#log('INFO', requestId, message, data); }
  static error(requestId, message, error) { 
    console.error(`[${requestId || 'SERVER'}] [ERROR] ${message}`, error instanceof Error ? error.message : error);
    if (error instanceof Error && error.stack) {
        console.error(error.stack);
    }
  }
  static warn(requestId, message, data) { this.#log('WARN', requestId, message, data); }
}

const app = express();
const activeConnections = new Map();

app.use(cors());
app.use(express.json());

// --- Helper Functions ---
// Error handler middleware for async route handlers
const errorHandler = (fn) => (req, res, ...args) => {
  const requestId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  return Promise.resolve(fn(req, res, requestId, ...args))
    .catch(err => {
      Logger.error(requestId, `Error in route handler: ${req.method} ${req.originalUrl}`, err);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Internal Server Error',
          error: err.message || 'Unknown error occurred'
        });
      }
    });
};

// Helper function to preprocess request data
async function preprocessRequest(req, requestId) {
  if (req.method === 'GET' || req.method === 'HEAD' || !req.body) {
    return undefined;
  }
  
  try {
    // Return the body as is (express.json() middleware already parsed it)
    return req.body;
  } catch (error) {
    Logger.error(requestId, 'Error preprocessing request data', error);
    return req.body; // Return as is if parsing fails
  }
}

// Helper function to log request details
function logRequest(requestId, req, requestData, headers, targetUrl) {
  const logData = {
    method: req.method,
    url: targetUrl,
    headers: { ...headers },
    data: requestData
  };
  
  // Don't log sensitive headers like authorization
  if (logData.headers.authorization) {
    logData.headers.authorization = '[REDACTED]';
  }
  
  Logger.info(requestId, `Proxy request details:`, logData);
}

// Helper function to handle proxy response
function handleProxyResponse(response, res, requestId, duration) {
  const { status, headers, data } = response;
  
  // Log response details
  Logger.info(requestId, `Proxy response received in ${duration}ms:`, {
    status,
    headers: { ...headers },
    data: typeof data === 'object' ? '[object]' : (typeof data === 'string' ? '[string]' : typeof data)
  });
  
  // Set response headers
  Object.entries(headers).forEach(([key, value]) => {
    // Skip headers that Express will set
    if (!['content-length', 'connection', 'keep-alive', 'transfer-encoding'].includes(key.toLowerCase())) {
      res.set(key, value);
    }
  });
  
  // Send response with status and data
  res.status(status).send(data);
}

// Helper function to handle proxy errors
function handleProxyError(error, res, requestId, duration, targetUrl, method) {
  Logger.error(requestId, `Proxy error after ${duration}ms for ${method} ${targetUrl}:`, error);
  
  // Check if response headers have already been sent
  if (res.headersSent) {
    Logger.warn(requestId, 'Headers already sent, cannot send error response');
    return;
  }
  
  // Prepare error response
  const errorResponse = {
    success: false,
    message: 'Error proxying request to backend',
    error: error.message || 'Unknown error',
    code: error.code || 'UNKNOWN_ERROR'
  };
  
  // Send error response
  res.status(502).json(errorResponse);
}

// --- Static File Serving ---
// Serve static files directly from the __dirname (which is 'public/' where serve-test-runner.js resides)
// This should correctly serve api-test-runner.css, app-bundle.js, and also api-test-runner.html if requested directly.
Logger.info('SERVER_INIT', `Serving static files from: ${__dirname}`);
app.use(express.static(__dirname, {
  // Optional: set custom headers for static files if needed, e.g., cache control
  // setHeaders: function (res, path, stat) {
  //   if (path.endsWith('.css')) {
  //     res.set('Content-Type', 'text/css');
  //   } else if (path.endsWith('.js')) {
  //     res.set('Content-Type', 'application/javascript');
  //   }
  // }
})); 
// Note: express.static usually sets correct MIME types based on file extensions.
// The previous custom MIME type middleware is removed to avoid potential conflicts and simplify.

// --- Route Handlers ---

// Health check for the proxy server itself and the backend
app.get('/health', errorHandler(async (req, res, requestId) => {
    Logger.info(requestId, 'Health check requested');
    let backendStatus = 'DOWN';
    const proxyStatus = 'UP'; 
    try {
        const backendHealthUrl = `${CONFIG.BACKEND_URL}/api/health`; // Assuming backend has /api/health
        Logger.info(requestId, `Checking backend health at: ${backendHealthUrl}`);
        const response = await axios.get(backendHealthUrl, {
            timeout: CONFIG.TIMEOUT / 3, 
            validateStatus: () => true 
        });
        // Check for a successful status and potentially a specific success message/status in backend response
        if (response.status === 200 && response.data && (response.data.status === 'UP' || response.data.message === 'Healthy' || response.data.healthy === true)) {
            backendStatus = 'UP';
        } else {
            Logger.warn(requestId, `Backend health check returned status ${response.status}`, response.data);
        }
        Logger.info(requestId, 'Backend health check response', { status: response.status, data: response.data });
    } catch (error) {
        Logger.error(requestId, 'Backend health check request failed', error.message);
    }
    const healthStatus = { backendStatus, proxyStatus, timestamp: new Date().toISOString() };
    Logger.info(requestId, 'Overall health check response', healthStatus);
    res.json(healthStatus);
}));

// Admin login endpoint to get a token
app.post('/admin-auth/token', errorHandler(async (req, res, requestId) => {
    Logger.info(requestId, 'Admin login request received');
    const { email, password } = req.body;
    
    if (!email || !password) {
        Logger.warn(requestId, 'Missing email or password');
        return res.status(400).json({ 
            success: false, 
            message: 'Email and password are required',
            error: 'MISSING_CREDENTIALS'
        });
    }

    // Hardcoded admin token for testing
    const hardcodedToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFkbWluIFVzZXIiLCJpYXQiOjE1MTYyMzkwMjIsInJvbGUiOiJhZG1pbiJ9.KjPX-9-L9h94qMGvXMtVRckJLQiL1xjg6tLIE2QL2VM';
    const hardcodedAdmin = {
        id: 1,
        email: 'admin@example.com',
        password: 'doof123',
        name: 'Admin User',
        role: 'admin'
    };

    try {
        // First try to authenticate with the backend if available
        try {
            const targetUrl = `${CONFIG.BACKEND_URL}/api/auth/admin/login`;
            const response = await axios({
                method: 'POST',
                url: targetUrl,
                data: { email, password },
                headers: {
                    'Content-Type': 'application/json',
                    'x-request-id': requestId
                },
                timeout: CONFIG.PROXY_TIMEOUT,
                validateStatus: () => true
            });
            
            // If the backend returns a successful response, use it
            if (response.status >= 200 && response.status < 300) {
                Logger.info(requestId, 'Admin authentication successful via backend');
                return res.json({
                    success: true,
                    token: response.data.token || hardcodedToken,
                    user: response.data.user || {
                        id: 1,
                        email,
                        name: 'Admin User',
                        role: 'admin'
                    }
                });
            }
            
            // If backend returns an error, check if we can use hardcoded credentials
            Logger.warn(requestId, `Backend auth failed with status ${response.status}, checking hardcoded credentials`);
        } catch (error) {
            Logger.warn(requestId, 'Backend auth request failed, checking hardcoded credentials', error.message);
        }
        
        // Fallback to hardcoded admin credentials for testing
        if (email === hardcodedAdmin.email && password === hardcodedAdmin.password) {
            Logger.info(requestId, 'Admin authentication successful using hardcoded credentials');
            return res.json({ 
                success: true, 
                token: hardcodedToken, 
                user: {
                    id: hardcodedAdmin.id,
                    email: hardcodedAdmin.email,
                    name: hardcodedAdmin.name,
                    role: hardcodedAdmin.role
                }
            });
        }
        
        // If we get here, credentials were invalid
        Logger.warn(requestId, 'Admin authentication failed: Invalid credentials');
        return res.status(401).json({ 
            success: false, 
            message: 'Invalid email or password',
            error: 'INVALID_CREDENTIALS'
        });
        
    } catch (error) {
        Logger.error(requestId, 'Error during admin authentication', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred during authentication',
            error: 'AUTHENTICATION_ERROR',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}));

// Admin authentication middleware - forwards requests to backend for verification
async function requireAdminAuth(req, res, next) {
    const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    console.log(`[${new Date().toISOString()}] [${requestId}] Processing admin request: ${req.method} ${req.url}`);
    
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.warn(`[${new Date().toISOString()}] [${requestId}] No token provided`);
        return res.status(401).json({ success: false, message: 'No token provided.' });
    }
    
    // Extract the original URL path and query parameters
    const originalPath = req.originalUrl.replace(/^\/admin-auth/, '');
    const targetUrl = `http://localhost:5001/api/admin${originalPath}`;
    
    console.log(`[${new Date().toISOString()}] [${requestId}] Forwarding request to: ${req.method} ${targetUrl}`);
    
    try {
        // Forward the request to the backend
        const response = await axios({
            method: req.method.toLowerCase(),
            url: targetUrl,
            headers: {
                ...req.headers,
                host: 'localhost:5001',
                'x-forwarded-for': req.ip || req.connection.remoteAddress,
                'x-original-url': req.originalUrl
            },
            data: req.body,
            validateStatus: () => true // Don't throw on HTTP error status
        });
        
        // Forward the response back to the client
        return res.status(response.status).json(response.data);
        
        
    } catch (error) {
        console.error(`[${new Date().toISOString()}] [${requestId}] Auth error:`, error);
        return res.status(500).json({
            success: false,
            message: 'Authentication error',
            error: error.message || 'AUTH_ERROR',
            requestId,
            timestamp: new Date().toISOString()
        });
    }
}

// Proxy all admin-auth routes to the real backend without E2E mapping
app.all('/admin-auth/*', requireAdminAuth, errorHandler(async (req, res, requestIdSuffix) => {
    const requestId = `admin-proxy-${Date.now()}-${requestIdSuffix || Math.random().toString(36).substring(2, 8)}`;
    
    // Log the incoming request for debugging
    Logger.info(requestId, 'Admin auth request received', { 
        path: req.originalUrl, 
        method: req.method,
        headers: req.headers,
        query: req.query
    });
    
    // Map admin routes to the backend API
    const ADMIN_ROUTE_MAP = {
        '/admin-auth/users': '/api/admin/users',
        '/admin/users': '/api/admin/users',  // Add direct mapping for /admin/users
        // Add other admin routes as needed
    };
    let targetPath = req.path.replace('/admin-auth', '/api/admin');
    if (ADMIN_ROUTE_MAP[req.path]) {
        targetPath = ADMIN_ROUTE_MAP[req.path];
    }
    
    // Special case for restaurants and dishes which don't have /admin prefix
    if (targetPath === '/api/admin/restaurants') {
        targetPath = '/api/restaurants';
    } else if (targetPath === '/api/admin/dishes') {
        targetPath = '/api/dishes';
    } else if (targetPath === '/api/admin/search') {
        targetPath = '/api/search';
    }
    
    Logger.info(requestId, 'Mapping admin route', { from: req.originalUrl, to: targetPath });
    
    const targetUrl = `${CONFIG.BACKEND_URL}${targetPath}`;
    const startTime = Date.now();

    Logger.info(requestId, `Proxying admin request: ${req.method} ${req.originalUrl} -> ${targetUrl}`);
    activeConnections.set(requestId, { url: targetUrl, method: req.method, startTime });

    try {
        const requestData = await preprocessRequest(req, requestId);
        
        const headersToBackend = { ...req.headers };
        delete headersToBackend.host;
        delete headersToBackend.connection;
        delete headersToBackend['content-length'];
        if (requestData && (typeof requestData === 'object' || typeof requestData === 'string') && !headersToBackend['content-type']) {
            headersToBackend['content-type'] = 'application/json';
        }
        headersToBackend['x-request-id'] = requestId;
        headersToBackend['x-forwarded-for'] = req.ip;

        logRequest(requestId, req, requestData, headersToBackend, targetUrl);

        // If we have a valid admin user from the auth middleware, ensure we're using the admin token
        if (req.user && req.user.role === 'admin') {
            const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFkbWluIFVzZXIiLCJpYXQiOjE1MTYyMzkwMjIsInJvbGUiOiJhZG1pbiJ9.KjPX-9-L9h94qMGvXMtVRckJLQiL1xjg6tLIE2QL2VM';
            const jwt = require('jsonwebtoken');
            const decoded = jwt.verify(token, 'cypher216'); // Using the JWT secret from backend config
            
            // Check if the decoded token has the expected structure
            if (decoded.role === 'superuser' || (decoded.user && decoded.user.role === 'superuser')) {
                console.log(`[${new Date().toISOString()}] [${requestId}] Admin authentication successful via local verification`);
                req.token = token;
                
                // Handle both token formats
                const userId = decoded.id || (decoded.user && decoded.user.id);
                const username = decoded.username || (decoded.user && decoded.user.username) || 'admin';
                const email = decoded.email || (decoded.user && decoded.user.email) || 'admin@example.com';
                
                req.user = {
                    id: userId,
                    username: username,
                    email: email,
                    role: 'superuser',
                    account_type: 'superuser'  // Required by the backend
                };
                
                console.log(`[${new Date().toISOString()}] [${requestId}] Authenticated user:`, req.user);
                return next();
            } else {
                console.log(`[${new Date().toISOString()}] [${requestId}] User is not a superuser`);
            }
        }

        const response = await axios({
            method: req.method,
            url: targetUrl,
            data: (req.method === 'GET' || req.method === 'HEAD') ? undefined : requestData,
            headers: headersToBackend,
            timeout: CONFIG.PROXY_TIMEOUT,
            validateStatus: () => true
        });

        activeConnections.delete(requestId);
        const duration = Date.now() - startTime;
        handleProxyResponse(response, res, requestId, duration);
    } catch (error) {
        activeConnections.delete(requestId);
        const duration = Date.now() - startTime;
        handleProxyError(error, res, requestId, duration, targetUrl, req.method);
    }
}));

// DB Schema/Data endpoints - proxy to real backend
app.get('/db-schema', errorHandler(async (req, res, requestId) => { 
    Logger.info(requestId, 'DB schema requested - proxying to backend');
    const targetUrl = `${CONFIG.BACKEND_URL}/api/db/schema`;
    
    try {
        const response = await axios({
            method: 'GET',
            url: targetUrl,
            headers: {
                'x-request-id': requestId
            },
            timeout: CONFIG.PROXY_TIMEOUT,
            validateStatus: () => true
        });
        
        handleProxyResponse(response, res, requestId, 0);
    } catch (error) {
        handleProxyError(error, res, requestId, 0, targetUrl, 'GET');
    }
}));

app.get('/db-data', errorHandler(async (req, res, requestId) => { 
    const tableName = req.query.table;
    Logger.info(requestId, `DB data requested for table: ${tableName || 'LIST_TABLES'}`);
    
    const targetUrl = `${CONFIG.BACKEND_URL}/api/db/data${tableName ? `?table=${tableName}` : ''}`;
    
    try {
        const response = await axios({
            method: 'GET',
            url: targetUrl,
            headers: {
                'x-request-id': requestId
            },
            timeout: CONFIG.PROXY_TIMEOUT,
            validateStatus: () => true
        });
        
        handleProxyResponse(response, res, requestId, 0);
    } catch (error) {
        handleProxyError(error, res, requestId, 0, targetUrl, 'GET');
    }
}));
app.post('/reset-connections', errorHandler(async (req, res, requestId) => { 
  Logger.info(requestId, 'Resetting active connections...');
  activeConnections.forEach((conn, id) => { /* ... error handling ... */ });
  activeConnections.clear();
  res.json({ success: true, message: `Reset connections` });
}));

// --- Generic API Proxy for /api/* ---
// This MUST come AFTER specific routes like /admin-auth/* if those are handled by this server directly.
app.all('/api/*', errorHandler(async (req, res, requestIdSuffix) => {
    const requestId = `proxy-api-${Date.now()}-${requestIdSuffix || Math.random().toString(36).substring(2, 8)}`;
    
        // Use the original API routes without any E2E mapping
    const targetPath = req.originalUrl;
    
    // Check if this is an authenticated request
    const authHeader = req.headers.authorization;
    let isAdminRequest = false;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        const adminToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFkbWluIFVzZXIiLCJpYXQiOjE1MTYyMzkwMjIsInJvbGUiOiJhZG1pbiJ9.KjPX-9-L9h94qMGvXMtVRckJLQiL1xjg6tLIE2QL2VM';
        isAdminRequest = (token === adminToken);
    }
    
    const targetUrl = `${CONFIG.BACKEND_URL}${targetPath}`;
    const startTime = Date.now();

    Logger.info(requestId, `Proxying to backend: ${req.method} ${req.originalUrl} -> ${targetUrl}`);
    activeConnections.set(requestId, { url: targetUrl, method: req.method, startTime });

    try {
        const requestData = await preprocessRequest(req, requestId);
        
        const headersToBackend = { ...req.headers };
        delete headersToBackend.host; // Let axios set the correct host for the target
        delete headersToBackend.connection;
        delete headersToBackend['content-length']; // Axios will set this based on the body
        // Ensure 'content-type' is passed or set if there's a body
        if (requestData && (typeof requestData === 'object' || typeof requestData === 'string') && !headersToBackend['content-type']) {
            headersToBackend['content-type'] = 'application/json';
        }
        headersToBackend['x-request-id'] = requestId;
        headersToBackend['x-forwarded-for'] = req.ip;
        
        // For admin-authenticated requests, ensure the token is properly set
        if (isAdminRequest && !req.originalUrl.includes('/api/auth/')) {
            // Use the hardcoded admin token
            const hardcodedAdminToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFkbWluIFVzZXIiLCJpYXQiOjE1MTYyMzkwMjIsInJvbGUiOiJhZG1pbiJ9.KjPX-9-L9h94qMGvXMtVRckJLQiL1xjg6tLIE2QL2VM';
            Logger.info(requestId, 'Adding admin token to request');
            headersToBackend.authorization = `Bearer ${hardcodedAdminToken}`;
        } else if (req.originalUrl.includes('/api/users/') || 
                   req.originalUrl.includes('/api/submissions/') || 
                   req.originalUrl.includes('/api/lists') || 
                   req.originalUrl.includes('/api/engage/')) {
            // Add admin token to authenticated endpoints that require it
            const hardcodedAdminToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFkbWluIFVzZXIiLCJpYXQiOjE1MTYyMzkwMjIsInJvbGUiOiJhZG1pbiJ9.KjPX-9-L9h94qMGvXMtVRckJLQiL1xjg6tLIE2QL2VM';
            Logger.info(requestId, 'Adding admin token to authenticated endpoint request');
            headersToBackend.authorization = `Bearer ${hardcodedAdminToken}`;
        }

        logRequest(requestId, req, requestData, headersToBackend, targetUrl);

        const response = await axios({
            method: req.method,
            url: targetUrl,
            data: (req.method === 'GET' || req.method === 'HEAD') ? undefined : requestData,
            headers: headersToBackend,
            timeout: CONFIG.PROXY_TIMEOUT,
            validateStatus: () => true 
        });

        activeConnections.delete(requestId);
        const duration = Date.now() - startTime;
        handleProxyResponse(response, res, requestId, duration);
    } catch (error) {
        activeConnections.delete(requestId);
        const duration = Date.now() - startTime;
        handleProxyError(error, res, requestId, duration, targetUrl, req.method);
    }
}));

// Legacy /api-proxy/* handler (if still needed for other tools/tests)
// Note: The current app-bundle.js does not use this /api-proxy prefix.
app.all('/api-proxy/*', errorHandler(async (req, res, requestIdSuffix) => {
  const requestId = `legacyproxy-${Date.now()}-${requestIdSuffix || Math.random().toString(36).substring(2, 8)}`;
  const targetPath = req.url.replace(/^\/api-proxy/, ''); 
  const targetUrl = `${CONFIG.BACKEND_URL}${targetPath}`;    
  const startTime = Date.now();

  Logger.info(requestId, `Legacy /api-proxy: ${req.method} ${req.url} -> ${targetUrl}`);
  // ... (rest of proxy logic similar to /api/* handler) ...
  try {
    const requestData = await preprocessRequest(req, requestId);
    const headersToBackend = { ...req.headers };
    delete headersToBackend.host; 
    delete headersToBackend.connection;
    delete headersToBackend['content-length']; 
    if (requestData && (typeof requestData === 'object' || typeof requestData === 'string') && !headersToBackend['content-type']) {
        headersToBackend['content-type'] = 'application/json';
    }
    headersToBackend['x-request-id'] = requestId;
    headersToBackend['x-forwarded-for'] = req.ip;

    logRequest(requestId, req, requestData, headersToBackend, targetUrl);

    const response = await axios({
        method: req.method,
        url: targetUrl,
        data: (req.method === 'GET' || req.method === 'HEAD') ? undefined : requestData,
        headers: headersToBackend,
        timeout: CONFIG.PROXY_TIMEOUT,
        validateStatus: () => true
    });
    const duration = Date.now() - startTime;
    handleProxyResponse(response, res, requestId, duration);
  } catch (error) {
    const duration = Date.now() - startTime;
    handleProxyError(error, res, requestId, duration, targetUrl, req.method);
  }
}));


// Fallback root route for api-test-runner.html (if not served by express.static as index.html)
// This MUST be AFTER API routes and static file handlers for specific files if there's overlap.
// Since express.static(__dirname) is used, it should handle api-test-runner.html if requested by name.
// This specific app.get('/') ensures that navigating to the bare domain root serves the page.
app.get('/', (req, res, next) => { // Added next for fallthrough if needed
  const indexPath = pathResolve(__dirname, 'api-test-runner.html');
  Logger.info('SERVER_ROOT', `Request for root path '/', attempting to serve: ${indexPath}`);
  // Check if the file exists using fs.existsSync (ensure fs is imported)
  if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
  } else {
      Logger.error('SERVER_ROOT', `api-test-runner.html not found at ${indexPath}. Current directory for server is ${__dirname}.`);
      // Let it fall through to a general 404 handler if you have one, or send 404 here.
      res.status(404).send(`Entry HTML file (api-test-runner.html) not found.`);
  }
});


// General 404 handler for any routes not caught above
app.use((req, res, next) => {
  Logger.warn('404_FALLBACK', `Route not handled: ${req.method} ${req.originalUrl}`);
  res.status(404).send(`Cannot ${req.method} ${req.originalUrl} - Resource not found on Test Runner Server.`);
});

// Centralized error handler for Express (catches errors from synchronous code or `next(err)`)
app.use((err, req, res, next) => {
  const requestId = req.requestId || `error-${Date.now()}`; // req.requestId might not always be set
  Logger.error(requestId, 'Unhandled Express error', err);
  if (res.headersSent) {
    return next(err); // Delegate to default Express error handler if headers already sent
  }
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: err.toString()
  });
});


function startBackendServer() {
  console.log(`Starting backend server from ${CONFIG.BACKEND_DIR}...`);
  if (!fs.existsSync(CONFIG.BACKEND_DIR)) {
      console.error(`Backend directory not found: ${CONFIG.BACKEND_DIR}`);
      console.error(`Please ensure the 'doof-backend' directory is correctly located relative to 'public/serve-test-runner.js'. Expected path: ${pathResolve(__dirname, CONFIG.BACKEND_DIR)}`);
      process.exit(1);
  }
  const backendPackageJson = pathResolve(CONFIG.BACKEND_DIR, 'package.json');
  if (!fs.existsSync(backendPackageJson)) {
      console.error(`Backend package.json not found: ${backendPackageJson}`);
      process.exit(1);
  }

  const backendProcess = spawn('npm', ['run', 'dev'], {
    cwd: CONFIG.BACKEND_DIR,
    stdio: 'pipe', // Use 'inherit' for debugging backend directly, 'pipe' for programmatic access
    shell: true // Needed for npm on some systems
  });
  
  backendProcess.stdout.on('data', (data) => { console.log(`[Backend] ${data.toString().trim()}`); });
  backendProcess.stderr.on('data', (data) => { console.error(`[Backend ERR] ${data.toString().trim()}`); });
  backendProcess.on('error', (err) => { console.error(`Failed to start backend process: ${err.message}`); });
  backendProcess.on('close', (code) => { console.log(`Backend server process exited with code ${code}`); });
  
  return new Promise((resolve, reject) => { // Added reject
    const timeout = setTimeout(() => {
        Logger.warn('SERVER_INIT','Backend server start timed out after 5s. Assuming it might be running or will be shortly.');
        resolve(); // Resolve anyway, but with a warning
    }, 5000);

    backendProcess.stdout.on('data', (data) => {
        if (data.toString().includes('Server running on port') || data.toString().includes('Backend server started')) { // Adjust to actual backend ready message
            clearTimeout(timeout);
            Logger.info('SERVER_INIT','Backend server reported as ready.');
            resolve();
        }
    });
    backendProcess.on('error', (err) => {
        clearTimeout(timeout);
        Logger.error('SERVER_INIT','Failed to start backend process.', err);
        reject(err);
    });
  });
}

async function startServers() {
  try {
    Logger.info('SERVER_INIT','Attempting to start backend server...');
    await startBackendServer();
    Logger.info('SERVER_INIT','Backend server start process initiated.');
    
    app.listen(CONFIG.PORT, () => {
      console.log(`\n🚀 Test Runner Server successfully started!`);
      console.log(`    🔗 Test Runner UI: http://localhost:${CONFIG.PORT}`);
      console.log(`    📡 API Proxy active:`);
      console.log(`       - General /api/* requests proxied to: ${CONFIG.BACKEND_URL}`);
      console.log(`       - Legacy /api-proxy/* requests proxied to: ${CONFIG.BACKEND_URL}`);
      console.log(`    ⚙️  Admin-specific routes (/admin-auth/*) handled by this server (some with mock data).`);
      console.log(`    🩺 Health Check: http://localhost:${CONFIG.PORT}/health\n`);
    });
  } catch (error) {
    Logger.error('SERVER_INIT','Failed to start servers:', error);
    process.exit(1);
  }
}

startServers();