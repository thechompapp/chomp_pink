/* src/App.jsx */
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Context Providers
import { AuthProvider } from '@/contexts/auth/AuthContext';
import { QuickAddProvider } from '@/contexts/QuickAddContext';
import { PlacesApiProvider } from '@/contexts/PlacesApiContext';

// Layout Components
import Navbar from '@/layouts/Navbar';
import Footer from '@/layouts/Footer';

// Page Components
import Home from '@/pages/Home';
import Search from '@/pages/Search';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import MyLists from '@/pages/Lists/MyLists';
import AdminPanel from '@/pages/AdminPanel';
import Profile from '@/pages/Profile';

// Component wrappers
import ProtectedRoute from '@/components/ProtectedRoute';
import ErrorBoundary from '@/components/ErrorBoundary';

// Utils
import { logInfo, logError } from '@/utils/logger';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
      onError: (error) => {
        logError('[ReactQuery] Query error:', error);
      }
    },
    mutations: {
      retry: false,
      onError: (error) => {
        logError('[ReactQuery] Mutation error:', error);
      }
    }
  }
});

function App() {
  logInfo('[App] Application starting');

  return (
    <ErrorBoundary 
      title="Application Error"
      message="The DOOF application encountered an unexpected error. Please try refreshing the page."
    >
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <QuickAddProvider>
            <PlacesApiProvider>
              <div className="min-h-screen flex flex-col">
                <ErrorBoundary 
                  title="Navigation Error"
                  message="There was an error with the navigation. Please try refreshing the page."
                >
                  <Navbar />
                </ErrorBoundary>
                
                <main className="flex-grow">
                  <ErrorBoundary 
                    title="Page Error"
                    message="There was an error loading this page content."
                  >
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/search" element={<Search />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/register" element={<Register />} />
                      <Route 
                        path="/my-lists" 
                        element={
                          <ProtectedRoute>
                            <MyLists />
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/profile" 
                        element={
                          <ProtectedRoute>
                            <Profile />
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/admin" 
                        element={
                          <ProtectedRoute adminOnly={true}>
                            <AdminPanel />
                          </ProtectedRoute>
                        } 
                      />
                    </Routes>
                  </ErrorBoundary>
                </main>
                
                <ErrorBoundary 
                  title="Footer Error"
                  message="There was an error with the footer."
                >
                  <Footer />
                </ErrorBoundary>
              </div>
            </PlacesApiProvider>
          </QuickAddProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
