/**
 * Direct HTTP Client for E2E Tests
 * 
 * This module provides a direct HTTP client that bypasses CORS restrictions
 * by using Node.js http/https modules instead of browser-based XHR.
 */

import http from 'http';
import https from 'https';
import { URL } from 'url';

/**
 * Make a direct HTTP request bypassing CORS restrictions
 * @param {string} url - Full URL to request
 * @param {Object} options - Request options
 * @returns {Promise<Object>} - Response object with status, headers, and data
 */
export async function directRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const isHttps = parsedUrl.protocol === 'https:';
    
    const requestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Doof-E2E-Test-Client',
        'Accept': 'application/json',
        'Origin': 'http://localhost:5173',
        ...(options.headers || {})
      },
      timeout: options.timeout || 5000 // Default 5 second timeout
    };
    
    // Set up timeout to avoid hanging tests
    const timeoutMs = options.timeout || 5000;
    const timeoutId = setTimeout(() => {
      req.destroy(new Error(`Request timeout after ${timeoutMs}ms`));
    }, timeoutMs);
    
    const client = isHttps ? https : http;
    const req = client.request(requestOptions, (res) => {
      const chunks = [];
      
      res.on('data', (chunk) => {
        chunks.push(chunk);
      });
      
      res.on('end', () => {
        clearTimeout(timeoutId); // Clear timeout on successful response
        const responseBody = Buffer.concat(chunks).toString();
        let data;
        
        try {
          data = JSON.parse(responseBody);
        } catch (e) {
          data = responseBody;
        }
        
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data
        });
      });
    });
    
    req.on('error', (error) => {
      clearTimeout(timeoutId); // Clear timeout on error
      console.error('Request error:', error.message);
      
      // Return a structured error response instead of rejecting
      resolve({
        status: 0,
        error: error.message,
        data: { error: error.message, success: false }
      });
    });
    
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    
    req.end();
  });
}

/**
 * Create a simple API client using direct HTTP requests
 * @param {string} baseUrl - Base URL for the API
 * @returns {Object} - API client with get, post, put, patch, delete methods
 */
export function createDirectClient(baseUrl) {
  return {
    async get(path, options = {}) {
      return directRequest(`${baseUrl}${path}`, { 
        method: 'GET',
        ...options
      });
    },
    
    async post(path, body, options = {}) {
      return directRequest(`${baseUrl}${path}`, { 
        method: 'POST',
        body,
        ...options
      });
    },
    
    async put(path, body, options = {}) {
      return directRequest(`${baseUrl}${path}`, { 
        method: 'PUT',
        body,
        ...options
      });
    },
    
    async patch(path, body, options = {}) {
      return directRequest(`${baseUrl}${path}`, { 
        method: 'PATCH',
        body,
        ...options
      });
    },
    
    async delete(path, options = {}) {
      return directRequest(`${baseUrl}${path}`, { 
        method: 'DELETE',
        ...options
      });
    }
  };
}

export default createDirectClient;
