/**
 * Test Runner Server
 * 
 * This server serves the API test runner page and provides a proxy
 * to bypass CORS restrictions when making API requests.
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createProxyMiddleware } from 'http-proxy-middleware';
import cors from 'cors';
import axios from 'axios';

// Set up __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 8080;
const BACKEND_URL = 'http://localhost:5001';

// Enable CORS for all routes
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Track active connections
let activeConnections = [];

// Database schema endpoint
app.get('/db-schema', async (req, res) => {
  console.log('Fetching database schema information...');
  
  try {
    // Proxy the request to get table information from the database
    const tablesResponse = await axios({
      method: 'get',
      url: `${BACKEND_URL}/api/db-test`,
      headers: {
        'x-test-mode': 'true'
      },
      timeout: 5000
    });
    
    // If the database connection is successful, get table information
    if (tablesResponse.data.success) {
      try {
        // Query to get all tables in the database
        const tableQuery = `
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          ORDER BY table_name;
        `;
        
        const tableResponse = await axios({
          method: 'post',
          url: `${BACKEND_URL}/api-proxy/db-query`,
          data: { query: tableQuery },
          headers: {
            'Content-Type': 'application/json',
            'x-test-mode': 'true'
          },
          timeout: 5000
        });
        
        // Get column information for each table
        const tables = [];
        
        if (tableResponse.data && tableResponse.data.rows) {
          for (const tableRow of tableResponse.data.rows) {
            const tableName = tableRow.table_name;
            
            // Query to get columns for this table
            const columnQuery = `
              SELECT column_name, data_type, is_nullable, column_default 
              FROM information_schema.columns 
              WHERE table_schema = 'public' AND table_name = '${tableName}' 
              ORDER BY ordinal_position;
            `;
            
            const columnResponse = await axios({
              method: 'post',
              url: `${BACKEND_URL}/api-proxy/db-query`,
              data: { query: columnQuery },
              headers: {
                'Content-Type': 'application/json',
                'x-test-mode': 'true'
              },
              timeout: 5000
            });
            
            tables.push({
              name: tableName,
              columns: columnResponse.data && columnResponse.data.rows ? columnResponse.data.rows : []
            });
          }
        }
        
        res.json({
          success: true,
          dbTime: tablesResponse.data.dbTime,
          tables: tables
        });
      } catch (error) {
        console.error('Error fetching schema details:', error.message);
        res.json({
          success: false,
          message: 'Connected to database but could not fetch schema',
          error: error.message,
          tables: []
        });
      }
    } else {
      res.json({
        success: false,
        message: 'Could not connect to database',
        error: 'Database connection failed'
      });
    }
  } catch (error) {
    console.error('Error connecting to database:', error.message);
    res.json({
      success: false,
      message: 'Error connecting to database',
      error: error.message
    });
  }
});

// Database query endpoint (for schema exploration)
app.post('/db-query', async (req, res) => {
  const { query } = req.body;
  console.log(`Executing database query: ${query}`);
  
  try {
    // Forward the query to the backend
    const response = await axios({
      method: 'post',
      url: `${BACKEND_URL}/api-proxy/db-query`,
      data: { query },
      headers: {
        'Content-Type': 'application/json',
        'x-test-mode': 'true'
      },
      timeout: 5000
    });
    
    res.json(response.data);
  } catch (error) {
    console.error(`Database query error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: `Database query error: ${error.message}`,
      error: error.toString()
    });
  }
});

// Reset connections endpoint
app.post('/reset-connections', (req, res) => {
  console.log('Resetting all connections...');
  
  // Close any active connections
  const count = activeConnections.length;
  activeConnections.forEach(connection => {
    try {
      if (connection.socket && !connection.socket.destroyed) {
        connection.socket.destroy();
      }
    } catch (error) {
      console.error('Error closing connection:', error.message);
    }
  });
  
  // Clear the connections array
  activeConnections = [];
  
  // Return success
  res.json({
    success: true,
    message: `Reset ${count} active connections`,
    timestamp: new Date().toISOString()
  });
});

// API proxy endpoint to bypass CORS
app.use('/api-proxy', async (req, res) => {
  const targetUrl = `${BACKEND_URL}${req.url}`;
  const startTime = Date.now();
  const requestId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  
  console.log(`[${requestId}] Proxying request: ${req.method} ${targetUrl}`);
  console.log(`[${requestId}] Request headers:`, req.headers);
  console.log(`[${requestId}] Request body:`, req.body);
  
  try {
    // Create a custom axios instance for this request
    const axiosInstance = axios.create({
      timeout: 30000, // 30 second timeout to prevent timeouts
    });
    
    // Track the connection
    let connectionInfo = { requestId, url: targetUrl, method: req.method, startTime };
    
    // Add connection tracking without custom transport
    axiosInstance.interceptors.request.use(config => {
      // Add request ID to the config for tracking
      config.requestId = requestId;
      
      // Track the connection without modifying transport
      setTimeout(() => {
        activeConnections.push(connectionInfo);
      }, 0);
      
      return config;
    });
    
    // Make the request
    const response = await axiosInstance({
      method: req.method,
      url: targetUrl,
      data: req.body,
      headers: {
        ...req.headers,
        host: new URL(BACKEND_URL).host,
        origin: BACKEND_URL,
        'x-test-mode': 'true',
        'x-request-id': requestId
      },
      validateStatus: () => true // Return all status codes, not just 2xx
    });
    
    // Remove this connection from the active connections list
    activeConnections = activeConnections.filter(conn => conn.requestId !== requestId);
    
    const duration = Date.now() - startTime;
    console.log(`[${requestId}] Response received in ${duration}ms with status ${response.status}`);
    
    // Log a sample of the response data (to avoid huge logs)
    const responsePreview = JSON.stringify(response.data).substring(0, 200);
    console.log(`[${requestId}] Response preview: ${responsePreview}${responsePreview.length >= 200 ? '...' : ''}`);
    
    // Send the response back to the client
    res.status(response.status).json(response.data);
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[${requestId}] Proxy error after ${duration}ms: ${error.message}`);
    
    // Log detailed error information to console
    console.error('=== DETAILED ERROR INFORMATION ===');
    console.error(`Request ID: ${requestId}`);
    console.error(`URL: ${targetUrl}`);
    console.error(`Method: ${req.method}`);
    console.error(`Duration: ${duration}ms`);
    console.error(`Error: ${error.toString()}`);
    
    if (error.config) {
      console.error('Request Config:', {
        url: error.config.url,
        method: error.config.method,
        headers: error.config.headers,
        data: error.config.data
      });
    }
    
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Headers:', error.response.headers);
      console.error('Response Data:', error.response.data);
    }
    
    // Provide detailed error information in response
    const errorResponse = {
      success: false,
      message: `Proxy error: ${error.message}`,
      error: error.toString(),
      requestId: requestId,
      url: targetUrl,
      method: req.method,
      duration: duration
    };
    
    // If there's a response from the backend, include it
    if (error.response) {
      errorResponse.statusCode = error.response.status;
      errorResponse.backendResponse = error.response.data;
    }
    
    console.error('=== END ERROR INFORMATION ===');
    res.status(500).json(errorResponse);
  }
});

// Health check endpoint with detailed error handling
app.get('/health', async (req, res) => {
  try {
    console.log('Health check request received, checking backend...');
    
    // Set a longer timeout for the health check
    const response = await axios.get(`${BACKEND_URL}/api/health`, {
      timeout: 5000, // 5 seconds timeout - faster response
      headers: {
        'X-Test-Mode': 'true'
      },
      validateStatus: () => true // Accept any status code
    });
    
    console.log('Backend health check response:', response.data);
    
    res.json({
      success: true,
      proxyStatus: 'UP',
      backendStatus: response.data.status,
      message: 'Proxy server is healthy',
      backendMessage: response.data.message,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Backend health check failed:', error.message);
    
    // Provide detailed error information
    const errorDetails = {
      success: false,
      proxyStatus: 'UP',
      backendStatus: 'DOWN',
      message: `Backend server connection failed: ${error.message}`,
      error: error.toString(),
      timestamp: new Date().toISOString()
    };
    
    // If there's a response from the backend, include it
    if (error.response) {
      errorDetails.statusCode = error.response.status;
      errorDetails.backendResponse = error.response.data;
    }
    
    res.status(500).json(errorDetails);
  }
});

// Serve the API test runner at the root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'api-test-runner-fixed.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Test runner server running at http://localhost:${PORT}`);
  console.log(`Open your browser to http://localhost:${PORT} to run the tests`);
  console.log(`API proxy available at http://localhost:${PORT}/api-proxy`);
});
