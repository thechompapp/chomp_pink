// src/App.jsx
import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QuickAddProvider } from './context/QuickAddContext';
import PageContainer from './layouts/PageContainer';
import QuickAddPopup from './components/QuickAddPopup';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/UI/LoadingSpinner';
import useAuthStore from './stores/useAuthStore';
import ProtectedRoute from './components/ProtectedRoute'; // Import the ProtectedRoute component

// --- Lazy Load Page Components ---
const Home = lazy(() => import('./pages/Home'));
const Trending = lazy(() => import('./pages/Trending'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Lists = lazy(() => import('./pages/Lists'));
const MyLists = lazy(() => import('./pages/Lists/MyLists'));
const ListDetail = lazy(() => import('./pages/Lists/ListDetail'));
const RestaurantDetail = lazy(() => import('./pages/RestaurantDetail'));
const DishDetail = lazy(() => import('./pages/DishDetail'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
// Add any other page-level components here if needed

// Suspense fallback
const SuspenseFallback = () => (
    <div className="flex justify-center items-center h-[calc(100vh-150px)]">
        <LoadingSpinner message="Loading page..." />
    </div>
);

const App = () => {
  // Initial auth check on mount
  const checkAuth = useAuthStore((state) => state.checkAuthStatus);
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <QuickAddProvider>
      <BrowserRouter>
        <QuickAddPopup />
        <Suspense fallback={<SuspenseFallback />}>
          <Routes>
            {/* Routes OUTSIDE PageContainer (Login/Register are public) */}
            <Route path="/login" element={<ErrorBoundary><Login /></ErrorBoundary>} />
            <Route path="/register" element={<ErrorBoundary><Register /></ErrorBoundary>} />

            {/* Routes INSIDE PageContainer */}
            <Route element={<PageContainer />}>
                {/* Public routes within PageContainer */}
                <Route path="/" element={<ErrorBoundary><Home /></ErrorBoundary>} />
                <Route path="/trending" element={<ErrorBoundary><Trending /></ErrorBoundary>} />
                <Route path="/restaurant/:id" element={<ErrorBoundary><RestaurantDetail /></ErrorBoundary>} />
                <Route path="/dish/:id" element={<ErrorBoundary><DishDetail /></ErrorBoundary>} />

                {/* Protected routes within PageContainer */}
                <Route element={<ProtectedRoute />}> {/* Wrap protected routes */}
                    <Route path="/dashboard" element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
                    <Route path="/lists" element={<ErrorBoundary><Lists /></ErrorBoundary>}>
                        <Route index element={<ErrorBoundary><MyLists /></ErrorBoundary>} />
                        <Route path=":id" element={<ErrorBoundary><ListDetail /></ErrorBoundary>} />
                    </Route>
                    <Route path="/admin" element={<ErrorBoundary><AdminPanel /></ErrorBoundary>} />
                    {/* Add any other routes that need protection here */}
                </Route>

                {/* Fallback for unknown routes within PageContainer (after checking protected routes) */}
                {/* Consider if a logged-out user hitting a protected URL should see 404 or login */}
                {/* This setup redirects to login via ProtectedRoute first. */}
                {/* If a user is logged in but hits a non-existent route inside PageContainer: */}
                 <Route path="*" element={<Navigate to="/" replace />} />

            </Route>

             {/* Fallback for any routes not matched at all (e.g., /nonexistent-toplevel) */}
             {/* This might be redundant if the '*' inside PageContainer catches everything intended */}
             {/* <Route path="*" element={<Navigate to="/" replace />} /> */}

          </Routes>
        </Suspense>
      </BrowserRouter>
    </QuickAddProvider>
  );
};

export default App;