// src/App.jsx
import React, { Suspense, lazy, useEffect } from 'react'; // Import Suspense and lazy
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QuickAddProvider } from './context/QuickAddContext';
import PageContainer from './layouts/PageContainer'; // Eager load layout
import QuickAddPopup from './components/QuickAddPopup'; // Eager load global components
import ErrorBoundary from './components/ErrorBoundary'; // Eager load ErrorBoundary
import LoadingSpinner from './components/UI/LoadingSpinner'; // Import LoadingSpinner for Suspense fallback
import useAuthStore from './stores/useAuthStore';

// --- Lazy Load Page Components ---
const Home = lazy(() => import('./pages/Home'));
const Trending = lazy(() => import('./pages/Trending'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Lists = lazy(() => import('./pages/Lists')); // Lists layout/wrapper
const MyLists = lazy(() => import('./pages/Lists/MyLists'));
const ListDetail = lazy(() => import('./pages/Lists/ListDetail'));
const RestaurantDetail = lazy(() => import('./pages/RestaurantDetail'));
const DishDetail = lazy(() => import('./pages/DishDetail'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
// Add any other page-level components here if needed

// Define a simple fallback UI for Suspense
const SuspenseFallback = () => (
    <div className="flex justify-center items-center h-[calc(100vh-150px)]"> {/* Adjust height as needed */}
        <LoadingSpinner message="Loading page..." />
    </div>
);

const App = () => {
  // Auth check remains the same
  const checkAuth = useAuthStore((state) => state.checkAuthStatus);
  useEffect(() => {
    console.log('[App.jsx useEffect] Triggering auth status check on mount...');
    checkAuth();
  }, [checkAuth]);

  return (
    <QuickAddProvider>
      <BrowserRouter>
        <QuickAddPopup /> {/* Render global components outside Suspense */}
        {/* Wrap the entire Routes component with Suspense */}
        <Suspense fallback={<SuspenseFallback />}>
          <Routes>
            {/* Routes within the main PageContainer */}
            <Route element={<PageContainer />}>
                {/* Wrap individual routes with ErrorBoundary */}
                <Route path="/" element={<ErrorBoundary><Home /></ErrorBoundary>} />
                <Route path="/trending" element={<ErrorBoundary><Trending /></ErrorBoundary>} />
                <Route path="/dashboard" element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
                {/* Nested routes for Lists */}
                <Route path="/lists" element={<ErrorBoundary><Lists /></ErrorBoundary>}>
                    {/* Use lazy loaded components within nested routes */}
                    <Route index element={<ErrorBoundary><MyLists /></ErrorBoundary>} />
                    <Route path=":id" element={<ErrorBoundary><ListDetail /></ErrorBoundary>} />
                </Route>
                <Route path="/restaurant/:id" element={<ErrorBoundary><RestaurantDetail /></ErrorBoundary>} />
                <Route path="/dish/:id" element={<ErrorBoundary><DishDetail /></ErrorBoundary>} />
                <Route path="/admin" element={<ErrorBoundary><AdminPanel /></ErrorBoundary>} />
                {/* Fallback within PageContainer */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Route>

            {/* Routes OUTSIDE PageContainer */}
            <Route path="/login" element={<ErrorBoundary><Login /></ErrorBoundary>} />
            <Route path="/register" element={<ErrorBoundary><Register /></ErrorBoundary>} />

          </Routes>
        </Suspense>
      </BrowserRouter>
    </QuickAddProvider>
  );
};

export default App;