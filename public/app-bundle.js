// app-bundle.js - Non-module version of the app for direct loading

// Configuration
const CONFIG = {
  BACKEND_URL: 'http://localhost:5001',
  TIMEOUT: 5000
};

// Logger for client-side logging
class Logger {
  static log(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const prefix = `[client-${timestamp}] [${level}]`;
    if (level === 'ERROR') {
      console.error(`${prefix} ${message}`, data);
    } else {
      console.log(`${prefix} ${message}`, data);
    }
  }

  static info(message, data = {}) {
    this.log('INFO', message, data);
  }

  static error(message, error) {
    this.log('ERROR', message, error);
  }
}

// Wait for DOM content to be loaded
document.addEventListener('DOMContentLoaded', () => {
  Logger.info('Application initialized');
  
  // Apply additional styling
  applyAdditionalStyling();
  
  // Set up tab navigation
  setupTabNavigation();
  
  // Set up event handlers
  setupEventHandlers();
  
  // Register tests
  registerTests();
  
  // Initialize the test runner
  initializeTestRunner();
});

// Apply additional styling to elements
function applyAdditionalStyling() {
  // Style the test list
  const testList = document.getElementById('test-list');
  if (testList) {
    testList.style.display = 'flex';
    testList.style.flexDirection = 'column';
    testList.style.gap = '8px';
    testList.style.marginBottom = '20px';
    testList.style.padding = '15px';
    testList.style.backgroundColor = '#f8f9fa';
    testList.style.borderRadius = '8px';
    testList.style.border = '1px solid #dee2e6';
  }
}

// Set up tab navigation
function setupTabNavigation() {
  const tabs = document.querySelectorAll('.tab');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Remove active class from all tabs
      tabs.forEach(t => t.classList.remove('active'));
      
      // Add active class to clicked tab
      tab.classList.add('active');
      
      // Hide all tab contents
      tabContents.forEach(content => {
        content.style.display = 'none';
      });
      
      // Show the selected tab content
      const tabId = tab.dataset.tab;
      const tabContent = document.getElementById(tabId);
      if (tabContent) {
        tabContent.style.display = 'block';
      }
    });
  });
}

// Global state for superuser authentication
let superuserAuthenticated = false;
let adminToken = null;

// Set up event handlers
function setupEventHandlers() {
  // Connect and reset button
  const connectResetButton = document.getElementById('connect-reset');
  if (connectResetButton) {
    connectResetButton.addEventListener('click', () => {
      Logger.info('Connect and reset button clicked');
      TestRunner.connectAndReset();
    });
  }
  
  // Superuser login button
  const superuserLoginButton = document.getElementById('superuser-login');
  if (superuserLoginButton) {
    superuserLoginButton.addEventListener('click', async () => {
      Logger.info('Superuser login button clicked');
      await loginAsSuperuser();
    });
  }
  
  // Run all tests button - disabled until superuser authenticated
  const runAllTestsButton = document.getElementById('run-all-tests');
  if (runAllTestsButton) {
    runAllTestsButton.addEventListener('click', () => {
      if (superuserAuthenticated) {
        Logger.info('Run all tests button clicked');
        TestRunner.runAllTests();
      } else {
        Logger.error('Cannot run tests without superuser authentication');
        updateSuperuserStatus('Not Authenticated', false);
        showAuthError('You must authenticate as a superuser before running tests');
      }
    });
  }
  
  // Clear log button
  const clearLogButton = document.getElementById('clear-log');
  if (clearLogButton) {
    clearLogButton.addEventListener('click', () => {
      Logger.info('Clear log button clicked');
      clearLog();
      // Also clear any auth errors
      const authErrorElement = document.getElementById('auth-error');
      if (authErrorElement) {
        authErrorElement.remove();
      }
    });
  }
}

