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
    const fetchUserLists = useUserListStore((state) => state.fetchUserLists);
    const userLists = useUserListStore((state) => state.userLists);
    const addToList = useUserListStore((state) => state.addToList);
    const hasFetched = useRef(false);
    const fetchError = useRef(null); // For QuickAddProvider context
  
    useEffect(() => {
      if (!hasFetched.current) {
        console.log('[App] useEffect running: Initial data fetch and auth check.');
        checkAuth(); // Check authentication status on load
  
        Promise.all([
          fetchCities().catch((err) => {
            console.error('[App] fetchCities failed:', err);
            return []; // Return empty array on failure
          }),
          fetchCuisines().catch((err) => {
            console.error('[App] fetchCuisines failed:', err);
            return []; // Return empty array on failure
          }),
          // Fetch user lists only if authenticated after initial check
          // Note: This relies on checkAuth potentially updating isAuthenticated state
          // Consider triggering this fetch *after* checkAuth completes if needed immediately
          // Or rely on components fetching their required data when they mount
        ])
          .then(([cities, cuisines]) => {
            console.log('[App] Initial common data fetch completed (Cities, Cuisines).');
            // If authenticated, trigger list fetch *now* if not already triggered by components
            if (useAuthStore.getState().isAuthenticated) {
              console.log('[App] User authenticated, triggering list fetch.');
               useUserListStore.getState().fetchUserLists().catch(err => {
                   console.error('[App] fetchUserLists failed (triggered from App useEffect):', err);
                   fetchError.current = err.message || 'Failed to fetch user lists'; // Set error for context
               });
            }
          })
          .catch((err) => console.error('[App] Unexpected initial fetch error:', err));
  
        hasFetched.current = true; // Ensure this block runs only once
      }
    }, [checkAuth, fetchCities, fetchCuisines]); // Dependencies for initial common fetch
  
  
    // Memoize props for QuickAddProvider to prevent unnecessary context updates
    const memoizedUserLists = useMemo(() => userLists, [userLists]);
    const memoizedAddToList = useCallback(addToList, [addToList]);
  
    console.log('[App] Rendering - isAuthenticated:', isAuthenticated); // Keep for debugging auth flow
  
    return (
      <QuickAddProvider
        userLists={memoizedUserLists}
        addToList={memoizedAddToList}
        fetchError={fetchError.current} // Pass potentially fetched error
      >
        <BrowserRouter>
          <QuickAddPopup />
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
                  <Route path="/admin" element={<ErrorBoundary><AdminPanel /></ErrorBoundary>} />
                  <Route path="/profile" element={<ErrorBoundary><Profile /></ErrorBoundary>} />
                  <Route path="/bulk-add" element={<ErrorBoundary><BulkAdd /></ErrorBoundary>} />
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
  
  export default React.memo(App); // Use React.memo if App component itself is pure