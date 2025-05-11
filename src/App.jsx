/* src/App.jsx */
import React, { Suspense, lazy, useEffect } from 'react';
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
import ListDataStatus from './components/ListDataStatus';
import TestListToggle from './components/TestListToggle';
import TestQuickAdd from '@/components/UI/TestQuickAdd';
import TestFollowButton from './components/TestFollowButton';
import useAuthStore from '@/stores/useAuthStore';
import useUserListStore from '@/stores/useUserListStore';
import { logError, logInfo, logDebug } from '@/utils/logger';

// Enhanced lazy loading with error handling
const enhancedLazy = (importFn, name) => {
  return lazy(() => {
    logInfo(`[App] Starting lazy load for ${name}`);
    return importFn().catch(error => {
      logError(`[App] Failed to lazy load ${name}:`, error);
      // Re-throw to trigger suspense fallback/error boundary
      throw error;
    });
  });
};

// Lazy-loaded pages with enhanced error logging
// Using relative paths to ensure Vite can resolve them correctly
const Home = enhancedLazy(() => import('./pages/Home'), 'Home');

// Import Login component directly to avoid lazy loading issues
import LoginPage from './pages/Login';
const Login = () => <LoginPage />;

// Create a separate direct import for BulkAdd to avoid lazy loading issues
import BulkAddComponent from './pages/BulkAdd';
const BulkAddPage = () => <BulkAddComponent />;

// Direct import for Trending to avoid lazy loading issues
import TrendingComponent from './pages/Trending';
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
import AdminPanel from './pages/AdminPanel';

