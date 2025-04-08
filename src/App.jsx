/* src/App.jsx */
import React, { Suspense, lazy, useEffect, useRef, useMemo, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QuickAddProvider } from '@/context/QuickAddContext';
import PageContainer from '@/layouts/PageContainer.jsx';
import QuickAddPopup from '@/components/QuickAddPopup.jsx';
import ErrorBoundary from '@/components/ErrorBoundary.jsx';
import LoadingSpinner from '@/components/UI/LoadingSpinner.jsx';
import useAuthStore from '@/stores/useAuthStore';
import useUIStateStore from '@/stores/useUIStateStore';
import useUserListStore from '@/stores/useUserListStore';
import ProtectedRoute from '@/components/ProtectedRoute.jsx';

const FloatingQuickAdd = lazy(() => import('@/components/FloatingQuickAdd.jsx'));
const Home = lazy(() => import('@/pages/Home/index.jsx'));
const Trending = lazy(() => import('@/pages/Trending.jsx'));
const Dashboard = lazy(() => import('@/pages/Dashboard/index.jsx'));
const Lists = lazy(() => import('@/pages/Lists/index.jsx'));
const MyLists = lazy(() => import('@/pages/Lists/MyLists.jsx'));
const NewList = lazy(() => import('@/pages/Lists/NewList.jsx'));
const ListDetail = lazy(() => import('@/pages/Lists/ListDetail.jsx'));
const RestaurantDetail = lazy(() => import('@/pages/RestaurantDetail.jsx'));
const DishDetail = lazy(() => import('@/pages/DishDetail.jsx'));
const AdminPanel = lazy(() => import('@/pages/AdminPanel.jsx'));
const Login = lazy(() => import('@/pages/Login.jsx'));
const Register = lazy(() => import('@/pages/Register.jsx'));
const Profile = lazy(() => import('@/pages/Profile.jsx'));
const BulkAdd = lazy(() => import('@/pages/BulkAdd.jsx'));
const SearchResultsPage = lazy(() => import('@/pages/Search.jsx'));

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
  const userLists = useUserListStore((state) => state.userLists);
  const addToList = useUserListStore((state) => state.addToList);
  const hasFetchedInitialCommon = useRef(false);
  const fetchError = useRef(null);

  useEffect(() => {
    if (!hasFetchedInitialCommon.current) {
      console.log('[App] useEffect running: Initial data fetch and auth check.');
      checkAuth();
      Promise.all([
        fetchCities().catch((err) => {
          console.error('[App] Initial fetchCities failed:', err);
          fetchError.current = err.message || 'Failed to load cities';
          return [];
        }),
        fetchCuisines().catch((err) => {
          console.error('[App] Initial fetchCuisines failed:', err);
          if (!fetchError.current) fetchError.current = err.message || 'Failed to load cuisines';
          return [];
        }),
      ])
        .then(() => {
          console.log('[App] Initial common data fetch completed.');
        })
        .catch((err) => console.error('[App] Unexpected error during initial fetch:', err));
      hasFetchedInitialCommon.current = true;
    }
  }, [checkAuth, fetchCities, fetchCuisines]);

  const memoizedUserLists = useMemo(() => userLists, [userLists]);
  const memoizedAddToList = useCallback(addToList, [addToList]);

  return (
    <QuickAddProvider userLists={memoizedUserLists} addToList={memoizedAddToList} fetchError={fetchError.current}>
      <BrowserRouter>
        <QuickAddPopup />
        <Suspense fallback={<SuspenseFallback />}>
          <Routes>
            <Route path="/login" element={<ErrorBoundary><Login /></ErrorBoundary>} />
            <Route path="/register" element={<ErrorBoundary><Register /></ErrorBoundary>} />
            <Route element={<PageContainer />}>
              <Route path="/" element={<ErrorBoundary><Home /></ErrorBoundary>} />
              <Route path="/trending" element={<ErrorBoundary><Trending /></ErrorBoundary>} />
              <Route path="/restaurant/:id" element={<ErrorBoundary><RestaurantDetail /></ErrorBoundary>} />
              <Route path="/dish/:id" element={<ErrorBoundary><DishDetail /></ErrorBoundary>} />
              <Route path="/search" element={<ErrorBoundary><SearchResultsPage /></ErrorBoundary>} />
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
                <Route path="/lists" element={<ErrorBoundary><Lists /></ErrorBoundary>}>
                  <Route index element={<ErrorBoundary><MyLists /></ErrorBoundary>} />
                  <Route path="new" element={<ErrorBoundary><NewList /></ErrorBoundary>} />
                  <Route path=":id" element={<ErrorBoundary><ListDetail /></ErrorBoundary>} />
                </Route>
                <Route path="/admin" element={
                  <ProtectedRoute>
                    {useAuthStore.getState().isSuperuser() ? <ErrorBoundary><AdminPanel /></ErrorBoundary> : <Navigate to="/" replace />}
                  </ProtectedRoute>
                } />
                <Route path="/profile" element={<ErrorBoundary><Profile /></ErrorBoundary>} />
                <Route path="/bulk-add" element={
                  <ProtectedRoute>
                    {useAuthStore.getState().isSuperuser() ? <ErrorBoundary><BulkAdd /></ErrorBoundary> : <Navigate to="/" replace />}
                  </ProtectedRoute>
                } />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
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

export default React.memo(App);