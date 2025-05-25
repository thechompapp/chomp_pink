// ui-manager.js - Manages UI interactions and updates

// UI Manager for handling UI updates
export class UIManager {
  static updateServerStatus(backendStatus, frontendStatus = 'UP') {
    // Get the status elements
    const backendStatusElement = document.getElementById('frontend-status'); // This is actually the backend status
    const proxyStatusElement = document.getElementById('backend-status');   // This is actually the proxy status
    
    // Update backend status (shown as 'Backend Server' in the UI)
    if (backendStatusElement) {
      backendStatusElement.textContent = backendStatus;
      backendStatusElement.className = backendStatus === 'UP' ? 'status-up' : 'status-down';
    }
    
    // Update proxy status (shown as 'Test Runner Server' in the UI)
    if (proxyStatusElement) {
      proxyStatusElement.textContent = frontendStatus;
      proxyStatusElement.className = frontendStatus === 'UP' ? 'status-up' : 'status-down';
    }
    
    // Log the status update for debugging
    console.log(`Status update - Proxy: ${frontendStatus}, Backend: ${backendStatus}`);
  }
  
  static addLog(message) {
    const logElement = document.getElementById('test-log');
    if (!logElement) {
      console.error('Log element not found');
      return;
    }
    
    const logEntry = document.createElement('p');
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    logEntry.textContent = `[${timestamp}] ${message}`;
    
    logElement.appendChild(logEntry);
    logElement.scrollTop = logElement.scrollHeight;
  }
  
  static clearLog() {
    const logElement = document.getElementById('log-content');
    logElement.innerHTML = '';
  }
  
  // Store test details for each test
  static testDetails = {};
  
  // Add a detail to a test
  static addTestDetail(testId, detail) {
    if (!this.testDetails[testId]) {
      this.testDetails[testId] = [];
    }
    this.testDetails[testId].push(detail);
    
    // Update the test details in the UI if the test item exists
    this.updateTestDetailsInUI(testId);
  }
  
  // Update the test details in the UI
  static updateTestDetailsInUI(testId) {
    const testItem = document.querySelector(`.test-item[data-test-id="${testId}"]`);
    if (testItem) {
      // Get or create the details container
      let detailsContainer = testItem.querySelector('.test-details');
      if (!detailsContainer) {
        detailsContainer = document.createElement('div');
        detailsContainer.className = 'test-details';
        testItem.appendChild(detailsContainer);
      }
      
      // Clear existing details
      detailsContainer.innerHTML = '';
      
      // Add each detail
      if (this.testDetails[testId] && this.testDetails[testId].length > 0) {
        this.testDetails[testId].forEach(detail => {
          const detailItem = document.createElement('div');
          detailItem.className = 'detail-item';
          detailItem.textContent = detail;
          detailsContainer.appendChild(detailItem);
        });
      } else {
        const noDetails = document.createElement('div');
        noDetails.className = 'detail-item';
        noDetails.textContent = 'No details available';
        detailsContainer.appendChild(noDetails);
      }
    }
  }
  
  static updateTestList(tests) {
    // Map tests to their categories
    const categoryMap = {
      'health-check': 'core',
      'auth-status': 'auth',
      'restaurant-service-get-all': 'service-core',
      'restaurant-service-by-id': 'service-core',
      'dish-service-get-all': 'service-core',
      'dish-service-by-id': 'service-core',
      'list-service-get-all': 'service-core',
      'hashtag-service': 'service-additional',
      'neighborhood-service': 'service-additional',
      'search-service': 'service-additional',
      'filter-service': 'service-additional',
      'trending-service': 'service-additional',
      'engagement-service': 'service-additional'
    };
    
    // Clear all category containers
    document.querySelectorAll('.category-tests').forEach(container => {
      container.innerHTML = '';
    });
    
    // Add tests to their respective categories
    tests.forEach(test => {
      const category = categoryMap[test.id] || 'service-additional';
      const categoryContainer = document.querySelector(`.category-tests[data-category="${category}"]`);
      
      if (categoryContainer) {
        const testItem = document.createElement('div');
        testItem.className = 'test-item';
        testItem.dataset.testId = test.id;
        
        // Add the status class to the test item
        const statusClass = test.status.toLowerCase().replace(/\s+/g, '-');
        testItem.classList.add(statusClass);
        
        // Create the test item header (contains name and status)
        const testItemHeader = document.createElement('div');
        testItemHeader.className = 'test-item-header';
        
        // Create the test name element (on the left)
        const testName = document.createElement('span');
        testName.className = 'test-name';
        testName.textContent = test.name;
        
        // Create the status indicator (on the right)
        const statusIndicator = document.createElement('span');
        statusIndicator.className = 'status-indicator ' + statusClass;
        statusIndicator.textContent = test.status;
        
        // Add elements to the test item header
        testItemHeader.appendChild(testName);
        testItemHeader.appendChild(statusIndicator);
        testItem.appendChild(testItemHeader);
        
        // Create the details container
        const detailsContainer = document.createElement('div');
        detailsContainer.className = 'test-details';
        testItem.appendChild(detailsContainer);
        
        // Make the test item expandable/collapsible
        testItemHeader.addEventListener('click', () => {
          testItem.classList.toggle('expanded');
        });
        
        // Add the test item to the category container
        categoryContainer.appendChild(testItem);
        
        // Update test details if available
        this.updateTestDetailsInUI(test.id);
      } else {
        console.error(`Category container for ${category} not found`);
      }
    });
  }
  
