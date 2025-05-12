/* src/App.jsx */
import React, { Suspense, lazy, useEffect, useState } from 'react'; // Added useState
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
import TestQuickAdd from '@/components/UI/TestQuickAdd';
import useAuthStore from '@/stores/useAuthStore';
import useUserListStore from '@/stores/useUserListStore'; // Ensure this is used or remove
import { logError, logInfo, logDebug } from '@/utils/logger';

// Enhanced lazy loading with error handling
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

// Query Client setup
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, 
      retry: 1,
    },
  },
});

function App() {
  const { checkAuthStatus, isAuthenticated, user } = useAuthStore();
  const [quickAddItem, setQuickAddItem] = useState(null); // Changed from React.useState
  const [isModalOpen, setIsModalOpen] = useState(false); // Changed from React.useState
  
  // User list store (ensure it's used if imported)
  // const fetchUserLists = useUserListStore(state => state.fetchUserLists);
  // const userLists = useUserListStore(state => state.userLists);
  // const isLoadingLists = useUserListStore(state => state.isLoading);

  const handleOpenQuickAdd = (item) => {
    setQuickAddItem(item);
    setIsModalOpen(true);
    // if (isAuthenticated && user) {
    //   logDebug('[App] Fetching user lists for quick add modal');
    //   fetchUserLists({ createdByUser: true }, queryClient); // Example usage
    // }
  };

  const handleCloseQuickAdd = () => {
    setIsModalOpen(false);
    setQuickAddItem(null);
  };

  useEffect(() => {
    let authInitialized = false;
    const initializeAuth = async () => {
      if (authInitialized) return;
      authInitialized = true; // Set immediately to prevent multiple runs

      const shouldForceCheck = !user; // Only force if no user in store
      
      try {
        if (process.env.NODE_ENV === 'development' && localStorage.getItem('bypass_auth_check') === 'true') {
          logDebug('[App] Auth bypass enabled, skipping auth check');
          return;
        }
        
        const authPromise = checkAuthStatus(shouldForceCheck);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Auth check timed out')), 3000)
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
    initializeAuth();

    const authCheckInterval = setInterval(() => {
      if (useAuthStore.getState().isAuthenticated) { // Get fresh state
        logDebug('[App] Running scheduled auth check');
        checkAuthStatus(false).catch(err => 
          logError('[App] Scheduled auth check failed:', { message: err.message })
        );
      }
    }, 5 * 60 * 1000); 
    
    return () => clearInterval(authCheckInterval);
  }, [checkAuthStatus, user]); // Added user to dependency array

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <Router>
          <QuickAddProvider openQuickAdd={handleOpenQuickAdd} onClose={handleCloseQuickAdd}>
            <ListDetailProvider>
              <PlacesApiProvider>
                <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
                  <Navbar />
                  <main className="flex-grow pt-16"> {/* Adjust pt if navbar height changes */}
                    <Suspense fallback={<EnhancedLoadingFallback componentName="Page" />}>
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
                  <AddToListModal
                    isOpen={isModalOpen}
                    onClose={handleCloseQuickAdd}
                    itemToAdd={quickAddItem} // Corrected prop name from item to itemToAdd
                  />
                  {/* Diagnostic components - consider removing or conditionally rendering for production */}
                  {process.env.NODE_ENV === 'development' && (
                    <>
                      <ListDataStatus />
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
