// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import App from './App.jsx'; // Keep relative for App root
import './index.css'; // Keep relative for global CSS
import { queryClient } from '@/queryClient'; // Use alias for consistency
import { logError } from '@/utils/logger';

// Global error handler for uncaught JavaScript errors
window.addEventListener('error', (event) => {
  logError('[Global Error]', event.error);
  console.error('Uncaught error:', event.error);
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
          <App />
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