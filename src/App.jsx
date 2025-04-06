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
const Lists = lazy(() => import('@/pages/Lists/index'));
const MyLists = lazy(() => import('@/pages/Lists/MyLists'));
const NewList = lazy(() => import('@/pages/Lists/NewList'));
const ListDetail = lazy(() => import('@/pages/Lists/ListDetail'));
const RestaurantDetail = lazy(() => import('@/pages/RestaurantDetail'));
const DishDetail = lazy(() => import('@/pages/DishDetail'));
const AdminPanel = lazy(() => import('@/pages/AdminPanel'));
const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
const Profile = lazy(() => import('@/pages/Profile')); // Added Profile import
const BulkAdd = lazy(() => import('@/pages/BulkAdd')); // Added BulkAdd import

const SuspenseFallback = () => (
  <div className="flex justify-center items-center h-[calc(100vh-150px)]">
    <LoadingSpinner message="Loading page..." />
  </div>
);

const App = () => {
  // Selectors using primitive values where possible to minimize re-renders
  const checkAuth = useAuthStore(state => state.checkAuthStatus);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const fetchCuisines = useUIStateStore(state => state.fetchCuisines);
  const fetchCities = useUIStateStore(state => state.fetchCities);

  useEffect(() => {
    checkAuth();
    const fetchInitialData = async () => {
      // Fetch cities and cuisines in parallel for faster startup
      await Promise.all([fetchCities(), fetchCuisines()]);
    };
    fetchInitialData();
    // Dependencies are stable functions, safe for useEffect
  }, [checkAuth, fetchCities, fetchCuisines]);

  console.log('[App] Rendering - isAuthenticated:', isAuthenticated);

  return (
    <QuickAddProvider>
      <BrowserRouter>
        <QuickAddPopup />
        <Suspense fallback={<SuspenseFallback />}>
          <Routes>
            {/* Public Routes outside PageContainer */}
            <Route path="/login" element={<ErrorBoundary><Login /></ErrorBoundary>} />
            <Route path="/register" element={<ErrorBoundary><Register /></ErrorBoundary>} />

            {/* Routes within PageContainer (includes Navbar) */}
            <Route element={<PageContainer />}>
              {/* Publicly Accessible Content Routes */}
              <Route path="/" element={<ErrorBoundary><Home /></ErrorBoundary>} />
              <Route path="/trending" element={<ErrorBoundary><Trending /></ErrorBoundary>} />
              <Route path="/restaurant/:id" element={<ErrorBoundary><RestaurantDetail /></ErrorBoundary>} />
              <Route path="/dish/:id" element={<ErrorBoundary><DishDetail /></ErrorBoundary>} />

              {/* Protected Routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
                <Route path="/lists" element={<ErrorBoundary><Lists /></ErrorBoundary>}>
                  <Route index element={<ErrorBoundary><MyLists /></ErrorBoundary>} />
                  <Route path="new" element={<ErrorBoundary><NewList /></ErrorBoundary>} />
                  <Route path=":id" element={<ErrorBoundary><ListDetail /></ErrorBoundary>} />
                </Route>
                <Route path="/admin" element={<ErrorBoundary><AdminPanel /></ErrorBoundary>} />
                <Route path="/profile" element={<ErrorBoundary><Profile /></ErrorBoundary>} /> {/* Added Profile route */}
                <Route path="/bulk-add" element={<ErrorBoundary><BulkAdd /></ErrorBoundary>} /> {/* Added BulkAdd route */}
              </Route>

              {/* Catch-all Redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
          {/* FloatingQuickAdd only rendered if authenticated */}
          {isAuthenticated && <FloatingQuickAdd />}
        </Suspense>
      </BrowserRouter>
    </QuickAddProvider>
  );
};

// Use React.memo for App component if it's likely to re-render unnecessarily
// (though often not needed at the top level if children are managed well)
export default React.memo(App);