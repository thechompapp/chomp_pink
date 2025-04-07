import React, { Suspense, lazy, useEffect, useRef, useMemo, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QuickAddProvider } from '@/context/QuickAddContext';
import PageContainer from '@/layouts/PageContainer';
import QuickAddPopup from '@/components/QuickAddPopup';
import ErrorBoundary from '@/components/ErrorBoundary';
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import useAuthStore from '@/stores/useAuthStore';
import useUIStateStore from '@/stores/useUIStateStore';
import useUserListStore from '@/stores/useUserListStore';
import ProtectedRoute from '@/components/ProtectedRoute';

// Lazy load FloatingQuickAdd
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

const SuspenseFallback = () => (
    <div className="flex justify-center items-center h-[calc(100vh-150px)]">
        <LoadingSpinner message="Loading page..." />
    </div>
);

const App = () => {
    const checkAuth = useAuthStore(state => state.checkAuthStatus);
    const isAuthenticated = useAuthStore(state => state.isAuthenticated);
    const fetchCuisines = useUIStateStore(state => state.fetchCuisines);
    const fetchCities = useUIStateStore(state => state.fetchCities);
    const fetchUserLists = useUserListStore(state => state.fetchUserLists);
    const userLists = useUserListStore(state => state.userLists);
    const addToList = useUserListStore(state => state.addToList);
    const hasFetched = useRef(false);
    const fetchError = useRef(null);

    useEffect(() => {
        if (!hasFetched.current) {
            console.log('[App] useEffect running');
            checkAuth();
            Promise.all([
                fetchCities().catch(err => {
                    console.error('[App] fetchCities failed:', err);
                    return [];
                }),
                fetchCuisines().catch(err => {
                    console.error('[App] fetchCuisines failed:', err);
                    return [];
                }),
                isAuthenticated
                    ? fetchUserLists().catch(err => {
                          console.error('[App] fetchUserLists failed:', err);
                          fetchError.current = err.message || 'Failed to fetch user lists';
                          return [];
                      })
                    : Promise.resolve([]),
            ])
                .then(([cities, cuisines, lists]) => {
                    console.log('[App] Initial fetch completed');
                })
                .catch(err => console.error('[App] Unexpected fetch error:', err));
            hasFetched.current = true;
        }
    }, [checkAuth, fetchCities, fetchCuisines, fetchUserLists, isAuthenticated]);

    // Memoize QuickAddProvider props to prevent unnecessary context updates
    const memoizedUserLists = useMemo(() => userLists, [userLists]);
    const memoizedAddToList = useCallback(addToList, [addToList]);

    console.log('[App] Rendering - isAuthenticated:', isAuthenticated);

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
                            <Route element={<ProtectedRoute />}>
                                <Route path="/dashboard" element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
                                <Route path="/lists" element={<ErrorBoundary><Lists /></ErrorBoundary>}>
                                    <Route index element={<ErrorBoundary><MyLists /></ErrorBoundary>} />
                                    <Route path="new" element={<ErrorBoundary><NewList /></ErrorBoundary>} />
                                    <Route path=":id" element={<ErrorBoundary><ListDetail /></ErrorBoundary>} />
                                </Route>
                                <Route path="/admin" element={<ErrorBoundary><AdminPanel /></ErrorBoundary>} />
                                <Route path="/profile" element={<ErrorBoundary><Profile /></ErrorBoundary>} />
                                <Route path="/bulk-add" element={<ErrorBoundary><BulkAdd /></ErrorBoundary>} />
                            </Route>
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Route>
                    </Routes>
                    {isAuthenticated && (
                        <Suspense fallback={<LoadingSpinner message="Loading quick add..." />}>
                            <FloatingQuickAdd />
                        </Suspense>
                    )}
                </Suspense>
            </BrowserRouter>
        </QuickAddProvider>
    );
};

export default React.memo(App);