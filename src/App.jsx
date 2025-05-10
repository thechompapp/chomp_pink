/* src/App.jsx */
import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { QuickAddProvider } from '@/context/QuickAddContext';
import { PlacesApiProvider } from '@/context/PlacesApiContext';
import Navbar from '@/layouts/Navbar';
import FloatingQuickAdd from '@/components/FloatingQuickAdd';
import ErrorBoundary from '@/components/ErrorBoundary';
import EnhancedLoadingFallback from '@/components/UI/EnhancedLoadingFallback';
import useAuthStore from '@/stores/useAuthStore';
import { logError, logInfo } from '@/utils/logger';

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

const Register = enhancedLazy(() => import('./pages/Register'), 'Register');
const Trending = enhancedLazy(() => import('./pages/Trending'), 'Trending');
const Search = enhancedLazy(() => import('./pages/Search'), 'Search');
const RestaurantDetail = enhancedLazy(() => import('./pages/RestaurantDetail'), 'RestaurantDetail');
const DishDetail = enhancedLazy(() => import('./pages/DishDetail'), 'DishDetail');
const Lists = enhancedLazy(() => import('./pages/Lists'), 'Lists');
const MyLists = enhancedLazy(() => import('./pages/Lists/MyLists'), 'MyLists');
const NewList = enhancedLazy(() => import('./pages/Lists/NewList'), 'NewList');
const MySubmissions = enhancedLazy(() => import('./pages/MySubmissions'), 'MySubmissions');
const AdminPanel = enhancedLazy(() => import('./pages/AdminPanel'), 'AdminPanel');

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
  const { checkAuthStatus, isAuthenticated } = useAuthStore();

  React.useEffect(() => {
    const initializeAuth = async () => {
      const authSuccess = await checkAuthStatus();
      console.log('[App] Initial auth check result:', authSuccess, 'isAuthenticated:', isAuthenticated);
    };
    initializeAuth();
  }, [checkAuthStatus]);

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <Router>
          <QuickAddProvider>
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
                      <Route path="/lists" element={<Lists />} />
                      <Route path="/lists/mylists" element={<MyLists />} />
                      <Route path="/lists/new" element={<NewList />} />
                      <Route path="/my-submissions" element={<MySubmissions />} />
                      <Route path="/admin" element={<AdminPanel />} />
                      <Route path="/bulk-add" element={<BulkAddPage />} />
                    </Routes>
                  </Suspense>
                </main>
                <FloatingQuickAdd />
              </div>
            </PlacesApiProvider>
          </QuickAddProvider>
        </Router>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

export default App;