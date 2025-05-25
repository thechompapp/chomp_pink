// app-bundle.js - Non-module version of the app for direct loading

// Configuration
const CONFIG = {
  PROXY_URL: '', // Base path for proxy. Empty means same origin as HTML.
  TIMEOUT: 10000 // 10 seconds for API call timeout
};

// Logger for client-side logging
class Logger {
  static log(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const logData = typeof data === 'object' ? JSON.stringify(data) : data;
    console[level](`[client-${timestamp}] [${level.toUpperCase()}] ${message}`, logData);
  }
  
  static debug(message, data = {}) {
    if (console.debug) {
      this.log('debug', message, data);
    } else {
      // Fallback to console.log if debug is not available
      this.log('log', `[DEBUG] ${message}`, data);
    }
  }
  
  static info(message, data = {}) {
    this.log('info', message, data);
  }
  
  static error(message, error) {
    const errorData = {
      error: error?.message || message, 
      stack: error?.stack,
      ...(error?.name && { name: error.name }),
      ...(error?.status && { status: error.status })
    };
    
    // Include response data if available
    if (error?.response) {
      try {
        errorData.response = {
          status: error.response.status,
          statusText: error.response.statusText,
          headers: Object.fromEntries(error.response.headers?.entries() || []),
          data: error.response.data
        };
      } catch (e) {
        errorData.responseError = 'Failed to parse response';
      }
    }
    
    this.log('error', message, errorData);
  }
  
  static warn(message, data = {}) {
    this.log('warn', message, data);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  Logger.info('Application initialized');
  applyAdditionalStyling();
  setupTabNavigation();
  
  // Initialize event handlers and test runner
  setupEventHandlers();
  
  // Register all API tests and initialize the test runner
  registerAllApiTests();
  TestRunner.initialize();
  initializeTestRunner();
  
  // Don't auto-authenticate - require explicit login
  updateSuperuserStatus('Not authenticated', false);
  document.getElementById('run-all-tests').disabled = true;
});

function applyAdditionalStyling() {
  const testCategories = document.querySelector('.test-categories');
  if (testCategories) {
    testCategories.style.display = 'grid';
    testCategories.style.gridTemplateColumns = 'repeat(auto-fit, minmax(400px, 1fr))';
    testCategories.style.gap = '20px';
  }
}

function setupTabNavigation() {
  const tabs = document.querySelectorAll('.tab');
  const tabContents = document.querySelectorAll('.tab-content');
  const testsContent = document.getElementById('tests'); 
  const testsSubContent = document.getElementById('tests-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      tabContents.forEach(content => {
        content.style.display = 'none';
      });
      
      const tabId = tab.dataset.tab;
      const selectedTabContent = document.getElementById(tabId);

      if (selectedTabContent) {
        selectedTabContent.style.display = 'block';
        if (tabId === 'tests' && testsSubContent) {
           testsSubContent.style.display = 'block'; 
        }
      }
    });
  });

  let activeTab = document.querySelector('.tab.active');
  if (!activeTab && tabs.length > 0) {
    tabs[0].click(); 
  } else if (activeTab) {
     const activeTabId = activeTab.dataset.tab;
     const activeTabContent = document.getElementById(activeTabId);
     if(activeTabContent) activeTabContent.style.display = 'block';
     if (activeTabId === 'tests' && testsSubContent) {
        testsSubContent.style.display = 'block';
     }
  }
}

let superuserAuthenticated = false;
let adminToken = null; 

function setupEventHandlers() {
  document.getElementById('connect-reset')?.addEventListener('click', () => {
    Logger.info('Connect and Reset button clicked');
    TestRunner.connectAndReset();
  });
  document.getElementById('superuser-login')?.addEventListener('click', async () => {
    Logger.info('Superuser Login button clicked');
    const loginButton = document.getElementById('superuser-login');
    const originalText = loginButton?.textContent || 'Login as Superuser';
    
    try {
      // Disable button and show loading state
      loginButton.disabled = true;
      loginButton.textContent = 'Logging in...';
      
      // Attempt login
      const result = await loginAsSuperuserViaButton();
      
      if (result.ok) {
        // Update UI for successful login
        loginButton.textContent = 'Login Successful';
        loginButton.classList.add('success');
        
        // Enable test buttons
        document.querySelectorAll('.run-test, #run-all-tests').forEach(btn => {
          btn.disabled = false;
        });
        
        // Log success
        Logger.info('Login flow completed successfully');
      } else {
        // Show error and reset button
        showAuthError(result.message || 'Login failed');
        loginButton.textContent = 'Login Failed';
        loginButton.classList.add('error');
        
        // Re-enable login button after delay
        setTimeout(() => {
          loginButton.textContent = originalText;
          loginButton.classList.remove('error');
          loginButton.disabled = false;
        }, 2000);
      }
    } catch (error) {
      // Handle unexpected errors
      const errorMsg = error.message || 'An unexpected error occurred';
      Logger.error('Login process failed', { error: errorMsg });
      showAuthError(errorMsg);
      
      // Reset button state
      loginButton.textContent = 'Login Failed';
      loginButton.classList.add('error');
      
      // Re-enable login button after delay
      setTimeout(() => {
        loginButton.textContent = originalText;
        loginButton.classList.remove('error');
        loginButton.disabled = false;
      }, 2000);
    }
  });
  document.getElementById('run-all-tests')?.addEventListener('click', () => {
    if (superuserAuthenticated) {
      Logger.info('Run All Tests button clicked');
      TestRunner.runAllTests();
    } else {
      Logger.error('Cannot run tests: Superuser not authenticated.');
      showAuthError('You must authenticate as a superuser before running tests.');
    }
  });
  document.getElementById('clear-log')?.addEventListener('click', () => {
    Logger.info('Clear Log button clicked');
    TestRunner.clearLog();
    document.getElementById('auth-error')?.remove();
  });
  document.getElementById('expand-all')?.addEventListener('click', () => TestRunner.expandAllTestDetails());
  document.getElementById('collapse-all')?.addEventListener('click', () => TestRunner.collapseAllTestDetails());
  document.getElementById('copy-results')?.addEventListener('click', () => TestRunner.copyResultsToClipboard());

  document.getElementById('load-schema')?.addEventListener('click', () => TestRunner.loadSchema());
  document.getElementById('refresh-schema')?.addEventListener('click', () => TestRunner.refreshSchema());
  document.getElementById('load-data')?.addEventListener('click', () => DatabaseDataManager.loadTableList());
  document.getElementById('refresh-data')?.addEventListener('click', () => DatabaseDataManager.refreshData());
  document.getElementById('table-select')?.addEventListener('change', (e) => {
      if (e.target.value) DatabaseDataManager.loadTableData(e.target.value);
  });
}

