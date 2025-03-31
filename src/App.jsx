import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "react-error-boundary";
import useAppStore from "@/hooks/useAppStore";
import { QuickAddProvider } from "@/context/QuickAddContext";
import Navbar from "@/layouts/Navbar";
import FloatingQuickAdd from "@/components/FloatingQuickAdd";
import Home from "@/pages/Home";
import Search from "@/pages/Search"; // This will resolve to src/pages/Search/index.jsx
import DishDetail from "@/pages/DishDetail";
import MyLists from "@/pages/Lists/MyLists";
import Dashboard from "@/pages/Dashboard";
import AdminPanel from "@/pages/AdminPanel";

const ErrorFallback = ({ error, resetErrorBoundary }) => (
  <div className="text-center py-10">
    <h1 className="text-2xl font-bold text-red-600">Something went wrong</h1>
    <p className="text-gray-600 mb-4">{error.message}</p>
    <button
      onClick={resetErrorBoundary}
      className="px-4 py-2 bg-[#D1B399] text-white rounded-lg hover:bg-[#b89e89]"
    >
      Try again
    </button>
  </div>
);

const App = () => {
  const { initializeTrendingData } = useAppStore();

  useEffect(() => {
    initializeTrendingData();
  }, [initializeTrendingData]);

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback} onError={(error) => console.error("ErrorBoundary caught an error:", error)}>
      <BrowserRouter>
        <QuickAddProvider>
          <div className="min-h-screen bg-gray-50">
            <Navbar />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/search" element={<Search />} />
              <Route path="/dish/:id" element={<DishDetail />} />
              <Route path="/lists" element={<MyLists />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/admin" element={<AdminPanel />} />
            </Routes>
            <FloatingQuickAdd />
          </div>
        </QuickAddProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;