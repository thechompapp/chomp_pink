/* src/App.jsx */
import React, { Suspense, lazy, useEffect, useRef, useMemo, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { QuickAddProvider } from '@/context/QuickAddContext';
import { PlacesApiProvider } from '@/context/PlacesApiContext';
import PageContainer from '@/layouts/PageContainer.jsx';
import QuickAddPopup from '@/components/QuickAddPopup.jsx';
import ErrorBoundary from '@/components/ErrorBoundary.jsx';
import LoadingSpinner from '@/components/UI/LoadingSpinner.jsx';
import useAuthStore from '@/stores/useAuthStore';
import { useShallow } from 'zustand/react/shallow';
import { useUIStateStore } from '@/stores/useUIStateStore';
import useUserListStore from '@/stores/useUserListStore';
import ProtectedRoute from '@/components/ProtectedRoute.jsx';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/queryClient';

// Lazy load pages
const FloatingQuickAdd = lazy(() => import('@/components/FloatingQuickAdd.jsx'));
const Home = lazy(() => import('@/pages/Home/index.jsx'));
const Trending = lazy(() => import('@/pages/Trending/index.jsx'));
const Dashboard = lazy(() => import('@/pages/Dashboard/index.jsx'));
const Lists = lazy(() => import('@/pages/Lists/index.jsx'));
const MyLists = lazy(() => import('@/pages/Lists/MyLists.jsx'));
const NewList = lazy(() => import('@/pages/Lists/NewList.jsx'));
const ListDetail = lazy(() => import('@/pages/Lists/ListDetail.jsx'));
const RestaurantDetail = lazy(() => import('@/pages/RestaurantDetail/index.jsx'));
const DishDetail = lazy(() => import('@/pages/DishDetail/index.jsx'));
// Lazy load AdminPanel - Ensure path alias '@/' is configured in vite.config.js
const AdminPanel = lazy(() => import('@/pages/AdminPanel/index.jsx'));
const Login = lazy(() => import('@/pages/Login/index.jsx'));
const Register = lazy(() => import('@/pages/Register/index.jsx'));
const Profile = lazy(() => import('@/pages/Profile/index.jsx'));
const BulkAdd = lazy(() => import('@/pages/BulkAdd/index.jsx'));
const SearchResultsPage = lazy(() => import('@/pages/Search/index.jsx'));

const SuspenseFallback = () => (
  <div className="flex justify-center items-center h-[calc(100vh-150px)]">
    <LoadingSpinner message="Loading page..." />
  </div>
);

// AppInitializer Component (Loads initial data)
const AppInitializer = () => {
  const checkAuthStatus = useAuthStore((state) => state.checkAuthStatus);
  const fetchCuisines = useUIStateStore((state) => state.fetchCuisines);
  const fetchCities = useUIStateStore((state) => state.fetchCities);
  const hasFetchedInitialCommon = useRef(false);

  useEffect(() => {
    console.log('[AppInitializer] Running effect...');
    checkAuthStatus(); // Check auth on initial load
    if (!hasFetchedInitialCommon.current) {
      console.log('[AppInitializer] Fetching initial cities and cuisines...');
      hasFetchedInitialCommon.current = true;
      Promise.all([
        fetchCities().catch((err) => console.error('[AppInitializer] fetchCities failed:', err)),
        fetchCuisines().catch((err) => console.error('[AppInitializer] fetchCuisines failed:', err)),
      ]).then(() => console.log('[AppInitializer] Initial city/cuisine fetch attempt complete.'));
    }
  }, [checkAuthStatus, fetchCities, fetchCuisines]); // Dependencies

  return null; // This component doesn't render anything itself
};

// Main App Component
const App = () => {
  // Use shallow comparison for selecting multiple state slices
  const { isAuthenticated, isSuperuser, isLoading: authLoading } = useAuthStore(
    useShallow((state) => ({
      isAuthenticated: state.isAuthenticated,
      isSuperuser: state.isSuperuser, // Assuming isSuperuser is a function
      isLoading: state.isLoading,
    }))
  );
  const { userLists, addToList } = useUserListStore(
    useShallow((state) => ({ userLists: state.userLists, addToList: state.addToList }))
  );
  const { errorCities, errorCuisines } = useUIStateStore(
    useShallow((state) => ({ errorCities: state.errorCities, errorCuisines: state.errorCuisines }))
  );

  // Memoize provider value to prevent unnecessary re-renders of context consumers
  const providerValue = useMemo(
    () => ({ userLists, addToList, fetchError: errorCities || errorCuisines }),
    [userLists, addToList, errorCities, errorCuisines]
  );

  // Show a global loading indicator while checking auth state
  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingSpinner message="Initializing..." />
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <PlacesApiProvider>
        <QuickAddProvider {...providerValue}>
          <BrowserRouter>
            {/* QuickAddPopup is always rendered but controlled internally by context */}
            <QuickAddPopup />
            <Suspense fallback={<SuspenseFallback />}>
              <AppInitializer />
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<ErrorBoundary><Login /></ErrorBoundary>} />
                <Route path="/register" element={<ErrorBoundary><Register /></ErrorBoundary>} />

                {/* Routes within the main layout (Navbar + Content Area) */}
                <Route element={<PageContainer />}>
                  <Route path="/" element={<ErrorBoundary><Home /></ErrorBoundary>} />
                  <Route path="/trending" element={<ErrorBoundary><Trending /></ErrorBoundary>} />
                  <Route path="/restaurant/:id" element={<ErrorBoundary><RestaurantDetail /></ErrorBoundary>} />
                  <Route path="/dish/:id" element={<ErrorBoundary><DishDetail /></ErrorBoundary>} />
                  <Route path="/search" element={<ErrorBoundary><SearchResultsPage /></ErrorBoundary>} />
                  {/* Public list detail view */}
                  <Route path="/lists/:id" element={<ErrorBoundary><ListDetail /></ErrorBoundary>} />

                  {/* Protected Routes */}
                  <Route element={<ProtectedRoute />}>
                    <Route path="/dashboard" element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
                    {/* Nested routes for user's lists */}
                    <Route path="/lists" element={<ErrorBoundary><Lists /></ErrorBoundary>}>
                      {/* Index route for /lists (shows MyLists) */}
                      <Route index element={<ErrorBoundary><MyLists /></ErrorBoundary>} />
                      {/* Route for creating a new list */}
                      <Route path="new" element={<ErrorBoundary><NewList /></ErrorBoundary>} />
                      {/* Detail view under /lists/:id is handled above (publicly accessible) */}
                    </Route>
                    <Route path="/profile" element={<ErrorBoundary><Profile /></ErrorBoundary>} />

                    {/* Admin Panel Route - Protected + Superuser Check */}
                    <Route
                      path="/admin" // Match `/admin` or `/admin/*`
                      element={
                        isAuthenticated && isSuperuser() ? (
                          <ErrorBoundary>
                            <AdminPanel />
                          </ErrorBoundary>
                        ) : (
                          // Redirect non-superusers away from /admin
                          <Navigate to="/" replace />
                        )
                      }
                    />
                    {/* Bulk Add Route - Protected + Superuser Check */}
                    <Route
                      path="/bulk-add"
                      element={
                        isAuthenticated && isSuperuser() ? (
                          <ErrorBoundary><BulkAdd /></ErrorBoundary>
                        ) : (
                          // Redirect non-superusers away from /bulk-add
                          <Navigate to="/" replace />
                        )
                      }
                    />
                  </Route>

                  {/* Fallback Route for any other path */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
              </Routes>
              {/* Floating Quick Add button shown only when logged in */}
              {isAuthenticated && (
                <Suspense fallback={<div className="fixed bottom-6 right-6 z-50"><LoadingSpinner size="sm" /></div>}>
                  <FloatingQuickAdd />
                </Suspense>
              )}
            </Suspense>
          </BrowserRouter>
        </QuickAddProvider>
      </PlacesApiProvider>
    </QueryClientProvider>
  );
};

export default React.memo(App); // Memoize App to prevent unnecessary re-renders