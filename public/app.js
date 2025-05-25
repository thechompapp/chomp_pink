// app.js - Entry point for the API test runner application
import { TestRunner } from './test-runner.js';
import { DatabaseDataManager } from './database-manager.js';

// Logger for client-side logging
class Logger {
  static #levels = { INFO: 'INFO', ERROR: 'ERROR' };

  static log(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const prefix = `[client-${timestamp}] [${level}]`;
    if (level === Logger.#levels.ERROR) {
      console.error(`${prefix} ${message}`, data);
    } else {
      console.log(`${prefix} ${message}`, data);
    }
  }

  static info(message, data = {}) {
    this.log(this.#levels.INFO, message, data);
  }

  static error(message, error) {
    this.log(this.#levels.ERROR, message, error);
  }
}

// Event manager for handling UI events
class EventManager {
  static handleEvent(id, handler) {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener('click', handler);
    } else {
      console.error(`Element with ID ${id} not found`);
    }
  }
  
  static registerEvents() {
    // Connect button
    this.handleEvent('connect-reset', () => TestRunner.connectAndReset());
    
    // Run tests button
    this.handleEvent('run-all-tests', () => TestRunner.runAllTests());
    
    // Clear log button
    this.handleEvent('clear-log', () => TestRunner.clearLog());
    
    // Copy results button
    this.handleEvent('copy-results', (event) => {
      try {
        // Ensure TestRunner is properly imported and accessible
        if (typeof TestRunner !== 'undefined' && TestRunner) {
          TestRunner.copyResults();
        } else {
          console.error('TestRunner is not defined or not accessible');
          // Try to access it through window as a fallback
          if (window.TestRunner) {
            window.TestRunner.copyResults();
          } else {
            throw new Error('TestRunner is not available');
          }
        }
      } catch (error) {
        console.error('Error copying results:', error);
        // Show user feedback
        const logElement = document.getElementById('test-log');
        if (logElement) {
          const logEntry = document.createElement('div');
          logEntry.className = 'log-entry error';
          logEntry.textContent = `[${new Date().toLocaleTimeString()}] Error copying results: ${error.message}`;
          logElement.appendChild(logEntry);
          logElement.scrollTop = logElement.scrollHeight;
        }
      }
    });
    
    // Schema tab buttons
    this.handleEvent('load-schema', () => TestRunner.loadSchema());
    this.handleEvent('refresh-schema', () => TestRunner.refreshSchema());
    
    // Database data tab buttons
    this.handleEvent('load-data', () => DatabaseDataManager.loadTableList());
    this.handleEvent('refresh-data', () => DatabaseDataManager.refreshData());
    
    // Table select change event
    const tableSelect = document.getElementById('table-select');
    if (tableSelect) {
      tableSelect.addEventListener('change', () => {
        const selectedTable = tableSelect.value;
        if (selectedTable) {
          DatabaseDataManager.loadTableData(selectedTable);
        }
      });
    }
  }
}

// Main application class
class App {
  static init() {
    Logger.info('Initializing application');
    this.setupTabNavigation();
    EventManager.registerEvents();
    TestRunner.connectAndReset();
    
    // Initialize the database data tab
    const dataTab = document.querySelector('.tab[data-tab="data"]');
    if (dataTab) {
      dataTab.addEventListener('click', () => {
        // Load table list when the data tab is clicked for the first time
        const dataContent = document.getElementById('data-content');
        if (dataContent && dataContent.textContent.trim() === 'Select a table to view its data.') {
          DatabaseDataManager.loadTableList();
        }
      });
    }
    
    // Initialize the schema tab
    const schemaTab = document.querySelector('.tab[data-tab="schema"]');
    if (schemaTab) {
      schemaTab.addEventListener('click', () => {
        // Load schema when the schema tab is clicked for the first time
        const schemaContent = document.getElementById('schema-content');
        if (schemaContent && schemaContent.textContent.trim() === 'Loading database schema...') {
          TestRunner.loadSchema();
        }
      });
    }
  }
  
  static setupTabNavigation() {
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
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('Initializing application from app.js');
  try {
    // First initialize the UI
    App.init();
    
    // Then initialize the test runner
    console.log('Initializing TestRunner...');
    TestRunner.init();
    
    // Connect to the backend and update the UI
    console.log('Connecting to backend...');
    TestRunner.connectAndReset().then(() => {
      console.log('Connected to backend successfully');
    }).catch(error => {
      console.error('Error connecting to backend:', error);
    });
    
    console.log('Application initialized successfully');
  } catch (error) {
    console.error('Error initializing application:', error);
  }
});