// Login as superuser
async function loginAsSuperuser() {
  // Update UI to show authenticating status
  updateSuperuserStatus('Authenticating...', null);
  
  try {
    // Clear any previous auth errors
    const authErrorElement = document.getElementById('auth-error');
    if (authErrorElement) {
      authErrorElement.remove();
    }
    
    // Get admin token
    adminToken = await getAdminToken();
    
    // Update global state and UI
    superuserAuthenticated = true;
    updateSuperuserStatus('Authenticated', true);
    
    // Enable run all tests button
    const runAllTestsButton = document.getElementById('run-all-tests');
    if (runAllTestsButton) {
      runAllTestsButton.disabled = false;
    }
    
    // Log success with token (truncated for security)
    const truncatedToken = adminToken.substring(0, 10) + '...' + adminToken.substring(adminToken.length - 10);
    Logger.info(`Superuser authenticated successfully. Token: ${truncatedToken}`);
    TestRunner.logMessage('Superuser authenticated successfully. You can now run tests.');
    
    return true;
  } catch (error) {
    // Update UI to show authentication failed
    superuserAuthenticated = false;
    updateSuperuserStatus('Authentication Failed', false);
    
    // Show detailed error
    showAuthError(`Superuser authentication failed: ${error.message}`);
    
    // Log detailed error for debugging
    Logger.error('Superuser authentication error', error);
    TestRunner.logMessage(`Superuser authentication failed: ${error.message}`, true);
    
    return false;
  }
}

// Update superuser status in UI
function updateSuperuserStatus(status, isAuthenticated) {
  const statusElement = document.getElementById('superuser-status-value');
  if (!statusElement) return;
  
  // Update text
  statusElement.textContent = status;
  
  // Update classes
  statusElement.classList.remove('status-authenticated', 'status-not-authenticated', 'status-authenticating');
  
  if (isAuthenticated === true) {
    statusElement.classList.add('status-authenticated');
  } else if (isAuthenticated === false) {
    statusElement.classList.add('status-not-authenticated');
  } else {
    statusElement.classList.add('status-authenticating');
  }
}

// Show authentication error
function showAuthError(message) {
  // Remove any existing error
  const existingError = document.getElementById('auth-error');
  if (existingError) {
    existingError.remove();
  }
  
  // Create error element
  const errorElement = document.createElement('div');
  errorElement.id = 'auth-error';
  errorElement.className = 'auth-error';
  errorElement.innerHTML = `<strong>Error:</strong> ${message}`;
  
  // Add to page
  const superuserStatus = document.getElementById('superuser-status');
  if (superuserStatus) {
    superuserStatus.after(errorElement);
  }
}

// Initialize the test runner
function initializeTestRunner() {
  // Check server status
  fetch('/health')
    .then(response => response.json())
    .then(data => {
      updateServerStatus(data.backendStatus, data.proxyStatus);
      Logger.info('Initial health check completed', data);
    })
    .catch(error => {
      Logger.error('Initial health check failed', error);
      updateServerStatus('DOWN', 'DOWN');
    });
}

// Update server status
function updateServerStatus(backendStatus, proxyStatus) {
  const backendStatusElement = document.getElementById('frontend-status');
  const proxyStatusElement = document.getElementById('backend-status');
  
  if (backendStatusElement) {
    backendStatusElement.textContent = backendStatus;
    backendStatusElement.className = backendStatus === 'UP' ? 'status-up' : 'status-down';
  }
  
  if (proxyStatusElement) {
    proxyStatusElement.textContent = proxyStatus;
    proxyStatusElement.className = proxyStatus === 'UP' ? 'status-up' : 'status-down';
  }
}

// API Client
const ApiClient = {
  async fetch(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `/api-proxy${endpoint}`;
    Logger.info(`API Request: ${url}`);
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });
      
      const data = await response.json();
      Logger.info(`API Response: ${url}`, { status: response.status, data });
      
      return {
        status: response.status,
        data,
        ok: response.ok
      };
    } catch (error) {
      Logger.error(`API Error: ${url}`, error);
      return {
        status: 500,
        data: { error: error.message },
        ok: false
      };
    }
  }
};