async function loginAsSuperuserViaButton() {
  const loginButton = document.getElementById('superuser-login');
  const originalText = loginButton?.textContent || 'Login as Superuser';
  
  try {
    // Update UI for login attempt
    loginButton.disabled = true;
    loginButton.textContent = 'Authenticating...';
    updateSuperuserStatus('Authenticating...', null);
    document.getElementById('auth-error')?.remove();
    
    Logger.info('Attempting superuser login', { email: 'admin@example.com' });
    
    // Make the login request
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ 
        email: 'admin@example.com', 
        password: 'doof123' 
      }),
      credentials: 'include' // Important for cookies/sessions
    });
    
    let data;
    const responseClone = response.clone(); // Clone the response to read it multiple times
    
    try {
      // First try to parse as JSON
      data = await response.json();
      Logger.debug('Login response received', { 
        status: response.status,
        statusText: response.statusText,
        data: data
      });
    } catch (e) {
      // If JSON parsing fails, read as text
      try {
        const text = await responseClone.text();
        Logger.debug('Login response (raw text)', { 
          status: response.status,
          statusText: response.statusText,
          text: text.substring(0, 500) + (text.length > 500 ? '...' : '')
        });
        throw new Error(`Invalid JSON response: ${e.message}\nResponse: ${text.substring(0, 500)}`);
      } catch (textError) {
        throw new Error(`Failed to read response: ${textError.message}`);
      }
    }
    
    if (!response.ok) {
      throw new Error(data.message || data.error || `Authentication failed with status ${response.status}`);
    }
    
    // Extract token from nested response structure
    const responseData = data.data || {};
    const authToken = responseData.token || data.token;
    
    if (!authToken) {
      throw new Error('No authentication token received in response');
    }
    
    // Update authentication state
    adminToken = authToken;
    superuserAuthenticated = true;
    localStorage.setItem('adminToken', adminToken);
    
    // Update UI
    updateSuperuserStatus('Authenticated', true);
    document.getElementById('run-all-tests').disabled = false;
    
    // Log success
    const truncatedToken = adminToken ? `${adminToken.substring(0, 10)}...` : "N/A";
    Logger.info('Superuser login successful', { 
      tokenPreview: truncatedToken,
      user: data.user 
    });
    
    // Update button state
    loginButton.textContent = 'Login Successful';
    loginButton.classList.add('success');
    
    return { 
      ok: true, 
      message: 'Login successful',
      data: {
        token: adminToken,
        user: data.user
      }
    };
    
  } catch (error) {
    // Handle errors
    adminToken = null;
    superuserAuthenticated = false;
    localStorage.removeItem('adminToken');
    
    const errorMessage = `Login failed: ${error.message || 'Unknown error'}`;
    updateSuperuserStatus('Authentication Failed', false);
    showAuthError(errorMessage);
    
    // Log detailed error
    Logger.error('Superuser login error', { 
      error: error.message || 'Unknown error',
      stack: error.stack,
      name: error.name,
      status: error.status
    });
    
    // Update button state
    if (loginButton) {
      loginButton.textContent = 'Login Failed';
      loginButton.classList.add('error');
      
      // Reset button after delay
      setTimeout(() => {
        loginButton.textContent = originalText;
        loginButton.classList.remove('error');
        loginButton.disabled = false;
      }, 2000);
    }
    
    return { 
      ok: false, 
      message: errorMessage,
      error: error.message,
      status: error.status
    };
  }
}

function updateSuperuserStatus(status, isAuthenticated) {
  const statusElement = document.getElementById('superuser-status-value');
  if (!statusElement) return;
  statusElement.textContent = status;
  statusElement.className = 'status-value '; 
  if (isAuthenticated === true) statusElement.classList.add('status-authenticated');
  else if (isAuthenticated === false) statusElement.classList.add('status-not-authenticated');
  else statusElement.classList.add('status-authenticating');
}

function showAuthError(message) {
  let errorElement = document.getElementById('auth-error');
  if (!errorElement) {
    errorElement = document.createElement('div');
    errorElement.id = 'auth-error';
    errorElement.className = 'auth-error';
    document.getElementById('superuser-status')?.after(errorElement);
  }
  errorElement.innerHTML = `<strong>Error:</strong> ${message}`;
}

function initializeTestRunner() {
  ApiClient.fetchWithProxy('/health', { skipAuth: true }) 
    .then(response => {
        if (response && typeof response.data === 'object' && response.data !== null) {
            updateServerStatus(response.data.backendStatus, response.data.proxyStatus);
        } else {
             updateServerStatus('ERROR', 'ERROR'); 
        }
    })
    .catch(() => updateServerStatus('DOWN', 'DOWN'));
}

