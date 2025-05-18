/* src/App.jsx */
import React, { Suspense, lazy, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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
import useAuthStore from '@/stores/useAuthStore';
import useUserListStore from '@/stores/useUserListStore'; // Ensure this is used or remove
import { logError, logInfo, logDebug } from '@/utils/logger';
import ProtectedRoute from '@/components/ProtectedRoute';
import httpInterceptor from '@/services/httpInterceptor';
import { setupAdminAuthSync } from '@/utils/adminAuth.js';
import '@/utils/auth-fix.js'; // Import auth-fix to ensure it's loaded and executed

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
  const { checkAuthStatus, isAuthenticated, user } = useAuthStore();
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
   * Initialize authentication by checking status
   * @param {boolean} shouldForceCheck - Whether to force an auth check
   * @returns {Promise<void>}
   */
  const initializeAuthentication = async (shouldForceCheck) => {
    try {
      if (process.env.NODE_ENV === 'development' && localStorage.getItem('bypass_auth_check') === 'true') {
        logDebug('[App] Auth bypass enabled, skipping auth check');
        return;
      }
      
      const authPromise = checkAuthStatus(shouldForceCheck);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Auth check timed out')), AUTH_CHECK_TIMEOUT)
      );
      
      await Promise.race([authPromise, timeoutPromise]);
      logDebug('[App] Initial auth check completed.');
    } catch (error) {
      const errorInfo = {
        message: error?.message || 'Unknown authentication error',
        name: error?.name || 'Error',
      };
      logError('[App] Error during initial authentication check:', errorInfo);
      
      if (process.env.NODE_ENV === 'development') {
        localStorage.setItem('bypass_auth_check', 'true');
        logDebug('[App] Enabled auth bypass due to initial auth errors.');
      }
    }
  };

  /**
   * Setup periodic authentication check
   * @returns {number} Interval ID for cleanup
   */
  const setupPeriodicAuthCheck = () => {
    return setInterval(() => {
      if (useAuthStore.getState().isAuthenticated) { // Get fresh state
        logDebug('[App] Running scheduled auth check');
        checkAuthStatus(false).catch(err => 
          logError('[App] Scheduled auth check failed:', { message: err.message })
        );
      }
    }, AUTH_CHECK_INTERVAL);
  };

  /**
   * Initialize authentication and setup periodic auth checks
   */
  useEffect(() => {
    let authInitialized = false;
    
    const initAuth = async () => {
      if (authInitialized) return;
      authInitialized = true; // Set immediately to prevent multiple runs

      const shouldForceCheck = !user; // Only force if no user in store
      await initializeAuthentication(shouldForceCheck);
    };
    
    // Initialize auth and setup periodic check
    initAuth();
    const authCheckInterval = setupPeriodicAuthCheck();
    
    // Setup admin auth synchronization
    const cleanupAdminAuthSync = setupAdminAuthSync();

    // Import admin-refresh for development mode only
    if (process.env.NODE_ENV === 'development') {
      import('@/utils/admin-refresh.js')
        .then(() => logDebug('[App] Admin refresh utility loaded'))
        .catch(err => logError('[App] Failed to load admin refresh utility:', err));
    }
    
    return () => {
      clearInterval(authCheckInterval);
      cleanupAdminAuthSync();
    };
  }, [checkAuthStatus, user]);

  // Initialize global HTTP interceptors
  useEffect(() => {
    // Setup global HTTP defaults and interceptors
    httpInterceptor.setupGlobalDefaults();
    
    return () => {
      // Any cleanup needed for interceptors
      // (most cleanup is handled internally by the interceptor module)
    };
  }, []);

  /**
   * Render application routes
   * @returns {JSX.Element} Routes component with all application routes
   */
  const renderRoutes = () => (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/trending/:type" element={<Trending />} />
      <Route path="/search" element={<Search />} />
      <Route path="/restaurants/:id" element={<RestaurantDetail />} />
      <Route path="/dishes/:id" element={<DishDetail />} />
      <Route path="/test-quickadd" element={<TestQuickAdd />} />
      <Route path="/lists" element={<Lists />} />
      
      {/* Public list routes */}
      <Route path="/lists/mylists" element={<MyLists />} />
      <Route path="/lists/new" element={<NewList />} />
      <Route path="/lists/:listId" element={<ListDetail />} />
      
      {/* User-specific routes */}
      <Route path="/my-submissions" element={<MySubmissions />} />
      
      {/* Admin routes (protected) */}
      <Route 
        path="/admin" 
        element={<ProtectedRoute requireSuperuser><AdminPanel /></ProtectedRoute>} 
      />
      <Route 
        path="/bulk-add" 
        element={<ProtectedRoute requireSuperuser><BulkAddPage /></ProtectedRoute>} 
      />
    </Routes>
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <Router>
          <QuickAddProvider openQuickAdd={handleOpenQuickAdd} onClose={handleCloseQuickAdd}>
            <ListDetailProvider>
              <PlacesApiProvider>
                <div className="flex flex-col min-h-screen bg-background">
                  <Navbar />
                  <main className="flex-grow pt-16"> {/* Adjust pt if navbar height changes */}
                    <Suspense fallback={<EnhancedLoadingFallback componentName="Page" />}>
                      {renderRoutes()}
                    </Suspense>
                  </main>
                  <FloatingQuickAdd />
                  <AddToListModal
                    isOpen={isModalOpen}
                    onClose={handleCloseQuickAdd}
                    itemToAdd={quickAddItem}
                  />
                  {process.env.NODE_ENV === 'development' && (
                    <>
                      {/* Development-only components can be added here if needed */}
                    </>
                  )}
                  <DevModeToggle />
                  <OfflineIndicator />
                </div>
              </PlacesApiProvider>
            </ListDetailProvider>
          </QuickAddProvider>
        </Router>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

export default App;
