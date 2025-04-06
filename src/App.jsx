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
const Dashboard = lazy(() => import('@/pages/Dashboard')); // For submissions page
const Lists = lazy(() => import('@/pages/Lists/index')); // Wrapper for list routes
const MyLists = lazy(() => import('@/pages/Lists/MyLists')); // List landing page (shows user's lists)
const NewList = lazy(() => import('@/pages/Lists/NewList')); // Page for creating a new list
const ListDetail = lazy(() => import('@/pages/Lists/ListDetail')); // Page for viewing a specific list
const RestaurantDetail = lazy(() => import('@/pages/RestaurantDetail'));
const DishDetail = lazy(() => import('@/pages/DishDetail'));
const AdminPanel = lazy(() => import('@/pages/AdminPanel'));
const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
// REMOVED: NightPlanner import

// Fallback component during lazy loading
const SuspenseFallback = () => (
  <div className="flex justify-center items-center h-[calc(100vh-150px)]">
    <LoadingSpinner message="Loading page..." />
  </div>
);

const App = () => {
  // Selectors using primitives or stable functions
  const checkAuth = useAuthStore(state => state.checkAuthStatus);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated); // Get auth state
  const fetchCuisines = useUIStateStore(state => state.fetchCuisines);
  const fetchCities = useUIStateStore(state => state.fetchCities);

  useEffect(() => {
    checkAuth();
    const fetchInitialData = async () => { /* ... */ };
    fetchInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // <<< Add Log Here >>>
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

// Re-add React.memo if it was removed previously, though unlikely to be the cause
export default React.memo(App);