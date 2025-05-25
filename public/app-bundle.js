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
    const prefix = `[client-${timestamp}] [${level}]`;
    if (level === 'ERROR') {
      console.error(`${prefix} ${message}`, data);
    } else {
      console.log(`${prefix} ${message}`, data);
    }
  }
  static info(message, data = {}) { this.log('INFO', message, data); }
  static error(message, error) { this.log('ERROR', message, error); }
}

document.addEventListener('DOMContentLoaded', () => {
  Logger.info('Application initialized');
  applyAdditionalStyling();
  setupTabNavigation();
  setupEventHandlers();
  registerAllApiTests();
  initializeTestRunner();
  
  // Check for stored admin token
  const storedToken = localStorage.getItem('adminToken');
  if (storedToken) {
    adminToken = storedToken;
    superuserAuthenticated = true;
    updateSuperuserStatus('Authenticated', true);
    document.getElementById('run-all-tests').disabled = false;
    Logger.info('Retrieved admin token from storage');
  }
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
    await loginAsSuperuserViaButton(); 
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
  updateSuperuserStatus('Authenticating...', null);
  document.getElementById('auth-error')?.remove();
  try {
    const response = await fetch(`${CONFIG.PROXY_URL}/admin-auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@example.com', password: 'doof123' })
    });
    const data = await response.json();
    if (!response.ok || !data.token) {
      throw new Error(data.message || data.error || 'Authentication via button failed');
    }
    adminToken = data.token; 
    superuserAuthenticated = true; 
    updateSuperuserStatus('Authenticated', true);
    document.getElementById('run-all-tests').disabled = false;
    const truncatedToken = adminToken ? adminToken.substring(0, 10) + '...' + adminToken.substring(adminToken.length - 10) : "N/A";
    TestRunner.logMessage(`Superuser authenticated successfully via UI button. Token: ${truncatedToken}`);
    
    // Store the token in localStorage for persistence
    localStorage.setItem('adminToken', adminToken);
  } catch (error) {
    adminToken = null;
    superuserAuthenticated = false;
    updateSuperuserStatus('Authentication Failed', false);
    showAuthError(`Superuser authentication (button) failed: ${error.message}`);
    TestRunner.logMessage(`Superuser authentication (button) failed: ${error.message}`, true);
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
}

const ApiClient = {
  async fetchWithProxy(endpoint, options = {}) {
    const url = `${CONFIG.PROXY_URL}${endpoint}`; 
    const requestId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    
    Logger.info(`API Request [${requestId}]: ${options.method || 'GET'} ${endpoint}`);
    
    // Set up headers
    const headers = { 
      'Content-Type': 'application/json', 
      'x-request-id': requestId,
      ...options.headers 
    };
    
    // Add auth token if available and not explicitly skipped
    if (adminToken && !options.skipAuth) {
      headers['Authorization'] = `Bearer ${adminToken}`;
      Logger.info(`[${requestId}] Added auth token to request`);
    }

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT);

    try {
      const fetchOptions = {
        ...options,
        headers,
        signal: controller.signal
      };

      // Remove body for GET/HEAD requests
      if ((!options.method || options.method === 'GET' || options.method === 'HEAD') && 'body' in fetchOptions) {
        delete fetchOptions.body;
      }

      const response = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);
      
      // Process response
      let data;
      const contentType = response.headers.get("content-type") || '';
      
      try {
        if (contentType.includes("application/json")) {
          data = await response.json();
        } else {
          data = await response.text();
        }
      } catch (parseError) {
        Logger.error(`[${requestId}] Failed to parse response`, parseError);
        data = await response.text();
      }
      
      // Format response
      const result = {
        status: response.status,
        data,
        ok: response.ok,
        message: response.ok ? 'Success' : `Request failed with status ${response.status}`
      };
      
      if (!response.ok) {
        Logger.warn(`[${requestId}] API Error Response`, {
          status: response.status,
          statusText: response.statusText,
          endpoint,
          error: data?.error || data?.message || 'Unknown error'
        });
      } else {
        Logger.info(`[${requestId}] API Success Response`, {
          status: response.status,
          endpoint,
          dataPreview: typeof data === 'string' ? data.substring(0, 100) : '[Object]'
        });
      }
      
      return result;
      
    } catch (error) {
      clearTimeout(timeoutId);
      const errorMessage = error.name === 'AbortError' 
        ? `Request timed out after ${CONFIG.TIMEOUT}ms` 
        : `Network or client-side error: ${error.message}`;
        
      Logger.error(`[${requestId}] API Request Failed`, {
        error: errorMessage,
        endpoint,
        method: options.method || 'GET'
      });
      
      return { 
        status: error.name === 'AbortError' ? 504 : 500, 
        data: { error: errorMessage },
        ok: false, 
        message: errorMessage 
      };
    }
  }
};

const TestRunner = {
  tests: {},
  testOrder: [],
  
  registerTest(id, name, testFn, dependencies = [], category = 'general-api') {
    this.tests[id] = { id, name, testFn, dependencies, category, status: 'pending', result: null };
    if (!this.testOrder.includes(id)) this.testOrder.push(id);
    this.addTestToUI(id, name, category, dependencies);
  },
  
  addTestToUI(id, name, category, dependencies) {
    let container = document.querySelector(`.category-tests[data-category="${category}"]`);
    if (!container) {
        Logger.warn(`Category container for "${category}" not found for test "${name}".`);
        return;
    }
    const testItem = document.createElement('div');
    testItem.className = 'test-item';
    testItem.id = `test-${id}`;
    testItem.innerHTML = `
      <div class="test-item-header">
        <span class="test-name">${name}</span>
        <span class="test-status pending">Pending</span>
      </div>
      <div class="test-details" style="display: none;">
        <div class="detail-item"><span class="detail-label">Test ID:</span><span class="detail-value">${id}</span></div>
        <div class="detail-item"><span class="detail-label">Status:</span><span class="detail-value status-value">Not run</span></div>
        <div class="detail-item"><span class="detail-label">Deps:</span><span class="detail-value">${dependencies.join(', ') || 'None'}</span></div>
        <div class="detail-item result-message" style="display: none;"><span class="detail-label">Result:</span><span class="detail-value result-value"></span></div>
      </div>`;
    testItem.querySelector('.test-item-header').addEventListener('click', () => {
      const details = testItem.querySelector('.test-details');
      details.style.display = details.style.display === 'none' ? 'block' : 'none';
      testItem.classList.toggle('expanded');
    });
    container.appendChild(testItem);
  },

  expandAllTestDetails() { document.querySelectorAll('.test-item .test-details').forEach(d => { d.style.display = 'block'; d.closest('.test-item').classList.add('expanded');}); },
  collapseAllTestDetails() { document.querySelectorAll('.test-item .test-details').forEach(d => { d.style.display = 'none'; d.closest('.test-item').classList.remove('expanded');}); },
  
  async runTest(id) {
    const test = this.tests[id];
    if (!test) {
        Logger.error(`Test with ID ${id} not found.`);
        return {ok: false, message: `Test ${id} not found.`};
    }
    this.updateTestStatusUI(id, 'running');
    this.logMessage(`Running: ${test.name}`);
    try {
      const result = await test.testFn();
      test.status = result.ok ? 'passed' : 'failed';
      test.result = result; 
      this.updateTestStatusUI(id, test.status, result);
      this.logMessage(`Test ${test.name} ${test.status}${result.message ? ': ' + result.message : ''}`, !result.ok);
      return result; 
    } catch (error) {
      test.status = 'failed';
      test.result = { ok: false, message: `Execution Error: ${error.message}`, data: { error: error.toString(), stack: error.stack } };
      this.updateTestStatusUI(id, 'failed', test.result);
      this.logMessage(`Test ${test.name} failed with exception: ${error.message}`, true);
      return test.result; 
    }
  },

  updateTestStatusUI(id, status, result = null) {
    const testItem = document.getElementById(`test-${id}`);
    if (!testItem) return;
    const statusElement = testItem.querySelector('.test-status');
    const statusValueElement = testItem.querySelector('.status-value');
    const resultMessageContainer = testItem.querySelector('.result-message');
    const resultValueElement = testItem.querySelector('.result-value');

    testItem.className = `test-item ${status}`; 
    if (statusElement) {
        statusElement.className = `test-status ${status}`;
        statusElement.textContent = { passed: '✅ Passed', failed: '❌ Failed', running: '⏳ Running', skipped: '⏭️ Skipped', pending: 'Pending' }[status];
    }
    if (statusValueElement) statusValueElement.textContent = status.charAt(0).toUpperCase() + status.slice(1);

    if (result && resultMessageContainer && resultValueElement) {
        resultMessageContainer.style.display = 'flex';
        resultValueElement.textContent = result.message || (result.ok ? 'Test passed.' : 'Test failed.');
        
        const existingDetails = testItem.querySelector('.result-details-data');
        if(existingDetails) existingDetails.remove();

        if (result.data) {
            const detailsContainer = document.createElement('div');
            detailsContainer.className = 'result-details-data'; 
            try {
                detailsContainer.innerHTML = '<strong>Details:</strong><pre>' + JSON.stringify(result.data, null, 2) + '</pre>';
            } catch (e) {
                detailsContainer.innerHTML = '<strong>Details:</strong><pre>' + String(result.data) + '</pre>';
            }
            resultMessageContainer.appendChild(detailsContainer);
        }
    } else if (resultMessageContainer) {
        resultMessageContainer.style.display = 'none';
    }
     if (status === 'passed' || status === 'failed' || status === 'skipped') {
        if (!testItem.classList.contains('expanded') && result ) { 
             const details = testItem.querySelector('.test-details');
             if(details) details.style.display = 'block';
             testItem.classList.add('expanded');
        }
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

  async runAllTests() {
    this.logMessage('Running all tests...');
    let passedCount = 0;
    let failedCount = 0;
    let skippedCount = 0;

    for (const id of this.testOrder) {
      const test = this.tests[id];
      
      let canRun = true;
      if (test.dependencies && test.dependencies.length > 0) {
        canRun = test.dependencies.every(depId => {
            const dependentTest = this.tests[depId];
            return dependentTest && dependentTest.status === 'passed';
        });
      }
      
      if (canRun) {
        await this.runTest(id); 
        if (test.status === 'passed') passedCount++;
        else if (test.status === 'failed') failedCount++;
        
        if (id === 'admin-login' && test.status !== 'passed') {
            this.logMessage('CRITICAL: Admin login test failed. Subsequent dependent tests will be skipped.', true);
        }
      } else {
        test.status = 'skipped';
        test.result = {ok: false, skipped: true, message: "Skipped: Dependencies not met."};
        this.updateTestStatusUI(id, 'skipped', test.result);
        skippedCount++;
      }
    }
    this.logMessage(`All tests completed. Passed: ${passedCount}, Failed: ${failedCount}, Skipped: ${skippedCount}, Total: ${this.testOrder.length}`);
    this.updateSummary(passedCount, failedCount, skippedCount, this.testOrder.length);
  },

  updateSummary(passed, failed, skipped, total) {
    const summaryContent = document.getElementById('summary-content');
    if (summaryContent) {
        summaryContent.innerHTML = `
            <span class="summary-item passed">✅ Passed: ${passed}</span>
            <span class="summary-item failed">❌ Failed: ${failed}</span>
            <span class="summary-item skipped">⏭️ Skipped: ${skipped}</span>
            <span class="summary-item total">Total: ${total}</span>`;
    }
  },

  copyResultsToClipboard() {
    let report = "Chomp API Test Report:\n\n";
    report += `Date: ${new Date().toLocaleString()}\n`;
    report += `Superuser Authenticated (via UI button): ${superuserAuthenticated}\n`; 
    const backendStatus = document.getElementById('frontend-status')?.textContent || "Unknown";
    const proxyStatus = document.getElementById('backend-status')?.textContent || "Unknown";
    report += `Backend Server Status: ${backendStatus}\n`;
    report += `Proxy Server Status: ${proxyStatus}\n\n`;
    report += "Individual Test Results:\n";
    this.testOrder.forEach(id => {
        const test = this.tests[id]; 
        report += "---------------------------------\n";
        report += `Test: ${test.name} (ID: ${test.id})\n`;
        report += `Category: ${test.category}\n`;
        report += `Status: ${test.status ? test.status.toUpperCase() : 'PENDING'}\n`;
        if (test.result) {
            report += `Message: ${test.result.message || 'No message'}\n`;
            if (test.result.data) {
                try {
                    const dataStr = JSON.stringify(test.result.data, null, 2);
                    report += `Data: ${dataStr.length > 500 ? dataStr.substring(0, 500) + "... (truncated)" : dataStr}\n`;
                } catch { report += `Data: (Could not stringify data)\n`; }
            }
        } else { report += `Message: No result recorded.\n`; }
    });
    report += "---------------------------------\n\nTest Log Summary (first 2000 chars):\n";
    const logEntries = document.getElementById('test-log')?.innerText || "Log not available.";
    report += logEntries.substring(0, 2000) + (logEntries.length > 2000 ? "... (log truncated)" : "");

    navigator.clipboard.writeText(report).then(() => {
        this.logMessage("Test results copied to clipboard!");
    }).catch(err => {
        this.logMessage("Failed to copy results: " + err, true);
    });
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
            const response = await ApiClient.fetchWithProxy('/admin-auth/token', {
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
        async () => ApiClient.fetchWithProxy('/api/search?query=Pizza', { skipAuth: true }), 
        [], 'search-location');
    TestRunner.registerTest('get-neighborhoods', 'Get All Neighborhoods', 
        async () => ApiClient.fetchWithProxy('/api/neighborhoods', { skipAuth: true }), 
        [], 'search-location');
    TestRunner.registerTest('get-cities', 'Get All Cities', 
        async () => ApiClient.fetchWithProxy('/api/cities', { skipAuth: true }), 
        [], 'search-location');

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