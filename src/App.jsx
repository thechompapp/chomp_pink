// src/App.jsx
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
const AdminPanel = lazy(() => import('@/pages/AdminPanel/index.tsx')); // Changed to .tsx
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

// Component to handle initial data fetching logic
const AppInitializer = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const checkAuthStatus = useAuthStore((state) => state.checkAuthStatus);
  const fetchCuisines = useUIStateStore((state) => state.fetchCuisines);
  const fetchCities = useUIStateStore((state) => state.fetchCities);
  const { isAuthenticated, isLoading: authLoading } = useAuthStore(
    useShallow((state) => ({
      isAuthenticated: state.isAuthenticated,
      isLoading: state.isLoading,
    }))
  );

  const hasFetchedInitialCommon = useRef(false);

  useEffect(() => {
    checkAuthStatus();
    if (!hasFetchedInitialCommon.current) {
      hasFetchedInitialCommon.current = true;
      Promise.all([
        fetchCities().catch((err) => {
          console.error('[AppInitializer] fetchCities failed:', err);
        }),
        fetchCuisines().catch((err) => {
          console.error('[AppInitializer] fetchCuisines failed:', err);
        }),
      ]).then(() => {
        console.log('[AppInitializer] Initial city/cuisine fetch attempt complete.');
      });
    }
  }, [checkAuthStatus, fetchCities, fetchCuisines]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated && !pathname.includes('/login') && !pathname.includes('/register')) {
      console.log('[AppInitializer] User not authenticated. Redirecting to login.');
      navigate('/login');
    }
  }, [isAuthenticated, authLoading, navigate, pathname]);

  return null;
};

const App = () => {
  const { isAuthenticated, isSuperuser, isLoading: authLoading } = useAuthStore(
    useShallow((state) => ({
      isAuthenticated: state.isAuthenticated,
      isSuperuser: state.isSuperuser,
      isLoading: state.isLoading,
    }))
  );
  const { userLists, addToList } = useUserListStore(
    useShallow((state) => ({ userLists: state.userLists, addToList: state.addToList }))
  );
  const { errorCities, errorCuisines } = useUIStateStore(
    useShallow((state) => ({ errorCities: state.errorCities, errorCuisines: state.errorCuisines }))
  );

  const providerValue = useMemo(
    () => ({
      userLists: userLists,
      addToList: addToList,
      fetchError: errorCities || errorCuisines,
    }),
    [userLists, addToList, errorCities, errorCuisines]
  );

  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingSpinner message="Checking authentication..." />
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <PlacesApiProvider>
        <QuickAddProvider {...providerValue}>
          <BrowserRouter>
            <QuickAddPopup />
            <Suspense fallback={<SuspenseFallback />}>
              <AppInitializer />
              <Routes>
                <Route path="/login" element={<ErrorBoundary><Login /></ErrorBoundary>} />
                <Route path="/register" element={<ErrorBoundary><Register /></ErrorBoundary>} />
                <Route element={<PageContainer />}>
                  <Route path="/" element={<ErrorBoundary><Home /></ErrorBoundary>} />
                  <Route path="/trending" element={<ErrorBoundary><Trending /></ErrorBoundary>} />
                  <Route path="/restaurant/:id" element={<ErrorBoundary><RestaurantDetail /></ErrorBoundary>} />
                  <Route path="/dish/:id" element={<ErrorBoundary><DishDetail /></ErrorBoundary>} />
                  <Route path="/search" element={<ErrorBoundary><SearchResultsPage /></ErrorBoundary>} />
                  <Route path="/lists/:id" element={<ErrorBoundary><ListDetail /></ErrorBoundary>} />
                  <Route element={<ProtectedRoute />}>
                    <Route path="/dashboard" element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
                    <Route path="/lists" element={<ErrorBoundary><Lists /></ErrorBoundary>}>
                      <Route index element={<ErrorBoundary><MyLists /></ErrorBoundary>} />
                      <Route path="new" element={<ErrorBoundary><NewList /></ErrorBoundary>} />
                    </Route>
                    <Route
                      path="/admin/*"
                      element={
                        isAuthenticated && isSuperuser ? (
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
                        isAuthenticated && isSuperuser ? (
                          <ErrorBoundary><BulkAdd /></ErrorBoundary>
                        ) : (
                          <Navigate to="/" replace />
                        )
                      }
                    />
                  </Route>
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
              </Routes>
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

export default React.memo(App);