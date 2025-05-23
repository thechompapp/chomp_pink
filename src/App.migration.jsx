/* src/App.jsx */
import React, { Suspense, lazy, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AuthMigrationWrapper from '@/contexts/auth/AuthMigrationWrapper';
import { QuickAddProvider } from '@/context/QuickAddContext';
import { ListDetailProvider } from '@/context/ListDetailContext';
import { PlacesApiProvider } from '@/context/PlacesApiContext';
import Navbar from '@/layouts/Navbar';
import FloatingQuickAdd from '@/components/FloatingQuickAdd';
import AddToListModal from '@/components/AddToListModal';
import ErrorBoundary from '@/components/ErrorBoundary';
import EnhancedLoadingFallback from '@/components/UI/EnhancedLoadingFallback';
import DevModeToggle from '@/components/UI/DevModeToggle';
import OfflineIndicator from '@/components/UI/OfflineIndicator';
import TestQuickAdd from '@/components/UI/TestQuickAdd';
import ProtectedRoute from '@/components/ProtectedRoute';
import { logError, logInfo, logDebug } from '@/utils/logger';
import httpInterceptor from '@/services/httpInterceptor';
import { setupAdminAuthSync } from '@/utils/adminAuth.js';
import '@/utils/auth-fix.js'; // Import auth-fix to ensure it's loaded and executed
import { useInvalidateCaches } from './utils/cacheUtils';
import offlineModeGuard from '@/utils/offlineModeGuard';

// Authentication constants
const AUTH_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
const AUTH_CHECK_TIMEOUT = 3000; // 3 seconds

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

// Lazy-loaded pages
const Home = enhancedLazy(() => import('./pages/Home'), 'Home');
import LoginPage from './pages/Login'; // Direct import for Login
const Login = () => <LoginPage />;
import BulkAddComponent from './pages/BulkAdd'; // Direct import for BulkAdd
const BulkAddPage = () => <BulkAddComponent />;
import TrendingComponent from './pages/Trending'; // Direct import for Trending
const Trending = () => <TrendingComponent />;
const Register = enhancedLazy(() => import('./pages/Register'), 'Register');
const Search = enhancedLazy(() => import('./pages/Search'), 'Search');
const RestaurantDetail = enhancedLazy(() => import('./pages/RestaurantDetail'), 'RestaurantDetail');
const DishDetail = enhancedLazy(() => import('./pages/DishDetail'), 'DishDetail');
const Lists = enhancedLazy(() => import('./pages/Lists'), 'Lists');
const MyLists = enhancedLazy(() => import('./pages/Lists/MyLists'), 'MyLists');
const ListDetail = enhancedLazy(() => import('./pages/Lists/ListDetail'), 'ListDetail');
const NewList = enhancedLazy(() => import('./pages/Lists/NewList'), 'NewList');
const MySubmissions = enhancedLazy(() => import('./pages/MySubmissions'), 'MySubmissions');
import AdminPanel from './pages/AdminPanel'; // Direct import for AdminPanel
import AuthTestPage from './pages/AuthTest'; // Direct import for AuthTest

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
  const invalidateCaches = useInvalidateCaches();

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
    
    // Invalidate caches on app start
    invalidateCaches();
  }, [invalidateCaches]);

  /**
   * Handle online/offline status changes
   */
  useEffect(() => {
    const handleOnline = () => {
      logInfo('[App] Browser is online');
      offlineModeGuard.clearOfflineModeFlags();
      
      // Invalidate caches when coming back online
      invalidateCaches();
      
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
  }, [invalidateCaches]);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthMigrationWrapper>
          <QuickAddProvider>
            <ListDetailProvider>
              <PlacesApiProvider>
                <Router>
                  <div className="app-container">
                    <Navbar />
                    <OfflineIndicator />
                    {process.env.NODE_ENV === 'development' && <DevModeToggle />}
                    
                    <main className="main-content">
                      <Suspense fallback={<EnhancedLoadingFallback />}>
                        <Routes>
                          <Route path="/" element={<Home />} />
                          <Route path="/login" element={<Login />} />
                          <Route path="/register" element={<Register />} />
                          <Route path="/search" element={<Search />} />
                          <Route path="/trending" element={<Trending />} />
                          <Route path="/restaurant/:id" element={<RestaurantDetail />} />
                          <Route path="/dish/:id" element={<DishDetail />} />
                          <Route path="/lists" element={<Lists />} />
                          <Route path="/list/:id" element={<ListDetail />} />
                          
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
                            path="/new-list" 
                            element={
                              <ProtectedRoute>
                                <NewList />
                              </ProtectedRoute>
                            } 
                          />
                          <Route 
                            path="/my-submissions" 
                            element={
                              <ProtectedRoute>
                                <MySubmissions />
                              </ProtectedRoute>
                            } 
                          />
                          <Route 
                            path="/bulk-add" 
                            element={
                              <ProtectedRoute>
                                <BulkAddPage />
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
                          
                          {/* Auth test route - only in development */}
                          {process.env.NODE_ENV === 'development' && (
                            <Route path="/auth-test" element={<AuthTestPage />} />
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
                    
                    {process.env.NODE_ENV === 'development' && <TestQuickAdd />}
                  </div>
                </Router>
              </PlacesApiProvider>
            </ListDetailProvider>
          </QuickAddProvider>
        </AuthMigrationWrapper>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
