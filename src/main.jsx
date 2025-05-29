// src/main.jsx

// Import the unified axios fix module first, before anything else
import '@/utils/axios-fix';

import './utils/DevModeManager';
import AuthManager from './utils/AuthManager';
import offlineModeGuard from './utils/offlineModeGuard';

// Import offline mode control and auto-fix
import { autoFixOfflineMode, enableOfflineModeDebugControls } from '@/utils/offlineModeControl';

// Initialize AuthManager early
if (typeof window !== 'undefined' && !AuthManager.initialized) {
  AuthManager.initialize();
}

// Core imports
import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import App from './App.jsx'; // Keep relative for App root
import './index.css'; // Keep relative for global CSS
import { queryClient } from '@/queryClient'; // Use alias for consistency
import { logError, logInfo } from '@/utils/logger';
import { Toaster } from 'react-hot-toast';
import { BrowserRouter } from 'react-router-dom';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { DevModeManager } from './utils/development-mode/DevModeManager';
import { AdminAuthSetup } from './utils/adminAuthSetup';

// Initialize development mode
DevModeManager.init();

// Auto-setup admin authentication in development
if (import.meta.env.DEV) {
  AdminAuthSetup.setupDevelopmentAuth();
}

// Safe environment check for development mode
const isDevelopmentMode = (() => {
  // Check Vite environment variables first (import.meta is always available in ES modules)
  if (import.meta && import.meta.env) {
    return import.meta.env.MODE === 'development' || import.meta.env.DEV;
  }
  // Check process.env if available (Node.js/webpack environments)
  if (typeof process !== 'undefined' && process.env) {
    return process.env.NODE_ENV === 'development';
  }
  // Default to development if unable to determine
  return true;
})();

// Import development tools utility - using dynamic import to avoid initialization issues
if (isDevelopmentMode) {
  // Check if auto-fix has already run using localStorage to persist across HMR
  const AUTO_FIX_KEY = 'doof-autofix-disabled';
  const autoFixDisabled = localStorage.getItem(AUTO_FIX_KEY) === 'true';
  
  if (!autoFixDisabled) {
    // Disable auto-fix permanently to prevent loops
    localStorage.setItem(AUTO_FIX_KEY, 'true');
    console.log('🚫 Auto-fix disabled to prevent refresh loops');
  }
  
  // Load development tools but don't run auto-fix
  let devToolsLoaded = false;
  if (!devToolsLoaded) {
    devToolsLoaded = true;
    setTimeout(() => {
      import('@/utils/devTools')
        .then(() => console.log('Development tools loaded successfully'))
        .catch(err => console.error('Error loading development tools:', err));
    }, 2000); // Increased delay to 2000ms
  }
}

// Global error handler for uncaught JavaScript errors
window.addEventListener('error', (event) => {
  logError('[Global Error]', event.error);
  console.error('Uncaught error:', event.error);
});

// Global error handler for specific axios errors
window.addEventListener('unhandledrejection', (event) => {
  if (event?.reason?.message?.includes('toUpperCase')) {
    logError('[Global Error] Caught axios toUpperCase error:', event.reason);
    console.error('Axios error:', event.reason);
    // Prevent the error from propagating
    event.preventDefault();
  }
});

// Expose services globally for testing
import { listService } from '@/services/listService';

// VERIFICATION HOOK: Expose list service globally for testing
if (typeof window !== 'undefined') {
  window.listService = listService;
  console.log('[VERIFICATION] List service exposed globally for testing');
}

// Fallback component in case of errors
const ErrorFallback = ({ error }) => (
  <div style={{ 
    padding: '20px', 
    margin: '20px', 
    border: '1px solid red',
    borderRadius: '5px',
    backgroundColor: '#ffebee'
  }}>
    <h1>Something went wrong</h1>
    <p>The application encountered an error:</p>
    <pre style={{ 
      backgroundColor: '#f5f5f5',
      padding: '10px',
      borderRadius: '4px',
      overflow: 'auto'
    }}>
      {error?.toString() || 'Unknown error'}
    </pre>
  </div>
);

// Root component with error boundary
const Root = () => {
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    console.log('Application mounting...');
    return () => console.log('Application unmounting...');
  }, []);

  if (error) {
    return <ErrorFallback error={error} />;
  }

  try {
    return (
      <React.StrictMode>
        <QueryClientProvider client={queryClient}>
          <Toaster />
          <BrowserRouter>
            <App />
          </BrowserRouter>
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </React.StrictMode>
    );
  } catch (err) {
    console.error('Error rendering application:', err);
    setError(err);
    return <ErrorFallback error={err} />;
  }
};

try {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Root element not found! Make sure there is a div with id="root" in your HTML.');
  }
  
  console.log('Starting application render...');
  
  // Check if we already have a root to prevent duplicate mounting
  let root;
  if (window.__REACT_ROOT) {
    root = window.__REACT_ROOT;
    console.log('Using existing React root');
  } else {
    root = ReactDOM.createRoot(rootElement);
    window.__REACT_ROOT = root; // Store the root instance
    console.log('Created new React root');
  }
  
  root.render(<Root />);
} catch (err) {
  console.error('Critical error during application initialization:', err);
  document.body.innerHTML = `
    <div style="padding: 20px; margin: 20px; border: 1px solid red; border-radius: 5px; background-color: #ffebee;">
      <h1>Critical Error</h1>
      <p>The application failed to initialize:</p>
      <pre style="background-color: #f5f5f5; padding: 10px; border-radius: 4px; overflow: auto;">
        ${err?.toString() || 'Unknown error'}
      </pre>
    </div>
  `;
}