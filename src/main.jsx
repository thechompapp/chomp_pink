// src/main.jsx

// Import the unified axios fix module first, before anything else
import '@/utils/axios-fix';

// Core imports
import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import App from './App.jsx';
import './index.css';
import { queryClient } from '@/queryClient';
import { logError, logInfo } from '@/utils/logger';
import { Toaster } from 'react-hot-toast';
import { BrowserRouter } from 'react-router-dom';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Import emergency utilities for debugging
import './utils/emergencyReset.js';

// Development mode authentication setup
if (import.meta.env.DEV) {
  logInfo('[Main] Development mode detected - optimized authentication system active');
}

// Global error handler for uncaught JavaScript errors
window.addEventListener('error', (event) => {
  logError('[Global Error]', event.error);
  console.error('Uncaught error:', event.error);
});

// Global error handler for unhandled promises
window.addEventListener('unhandledrejection', (event) => {
  if (event?.reason?.message?.includes('toUpperCase')) {
    logError('[Global Error] Caught axios toUpperCase error:', event.reason);
    console.error('Axios error:', event.reason);
    event.preventDefault();
  }
});

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
    logInfo('[Main] Application mounting with optimized authentication');
    return () => logInfo('[Main] Application unmounting');
  }, []);

  if (error) {
    return <ErrorFallback error={error} />;
  }

  try {
    return (
      <React.StrictMode>
        <QueryClientProvider client={queryClient}>
          <Toaster 
            position="bottom-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#fff',
                color: '#363636',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                maxWidth: '400px',
                zIndex: 9999,
              },
              success: {
                duration: 4000,
                style: {
                  background: '#10b981',
                  color: '#fff',
                  border: '1px solid #059669',
                },
              },
              error: {
                duration: 5000,
                style: {
                  background: '#ef4444',
                  color: '#fff',
                  border: '1px solid #dc2626',
                },
              },
            }}
            containerStyle={{
              zIndex: 9999,
            }}
          />
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
  
  logInfo('[Main] Starting application with optimized authentication system');
  
  // Check if we already have a root to prevent duplicate mounting
  let root;
  if (window.__REACT_ROOT) {
    root = window.__REACT_ROOT;
    logInfo('[Main] Using existing React root');
  } else {
    root = ReactDOM.createRoot(rootElement);
    window.__REACT_ROOT = root;
    logInfo('[Main] Created new React root');
  }
  
  root.render(<Root />);
} catch (err) {
  logError('[Main] Critical error during application initialization:', err);
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