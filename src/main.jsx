// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'; // Import React Query
import App from './App.jsx';
import './index.css';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Optional: Default query options like staleTime, cacheTime
      // staleTime: 1000 * 60 * 5, // 5 minutes
      // cacheTime: 1000 * 60 * 30, // 30 minutes
      refetchOnWindowFocus: false, // Optional: Disable refetch on window focus
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* Provide the client to your App */}
    <QueryClientProvider client={queryClient}> {/* *** WRAP HERE *** */}
      <App />
    </QueryClientProvider> {/* *** END WRAP *** */}
  </React.StrictMode>
);