function updateServerStatus(backendStatus, proxyStatus) {
  const backendEl = document.getElementById('frontend-status'); 
  const proxyEl = document.getElementById('backend-status'); 
  if (backendEl) {
    backendEl.textContent = backendStatus || 'Unknown';
    backendEl.className = backendStatus === 'UP' ? 'status-up' : 'status-down';
  }
  if (proxyEl) {
    proxyEl.textContent = proxyStatus || 'Unknown';
    proxyEl.className = proxyStatus === 'UP' ? 'status-up' : 'status-down';
  }
  
  const style = document.createElement('style');
  style.textContent = `
    .test-runner {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    
    .test-controls {
      margin-bottom: 20px;
      padding: 15px;
      background-color: #f5f5f5;
      border-radius: 6px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .test-summary {
      display: flex;
      gap: 15px;
      font-size: 14px;
    }
    
    .test-summary span {
      display: inline-flex;
      align-items: center;
      padding: 4px 8px;
      border-radius: 4px;
      background-color: #f0f0f0;
    }
    
    .test-summary .passed { color: #2e7d32; }
    .test-summary .failed { color: #c62828; }
    .test-summary .pending { color: #9e9e9e; }
    
    .test-category {
      margin-bottom: 20px;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      overflow: hidden;
    }
    
    .test-category-header {
      padding: 12px 15px;
      background-color: #f8f9fa;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: 600;
      border-bottom: 1px solid #e0e0e0;
    }
    
    .test-item {
      border-bottom: 1px solid #eee;
      transition: background-color 0.2s;
    }
    
    .test-item:hover {
      background-color: #f9f9f9;
    }
    
    .test-header {
      padding: 12px 15px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
    }
    
    .test-name {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;
    }
    
    .status-indicator {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      font-size: 12px;
      font-weight: bold;
    }
    
    .status-indicator.passed {
      color: #2e7d32;
      background-color: #e8f5e9;
    }
    
    .status-indicator.failed {
      color: #c62828;
      background-color: #ffebee;
    }
    
    .status-indicator.running {
      color: #1565c0;
      background-color: #e3f2fd;
      animation: spin 1s linear infinite;
    }
    
    .status-indicator.skipped {
      color: #9e9e9e;
      background-color: #f5f5f5;
    }
    
    .status-indicator.pending {
      color: #9e9e9e;
      background-color: #f5f5f5;
    }
    
    .status-indicator.error {
      color: #ff6f00;
      background-color: #fff3e0;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .test-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .test-status {
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
    }
    
    .status-passed { background-color: #e8f5e9; color: #2e7d32; }
    .status-failed { background-color: #ffebee; color: #c62828; }
    .status-running { background-color: #e3f2fd; color: #1565c0; }
    .status-skipped { background-color: #f5f5f5; color: #9e9e9e; }
    .status-pending { background-color: #f5f5f5; color: #9e9e9e; }
    .status-error { background-color: #fff3e0; color: #ff6f00; }
    
    .test-duration {
      color: #757575;
      font-size: 12px;
      margin-left: 8px;
    }
    
    .test-details {
      padding: 12px 15px 12px 44px;
      background-color: #fafafa;
      border-top: 1px solid #f0f0f0;
      font-family: monospace;
      white-space: pre-wrap;
      font-size: 13px;
      line-height: 1.5;
    }
    
    .test-category-header h3 {
      margin: 0;
      font-size: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .category-count {
      background-color: #e0e0e0;
      color: #424242;
      font-size: 12px;
      padding: 2px 6px;
      border-radius: 10px;
    }
    
    .test-list {
      padding: 0;
      margin: 0;
      list-style: none;
    }
    
    .test-item {
      border-bottom: 1px solid #eee;
    }
    
    .test-item:last-child {
      border-bottom: none;
    }
    
    .test-header {
      padding: 12px 15px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
      background-color: #fff;
      transition: background-color 0.2s;
    }
    
    .test-header:hover {
      background-color: #f8f9fa;
    }
    
    .test-name {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;
      min-width: 0;
    }
    
    .test-name-text {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .test-duration {
      color: #757575;
      font-size: 12px;
      white-space: nowrap;
    }
    
    .test-actions {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-left: 10px;
    }
    
    .test-status {
      font-size: 12px;
      padding: 2px 8px;
      border-radius: 10px;
      font-weight: 500;
    }
    
    .status-passed {
      background-color: #e8f5e9;
      color: #2e7d32;
    }
    
    .status-failed {
      background-color: #ffebee;
      color: #c62828;
    }
    
    .status-pending, .status-skipped {
      background-color: #fff8e1;
      color: #ff8f00;
    }
    
    .status-running {
      background-color: #e3f2fd;
      color: #1565c0;
      animation: pulse 1.5s infinite;
    }
    
    .copy-btn {
      background: none;
      border: none;
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #757575;
      transition: all 0.2s;
    }
    
    .copy-btn:hover {
      background-color: #f0f0f0;
      color: #424242;
    }
    
    .copy-btn.copied {
      color: #2e7d32;
    }
    
    .test-toggle {
      color: #757575;
      font-size: 12px;
      width: 20px;
      text-align: center;
    }
    
    .test-details {
      padding: 15px;
      background-color: #fafafa;
      border-top: 1px solid #eee;
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
      font-size: 13px;
      white-space: pre-wrap;
      word-break: break-word;
    }
    
    .test-details pre {
      margin: 0;
      font-family: inherit;
      white-space: pre-wrap;
    }
    
    .detail-item {
      margin-bottom: 10px;
    }
    
    .detail-item:last-child {
      margin-bottom: 0;
    }
    
    .detail-label {
      font-weight: 600;
      margin-bottom: 4px;
      color: #424242;
    }
    
    .detail-value {
      padding: 8px;
      background-color: #fff;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      max-height: 300px;
      overflow-y: auto;
    }
    
    .detail-value.error {
      border-color: #ffcdd2;
      background-color: #ffebee;
    }
    
    @keyframes pulse {
      0% { opacity: 0.6; }
      50% { opacity: 1; }
      100% { opacity: 0.6; }
    }
    
    .test-log {
      margin-top: 20px;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      overflow: hidden;
    }
    
    .log-header {
      padding: 10px 15px;
      background-color: #f8f9fa;
      border-bottom: 1px solid #e0e0e0;
      font-weight: 600;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .log-content {
      max-height: 200px;
      overflow-y: auto;
      background-color: #1e1e1e;
      color: #e0e0e0;
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
      font-size: 12px;
      line-height: 1.5;
      padding: 10px 15px;
    }
    
    .log-entry {
      margin: 4px 0;
      padding: 2px 0;
    }
    
    .log-entry.error {
      color: #ff8a80;
    }
    
    .log-entry.warn {
      color: #ffd54f;
    }
    
    .log-entry.info {
      color: #80d8ff;
    }
    
    .log-time {
      color: #9e9e9e;
      margin-right: 8px;
    }
    
    button {
      background-color: #1976d2;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: background-color 0.2s;
    }
    
    button:hover {
      background-color: #1565c0;
    }
    
    button:disabled {
      background-color: #bdbdbd;
      cursor: not-allowed;
    }
    
    button.secondary {
      background-color: #757575;
    }
    
    button.secondary:hover {
      background-color: #616161;
    }
    
    /* Status Indicators */
    .status-indicator {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      font-weight: bold;
      font-size: 12px;
      flex-shrink: 0;
      margin-right: 8px;
    }
    
    .status-indicator.passed {
      color: #2e7d32;
      background-color: #e8f5e9;
    }
    
    .status-indicator.failed {
      color: #c62828;
      background-color: #ffebee;
    }
    
    .status-indicator.running {
      color: #1565c0;
      background-color: #e3f2fd;
      animation: pulse 1.5s infinite;
    }
    
    .status-indicator.pending {
      color: #9e9e9e;
      background-color: #f5f5f5;
    }
    
    .status-indicator.skipped {
      color: #ff8f00;
      background-color: #fff8e1;
    }
    
    .status-indicator.error {
      color: #d32f2f;
      background-color: #ffebee;
    }
  `;
  document.head.appendChild(style);
}