// Test Runner
const TestRunner = {
  tests: {},
  testOrder: [], // Keep track of test order for display
  
  registerTest(id, name, testFn, dependencies = [], category = null) {
    this.tests[id] = {
      id,
      name,
      testFn,
      dependencies, // Tests that must pass before this one can run
      category,
      status: 'pending',
      result: null
    };
    
    // Add to test order
    this.testOrder.push(id);
    
    // Add test to UI
    this.addTestToUI(id, name, category);
  },
  
  addTestToUI(id, name, category) {
    // Determine where to add the test based on category
    let container;
    
    if (category) {
      // Find the category container
      container = document.querySelector(`.category-tests[data-category="${category}"]`);
    } else {
      // Use the default test list for tests without a category
      container = document.getElementById('test-list');
    }
    
    if (!container) return;
    
    const testItem = document.createElement('div');
    testItem.className = 'test-item';
    testItem.id = `test-${id}`;
    
    // Create a more detailed test item with description
    testItem.innerHTML = `
      <div class="test-item-header">
        <span class="test-name">${name}</span>
        <span class="test-status pending">Pending</span>
      </div>
      <div class="test-details">
        <div class="detail-item">
          <span class="detail-label">Test ID:</span>
          <span class="detail-value">${id}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Status:</span>
          <span class="detail-value status-value">Not run yet</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Dependencies:</span>
          <span class="detail-value">${dependencies.length ? dependencies.join(', ') : 'None'}</span>
        </div>
        <div class="detail-item result-message" style="display: none;">
          <span class="detail-label">Result:</span>
          <span class="detail-value result-value"></span>
        </div>
      </div>
    `;
    
    // No click event handler - tests are read-only
    
    container.appendChild(testItem);
  },
  
  async runTest(id) {
    const test = this.tests[id];
    if (!test) return;
    
    // Update UI
    this.updateTestStatus(id, 'running');
    this.logMessage(`Running test: ${test.name}`);
    
    try {
      // Run the test
      const result = await test.testFn();
      
      // Update test status
      test.status = result.ok ? 'passed' : 'failed';
      test.result = result;
      
      // Update UI with the result
      this.updateTestStatus(id, test.status, result);
      this.logMessage(`Test ${test.name} ${test.status}: ${result.message || ''}`);
      
      return result;
    } catch (error) {
      // Update test status on error
      test.status = 'failed';
      test.result = { 
        ok: false, 
        error: error.message,
        message: `Error: ${error.message}`
      };
      
      // Update UI with the error result
      this.updateTestStatus(id, 'failed', test.result);
      this.logMessage(`Test ${test.name} failed with error: ${error.message}`);
      
      return test.result;
    }
  },
  
  updateTestStatus(id, status, result = null) {
    const testItem = document.getElementById(`test-${id}`);
    if (!testItem) return;
    
    const statusElement = testItem.querySelector('.test-status');
    if (!statusElement) return;
    
    // Remove all status classes from the test item
    testItem.classList.remove('pending', 'running', 'passed', 'failed', 'skipped');
    testItem.classList.add(status);
    
    // Remove all status classes from the status element
    statusElement.classList.remove('pending', 'running', 'passed', 'failed', 'skipped');
    
    // Add the new status class
    statusElement.classList.add(status);
    
    // Update the text with appropriate symbols
    let statusText = '';
    switch(status) {
      case 'passed':
        statusText = '✅ Passed';
        break;
      case 'failed':
        statusText = '❌ Failed';
        break;
      case 'running':
        statusText = '⏳ Running';
        break;
      case 'skipped':
        statusText = '⏭️ Skipped';
        break;
      default:
        statusText = 'Pending';
    }
    
    statusElement.textContent = statusText;
    
    // Update the detailed status and result information
    const statusValueElement = testItem.querySelector('.status-value');
    if (statusValueElement) {
      statusValueElement.textContent = status.charAt(0).toUpperCase() + status.slice(1);
    }
    
    // Update the result message if we have a result
    if (result) {
      const resultMessageElement = testItem.querySelector('.result-message');
      const resultValueElement = testItem.querySelector('.result-value');
      
      if (resultMessageElement && resultValueElement) {
        resultMessageElement.style.display = 'flex';
        resultValueElement.textContent = result.message || 'No message provided';
        
        // Add detailed data if available
        if (result.data) {
          const detailsContainer = document.createElement('div');
          detailsContainer.className = 'result-details';
          
          // Format the data as a readable string
          let detailsHtml = '<div class="result-data"><strong>Details:</strong><pre>';
          
          try {
            // Try to format the data as JSON
            detailsHtml += JSON.stringify(result.data, null, 2);
          } catch (e) {
            // Fallback to string representation
            detailsHtml += String(result.data);
          }
          
          detailsHtml += '</pre></div>';
          detailsContainer.innerHTML = detailsHtml;
          
          // Remove any existing details
          const existingDetails = testItem.querySelector('.result-details');
          if (existingDetails) {
            existingDetails.remove();
          }
          
          // Add the new details
          resultMessageElement.appendChild(detailsContainer);
        }
      }
    }
    
    // Expand the test item to show details
    testItem.classList.add('expanded');
    
    // Make sure the test item is visible
    testItem.style.display = 'flex';
    testItem.style.justifyContent = 'space-between';
    testItem.style.padding = '8px';
    testItem.style.margin = '4px 0';
    testItem.style.borderRadius = '4px';
    testItem.style.backgroundColor = '#f5f5f5';
  },
  
  logMessage(message, isError = false) {
    const testLog = document.getElementById('test-log');
    if (!testLog) return;
    
    const logEntry = document.createElement('p');
    logEntry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    
    if (isError) {
      logEntry.style.color = '#dc3545';
      logEntry.style.fontWeight = 'bold';
    }
    
    testLog.appendChild(logEntry);
    testLog.scrollTop = testLog.scrollHeight;
    
    // If this is a critical error about admin authentication, also show a warning banner
    if (message.includes('CRITICAL ERROR: Admin authentication failed')) {
      this.showCriticalWarning('Superuser authentication failed! Subsequent tests cannot run without proper admin access.');
    }
  },
  
  showCriticalWarning(message) {
    // Check if there's already a warning
    let warningElement = document.getElementById('critical-warning');
    
    if (!warningElement) {
      // Create a new warning element
      warningElement = document.createElement('div');
      warningElement.id = 'critical-warning';
      warningElement.className = 'critical-warning';
      
      // Insert it at the top of the test content
      const testContent = document.getElementById('tests-content');
      if (testContent && testContent.firstChild) {
        testContent.insertBefore(warningElement, testContent.firstChild);
      }
    }
    
    // Set the warning message
    warningElement.innerHTML = `⚠️ ${message}`;
  },
  
  async runAllTests() {
    this.logMessage('Running all tests...');
    
    const results = [];
    let adminAuthPassed = true;
    
    // Run tests in the order they were registered
    for (const id of this.testOrder) {
      const test = this.tests[id];
      
      // Check if this test depends on admin authentication
      if (id === 'admin-login') {
        const result = await this.runTest(id);
        results.push(result);
        
        // If admin login fails, mark flag and log critical error
        if (!result.ok) {
          adminAuthPassed = false;
          this.logMessage('⚠️ CRITICAL ERROR: Admin authentication failed! Superuser access is required for subsequent tests.', true);
          this.logMessage('⚠️ Stopping test execution. Please ensure you have superuser credentials.', true);
          break; // Stop running tests
        }
      } 
      // For other tests that depend on admin auth, check if we should run them
      else if (test.dependencies.includes('admin-login') && !adminAuthPassed) {
        // Skip this test but mark it as failed due to dependency failure
        this.updateTestStatus(id, 'skipped');
        this.logMessage(`Test ${test.name} skipped: Depends on admin authentication which failed`);
        results.push({
          ok: false,
          skipped: true,
          message: 'Skipped due to admin authentication failure'
        });
      } 
      // Otherwise run the test normally
      else {
        const result = await this.runTest(id);
        results.push(result);
      }
    }
    
    const passed = results.filter(r => r.ok).length;
    const total = this.testOrder.length;
    const skipped = results.filter(r => r.skipped).length;
    
    this.logMessage(`Tests completed: ${passed}/${total} passed, ${skipped} skipped`);
    
    return results;
  },
  
  connectAndReset() {
    this.logMessage('Connecting to backend and resetting test state...');
    
    // Check health
    fetch('/health')
      .then(response => response.json())
      .then(data => {
        // Update UI with server status
        const backendStatusElement = document.getElementById('backend-status');
        const proxyStatusElement = document.getElementById('frontend-status');
        
        if (backendStatusElement) {
          backendStatusElement.textContent = data.backendStatus;
          backendStatusElement.className = data.backendStatus === 'UP' ? 'status-up' : 'status-down';
        }
        
        if (proxyStatusElement) {
          proxyStatusElement.textContent = data.proxyStatus;
          proxyStatusElement.className = data.proxyStatus === 'UP' ? 'status-up' : 'status-down';
        }
        
        this.logMessage(`Health check completed: Backend ${data.backendStatus}, Proxy ${data.proxyStatus}`);
      })
      .catch(error => {
        Logger.error('Health check failed', error);
        
        // Update UI with DOWN status
        const backendStatusElement = document.getElementById('backend-status');
        const proxyStatusElement = document.getElementById('frontend-status');
        
        if (backendStatusElement) {
          backendStatusElement.textContent = 'DOWN';
          backendStatusElement.className = 'status-down';
        }
        
        if (proxyStatusElement) {
          proxyStatusElement.textContent = 'DOWN';
          proxyStatusElement.className = 'status-down';
        }
        
        this.logMessage('Health check failed: ' + error.message);
      });
  }
};

