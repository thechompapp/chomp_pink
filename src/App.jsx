/* src/App.jsx */
import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { QuickAddProvider } from '@/context/QuickAddContext';
import { PlacesApiProvider } from '@/context/PlacesApiContext';
import Navbar from '@/layouts/Navbar';
import FloatingQuickAdd from '@/components/FloatingQuickAdd';
import ErrorBoundary from '@/components/ErrorBoundary';
import useAuthStore from '@/stores/useAuthStore';

// Lazy-loaded pages
const Home = lazy(() => import('@/pages/Home/index'));
const Login = lazy(() => import('@/pages/Login/index'));
const Register = lazy(() => import('@/pages/Register/index'));
const Trending = lazy(() => import('@/pages/Trending/index'));
const Search = lazy(() => import('@/pages/Search/index'));
const RestaurantDetail = lazy(() => import('@/pages/RestaurantDetail/index'));
const DishDetail = lazy(() => import('@/pages/DishDetail/index'));
const Lists = lazy(() => import('@/pages/Lists/index'));
const MyLists = lazy(() => import('@/pages/Lists/MyLists'));
const NewList = lazy(() => import('@/pages/Lists/NewList'));
const MySubmissions = lazy(() => import('@/pages/MySubmissions/index'));
const AdminPanel = lazy(() => import('@/pages/AdminPanel/index'));
const BulkAdd = lazy(() => import('@/pages/BulkAdd/index'));

// Query Client setup
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  const { checkAuthStatus, isAuthenticated } = useAuthStore();

  React.useEffect(() => {
    const initializeAuth = async () => {
      const authSuccess = await checkAuthStatus();
      console.log('[App] Initial auth check result:', authSuccess, 'isAuthenticated:', isAuthenticated);
    };
    initializeAuth();
  }, [checkAuthStatus]);

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <Router>
          <QuickAddProvider>
            <PlacesApiProvider>
              <div className="flex flex-col min-h-screen">
                <Navbar />
                <main className="flex-grow pt-16">
                  <Suspense fallback={<div>Loading...</div>}>
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/register" element={<Register />} />
                      <Route path="/trending/:type" element={<Trending />} />
                      <Route path="/search" element={<Search />} />
                      <Route path="/restaurants/:id" element={<RestaurantDetail />} />
                      <Route path="/dishes/:id" element={<DishDetail />} />
                      <Route path="/lists" element={<Lists />} />
                      <Route path="/lists/mylists" element={<MyLists />} />
                      <Route path="/lists/new" element={<NewList />} />
                      <Route path="/my-submissions" element={<MySubmissions />} />
                      <Route path="/admin" element={<AdminPanel />} />
                      <Route path="/bulk-add" element={<BulkAdd />} />
                    </Routes>
                  </Suspense>
                </main>
                <FloatingQuickAdd />
              </div>
            </PlacesApiProvider>
          </QuickAddProvider>
        </Router>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

export default App;