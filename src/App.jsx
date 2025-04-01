// src/App.jsx (Use getState in useEffect)
import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import useAppStore from "@/hooks/useAppStore.js"; // Still need the hook reference for getState
import { QuickAddProvider } from "@/context/QuickAddContext.jsx";
import QuickAddPopup from "@/components/QuickAddPopup.jsx";
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
  // Removed the useAppStore hook call for initializeApp from here

  // This useEffect will run once on component mount
  useEffect(() => {
    console.log('[App useEffect] Running mount effect for initialization check.');
    // Get current state and actions via getState()
    const state = useAppStore.getState();
    const initializeAppAction = state.initializeApp; // Get action reference

    console.log('[App useEffect] typeof initializeAppAction:', typeof initializeAppAction);

    if (!state.isInitializing && !state.initializationError) {
        // Check if data seems uninitialized
        if(state.cities.length === 0 && state.cuisines.length === 0) {
            console.log("[App useEffect] Data seems uninitialized. Triggering initializeApp...");
            // Check if action exists before calling
            if (typeof initializeAppAction === 'function') {
                initializeAppAction(); // Call action obtained via getState
            } else {
                console.error('[App useEffect] initializeAppAction is not a function via getState()!');
            }
        } else {
            console.log("[App useEffect] Data already present or initialization attempted. Skipping initializeApp call.");
        }
    } else {
         console.log("[App useEffect] Skipping initializeApp check. isInitializing:", state.isInitializing, "Error:", state.initializationError);
    }
  // Empty dependency array ensures this effect runs only once on mount
  }, []); // <--- Empty dependency array

  return (
    <Router>
      <QuickAddProvider>
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
        {/* Render QuickAddPopup globally */}
        <QuickAddPopup />
      </QuickAddProvider>
    </Router>
  );
};

export default App;