// src/App.jsx
import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QuickAddProvider } from '@/context/QuickAddContext';
import PageContainer from '@/layouts/PageContainer';
import QuickAddPopup from '@/components/QuickAddPopup';
import FloatingQuickAdd from '@/components/FloatingQuickAdd';
import ErrorBoundary from '@/components/ErrorBoundary';
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import useAuthStore from '@/stores/useAuthStore';
import useUIStateStore from '@/stores/useUIStateStore';
import ProtectedRoute from '@/components/ProtectedRoute';

// Lazy load pages
const Home = lazy(() => import('@/pages/Home/index'));
const Trending = lazy(() => import('@/pages/Trending'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Lists = lazy(() => import('@/pages/Lists'));
const MyLists = lazy(() => import('@/pages/Lists/MyLists'));
const ListDetail = lazy(() => import('@/pages/Lists/ListDetail'));
const RestaurantDetail = lazy(() => import('@/pages/RestaurantDetail'));
const DishDetail = lazy(() => import('@/pages/DishDetail'));
const AdminPanel = lazy(() => import('@/pages/AdminPanel'));
const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
// REMOVED: NightPlanner import

const SuspenseFallback = () => (
  <div className="flex justify-center items-center h-[calc(100vh-150px)]">
    <LoadingSpinner message="Loading page..." />
  </div>
);

const App = () => {
  // Selectors using primitives or stable functions
  const checkAuth = useAuthStore(state => state.checkAuthStatus);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const fetchCuisines = useUIStateStore(state => state.fetchCuisines);
  const fetchCities = useUIStateStore(state => state.fetchCities);

  useEffect(() => {
    // Check auth status on initial load
    checkAuth();

    // Fetch initial UI data (cities, cuisines)
    const fetchInitialData = async () => {
      try {
        // Use Promise.allSettled to handle potential errors independently
        const results = await Promise.allSettled([fetchCities(), fetchCuisines()]);
        results.forEach((result, index) => {
            if (result.status === 'rejected') {
                const source = index === 0 ? 'cities' : 'cuisines';
                console.error(`[App] Failed to fetch initial ${source}:`, result.reason);
            }
        });
      } catch (error) {
         // This catch block might not be necessary with Promise.allSettled
         // unless the Promise.allSettled call itself throws (unlikely)
        console.error('[App] Unexpected error during initial data fetch setup:', error);
      }
    };
    fetchInitialData();
  }, [checkAuth, fetchCities, fetchCuisines]); // Dependencies for initial data fetch

  return (
    <QuickAddProvider>
      <BrowserRouter>
        {/* QuickAddPopup renders based on context state */}
        <QuickAddPopup />
        <Suspense fallback={<SuspenseFallback />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<ErrorBoundary><Login /></ErrorBoundary>} />
            <Route path="/register" element={<ErrorBoundary><Register /></ErrorBoundary>} />

            {/* Routes within PageContainer (Navbar + Main Content Area) */}
            <Route element={<PageContainer />}>
              {/* Publicly Accessible Content Routes */}
              <Route path="/" element={<ErrorBoundary><Home /></ErrorBoundary>} />
              <Route path="/trending" element={<ErrorBoundary><Trending /></ErrorBoundary>} />
              <Route path="/restaurant/:id" element={<ErrorBoundary><RestaurantDetail /></ErrorBoundary>} />
              <Route path="/dish/:id" element={<ErrorBoundary><DishDetail /></ErrorBoundary>} />

              {/* Protected Routes (Require Authentication) */}
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
                <Route path="/lists" element={<ErrorBoundary><Lists /></ErrorBoundary>}>
                  {/* Nested routes for lists, e.g., My Lists vs. specific list */}
                  <Route index element={<ErrorBoundary><MyLists /></ErrorBoundary>} />
                  <Route path=":id" element={<ErrorBoundary><ListDetail /></ErrorBoundary>} />
                  {/* Add /lists/new route here if needed */}
                </Route>
                {/* Admin route should also be protected */}
                <Route path="/admin" element={<ErrorBoundary><AdminPanel /></ErrorBoundary>} />
                {/* REMOVED: NightPlanner Route */}
              </Route>

              {/* Catch-all Redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
          {/* Floating Quick Add button shown only when authenticated */}
          {isAuthenticated && <FloatingQuickAdd />}
        </Suspense>
      </BrowserRouter>
    </QuickAddProvider>
  );
};

// Use React.memo if App component props rarely change (often the case for top-level App)
export default React.memo(App);