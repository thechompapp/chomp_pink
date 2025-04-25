/* src/App.jsx */
import React, { Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './queryClient';
import useAuthStore from './stores/useAuthStore';

// Layouts
import Navbar from './layouts/Navbar'; // Use updated Navbar

// Context Providers
import { QuickAddProvider } from './context/QuickAddContext';
import { PlacesApiProvider } from './context/PlacesApiContext';

// Components
import LoadingSpinner from './components/UI/LoadingSpinner';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import FloatingQuickAdd from './components/FloatingQuickAdd';

// Page Components (Lazy Loaded)
const HomePage = React.lazy(() => import('./pages/Home'));
const LoginPage = React.lazy(() => import('./pages/Login'));
const RegisterPage = React.lazy(() => import('./pages/Register'));
const TrendingPage = React.lazy(() => import('./pages/Trending'));
const SearchResultsPage = React.lazy(() => import('./pages/Search'));
const RestaurantDetailPage = React.lazy(() => import('./pages/RestaurantDetail'));
const DishDetailPage = React.lazy(() => import('./pages/DishDetail'));
const ListsPage = React.lazy(() => import('./pages/Lists'));
const ProfilePage = React.lazy(() => import('./pages/Profile'));
const MySubmissionsPage = React.lazy(() => import('./pages/MySubmissions'));
const AdminPanelPage = React.lazy(() => import('./pages/AdminPanel'));
const BulkAddPage = React.lazy(() => import('./pages/BulkAdd'));

function App() {
  useEffect(() => {
    useAuthStore.getState().checkAuthStatus();
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Router>
           {/* Removed explicit bg/text classes - relies on body styles from index.css */}
          <div className="min-h-screen flex flex-col">
            <QuickAddProvider>
              <PlacesApiProvider>
                <Navbar /> {/* Use updated Navbar */}
                 {/* Added flex-grow to make content area fill height */}
                <main className="flex-grow">
                  <Suspense
                    fallback={
                      <div className="flex justify-center items-center h-[calc(100vh-80px)]">
                        <LoadingSpinner message="Loading page..." />
                      </div>
                    }
                  >
                    <Routes>
                      {/* Public Routes */}
                      <Route path="/" element={<HomePage />} />
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/register" element={<RegisterPage />} />
                      <Route path="/trending" element={<TrendingPage />} />
                      <Route path="/search" element={<SearchResultsPage />} />
                      <Route path="/restaurant/:restaurantId" element={<RestaurantDetailPage />} />
                      <Route path="/dish/:dishId" element={<DishDetailPage />} />
                      <Route path="/lists/*" element={<ListsPage />} />

                      {/* Protected Routes */}
                      <Route element={<ProtectedRoute />}>
                        <Route path="/profile/me" element={<ProfilePage />} />
                        <Route path="/my-submissions" element={<MySubmissionsPage />} />
                      </Route>

                      {/* Admin Routes */}
                      <Route element={<ProtectedRoute requireSuperuser={true} />}>
                        <Route path="/admin" element={<AdminPanelPage />} />
                        <Route path="/admin/bulk-add" element={<BulkAddPage />} />
                      </Route>

                      {/* 404 Not Found Route */}
                      <Route
                        path="*"
                        element={
                          // Use theme text color
                          <div className="text-center py-10 text-foreground">
                            <h2 className="text-xl font-semibold mb-2">404: Page Not Found</h2>
                            <Link to="/" className="text-primary hover:underline">
                              Go Home
                            </Link>
                          </div>
                        }
                      />
                    </Routes>
                  </Suspense>
                </main>
                <FloatingQuickAdd />
              </PlacesApiProvider>
            </QuickAddProvider>
          </div>
        </Router>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;