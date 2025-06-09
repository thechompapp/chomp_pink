/* src/App.jsx */
/**
 * Production-Ready Main Application Component
 * 
 * Root application component with proper authentication integration,
 * error boundaries, and optimized performance.
 */
import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from 'react-error-boundary';

// Core Components
import { AuthProvider } from './contexts/auth/AuthContext';
import { QuickAddProvider } from './contexts/QuickAddContext';
import { CreateListProvider } from './contexts/CreateListContext';
import { PlacesApiProvider } from './contexts/PlacesApiContext';
import { FilterProvider } from './hooks/filters/FilterContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './layouts/Navbar';
import LoadingSpinner from './components/UI/LoadingSpinner';
import ErrorFallback from './components/ErrorBoundary';
import { logError, logInfo, logDebug } from './utils/logger';
import { LocationProvider } from './contexts/LocationContext';

// Lazy-loaded page components for better performance
const LoginPage = lazy(() => import('./pages/Login'));
const RegisterPage = lazy(() => import('./pages/Register'));
const HomePage = lazy(() => import('./pages/Home'));
const UserProfilePage = lazy(() => import('./pages/Profile'));
const AdminPanelPage = lazy(() => import('./pages/AdminPanel'));
const NotFoundPage = lazy(() => import('./pages/NotFound'));

// Additional page components
const SearchResultsPage = lazy(() => import('./pages/SearchResults'));
const TrendingPage = lazy(() => import('./pages/Trending'));
const MyListsPage = lazy(() => import('./pages/Lists/MyLists'));
const MySubmissionsPage = lazy(() => import('./pages/MySubmissions'));
const ListDetailPage = lazy(() => import('./pages/Lists/ListDetail'));
const RestaurantDetailPage = lazy(() => import('./pages/RestaurantDetail'));
const DishDetailPage = lazy(() => import('./pages/DishDetail'));
const MapsPage = lazy(() => import('./pages/Maps'));

// Query client configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
});

/**
 * Global Loading Component
 */
const GlobalLoading = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div className="flex flex-col items-center space-y-4">
      <LoadingSpinner size="lg" />
      <p className="text-lg font-medium text-gray-900 dark:text-white">
        Loading application...
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Please wait while we initialize your session
      </p>
    </div>
  </div>
);

/**
 * Error handler for error boundary
 */
const handleError = (error, errorInfo) => {
  logError('[App] Global error caught:', error, errorInfo);
  
  // In production, you might want to send this to an error reporting service
  if (import.meta.env.PROD) {
    // Send to error reporting service (e.g., Sentry, LogRocket, etc.)
    console.error('Production error:', error);
  }
};

/**
 * Main Layout Component with Navbar for authenticated pages
 */
const MainLayout = ({ children }) => (
  <>
    <Navbar />
    {children}
  </>
);

/**
 * Application Routes Component
 */
const AppRoutes = () => (
  <Suspense fallback={<GlobalLoading />}>
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      
      {/* Public Home Page - Anyone can browse */}
      <Route 
        path="/" 
        element={
          <MainLayout>
            <HomePage />
          </MainLayout>
        } 
      />
      
      {/* Public Search Page - Anyone can search */}
      <Route 
        path="/search" 
        element={
          <MainLayout>
            <SearchResultsPage />
          </MainLayout>
        } 
      />
      
      {/* Public Trending Page - Anyone can view trending content */}
      <Route 
        path="/trending" 
        element={
          <MainLayout>
            <TrendingPage />
          </MainLayout>
        } 
      />
      
      {/* Public Detail Pages - Anyone can view */}
      <Route 
        path="/restaurant/:restaurantId" 
        element={
          <MainLayout>
            <RestaurantDetailPage />
          </MainLayout>
        } 
      />
      
      <Route 
        path="/dish/:dishId" 
        element={
          <MainLayout>
            <DishDetailPage />
          </MainLayout>
        } 
      />
      
      {/* Protected Routes - Require Authentication */}
      <Route 
        path="/my-lists" 
        element={
          <ProtectedRoute>
            <MainLayout>
              <MyListsPage />
            </MainLayout>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/lists" 
        element={
          <ProtectedRoute>
            <MainLayout>
              <MyListsPage />
            </MainLayout>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/my-submissions" 
        element={
          <ProtectedRoute>
            <MainLayout>
              <MySubmissionsPage />
            </MainLayout>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/lists/:id" 
        element={
          <ProtectedRoute>
            <MainLayout>
              <ListDetailPage />
            </MainLayout>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/profile" 
        element={
          <ProtectedRoute>
            <MainLayout>
              <UserProfilePage />
            </MainLayout>
          </ProtectedRoute>
        } 
      />
      
      {/* Development only route */}
      {import.meta.env.DEV && (
        <Route 
          path="/auth-test" 
          element={
            <ProtectedRoute>
              <MainLayout>
                <div className="p-8">
                  <h1 className="text-2xl font-bold mb-4">Auth Test Page</h1>
                  <p>This is a development-only auth test page.</p>
                </div>
              </MainLayout>
            </ProtectedRoute>
          } 
        />
      )}
      
      {/* Admin Routes */}
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute adminOnly>
            <MainLayout>
              <AdminPanelPage />
            </MainLayout>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/admin/*" 
        element={
          <ProtectedRoute adminOnly>
            <MainLayout>
              <AdminPanelPage />
            </MainLayout>
          </ProtectedRoute>
        } 
      />
      
      {/* Maps Route */}
      <Route 
        path="/maps" 
        element={
          <MainLayout>
            <MapsPage />
          </MainLayout>
        } 
      />
      
      {/* Catch-all Route */}
      <Route path="/404" element={<NotFoundPage />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  </Suspense>
);

/**
 * Main Application Component
 */
const App = () => {
  logDebug(`[App] Application starting up {isDev: ${import.meta.env.DEV}, mode: '${import.meta.env.MODE}', timestamp: '${new Date().toISOString()}'}`);

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={handleError}
      onReset={() => window.location.reload()}
    >
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <LocationProvider>
            <QuickAddProvider>
              <CreateListProvider>
                <PlacesApiProvider>
                  <FilterProvider>
                    <div className="App bg-gray-50 dark:bg-gray-900 min-h-screen">
                      <AppRoutes />
                    </div>
                    
                    {/* Global Toast Notifications */}
                    <Toaster
                      position="top-right"
                      reverseOrder={false}
                      gutter={8}
                      containerClassName=""
                      containerStyle={{}}
                      toastOptions={{
                        // Default options for all toasts
                        className: '',
                        duration: 4000,
                        style: {
                          background: '#363636',
                          color: '#fff',
                        },
                        // Default options for specific toast types
                        success: {
                          duration: 3000,
                          theme: {
                            primary: 'green',
                            secondary: 'black',
                          },
                        },
                        error: {
                          duration: 5000,
                          theme: {
                            primary: 'red',
                            secondary: 'black',
                          },
                        },
                      }}
                    />
                  </FilterProvider>
                </PlacesApiProvider>
              </CreateListProvider>
            </QuickAddProvider>
          </LocationProvider>
        </AuthProvider>
        
        {/* React Query DevTools (only in development) */}
        {import.meta.env.DEV && (
          <ReactQueryDevtools 
            initialIsOpen={false} 
            position="bottom-right"
          />
        )}
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
