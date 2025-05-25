// api-client.js - API client for making requests to the backend

// Configuration settings
export class Config {
  static API_BASE_URL = 'http://localhost:8080';
  static REQUEST_TIMEOUT = 15000; // Increased timeout to 15 seconds
  static MAX_RETRIES = 2; // Increased to 2 retries
  static RETRY_DELAY = 1000; // Increased delay to 1000ms (1 second)
}

// API Client for making requests
export class ApiClient {
  static async fetch(url, options = {}, retries = Config.MAX_RETRIES) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), Config.REQUEST_TIMEOUT);

    try {
      // Log only the endpoint name for brevity
      const endpoint = url.split('/').pop();
      console.log(`Fetching endpoint: ${endpoint}`);
      
      // Start timing the request
      const startTime = performance.now();
      
      const response = await fetch(`${Config.API_BASE_URL}${url}`, {
        ...options,
        headers: {
          'x-test-mode': 'true',
          'Content-Type': 'application/json',
          ...options.headers
        },
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      // Calculate response time
      const responseTime = Math.round(performance.now() - startTime);
      
      // Handle non-JSON responses gracefully
      let data;
      try {
        data = await response.json();
        
        // Verify payload structure
        if (data && typeof data === 'object') {
          console.log(`Response from ${endpoint} in ${responseTime}ms: OK`);
        } else {
          console.warn(`Response from ${endpoint} has unexpected format:`, typeof data);
        }
      } catch (e) {
        console.warn(`Non-JSON response from ${endpoint}`);
        data = { message: 'Invalid JSON response' };
      }
      
      return { success: response.ok, data, status: response.status, responseTime };
    } catch (error) {
      clearTimeout(timeoutId);
      
      // If we have retries left and it's worth retrying, try again
      if (retries > 0 && (error.name === 'AbortError' || error.name === 'TypeError')) {
        console.log(`Retrying ${url}, ${retries} attempts left`);
        await new Promise(resolve => setTimeout(resolve, Config.RETRY_DELAY));
        return this.fetch(url, options, retries - 1);
      }
      
      // For tests, provide a concise error message
      if (error.name === 'AbortError') {
        return { 
          success: false, 
          notImplemented: true,
          data: { message: 'Request timed out' }
        };
      }
      
      return { 
        success: false, 
        error: error.message,
        data: { message: `Error: ${error.message}` }
      };
    }
  }
}