// Admin token helper
async function getAdminToken() {
  // If we already have a token, return it
  if (adminToken) {
    Logger.info('Using cached admin token');
    return adminToken;
  }
  
  try {
    Logger.info('Getting admin token with credentials (admin@example.com)');
    TestRunner.logMessage('Authenticating with admin@example.com...');
    
    // Direct API call to the admin token endpoint
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    // Create the request payload
    const payload = {
      email: 'admin@example.com',
      password: 'doof123'
    };
    
    Logger.info('Sending admin token request', { endpoint: '/admin-auth/token', payload });
    
    const response = await fetch('/admin-auth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    }).finally(() => clearTimeout(timeoutId));
    
    Logger.info('Admin token response received', { status: response.status });
    
    // Handle non-JSON responses
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
      Logger.info('Admin token response parsed', { success: data.success });
    } else {
      const text = await response.text();
      Logger.error('Non-JSON response from admin token endpoint', { text, status: response.status });
      throw new Error('Invalid response format from server');
    }
    
    if (!response.ok || !data.token) {
      const errorMessage = data.error || response.statusText || 'Unknown error';
      TestRunner.logMessage(`Authentication failed: ${errorMessage}`, true);
      throw new Error('Failed to get admin token: ' + errorMessage);
    }
    
    // Store the token in the global variable
    adminToken = data.token;
    
    Logger.info('Admin token retrieved successfully');
    TestRunner.logMessage('Admin authentication successful');
    return adminToken;
  } catch (error) {
    if (error.name === 'AbortError') {
      const timeoutError = 'Admin token request timed out after 10 seconds';
      TestRunner.logMessage(timeoutError, true);
      throw new Error(timeoutError);
    }
    Logger.error('Admin token error', error);
    TestRunner.logMessage(`Authentication error: ${error.message}`, true);
    throw error;
  }
}

