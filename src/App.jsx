/* src/App.jsx */
import React, { Suspense, lazy, useEffect, useRef, useMemo, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QuickAddProvider } from '@/context/QuickAddContext';
import PageContainer from '@/layouts/PageContainer.jsx';
import QuickAddPopup from '@/components/QuickAddPopup.jsx';
import ErrorBoundary from '@/components/ErrorBoundary.jsx';
import LoadingSpinner from '@/components/UI/LoadingSpinner.jsx';
import useAuthStore from '@/stores/useAuthStore';
import { useShallow } from 'zustand/react/shallow'; // Import shallow selector helper
import { useUIStateStore } from '@/stores/useUIStateStore';
import useUserListStore from '@/stores/useUserListStore';
import ProtectedRoute from '@/components/ProtectedRoute.jsx';

// Lazy load pages (keep as is)
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

// Separate component to handle initial data fetching logic
const AppInitializer = () => {
  // Select only necessary functions, which are stable
  const checkAuthStatus = useAuthStore(state => state.checkAuthStatus);
  const fetchCuisines = useUIStateStore(state => state.fetchCuisines);
  const fetchCities = useUIStateStore(state => state.fetchCities);

  const hasFetchedInitialCommon = useRef(false);
  const fetchErrorRef = useRef(null);

  useEffect(() => {
    checkAuthStatus(); // Check auth on mount
    if (!hasFetchedInitialCommon.current) {
      hasFetchedInitialCommon.current = true;
      // Fetch initial data
      Promise.all([
        fetchCities().catch((err) => {
          console.error('[AppInitializer] fetchCities failed:', err);
          if (!fetchErrorRef.current) fetchErrorRef.current = err.message || 'Failed to load cities';
        }),
        fetchCuisines().catch((err) => {
          console.error('[AppInitializer] fetchCuisines failed:', err);
          if (!fetchErrorRef.current) fetchErrorRef.current = err.message || 'Failed to load cuisines';
        }),
      ]).then(() => {
        console.log('[AppInitializer] Initial city/cuisine fetch attempt complete.');
      });
    }
    // Only run once on mount
  }, [checkAuthStatus, fetchCities, fetchCuisines]);

  // This component doesn't render UI directly, just runs effects
  // Return the potential error message stored in the ref
  return fetchErrorRef.current;
};


const App = () => {
  // Use stable selectors or shallow comparison for objects/arrays
  // Select only the needed values or use shallow compare
  const { userLists, addToList } = useUserListStore(
    useShallow(state => ({ userLists: state.userLists, addToList: state.addToList }))
  );
  const { isAuthenticated, isSuperuser } = useAuthStore(
    useShallow(state => ({ isAuthenticated: state.isAuthenticated, isSuperuser: state.isSuperuser }))
  );
  // Get error states separately if needed, they are likely less frequent changes
  const errorCities = useUIStateStore(state => state.errorCities);
  const errorCuisines = useUIStateStore(state => state.errorCuisines);

  // Run initializer effects
  const fetchError = AppInitializer();
  // Combine potential errors
  const uiError = fetchError || errorCities || errorCuisines;

  // Memoize provider value if necessary, but individual props are likely stable enough
  const providerValue = useMemo(() => ({
      userLists: userLists,
      addToList: addToList,
      fetchError: uiError
  }), [userLists, addToList, uiError]);

  return (
    // Pass stable or memoized value to provider
    <QuickAddProvider {...providerValue}>
      <BrowserRouter>
        <QuickAddPopup /> {/* Render Popup globally */}
        <Suspense fallback={<SuspenseFallback />}>
          <Routes>
            {/* Public routes without layout */}
            <Route path="/login" element={<ErrorBoundary><Login /></ErrorBoundary>} />
            <Route path="/register" element={<ErrorBoundary><Register /></ErrorBoundary>} />

            {/* Routes with PageContainer layout */}
            <Route element={<PageContainer />}>
              {/* Public routes */}
              <Route path="/" element={<ErrorBoundary><Home /></ErrorBoundary>} />
              <Route path="/trending" element={<ErrorBoundary><Trending /></ErrorBoundary>} />
              <Route path="/restaurant/:id" element={<ErrorBoundary><RestaurantDetail /></ErrorBoundary>} />
              <Route path="/dish/:id" element={<ErrorBoundary><DishDetail /></ErrorBoundary>} />
              <Route path="/search" element={<ErrorBoundary><SearchResultsPage /></ErrorBoundary>} />
              <Route path="/lists/:id" element={<ErrorBoundary><ListDetail /></ErrorBoundary>} />

              {/* Protected routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
                <Route path="/lists" element={<ErrorBoundary><Lists /></ErrorBoundary>}>
                  <Route index element={<ErrorBoundary><MyLists /></ErrorBoundary>} />
                  <Route path="new" element={<ErrorBoundary><NewList /></ErrorBoundary>} />
                  {/* Detail route is public now */}
                </Route>
                <Route
                  path="/admin"
                  element={
                    isSuperuser() ? (
                      <ErrorBoundary><AdminPanel /></ErrorBoundary>
                    ) : (
                      <Navigate to="/" replace />
                    )
                  }
                />
                <Route path="/profile" element={<ErrorBoundary><Profile /></ErrorBoundary>} />
                <Route
                  path="/bulk-add"
                  element={
                    isSuperuser() ? (
                      <ErrorBoundary><BulkAdd /></ErrorBoundary>
                    ) : (
                      <Navigate to="/" replace />
                    )
                  }
                />
              </Route>

              {/* Catch-all route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>

          {/* Floating Quick Add button visible only when logged in */}
          {isAuthenticated && (
            <Suspense fallback={<div className="fixed bottom-6 right-6 z-50"><LoadingSpinner size="sm" /></div>}>
              <FloatingQuickAdd />
            </Suspense>
          )}
        </Suspense>
      </BrowserRouter>
    </QuickAddProvider>
  );
};

export default React.memo(App);