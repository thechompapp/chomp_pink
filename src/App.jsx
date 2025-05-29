/* src/App.jsx */
import React, { Suspense, lazy, useEffect, useState } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/auth';
import { QuickAddProvider } from './contexts/QuickAddContext';
import { ListDetailProvider } from './contexts/ListDetailContext';
import { PlacesApiProvider } from './contexts/PlacesApiContext';
import Navbar from './layouts/Navbar';
import FloatingQuickAdd from './components/FloatingQuickAdd';
import AddToListModal from './components/AddToListModal';
import ProtectedRoute from './components/ProtectedRoute';
import { logError, logInfo, logDebug } from './utils/logger';
import offlineModeGuard from './utils/offlineModeGuard';

// Authentication constants
const AUTH_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

/**
 * Enhanced lazy loading with error handling
 * @param {Function} importFn - Import function to lazily load a component
 * @param {string} name - Component name for logging purposes
 * @returns {React.LazyExoticComponent} Lazy loaded component
 */
const enhancedLazy = (importFn, name) => {
  return lazy(() => {
    logInfo(`[App] Starting lazy load for ${name}`);
    return importFn().catch(error => {
      logError(`[App] Failed to lazy load ${name}:`, error);
      throw error; // Re-throw to trigger suspense fallback/error boundary
    });
  });
};

// Direct imports for critical pages
import Home from './pages/Home';
import LoginPage from './pages/Login';
const Login = () => <LoginPage />;
const Register = enhancedLazy(() => import('./pages/Register'), 'Register');
const Search = enhancedLazy(() => import('./pages/Search'), 'Search');
const Trending = enhancedLazy(() => import('./pages/Trending'), 'Trending');
const Lists = enhancedLazy(() => import('./pages/Lists'), 'Lists');
const MyLists = enhancedLazy(() => import('./pages/Lists/MyLists'), 'MyLists');
import BulkAdd from './pages/BulkAdd'; // Direct import for BulkAdd
import AdminPanel from './pages/AdminPanel/AdminPanel'; // Direct import for AdminPanel
import EnhancedAdminPanelDemo from './pages/AdminPanel/EnhancedAdminPanelDemo'; // Import enhanced admin panel demo
import AuthTestPage from './pages/AuthTest'; // Direct import for AuthTest
import AdminAuthDebug from './pages/AdminAuthDebug'; // Import admin auth debug page

/**
 * Create and configure query client with default options
 * @returns {QueryClient} Configured query client
 */
const createQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, 
        retry: 1,
      },
    },
  });
};

// Initialize query client
const queryClient = createQueryClient();

/**
 * App component - main application container
 */
function App() {
  const [quickAddItem, setQuickAddItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  /**
   * Handle opening the quick add modal
   * @param {Object} item - Item to add
   */
  const handleOpenQuickAdd = (item) => {
    setQuickAddItem(item);
    setIsModalOpen(true);
  };

  /**
   * Handle closing the quick add modal
   */
  const handleCloseQuickAdd = () => {
    setIsModalOpen(false);
    setQuickAddItem(null);
  };

  /**
   * Initialize offline mode guard
   */
  useEffect(() => {
    // Initialize offline mode guard
    if (!offlineModeGuard.initialized) {
      logInfo('[App] Initializing offline mode guard');
      offlineModeGuard.initialize();
    }
    
    // Force clear offline mode flags
    offlineModeGuard.clearOfflineModeFlags();
  }, []);

  /**
   * Handle online/offline status changes
   */
  useEffect(() => {
    const handleOnline = () => {
      logInfo('[App] Browser is online');
      offlineModeGuard.clearOfflineModeFlags();
      
      // Dispatch event to force UI refresh
      window.dispatchEvent(new CustomEvent('forceUiRefresh', {
        detail: { timestamp: Date.now() }
      }));
    };
    
    const handleOffline = () => {
      logInfo('[App] Browser is offline');
      localStorage.setItem('offline_mode', 'true');
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <AuthProvider>
          <QuickAddProvider>
            <ListDetailProvider>
              <PlacesApiProvider>
                <Router>
                <div className="app-container">
                  <Navbar />
                  
                  <main className="main-content">
                    <Suspense fallback={<div>Loading...</div>}>
                      <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/search" element={<Search />} />
                        <Route path="/trending" element={<Trending />} />
                        <Route path="/lists" element={<Lists />} />
                        
                        {/* Protected routes */}
                        <Route 
                          path="/my-lists" 
                          element={
                            <ProtectedRoute>
                              <MyLists />
                            </ProtectedRoute>
                          } 
                        />
                        <Route 
                          path="/admin" 
                          element={
                            <ProtectedRoute adminOnly>
                              <AdminPanel />
                            </ProtectedRoute>
                          } 
                        />
                        <Route 
                          path="/admin-enhanced" 
                          element={
                            <ProtectedRoute adminOnly>
                              <EnhancedAdminPanelDemo />
                            </ProtectedRoute>
                          } 
                        />
                        
                        <Route 
                          path="/bulk-add" 
                          element={
                            <ProtectedRoute adminOnly>
                              <BulkAdd />
                            </ProtectedRoute>
                          } 
                        />
                        
                        {/* Auth test route - only in development */}
                        {process.env.NODE_ENV === 'development' && (
                          <Route path="/auth-test" element={<AuthTestPage />} />
                        )}
                        
                        {/* Admin auth debug route - only in development */}
                        {process.env.NODE_ENV === 'development' && (
                          <Route path="/admin-auth-debug" element={<AdminAuthDebug />} />
                        )}
                        
                        {/* Fallback for unknown routes */}
                        <Route path="*" element={<Home />} />
                      </Routes>
                    </Suspense>
                  </main>
                  
                  <FloatingQuickAdd onOpenQuickAdd={handleOpenQuickAdd} />
                  {isModalOpen && (
                    <AddToListModal 
                      item={quickAddItem} 
                      isOpen={isModalOpen} 
                      onClose={handleCloseQuickAdd} 
                    />
                  )}
                </div>
              </Router>
            </PlacesApiProvider>
          </ListDetailProvider>
        </QuickAddProvider>
      </AuthProvider>
    </HelmetProvider>
    </QueryClientProvider>
  );
}

export default App;
