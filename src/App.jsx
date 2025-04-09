/* src/App.jsx */
import React, { Suspense, lazy, useEffect, useRef, useMemo, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
// Context and Layouts - Use aliases
import { QuickAddProvider } from '@/context/QuickAddContext';
import PageContainer from '@/layouts/PageContainer.jsx'; // Assuming .jsx is needed
import QuickAddPopup from '@/components/QuickAddPopup.jsx'; // Assuming .jsx is needed
import ErrorBoundary from '@/components/ErrorBoundary.jsx'; // Assuming .jsx is needed
import LoadingSpinner from '@/components/UI/LoadingSpinner.jsx'; // Assuming .jsx is needed
// Stores - Use aliases
import useAuthStore from '@/stores/useAuthStore';
import useUIStateStore from '@/stores/useUIStateStore';
import useUserListStore from '@/stores/useUserListStore';
// Components - Use aliases
import ProtectedRoute from '@/components/ProtectedRoute.jsx'; // Assuming .jsx is needed

// Lazy load pages using aliases
const FloatingQuickAdd = lazy(() => import('@/components/FloatingQuickAdd.jsx')); // Assuming .jsx
const Home = lazy(() => import('@/pages/Home/index.jsx')); // Assuming .jsx
const Trending = lazy(() => import('@/pages/Trending/index.jsx')); // Assuming .jsx
const Dashboard = lazy(() => import('@/pages/Dashboard/index.jsx')); // Assuming .jsx
const Lists = lazy(() => import('@/pages/Lists/index.jsx')); // Parent layout for lists Assuming .jsx
const MyLists = lazy(() => import('@/pages/Lists/MyLists.jsx')); // Assuming .jsx
const NewList = lazy(() => import('@/pages/Lists/NewList.jsx')); // Assuming .jsx
const ListDetail = lazy(() => import('@/pages/Lists/ListDetail.jsx')); // Assuming .jsx
const RestaurantDetail = lazy(() => import('@/pages/RestaurantDetail/index.jsx')); // Assuming .jsx
const DishDetail = lazy(() => import('@/pages/DishDetail/index.jsx')); // Assuming .jsx
const AdminPanel = lazy(() => import('@/pages/AdminPanel/index.jsx')); // Assuming .jsx
const Login = lazy(() => import('@/pages/Login/index.jsx')); // Assuming .jsx
const Register = lazy(() => import('@/pages/Register/index.jsx')); // Assuming .jsx
const Profile = lazy(() => import('@/pages/Profile/index.jsx')); // Assuming .jsx
const BulkAdd = lazy(() => import('@/pages/BulkAdd/index.jsx')); // Assuming .jsx
const SearchResultsPage = lazy(() => import('@/pages/Search/index.jsx')); // Assuming .jsx

// Fallback component for Suspense
const SuspenseFallback = () => (
  <div className="flex justify-center items-center h-[calc(100vh-150px)]">
    <LoadingSpinner message="Loading page..." />
  </div>
);

const App = () => {
  // --- Select state and actions from stores ---
  const checkAuth = useAuthStore(state => state.checkAuthStatus);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const isSuperuser = useAuthStore(state => state.isSuperuser); // Use selector method
  const fetchCuisines = useUIStateStore(state => state.fetchCuisines);
  const fetchCities = useUIStateStore(state => state.fetchCities);
  const userLists = useUserListStore(state => state.userLists);
  const addToList = useUserListStore(state => state.addToList); // Get action for QuickAddProvider
  const uiError = useUIStateStore(state => state.errorCities || state.errorCuisines); // Combine potential UI fetch errors

  // Refs to prevent multiple initial fetches
  const hasFetchedInitialCommon = useRef(false);
  const fetchErrorRef = useRef(null); // Store potential critical fetch errors

  // --- Initial Data Fetching Effect ---
  useEffect(() => {
    // Check auth status on mount
    checkAuth();

    // Fetch common data only once
    if (!hasFetchedInitialCommon.current) {
      hasFetchedInitialCommon.current = true; // Set flag immediately
      Promise.all([
        fetchCities().catch((err) => {
          console.error('[App] fetchCities failed:', err);
          if (!fetchErrorRef.current) fetchErrorRef.current = err.message || 'Failed to load cities';
          return []; // Return empty on error
        }),
        fetchCuisines().catch((err) => {
          console.error('[App] fetchCuisines failed:', err);
          if (!fetchErrorRef.current) fetchErrorRef.current = err.message || 'Failed to load cuisines';
          return []; // Return empty on error
        }),
      ]).then(() => {
         console.log("[App] Initial city/cuisine fetch attempt complete.");
      });
    }
    // Dependencies: Only run checkAuth on mount, and fetch logic once.
    // fetchCities/fetchCuisines are stable references from Zustand.
  }, [checkAuth, fetchCities, fetchCuisines]);

  // Memoize values passed to context to prevent unnecessary re-renders
  const memoizedUserLists = useMemo(() => userLists, [userLists]);
  const memoizedAddToList = useCallback(addToList, [addToList]); // addToList action is stable

  return (
    <QuickAddProvider userLists={memoizedUserLists} addToList={memoizedAddToList} fetchError={fetchErrorRef.current || uiError}>
      <BrowserRouter>
        <QuickAddPopup /> {/* Render popup outside of PageContainer */}
        <Suspense fallback={<SuspenseFallback />}>
          <Routes>
            {/* Public routes without Navbar */}
            <Route path="/login" element={<ErrorBoundary><Login /></ErrorBoundary>} />
            <Route path="/register" element={<ErrorBoundary><Register /></ErrorBoundary>} />

            {/* Routes with Navbar and standard page layout */}
            <Route element={<PageContainer />}>
              {/* Publicly accessible pages */}
              <Route path="/" element={<ErrorBoundary><Home /></ErrorBoundary>} />
              <Route path="/trending" element={<ErrorBoundary><Trending /></ErrorBoundary>} />
              <Route path="/restaurant/:id" element={<ErrorBoundary><RestaurantDetail /></ErrorBoundary>} />
              <Route path="/dish/:id" element={<ErrorBoundary><DishDetail /></ErrorBoundary>} />
              <Route path="/search" element={<ErrorBoundary><SearchResultsPage /></ErrorBoundary>} />

              {/* Protected routes requiring authentication */}
              <Route element={<ProtectedRoute />}>
                 {/* Dashboard - Now correctly fetched in its own component */}
                 <Route path="/dashboard" element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />

                {/* Nested List Routes */}
                <Route path="/lists" element={<ErrorBoundary><Lists /></ErrorBoundary>}>
                  {/* Default view for /lists - shows MyLists */}
                  <Route index element={<ErrorBoundary><MyLists /></ErrorBoundary>} />
                  {/* Route for creating a new list */}
                  <Route path="new" element={<ErrorBoundary><NewList /></ErrorBoundary>} />
                  {/* Route for viewing a specific list */}
                  <Route path=":id" element={<ErrorBoundary><ListDetail /></ErrorBoundary>} />
                </Route>

                {/* Admin Panel (Requires Superuser) */}
                {/* Check superuser status dynamically */}
                <Route path="/admin" element={
                  isSuperuser()
                    ? <ErrorBoundary><AdminPanel /></ErrorBoundary>
                    : <Navigate to="/" replace /> // Redirect if not superuser
                } />

                 {/* Profile Page */}
                 <Route path="/profile" element={<ErrorBoundary><Profile /></ErrorBoundary>} />

                {/* Bulk Add (Requires Superuser) */}
                {/* Check superuser status dynamically */}
                 <Route path="/bulk-add" element={
                   isSuperuser()
                     ? <ErrorBoundary><BulkAdd /></ErrorBoundary>
                     : <Navigate to="/" replace /> // Redirect if not superuser
                 } />
              </Route> {/* End ProtectedRoute */}

              {/* Fallback for unmatched routes within PageContainer */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route> {/* End PageContainer */}

          </Routes>

          {/* Floating Action Button (only if authenticated) */}
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

export default React.memo(App); // Memoize App if its props rarely change