  static updateTestStatus(testId, status) {
    const testItem = document.querySelector(`.test-item[data-test-id="${testId}"]`);
    if (testItem) {
      // Remove any existing status classes
      testItem.classList.remove('passed', 'failed', 'running', 'skipped', 'not-run');
      
      // Add the appropriate status class
      const statusClass = status.toLowerCase().replace(/\s+/g, '-');
      testItem.classList.add(statusClass);
      
      // Update the status indicator
      const statusIndicator = testItem.querySelector('.status-indicator');
      if (statusIndicator) {
        statusIndicator.textContent = status;
        statusIndicator.className = 'status-indicator ' + statusClass;
      }
    }
  }
  
  static updateSummary(passed, failed, skipped) {
    // Update the summary content
    const summaryContent = document.getElementById('summary-content');
    if (!summaryContent) {
      console.error('Summary content element not found');
      return;
    }
    
    summaryContent.innerHTML = `
      <div class="summary-item">
        <span class="passed">Passed: ${passed}</span>
        <span class="failed">Failed: ${failed}</span>
        <span class="skipped">Skipped: ${skipped}</span>
        <span class="total">Total: ${passed + failed + skipped}</span>
      </div>
    `;
    
    // Update the test-results container for the copy functionality
    const testResultsContainer = document.getElementById('test-results');
    if (testResultsContainer) {
      // Clear the container first
      testResultsContainer.innerHTML = '';
      
      // Create a summary header
      const summaryHeader = document.createElement('div');
      summaryHeader.className = 'results-summary-header';
      summaryHeader.innerHTML = `<h2>API TEST RESULTS SUMMARY</h2><div class="summary-line"></div>`;
      testResultsContainer.appendChild(summaryHeader);
      
      // Add the summary counts
      const summaryText = document.createElement('div');
      summaryText.className = 'summary-text';
      summaryText.innerHTML = `<p>Passed: ${passed}, Failed: ${failed}, Skipped: ${skipped}, Total: ${passed + failed + skipped}</p>`;
      testResultsContainer.appendChild(summaryText);
      
      // Add a detailed results header
      const detailedHeader = document.createElement('div');
      detailedHeader.className = 'detailed-results-header';
      detailedHeader.innerHTML = `<h3>DETAILED RESULTS:</h3>`;
      testResultsContainer.appendChild(detailedHeader);
      
      // Now add each test result
      const allTestItems = document.querySelectorAll('.test-item');
      allTestItems.forEach(item => {
        // Create a new element instead of cloning to avoid duplicate IDs
        const resultItem = document.createElement('div');
        resultItem.className = 'result-item';
        resultItem.innerHTML = item.innerHTML;
        testResultsContainer.appendChild(resultItem);
      });
    }
    
    // Re-register the copy results button event
    const copyButton = document.getElementById('copy-results');
    if (copyButton) {
      // Remove old event listeners by cloning and replacing
      const newCopyButton = copyButton.cloneNode(true);
      copyButton.parentNode.replaceChild(newCopyButton, copyButton);
      
      // Add new event listener
      newCopyButton.addEventListener('click', () => {
        console.log('Copy button clicked');
        try {
          TestRunner.copyResults();
        } catch (error) {
          console.error('Error copying results:', error);
          this.addLog('Error copying results: ' + error.message);
        }
      });
    }
    
    // The copy button is already set up above, no need for another event listener
  }
  
  static updateSchema(tables) {
    const content = document.getElementById('schema-content');
    if (!content) {
      console.error('Schema content element not found');
      return;
    }
    
    if (!tables || tables.length === 0) {
      content.innerHTML = '<p>No schema information available.</p>';
      return;
    }
    
    content.innerHTML = tables.map(table => `
      <div class="schema-table">
        <h3>${table.name}</h3>
        <table>
          <thead>
            <tr>
              <th>Column</th>
              <th>Type</th>
              <th>Nullable</th>
              <th>Default</th>
            </tr>
          </thead>
          <tbody>
            ${table.columns.map(column => `
              <tr>
                <td>${column.name}</td>
                <td>${column.type}</td>
                <td>${column.nullable ? 'Yes' : 'No'}</td>
                <td>${column.default !== null ? column.default : 'NULL'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `).join('');
    
    // Hide any error message
    const errorElement = document.getElementById('schema-error');
    if (errorElement) {
      errorElement.style.display = 'none';
    }
  }
}