const ApiClient = {
  async fetchWithProxy(endpoint, options = {}) {
        const url = new URL(endpoint, window.location.origin);
        const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        const startTime = Date.now();

        // Add auth token if available and not skipped
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...(options.headers || {})
        };

        // Get the latest token in case it was updated
        const currentToken = adminToken || localStorage.getItem('adminToken');
        
        if (currentToken && !options.skipAuth) {
            headers['Authorization'] = `Bearer ${currentToken}`;
            Logger.info(`[${requestId}] Added auth token to request`, {});
        } else if (!options.skipAuth) {
            Logger.warn(`[${requestId}] No auth token available for authenticated request to ${endpoint}`);
        }

        // Set up fetch options
        const fetchOptions = {
            ...options,
            headers,
            credentials: 'include' // Include cookies for session handling
        };

        // Log the request
        Logger.info(`API Request [${requestId}]: ${fetchOptions.method || 'GET'} ${endpoint}`, {});

        try {
            // Make the request with timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT);
            
            const response = await fetch(url, {
                ...fetchOptions,
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            const responseTime = Date.now() - startTime;
            
            let responseData;
            try {
                // First try to parse as JSON
                responseData = await response.json();
            } catch (e) {
                // If JSON parsing fails, read as text
                try {
                    const text = await responseClone.text();
                    Logger.debug('Login response (raw text)', { 
                      status: response.status,
                      statusText: response.statusText,
                      text: text.substring(0, 500) + (text.length > 500 ? '...' : '')
                    });
                    throw new Error(`Invalid JSON response: ${e.message}\nResponse: ${text.substring(0, 500)}`);
                } catch (textError) {
                    throw new Error(`Failed to read response: ${textError.message}`);
                }
            }
            
            // Log successful response
            if (response.ok) {
                Logger.info(`[${requestId}] API Success Response`, {
                    status: response.status,
                    endpoint: endpoint,
                    responseTime: `${responseTime}ms`,
                    dataPreview: responseData ? JSON.stringify(responseData).substring(0, 100) : 'No data'
                });
            } else {
                Logger.error(`[${requestId}] API Error Response`, {
                    status: response.status,
                    statusText: response.statusText,
                    endpoint: endpoint,
                    error: responseData?.message || 'Unknown error'
                });
            }
            
            return {
                ok: response.ok,
                status: response.status,
                statusText: response.statusText,
                data: responseData,
                headers: response.headers
            };
            
        } catch (error) {
            clearTimeout(timeoutId);
            const errorMessage = error.name === 'AbortError' 
                ? `Request to ${endpoint} timed out after ${CONFIG.TIMEOUT}ms`
                : error.message;
                
            Logger.error(`[${requestId}] API Request Failed`, {
                error: errorMessage,
                endpoint: endpoint,
                method: (options.method || 'GET').toUpperCase()
            });
            
            throw new Error(errorMessage);
        }
    }
};

const TestRunner = {
  tests: {},
  testOrder: [],
  
  initialize() {
    this.setupEventListeners();
    this.renderTests();
    this.initializeTestItemClickHandlers();
    this.logMessage('Test runner initialized. Click "Run All Tests" to begin.');
  },
  
  setupEventListeners() {
    const runAllButton = document.getElementById('run-all-tests');
    if (runAllButton) {
      runAllButton.addEventListener('click', () => {
        if (superuserAuthenticated) {
          Logger.info('Run All Tests button clicked');
          this.runAllTests();
        } else {
          Logger.error('Cannot run tests: Superuser not authenticated.');
          showAuthError('You must authenticate as a superuser before running tests.');
        }
      });
    }
  },
  
  initializeCategoryToggles() {
    const categoryHeaders = document.querySelectorAll('.test-category-header');
    categoryHeaders.forEach(header => {
      header.addEventListener('click', () => {
        const category = header.closest('.test-category');
        const content = category?.querySelector('.test-list');
        const icon = header.querySelector('.toggle-icon');
        
        if (category && content && icon) {
          const isExpanded = category.getAttribute('aria-expanded') !== 'false';
          category.setAttribute('aria-expanded', !isExpanded);
          content.hidden = isExpanded;
          content.setAttribute('aria-hidden', isExpanded);
          icon.textContent = isExpanded ? '▶' : '▼';
        }
      });
    });
  },
  
  renderTests() {
    const testCategories = document.querySelector('.test-categories');
    if (!testCategories) return;
    
    // Group tests by category
    const categories = {};
    Object.values(this.tests).forEach(test => {
      const category = test.category || 'general-api';
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(test);
    });
    
    // Clear existing content
    testCategories.innerHTML = '';
    
    // Create a category for each group
    Object.entries(categories).forEach(([category, tests]) => {
      const categoryElement = document.createElement('div');
      categoryElement.className = 'test-category';
      categoryElement.innerHTML = `
        <div class="test-category-header">
          <h3>${category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} <span class="category-count">${tests.length}</span></h3>
          <span class="toggle-icon">▼</span>
        </div>
        <div class="test-list" aria-hidden="false"></div>
      `;
      
      const testList = categoryElement.querySelector('.test-list');
      tests.forEach(test => {
        const testElement = document.createElement('div');
        testElement.innerHTML = this.renderTestItem(test);
        testList.appendChild(testElement.firstElementChild);
      });
      
      testCategories.appendChild(categoryElement);
    });
    
    // Initialize category toggles
    this.initializeCategoryToggles();
    
    // Initialize test item click handlers
    this.initializeTestItemClickHandlers();
  },
  
  renderTestItem(test) {
    try {
      const status = test.status || 'pending';
      const statusClass = `status-${status.toLowerCase()}`;
      const isExpanded = this.expandedTests && this.expandedTests.has ? this.expandedTests.has(test.id) : false;
      
      // Format the status text to be more readable
      const formatStatus = (s) => {
        return typeof s === 'string' ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : 'Pending';
      };
      
      // Get status indicator icon
      const getStatusIndicator = (status) => {
        const indicators = {
          passed: '✓',
          failed: '✗',
          running: '⟳',
          skipped: '↷',
          pending: '…',
          error: '!'
        };
        return `<span class="status-indicator ${status}">${indicators[status] || '?'}</span>`;
      };
      
      // Format duration if available
      let durationText = '';
      if (test.duration !== undefined && test.duration !== null) {
        durationText = ` • ${test.duration}ms`;
      }
      
      // Add copy button to test header
      const copyButton = `
        <button class="copy-btn" title="Copy test details" aria-label="Copy test details" data-test-id="${test.id}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
        </button>`;
      
      // Ensure test name is properly escaped
      const testName = test.name || 'Unnamed Test';
      
      // Get test details if available
      const testDetails = this.renderTestDetails ? this.renderTestDetails(test) : '';
      
      return `
        <div class="test-item ${status.toLowerCase()}" data-test-id="${test.id}" aria-expanded="${isExpanded}">
          <div class="test-header">
            <div class="test-name">
              ${getStatusIndicator(status.toLowerCase())}
              <span class="test-name-text">${testName.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</span>
              ${durationText ? `<span class="test-duration">${durationText}</span>` : ''}
            </div>
            <div class="test-actions">
              <span class="test-status ${statusClass}">${formatStatus(status)}</span>
              ${copyButton}
              <span class="test-toggle" aria-hidden="true">${isExpanded ? '▼' : '▶'}</span>
            </div>
          </div>
          <div class="test-details" aria-hidden="${!isExpanded}" ${isExpanded ? '' : 'hidden'}>
            ${testDetails}
          </div>
        </div>`;
    } catch (error) {
      console.error('Error rendering test item:', error);
      return '<div class="test-item error">Error rendering test</div>';
    }
  },
  
  formatStatus(status) {
    return {
      passed: '✅ Passed',
      failed: '❌ Failed',
      running: '⏳ Running',
      skipped: '⏭️ Skipped',
      pending: '⏳ Pending',
      error: '⚠️ Error'
    }[status] || status;
  },
  
  renderTestDetails(test) {
    if (!test.result && !test.error) return '';
    
    const details = [];
    
    // Show error details if test failed
    if (test.error || (test.result && test.result.error)) {
      const error = test.error || test.result.error;
      details.push(`
        <div class="detail-item">
          <div class="detail-label">Error Details</div>
          <div class="detail-value error">
            <pre>${typeof error === 'string' ? error : JSON.stringify(error, null, 2)}</pre>
          </div>
        </div>
      `);
    }
    
    // Show response data if available
    if (test.result && test.result.data) {
      details.push(`
        <div class="detail-item">
          <div class="detail-label">Response Data</div>
          <div class="detail-value">
            <pre>${JSON.stringify(test.result.data, null, 2)}</pre>
          </div>
        </div>
      `);
    }
    
    // Show status code and text
    if (test.result) {
      const statusParts = [];
      if (test.result.status) statusParts.push(`Status: ${test.result.status}`);
      if (test.result.statusText) statusParts.push(test.result.statusText);
      
      if (statusParts.length > 0) {
        details.push(`
          <div class="detail-item">
            <div class="detail-label">Status</div>
            <div class="detail-value">${statusParts.join(' ')}</div>
          </div>
        `);
      }
    }
    
    // Show request details if available
    if (test.result && test.result.config) {
      const { method, url, headers, data } = test.result.config;
      const requestDetails = [];
      
      if (method && url) {
        requestDetails.push(`${method.toUpperCase()} ${url}`);
      }
      
      if (headers) {
        requestDetails.push(`Headers: ${JSON.stringify(headers, null, 2)}`);
      }
      
      if (data) {
        requestDetails.push(`Body: ${typeof data === 'string' ? data : JSON.stringify(data, null, 2)}`);
      }
      
      if (requestDetails.length > 0) {
        details.push(`
          <div class="detail-item">
            <div class="detail-label">Request</div>
            <div class="detail-value">
              <pre>${requestDetails.join('\n\n')}</pre>
            </div>
          </div>
        `);
      }
    }
    
    // Show timing information
    if (test.result && test.result.duration) {
      details.push(`
        <div class="detail-item">
          <div class="detail-label">Timing</div>
          <div class="detail-value">${test.result.duration}ms</div>
        </div>
      `);
    }
    
    return details.join('\n');
  },
  
  initializeTestItemClickHandlers() {
    // Remove any existing click handlers to prevent duplicates
    document.removeEventListener('click', this.boundHandleTestItemClick);
    document.removeEventListener('click', this.boundHandleCategoryClick);
    
    // Bind the methods to maintain 'this' context
    this.boundHandleTestItemClick = this.handleTestItemClick.bind(this);
    this.boundHandleCategoryClick = this.handleCategoryClick.bind(this);
    
    // Add the new event listeners
    document.addEventListener('click', this.boundHandleTestItemClick);
    document.addEventListener('click', this.boundHandleCategoryClick);
  },
  
  handleTestItemClick(e) {
    // Find the closest test item or test header
    const testHeader = e.target.closest('.test-header');
    const copyBtn = e.target.closest('.copy-btn');
    
    // Handle test header click
    if (testHeader && !copyBtn) {
      e.preventDefault();
      e.stopPropagation();
      const item = testHeader.closest('.test-item');
      if (item) {
        const testId = item.getAttribute('data-test-id');
        if (testId) {
          this.toggleTestDetails(testId);
        }
      }
      return;
    }
    
    // Handle copy button click
    if (copyBtn) {
      e.preventDefault();
      e.stopPropagation();
      const testItem = copyBtn.closest('.test-item');
      if (testItem) {
        const details = testItem.querySelector('.test-details');
        if (details) {
          const textToCopy = details.innerText;
          navigator.clipboard.writeText(textToCopy).then(() => {
            // Show copied feedback
            const originalText = copyBtn.innerHTML.trim();
            copyBtn.innerHTML = '<span>Copied!</span>';
            copyBtn.classList.add('copied');
            setTimeout(() => {
              copyBtn.innerHTML = originalText;
              copyBtn.classList.remove('copied');
            }, 2000);
          }).catch(err => {
            console.error('Failed to copy text: ', err);
          });
        }
      }
    }
  },
  
  handleCategoryClick(e) {
    const categoryHeader = e.target.closest('.test-category-header');
    if (categoryHeader) {
      e.preventDefault();
      e.stopPropagation();
      const category = categoryHeader.closest('.test-category');
      if (category) {
        const isExpanded = category.getAttribute('aria-expanded') !== 'false';
        category.setAttribute('aria-expanded', !isExpanded);
        const content = category.querySelector('.test-list');
        if (content) {
          content.hidden = isExpanded;
          content.setAttribute('aria-hidden', isExpanded);
        }
        const icon = categoryHeader.querySelector('.toggle-icon');
        if (icon) {
          icon.textContent = isExpanded ? '▶' : '▼';
        }
      }
    }
  },
  
  toggleTestDetails(testId) {
    const test = this.tests[testId];
    if (!test) return;
    
    const testElement = document.querySelector(`.test-item[data-test-id="${testId}"]`);
    if (!testElement) return;
    
    const isExpanded = testElement.getAttribute('aria-expanded') === 'true';
    const detailsElement = testElement.querySelector('.test-details');
    
    if (isExpanded) {
      // Collapse
      testElement.setAttribute('aria-expanded', 'false');
      if (detailsElement) {
        detailsElement.setAttribute('aria-hidden', 'true');
        detailsElement.hidden = true;
      }
    } else {
      // Expand
      testElement.setAttribute('aria-expanded', 'true');
      if (detailsElement) {
        detailsElement.setAttribute('aria-hidden', 'false');
        detailsElement.hidden = false;
      }
      
      // Scroll the test into view if needed
      setTimeout(() => {
        testElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 50);
    }
  },
  
  registerTest(id, name, testFn, dependencies = [], category = 'general-api') {
    this.tests[id] = { id, name, testFn, dependencies, category, status: 'pending', result: null };
    if (!this.testOrder.includes(id)) this.testOrder.push(id);
  },
  
  async runTest(id) {
    const test = this.tests[id];
    if (!test) {
      Logger.error(`Test with ID ${id} not found`);
      return null;
    }

    // Check if test requires admin auth
    const requiresAdmin = test.dependencies.includes('admin-login');
    if (requiresAdmin && !superuserAuthenticated) {
      const errorMsg = 'Admin authentication required';
      this.updateTestStatusUI(id, 'error', { message: errorMsg });
      Logger.error(`Test ${id} requires admin authentication`, { test });
      return { ok: false, message: errorMsg };
    }

    // Check dependencies
    const unmetDeps = test.dependencies.filter(depId => {
      if (depId === 'admin-login') return false; // Already checked
      const depTest = this.tests[depId];
      return !depTest || !depTest.lastResult?.ok;
    });

    if (unmetDeps.length > 0) {
      const message = `Skipped: Missing or failed dependencies: ${unmetDeps.join(', ')}`;
      this.updateTestStatusUI(id, 'skipped', { message });
      Logger.warn(`Skipping test ${id}: ${message}`);
      return { ok: false, skipped: true, message };
    }

    // Update UI and log
    this.updateTestStatusUI(id, 'running');
    Logger.info(`Running test: ${test.name}`, { testId: id });

    try {
      const result = await test.testFn();
      const status = result.ok ? 'passed' : 'failed';
      this.updateTestStatusUI(id, status, result);
      
      if (status === 'passed') {
        Logger.info(`Test passed: ${test.name}`, { testId: id });
      } else {
        Logger.warn(`Test failed: ${test.name}`, { 
          testId: id, 
          reason: result.message || 'Unknown reason',
          details: result
        });
      }
      
      return { ...result, testId: id, testName: test.name };
      
    } catch (error) {
      const errorDetails = {
        message: error.message || 'Test threw an exception',
        error: error.toString(),
        stack: error.stack
      };
      
      this.updateTestStatusUI(id, 'error', errorDetails);
      Logger.error(`Test error in ${test.name}`, { 
        testId: id, 
        error: errorDetails 
      });
      
      return { 
        ok: false, 
        error: true,
        ...errorDetails,
        testId: id,
        testName: test.name
      };
    }
  },
  
  updateTestStatusUI(id, status, result = null) {
    const test = this.tests[id];
    if (!test) return;

    test.status = status;
    test.result = result;
    
    const testElement = document.getElementById(`test-${id}`);
    if (!testElement) return;

    // Update status classes on the test item
    const statusClasses = ['passed', 'failed', 'running', 'pending', 'skipped', 'error'];
    statusClasses.forEach(cls => testElement.classList.remove(cls));
    testElement.classList.add(status);
    
    // Update status indicator
    const statusElement = testElement.querySelector('.test-status');
    if (statusElement) {
      // Format status text (capitalize first letter)
      const statusText = status.charAt(0).toUpperCase() + status.slice(1);
      
      // Update status text and classes
      statusElement.textContent = statusText;
      statusElement.className = 'test-status';
      statusElement.classList.add(`status-${status}`);
      
      // Add pulse animation for running state
      if (status === 'running') {
        statusElement.classList.add('pulse');
      } else {
        statusElement.classList.remove('pulse');
      }
    }

    // Update details if result is available
    if (result) {
      const detailsElement = testElement.querySelector('.test-details');
      if (detailsElement) {
        detailsElement.innerHTML = this.formatTestDetails(result);
      }
    }
  },
  
  async runAllTests() {
    // Clear previous results
    this.clearLog();
    this.logMessage('Preparing to run all tests...');
    
    // Check authentication for admin tests
    const hasAdminTests = this.testOrder.some(id => 
      this.tests[id]?.dependencies.includes('admin-login')
    );
    
    const results = [];
    let passedCount = 0;
    let failedCount = 0;
    let skippedCount = 0;
    
    // Run tests in order, waiting for each to complete
    for (const id of this.testOrder) {
      const test = this.tests[id];
      this.logMessage(`\nRunning test: ${test.name}`);
      
      try {
        const result = await this.runTest(id);
        results.push({ id, ...result });
        
        if (result?.skipped) {
          skippedCount++;
          this.logMessage(`  ✓ SKIPPED: ${result.message || 'Dependency not met'}`);
        } else if (result?.ok) {
          passedCount++;
          this.logMessage(`  ✓ PASSED: ${test.name}`);
        } else {
          failedCount++;
          this.logMessage(`  ✗ FAILED: ${test.name} - ${result?.message || 'No error details'}`, true);
        }
      } catch (error) {
        failedCount++;
        const errorMsg = error.message || 'Unexpected error';
        this.logMessage(`  ✗ ERROR: ${test.name} - ${errorMsg}`, true);
        Logger.error(`Error running test ${id} (${test.name})`, { error });
        test.status = 'error';
        test.result = { ok: false, message: errorMsg, error };
        this.updateTestStatusUI(id, 'error', test.result);
      }
    }
    
    const total = this.testOrder.length;
    this.logMessage(`\nAll tests completed. Passed: ${passedCount}, Failed: ${failedCount}, Skipped: ${skippedCount}, Total: ${total}`);
    this.updateSummary(passedCount, failedCount, skippedCount, total);
    
    return {
      passed: passedCount,
      failed: failedCount,
      skipped: skippedCount,
      total,
      results
    };
  },
  
  updateSummary(passed, failed, skipped, total) {
    const summaryContent = document.getElementById('summary-content');
    if (!summaryContent) return;
    
    // Calculate success rate
    const successRate = total > 0 ? Math.round((passed / total) * 100) : 0;
    
    // Update summary content
    summaryContent.innerHTML = `
      <div class="summary-grid">
        <span class="summary-item total">📊 Total: ${total}</span>
        <span class="summary-item passed">✅ Passed: ${passed}</span>
        <span class="summary-item failed">❌ Failed: ${failed}</span>
        <span class="summary-item skipped">⏭️ Skipped: ${skipped}</span>
        <span class="summary-item rate">📈 Success: ${successRate}%</span>
      </div>
      <div class="progress-bar">
        <div class="progress passed" style="width: ${successRate}%"></div>
        <div class="progress failed" style="width: ${(failed / total) * 100}%"></div>
        <div class="progress skipped" style="width: ${(skipped / total) * 100}%"></div>
      </div>`;
      
    // Update the run button text
    const runButton = document.getElementById('run-all-tests');
    if (runButton) {
      runButton.textContent = '🔁 Run All Tests Again';
    }
    
    // Scroll to top if there are failures
    if (failed > 0) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  },
  
  logMessage(message, isError = false) {
    const testLog = document.getElementById('test-log');
    if (!testLog) return;
    const logEntry = document.createElement('p');
    logEntry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    if (isError) logEntry.style.color = 'var(--danger-color)';
    testLog.appendChild(logEntry);
    testLog.scrollTop = testLog.scrollHeight;
  },
  
  clearLog() {
    const testLog = document.getElementById('test-log');
    if (testLog) testLog.innerHTML = '';
    this.logMessage("Log cleared.");
    const summaryContent = document.getElementById('summary-content');
    if(summaryContent) summaryContent.textContent = 'Connect to servers and run tests to see results.';
    Object.keys(this.tests).forEach(id => {
        this.tests[id].status = 'pending'; 
        this.tests[id].result = null;      
        this.updateTestStatusUI(id, 'pending');
    });
  },
  
  async copyResultsToClipboard() {
    try {
      // Create a more detailed report
      let report = "Chomp API Test Report\n";
      report += '='.repeat(50) + '\n\n';
      
      // Header with environment info
      report += `Test Run: ${new Date().toLocaleString()}\n`;
      report += `Environment: ${window.location.href}\n`;
      report += `User Agent: ${navigator.userAgent}\n`;
      report += `Superuser Authenticated: ${superuserAuthenticated ? '✅ Yes' : '❌ No'}\n`;
      
      // Server status
      const backendStatus = document.getElementById('frontend-status')?.textContent || "Unknown";
      const proxyStatus = document.getElementById('backend-status')?.textContent || "Unknown";
      report += `\nServer Status:\n`;
      report += `  - Backend: ${backendStatus}\n`;
      report += `  - Proxy: ${proxyStatus}\n`;
      
      // Test summary
      const total = this.testOrder.length;
      const passed = this.testOrder.filter(id => this.tests[id]?.status === 'passed').length;
      const failed = this.testOrder.filter(id => this.tests[id]?.status === 'failed').length;
      const skipped = this.testOrder.filter(id => this.tests[id]?.status === 'skipped').length;
      const successRate = total > 0 ? Math.round((passed / total) * 100) : 0;
      
      report += `\nTest Summary:\n`;
      report += `  - Total: ${total}\n`;
      report += `  - ✅ Passed: ${passed}\n`;
      report += `  - ❌ Failed: ${failed}\n`;
      report += `  - ⏭️ Skipped: ${skipped}\n`;
      report += `  - 📈 Success Rate: ${successRate}%\n\n`;
      
      // Detailed test results
      report += '='.repeat(50) + '\n';
      report += 'DETAILED TEST RESULTS\n';
      report += '='.repeat(50) + '\n\n';
      
      this.testOrder.forEach(id => {
        const test = this.tests[id];
        if (!test) return;
        
        const statusIcon = {
          'passed': '✅',
          'failed': '❌',
          'skipped': '⏭️',
          'running': '⏳',
          'error': '⚠️',
          'pending': '…'
        }[test.status] || '?';
        
        report += `${statusIcon} ${test.name} (${test.id})\n`;
        report += `Category: ${test.category || 'N/A'}\n`;
        report += `Status: ${test.status ? test.status.toUpperCase() : 'PENDING'}\n`;
        
        if (test.result) {
          if (test.result.message) {
            report += `Message: ${test.result.message}\n`;
          }
          
          if (test.result.error) {
            report += `Error: ${test.result.error}\n`;
          }
          
          if (test.result.stack) {
            report += `Stack Trace:\n${test.result.stack.split('\n').map(line => `  ${line}`).join('\n')}\n`;
          }
          
          if (test.result.data) {
            try {
              const dataStr = JSON.stringify(test.result.data, null, 2);
              report += `Data: ${dataStr.length > 1000 ? dataStr.substring(0, 1000) + "\n... (truncated)" : dataStr}\n`;
            } catch (e) {
              report += `Data: [Unserializable data]\n`;
            }
          }
        }
        
        report += '\n' + '-'.repeat(50) + '\n\n';
      });
      
      // Add logs
      report += '='.repeat(50) + '\n';
      report += 'TEST LOGS\n';
      report += '='.repeat(50) + '\n\n';
      
      const logEntries = document.getElementById('test-log')?.innerText || "No logs available.";
      report += logEntries;
      
      // Copy to clipboard
      await navigator.clipboard.writeText(report);
      
      // Show success feedback
      this.logMessage('✓ Test results copied to clipboard!');
      
      // Update the copy button to show success state
      const copyButton = document.getElementById('copy-results');
      if (copyButton) {
        const originalText = copyButton.textContent;
        copyButton.textContent = 'Copied!';
        copyButton.classList.add('success');
        
        setTimeout(() => {
          copyButton.textContent = originalText;
          copyButton.classList.remove('success');
        }, 2000);
      }
      
      return true;
      
    } catch (error) {
      const errorMsg = 'Failed to copy results to clipboard';
      this.logMessage(`${errorMsg}: ${error.message}`, true);
      console.error(errorMsg, error);
      return false;
    }
  },

  connectAndReset() {
    this.logMessage('Connecting & Resetting...');
    initializeTestRunner(); 
    superuserAuthenticated = false;
    adminToken = null;
    updateSuperuserStatus('Not Authenticated', false);
    const runAllButton = document.getElementById('run-all-tests');
    if(runAllButton) runAllButton.disabled = true;
    document.getElementById('auth-error')?.remove();
    
    Object.keys(this.tests).forEach(id => {
        this.tests[id].status = 'pending';
        this.tests[id].result = null;
        this.updateTestStatusUI(id, 'pending');
    });
    this.logMessage('State reset. Ready for superuser login and tests.');
    this.updateSummary(0,0,0,this.testOrder.length); 
    const summaryContent = document.getElementById('summary-content');
    if(summaryContent) summaryContent.textContent = 'Connect to servers and run tests to see results.';
  },

  loadSchema: async function() { this.logMessage("Load Schema: Not implemented in this tool version.", true); },
  refreshSchema: async function() { this.logMessage("Refresh Schema: Not implemented in this tool version.", true); }
};

const DatabaseDataManager = {
    loadTableList: async function() { TestRunner.logMessage("Load Table List: Not implemented in this tool version.", true); },
    loadTableData: async function(tableName) { TestRunner.logMessage(`Load Table Data (${tableName}): Not implemented.`, true); },
    refreshData: async function() { TestRunner.logMessage("Refresh DB Data: Not implemented in this tool version.", true); }
};

function registerAllApiTests() {
    const ADMIN_LOGIN_ID = 'admin-login'; 

    // Health & Authentication
    TestRunner.registerTest('health-check', 'Platform Health Check', 
        async () => ApiClient.fetchWithProxy('/health', { skipAuth: true }), 
        [], 'health-auth');

    TestRunner.registerTest(ADMIN_LOGIN_ID, 'Admin Superuser Login Test', async () => {
        // If already authenticated via UI, use that token
        if (superuserAuthenticated && adminToken) {
            return { 
                ok: true, 
                message: "Using existing admin token from UI login.", 
                data: { 
                    tokenStatus: "Exists",
                    tokenPreview: adminToken.substring(0, 10) + '...'
                } 
            };
        }

        Logger.info("Admin-login test: Attempting admin login...");
        
        try {
            const response = await ApiClient.fetchWithProxy('/api/auth/login', {
                method: 'POST',
                body: JSON.stringify({ 
                    email: 'admin@example.com', 
                    password: 'doof123' 
                }),
                skipAuth: true // Important: Don't send existing token for login
            });

            if (response.ok && response.data && response.data.token) {
                const token = response.data.token;
                adminToken = token;
                superuserAuthenticated = true;
                
                // Store the token for future requests
                localStorage.setItem('adminToken', token);
                
                return { 
                    ok: true, 
                    message: "Admin login successful.", 
                    data: {
                        tokenStatus: "Received",
                        tokenPreview: token.substring(0, 10) + '...',
                        user: response.data.user || 'Admin user'
                    }
                };
            }
            
            // Handle specific error cases
            let errorMessage = 'Failed to login as admin';
            if (response.status === 401) {
                errorMessage = 'Invalid credentials. Please check the admin email and password.';
            } else if (response.status >= 500) {
                errorMessage = 'Server error during admin login';
            } else if (response.data?.message) {
                errorMessage = response.data.message;
            }
            
            return { 
                ok: false, 
                message: errorMessage,
                data: response.data || {},
                status: response.status
            };
            
        } catch (error) {
            const errorMessage = `Admin login failed: ${error.message || 'Unknown error'}`;
            Logger.error("Admin-login test execution error", { error: errorMessage, stack: error.stack });
            return { 
                ok: false, 
                message: errorMessage,
                error: error.toString()
            };
        }
    }, [], 'health-auth');

    TestRunner.registerTest('user-register', 'User Registration', 
        async () => ApiClient.fetchWithProxy('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email: `testuser${Date.now()}@example.com`, password: 'password123', username: `testuser${Date.now()}` }),
            skipAuth: true 
        }), [], 'health-auth');

    TestRunner.registerTest('admin-get-users', 'Admin: Get All Users', 
        async () => ApiClient.fetchWithProxy('/admin-auth/users'), 
        [ADMIN_LOGIN_ID], 'admin-ops');
    TestRunner.registerTest('admin-get-submissions', 'Admin: Get All Submissions', 
        async () => ApiClient.fetchWithProxy('/admin-auth/submissions'), 
        [ADMIN_LOGIN_ID], 'admin-ops');
    TestRunner.registerTest('admin-get-restaurants', 'Admin: Get Restaurants', 
        async () => ApiClient.fetchWithProxy('/admin-auth/restaurants'), 
        [ADMIN_LOGIN_ID], 'admin-ops');
    TestRunner.registerTest('admin-get-dishes', 'Admin: Get All Dishes', 
        async () => ApiClient.fetchWithProxy('/admin-auth/dishes'), 
        [ADMIN_LOGIN_ID], 'admin-ops');
    TestRunner.registerTest('admin-get-cities', 'Admin: Get All Cities', 
        async () => ApiClient.fetchWithProxy('/admin-auth/cities'), 
        [ADMIN_LOGIN_ID], 'admin-ops');
    TestRunner.registerTest('admin-get-neighborhoods', 'Admin: Get All Neighborhoods', 
        async () => ApiClient.fetchWithProxy('/admin-auth/neighborhoods'), 
        [ADMIN_LOGIN_ID], 'admin-ops');

    TestRunner.registerTest('get-all-dishes', 'Get All Dishes', 
        async () => ApiClient.fetchWithProxy('/api/dishes'), 
        [ADMIN_LOGIN_ID], 'core-public');
    TestRunner.registerTest('get-restaurant-by-id', 'Get Restaurant by ID (e.g., ID 1)', 
        async () => ApiClient.fetchWithProxy('/api/restaurants/1', { skipAuth: true }), 
        [], 'core-public');
    TestRunner.registerTest('get-dish-by-id', 'Get Dish by ID (e.g., ID 1)', 
        async () => ApiClient.fetchWithProxy('/api/dishes/1', { skipAuth: true }), 
        [], 'core-public');
    TestRunner.registerTest('get-all-restaurants-public', 'Get All Restaurants (Public)', 
        async () => ApiClient.fetchWithProxy('/api/restaurants', { skipAuth: true }), 
        [], 'core-public');

    TestRunner.registerTest('search-all-content', 'Search All Content', 
        async () => ApiClient.fetchWithProxy('/admin-auth/search?query=pasta'), 
        [ADMIN_LOGIN_ID], 'search-location');
    TestRunner.registerTest('search-restaurants-query', 'Search Restaurants (Query)', 
        async () => ApiClient.fetchWithProxy('/api/restaurants?search=pizza', { skipAuth: true }), 
        [], 'search-location');
    TestRunner.registerTest('get-neighborhoods', 'Get All Neighborhoods (Admin)', 
        async () => ApiClient.fetchWithProxy('/admin-auth/neighborhoods'), 
        [ADMIN_LOGIN_ID], 'search-location');
    TestRunner.registerTest('get-cities', 'Get All Cities (Admin)', 
        async () => ApiClient.fetchWithProxy('/admin-auth/cities'), 
        [ADMIN_LOGIN_ID], 'search-location');

    TestRunner.registerTest('user-login', 'Standard User Login (Placeholder)', 
        async () => ApiClient.fetchWithProxy('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email: 'user@example.com', password: 'password' }), 
            skipAuth: true 
        }), [], 'user-account');
    TestRunner.registerTest('user-get-profile', 'Get User Profile (Auth Required)', 
        async () => ApiClient.fetchWithProxy('/api/users/profile'), 
        [ADMIN_LOGIN_ID], 'user-account'); 
    TestRunner.registerTest('user-get-my-submissions', 'Get My Submissions (Auth Required)', 
        async () => ApiClient.fetchWithProxy('/api/submissions/my-submissions'), 
        [ADMIN_LOGIN_ID], 'user-account');
    
    TestRunner.registerTest('list-get-all-public', 'Get Public Lists', 
        async () => ApiClient.fetchWithProxy('/api/lists/public', { skipAuth: true }), 
        [], 'list-management');
    TestRunner.registerTest('list-get-user-lists', 'Get User-Specific Lists (Auth Required)', 
        async () => ApiClient.fetchWithProxy('/api/lists'), 
        [ADMIN_LOGIN_ID], 'list-management');
    TestRunner.registerTest('list-create-new', 'Create New List (Auth Required)', 
        async () => ApiClient.fetchWithProxy('/api/lists', {
            method: 'POST',
            body: JSON.stringify({ name: `Test List ${Date.now()}`, description: 'API Test List', is_public: false })
        }), [ADMIN_LOGIN_ID], 'list-management');

    TestRunner.registerTest('engage-like-dish', 'Like Dish (ID 1, Auth Required)', 
        async () => ApiClient.fetchWithProxy('/api/engage/like/dish/1', { method: 'POST' }), 
        [ADMIN_LOGIN_ID], 'engagement');
    TestRunner.registerTest('engage-get-likes-for-dish', 'Get Likes for Dish (ID 1)', 
        async () => ApiClient.fetchWithProxy('/api/engage/likes/dish/1', { skipAuth: true }), 
        [], 'engagement');

    TestRunner.registerTest('submission-create-restaurant', 'Submit New Restaurant (Auth Required)', 
        async () => ApiClient.fetchWithProxy('/api/submissions/restaurant', {
            method: 'POST',
            body: JSON.stringify({ name: `Testaurant ${Date.now()}`, address: "123 Test St", city_id: 1, neighborhood_id: 1, latitude:0, longitude:0 })
        }), [ADMIN_LOGIN_ID], 'content-submission');
    TestRunner.registerTest('submission-create-dish', 'Submit New Dish (Auth Required)', 
        async () => ApiClient.fetchWithProxy('/api/submissions/dish', {
            method: 'POST',
            body: JSON.stringify({ name: `Test Dish ${Date.now()}`, description: "A delicious test dish", restaurant_id: 1 })
        }), [ADMIN_LOGIN_ID], 'content-submission');

    TestRunner.registerTest('get-trending-dishes', 'Get Trending Dishes', 
        async () => ApiClient.fetchWithProxy('/api/trending/dishes', { skipAuth: true }), 
        [], 'trending-analytics');
    TestRunner.registerTest('get-trending-restaurants', 'Get Trending Restaurants', 
        async () => ApiClient.fetchWithProxy('/api/trending/restaurants', { skipAuth: true }), 
        [], 'trending-analytics');

    Logger.info(`${TestRunner.testOrder.length} tests registered.`);
}

Logger.info('App bundle loaded successfully');