// Register tests
function registerTests() {
  // Health check test
  TestRunner.registerTest('health-check', 'Health Check', async () => {
    try {
      const response = await fetch('/health');
      const data = await response.json();
      
      return {
        ok: data.backendStatus === 'UP' && data.proxyStatus === 'UP',
        message: `Backend status: ${data.backendStatus}, Proxy status: ${data.proxyStatus}`,
        data: data
      };
    } catch (error) {
      return {
        ok: false,
        message: `Health check failed: ${error.message}`,
        error: error.message
      };
    }
  }, []);
  
  // Admin login test - critical for superuser access
  TestRunner.registerTest('admin-login', 'Admin Login (Superuser)', async () => {
    try {
      const token = await getAdminToken();
      return {
        ok: !!token,
        message: 'Admin login successful with superuser access',
        data: { token }
      };
    } catch (error) {
      return {
        ok: false,
        message: 'Admin login failed: ' + error.message + ' - Superuser access is required',
        error: error.message
      };
    }
  }, []);
  
  // Admin submissions test - depends on admin login
  TestRunner.registerTest('admin-submissions', 'Admin Submissions', async () => {
    try {
      const adminToken = await getAdminToken();
      
      // Make the real API call with the admin token using the dedicated endpoint
      const response = await fetch('/admin-auth/submissions', {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      return {
        ok: response.ok,
        message: `Retrieved ${data.submissions?.length || 0} submissions`,
        data: data
      };
    } catch (error) {
      return {
        ok: false,
        message: 'Admin submissions test failed: ' + error.message,
        error: error.message
      };
    }
  }, ['admin-login']);
  
  // Admin users test - depends on admin login
  TestRunner.registerTest('admin-users', 'Admin Users', async () => {
    try {
      const adminToken = await getAdminToken();
      
      // Make the real API call with the admin token using the dedicated endpoint
      const response = await fetch('/admin-auth/users', {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      return {
        ok: response.ok,
        message: `Retrieved ${data.users?.length || 0} users`,
        data: data
      };
    } catch (error) {
      return {
        ok: false,
        message: 'Admin users test failed: ' + error.message,
        error: error.message
      };
    }
  }, ['admin-login']);
  
  // Core Service Layer Tests
  // Restaurant service test
  TestRunner.registerTest('service-core-restaurant', 'Restaurant Service', async () => {
    try {
      const adminToken = await getAdminToken();
      const response = await fetch('/admin-auth/e2e/restaurants', {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      return {
        ok: response.ok,
        message: `Restaurant service test: ${response.ok ? 'Passed' : 'Failed'}`,
        data: data
      };
    } catch (error) {
      return {
        ok: false,
        message: 'Restaurant service test failed: ' + error.message,
        error: error.message
      };
    }
  }, ['admin-login'], 'service-core');
  
  // Dish service test
  TestRunner.registerTest('service-core-dish', 'Dish Service', async () => {
    try {
      const adminToken = await getAdminToken();
      const response = await fetch('/admin-auth/e2e/dishes', {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      return {
        ok: response.ok,
        message: `Dish service test: ${response.ok ? 'Passed' : 'Failed'}`,
        data: data
      };
    } catch (error) {
      return {
        ok: false,
        message: 'Dish service test failed: ' + error.message,
        error: error.message
      };
    }
  }, ['admin-login'], 'service-core');
  
  // Additional Service Tests
  // Auth service test
  TestRunner.registerTest('service-additional-auth', 'Auth Service', async () => {
    try {
      const adminToken = await getAdminToken();
      const response = await fetch('/admin-auth/auth/status', {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      return {
        ok: response.ok,
        message: `Auth service test: ${response.ok ? 'Passed' : 'Failed'}`,
        data: data
      };
    } catch (error) {
      return {
        ok: false,
        message: 'Auth service test failed: ' + error.message,
        error: error.message
      };
    }
  }, ['admin-login'], 'service-additional');
  
  // Search service test
  TestRunner.registerTest('service-additional-search', 'Search Service', async () => {
    try {
      const adminToken = await getAdminToken();
      const response = await fetch('/admin-auth/e2e/search?q=test', {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      return {
        ok: response.ok,
        message: `Search service test: ${response.ok ? 'Passed' : 'Failed'}`,
        data: data
      };
    } catch (error) {
      return {
        ok: false,
        message: 'Search service test failed: ' + error.message,
        error: error.message
      };
    }
  }, ['admin-login'], 'service-additional');
}

// Run all tests
function runAllTests() {
  TestRunner.runAllTests();
}

// Clear log
function clearLog() {
  const testLog = document.getElementById('test-log');
  if (testLog) {
    testLog.innerHTML = '';
  }
}

// Log initial load
Logger.info('App bundle loaded successfully');