// Query Client setup
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  const { checkAuthStatus, isAuthenticated, user } = useAuthStore();
  // Add state for the QuickAdd modal
  const [quickAddItem, setQuickAddItem] = React.useState(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  
  // Get user list store functions
  const fetchUserLists = useUserListStore(state => state.fetchUserLists);
  const userLists = useUserListStore(state => state.userLists);
  const isLoadingLists = useUserListStore(state => state.isLoading);

  // Function to open the AddToListModal
  const handleOpenQuickAdd = (item) => {
    setQuickAddItem(item);
    setIsModalOpen(true);
    
    // Always attempt to fetch lists when modal opens if authenticated
    if (isAuthenticated && user) {
      logDebug('[App] Fetching user lists for quick add modal');
      // Pass createdByUser: true to ensure we get the user's own lists
      fetchUserLists({ createdByUser: true }, queryClient);
    }
  };

  // Function to close the AddToListModal
  const handleCloseQuickAdd = () => {
    setIsModalOpen(false);
    setQuickAddItem(null);
  };

  // Effect to load user lists when authenticated
  useEffect(() => {
    if (isAuthenticated && user && (!userLists || userLists.length === 0) && !isLoadingLists && isModalOpen) {
      logDebug('[App] Fetching user lists on authentication change');
      fetchUserLists({}, queryClient);
    }
  }, [isAuthenticated, user, isModalOpen, userLists, isLoadingLists, fetchUserLists, queryClient]);

  // Handle authentication with improved reliability
  React.useEffect(() => {
    // Avoid constant re-authentication
    let authInitialized = false;
    
    const initializeAuth = async () => {
      if (authInitialized) return;
      
      // If we already have user data in the store, don't force a re-check
      const shouldForceCheck = !user;
      
      try {
        // If auth bypass is enabled in dev mode, skip the auth check
        if (process.env.NODE_ENV === 'development' && localStorage.getItem('bypass_auth_check') === 'true') {
          logDebug('[App] Auth bypass enabled, skipping auth check');
          authInitialized = true;
          return;
        }
        
        // Set a timeout to handle API unresponsiveness
        const authPromise = checkAuthStatus(shouldForceCheck);
        
        // Create a timeout promise
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error('Auth check timed out - using cached data'));
          }, 3000); // 3 second timeout
        });
        
        // Race between auth check and timeout
        const authSuccess = await Promise.race([authPromise, timeoutPromise])
          .catch(error => {
            // Create a serializable error object
            const errorDetail = {
              message: error.message || 'Unknown error',
              name: error.name || 'Error',
            };
            
            logWarn('[App] Auth check issue - using local storage state:', errorDetail.message);
            
            // Enable auth bypass in development to prevent repeated failures
            if (process.env.NODE_ENV === 'development') {
              localStorage.setItem('bypass_auth_check', 'true');
              logDebug('[App] Enabled auth bypass for development');
            }
            
            // If we already have user info in the store, consider it a success
            return !!user;
          });
          
        logDebug('[App] Initial auth check result:', authSuccess, 'isAuthenticated:', isAuthenticated);
        authInitialized = true;
      } catch (error) {
        // Create a proper serializable error object to prevent empty objects in logs
        const errorInfo = {
          message: error?.message || 'Unknown authentication error',
          name: error?.name || 'Error',
          stack: error?.stack ? error.stack.split('\n')[0] : 'No stack trace'
        };
        
        logError('[App] Error during authentication check:', errorInfo);
        
        // Enable bypass in development to prevent repeated errors
        if (process.env.NODE_ENV === 'development') {
          localStorage.setItem('bypass_auth_check', 'true');
          logDebug('[App] Enabled auth bypass due to errors');
        }
        
        // Still mark as initialized to prevent endless retries
        authInitialized = true;
      }
    };
    
    initializeAuth();
    
    // Set up periodic check for auth status but only when app is active
    let authCheckInterval;
    
    const setupAuthCheck = () => {
      // Clear any existing interval
      if (authCheckInterval) clearInterval(authCheckInterval);
      
      // Check auth every 5 minutes while the app is open
      authCheckInterval = setInterval(() => {
        // Only check if user is authenticated (no need to check repeatedly if logged out)
        if (isAuthenticated) {
          logDebug('[App] Running scheduled auth check');
          checkAuthStatus(false).catch(err => 
            logError('[App] Scheduled auth check failed:', err)
          );
        }
      }, 5 * 60 * 1000); // 5 minutes
    };
    
    setupAuthCheck();
    
    // Clean up interval on component unmount
    return () => {
      if (authCheckInterval) clearInterval(authCheckInterval);
    };
  }, [checkAuthStatus, isAuthenticated, user]);

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <Router>
          <QuickAddProvider openQuickAdd={handleOpenQuickAdd} onClose={handleCloseQuickAdd}>
            <ListDetailProvider>
              <PlacesApiProvider>
                <div className="flex flex-col min-h-screen">
                  <Navbar />
                  <main className="flex-grow pt-16">
                    <Suspense fallback={<EnhancedLoadingFallback componentName="page" />}>
                      <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/trending/:type" element={<Trending />} />
                        <Route path="/search" element={<Search />} />
                        <Route path="/restaurants/:id" element={<RestaurantDetail />} />
                        <Route path="/dishes/:id" element={<DishDetail />} />
                        <Route path="/test-quickadd" element={<TestQuickAdd />} />
                        <Route path="/lists" element={<Lists />} />
                        <Route path="/lists/mylists" element={<MyLists />} />
                        <Route path="/lists/new" element={<NewList />} />
                        <Route path="/lists/:listId" element={<ListDetail />} />
                        <Route path="/my-submissions" element={<MySubmissions />} />
                        <Route path="/admin" element={<AdminPanel />} />
                        <Route path="/bulk-add" element={<BulkAddPage />} />
                      </Routes>
                    </Suspense>
                  </main>
                  <FloatingQuickAdd />
                  {/* Add to list modal (accessed via QuickAdd context) */}
                  <AddToListModal
                    isOpen={isModalOpen}
                    onClose={handleCloseQuickAdd}
                    item={quickAddItem}
                  />
                  {/* Diagnostic component to help debug list data status */}
                  <ListDataStatus />
                  {/* Test component to verify list toggle functionality */}
                  <TestListToggle />
                  {/* Test component for follow button functionality */}
                  <TestFollowButton />
                  {/* Development mode toggle (only shown in development) */}
                  <DevModeToggle />
                  {/* Offline mode indicator */}
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