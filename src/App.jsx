// src/App.jsx
import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import useAppStore from "@/hooks/useAppStore.js";
import { QuickAddProvider } from "@/context/QuickAddContext.jsx"; // Import QuickAddProvider
import QuickAddPopup from "@/components/QuickAddPopup.jsx"; // *** IMPORT QuickAddPopup ***
import Home from "@/pages/Home/index.jsx";
import Trending from "@/pages/Trending/index.jsx";
import MyLists from "@/pages/Lists/MyLists.jsx";
import ListDetail from "@/pages/Lists/ListDetail.jsx";
import RestaurantDetail from "@/pages/RestaurantDetail/index.jsx";
import DishDetail from "@/pages/DishDetail/index.jsx";
import Search from "@/pages/Search/index.jsx";
import AdminPanel from "@/pages/AdminPanel/index.jsx";
import Dashboard from "@/pages/Dashboard/index.jsx";
import PageContainer from "@/layouts/PageContainer.jsx";

const App = () => {
  const { initializeApp } = useAppStore();

  useEffect(() => {
    // Call initializeApp only once on mount if not already initializing
    const state = useAppStore.getState();
    if (!state.isInitializing && state.trendingItems.length === 0 && state.trendingDishes.length === 0 && state.popularLists.length === 0) {
        console.log("[App.jsx useEffect] Triggering initializeApp...");
        initializeApp();
    } else {
         console.log("[App.jsx useEffect] Skipping initializeApp. isInitializing:", state.isInitializing, "Data length:", state.trendingItems.length);
    }
  }, [initializeApp]); // Dependency array includes initializeApp

  return (
    <Router>
      <QuickAddProvider>
        {/* PageContainer contains Navbar and main page content */}
        <PageContainer>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/trending" element={<Trending />} />
            <Route path="/lists" element={<MyLists />} />
            <Route path="/lists/:id" element={<ListDetail />} />
            <Route path="/restaurant/:id" element={<RestaurantDetail />} />
            <Route path="/dish/:id" element={<DishDetail />} />
            <Route path="/search" element={<Search />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/dashboard" element={<Dashboard />} />
            {/* Add other routes as needed */}
          </Routes>
        </PageContainer>

        {/* Render QuickAddPopup here, outside PageContainer, so it can overlay */}
        {/* It will only display when isOpen is true in the context */}
        <QuickAddPopup />

      </QuickAddProvider>
    </Router>
  );
};

export default App;