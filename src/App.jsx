/* src/App.jsx */
import React, {
  Suspense,
  lazy,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QuickAddProvider } from '@/context/QuickAddContext'; // Use global alias
import PageContainer from '@/layouts/PageContainer'; // Use global alias
import QuickAddPopup from '@/components/QuickAddPopup'; // Use global alias
import ErrorBoundary from '@/components/ErrorBoundary'; // Use global alias
import LoadingSpinner from '@/components/UI/LoadingSpinner'; // Use global alias
import useAuthStore from '@/stores/useAuthStore'; // Use global alias
import useUIStateStore from '@/stores/useUIStateStore'; // Use global alias
import useUserListStore from '@/stores/useUserListStore'; // Use global alias
import ProtectedRoute from '@/components/ProtectedRoute'; // Use global alias

// Lazy load components using global aliases
const FloatingQuickAdd = lazy(() => import('@/components/FloatingQuickAdd'));
const Home = lazy(() => import('@/pages/Home/index'));
const Trending = lazy(() => import('@/pages/Trending'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Lists = lazy(() => import('@/pages/Lists/index'));
const MyLists = lazy(() => import('@/pages/Lists/MyLists'));
const NewList = lazy(() => import('@/pages/Lists/NewList'));
const ListDetail = lazy(() => import('@/pages/Lists/ListDetail'));
const RestaurantDetail = lazy(() => import('@/pages/RestaurantDetail'));
const DishDetail = lazy(() => import('@/pages/DishDetail'));
const AdminPanel = lazy(() => import('@/pages/AdminPanel'));
const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
const Profile = lazy(() => import('@/pages/Profile'));
const BulkAdd = lazy(() => import('@/pages/BulkAdd'));
const SearchResultsPage = lazy(() => import('@/pages/Search')); // Renamed import for clarity

const SuspenseFallback = () => (
  <div className="flex justify-center items-center h-[calc(100vh-150px)]">
    <LoadingSpinner message="Loading page..." />
  </div>
);

const App = () => {
  const checkAuth = useAuthStore((state) => state.checkAuthStatus);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const fetchCuisines = useUIStateStore((state) => state.fetchCuisines);
  const fetchCities = useUIStateStore((state) => state.fetchCities);
  // fetchUserLists is now primarily triggered by components needing the data (e.g., MyLists)
  const userLists = useUserListStore((state) => state.userLists);
  const addToList = useUserListStore((state) => state.addToList);
  const hasFetchedInitialCommon = useRef(false);
  const fetchError = useRef(null); // For QuickAddProvider context

  // Effect for initial common data and auth check
  useEffect(() => {
    if (!hasFetchedInitialCommon.current) {
      console.log('[App] useEffect running: Initial data fetch and auth check.');
      checkAuth(); // Check authentication status on load

      Promise.all([
        fetchCities().catch((err) => {
          console.error('[App] Initial fetchCities failed:', err);
          fetchError.current = err.message || 'Failed to load cities';
          return []; // Return empty array on failure
        }),
        fetchCuisines().catch((err) => {
          console.error('[App] Initial fetchCuisines failed:', err);
          if (!fetchError.current) fetchError.current = err.message || 'Failed to load cuisines'; // Set error if not already set
          return []; // Return empty array on failure
        }),
      ])
        .then(([cities, cuisines]) => {
          console.log('[App] Initial common data fetch completed (Cities, Cuisines).');
          // List data will be fetched by components like MyLists when they mount if authenticated
        })
        .catch((err) => console.error('[App] Unexpected error during initial common data fetch:', err));

      hasFetchedInitialCommon.current = true; // Ensure this block runs only once
    }
  }, [checkAuth, fetchCities, fetchCuisines]); // Dependencies for initial common fetch


  // Memoize props for QuickAddProvider to prevent unnecessary context updates
  // userLists and addToList are stable references from Zustand, memoization might be redundant
  // but kept here for explicitness if needed elsewhere.
  const memoizedUserLists = useMemo(() => userLists, [userLists]);
  const memoizedAddToList = addToList; // Direct reference is usually fine

  // console.log('[App] Rendering - isAuthenticated:', isAuthenticated); // Keep for debugging auth flow

  return (
    <QuickAddProvider
      userLists={memoizedUserLists}
      addToList={memoizedAddToList}
      fetchError={fetchError.current} // Pass potentially set error
    >
      <BrowserRouter>
        <QuickAddPopup /> {/* Ensure this is inside Provider */}
        <Suspense fallback={<SuspenseFallback />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<ErrorBoundary><Login /></ErrorBoundary>} />
            <Route path="/register" element={<ErrorBoundary><Register /></ErrorBoundary>} />

            {/* Routes within PageContainer Layout */}
            <Route element={<PageContainer />}>
              <Route path="/" element={<ErrorBoundary><Home /></ErrorBoundary>} />
              <Route path="/trending" element={<ErrorBoundary><Trending /></ErrorBoundary>} />
              <Route path="/restaurant/:id" element={<ErrorBoundary><RestaurantDetail /></ErrorBoundary>} />
              <Route path="/dish/:id" element={<ErrorBoundary><DishDetail /></ErrorBoundary>} />
              <Route path="/search" element={<ErrorBoundary><SearchResultsPage /></ErrorBoundary>} /> {/* Added search results page route */}

              {/* Protected Routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
                <Route path="/lists" element={<ErrorBoundary><Lists /></ErrorBoundary>}>
                  {/* Nested List Routes */}
                  <Route index element={<ErrorBoundary><MyLists /></ErrorBoundary>} /> {/* Default view */}
                  <Route path="new" element={<ErrorBoundary><NewList /></ErrorBoundary>} /> {/* Create new list */}
                  <Route path=":id" element={<ErrorBoundary><ListDetail /></ErrorBoundary>} /> {/* Specific list detail */}
                </Route>
                {/* Render AdminPanel only if authenticated and superuser */}
                <Route path="/admin" element={
                   <ProtectedRoute> {/* Double check auth */}
                       {useAuthStore.getState().isSuperuser() ? <ErrorBoundary><AdminPanel /></ErrorBoundary> : <Navigate to="/" replace />}
                   </ProtectedRoute>
                } />
                <Route path="/profile" element={<ErrorBoundary><Profile /></ErrorBoundary>} />
                {/* Render BulkAdd only if authenticated and superuser */}
                <Route path="/bulk-add" element={
                    <ProtectedRoute>
                       {useAuthStore.getState().isSuperuser() ? <ErrorBoundary><BulkAdd /></ErrorBoundary> : <Navigate to="/" replace />}
                   </ProtectedRoute>
                 } />
              </Route>

              {/* Fallback Route - Navigate to Home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>

          {/* Floating Quick Add Button - Render only if authenticated */}
          {isAuthenticated && (
            <Suspense fallback={<LoadingSpinner size="sm" message="Loading..." />}>
              <FloatingQuickAdd />
            </Suspense>
          )}
        </Suspense>
      </BrowserRouter>
    </QuickAddProvider>
  );
};

// Using React.memo might offer slight performance benefit if props rarely change,
// but with context/store usage, re-renders might happen anyway. It's generally safe here.
export default React.memo(App);