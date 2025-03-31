// src/App.jsx
import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import useAppStore from "@/hooks/useAppStore.js";
import { QuickAddProvider } from "@/context/QuickAddContext.jsx"; // Import QuickAddProvider
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
    console.log("[App.jsx] Component mounted. Calling initializeApp.");
    initializeApp();
  }, [initializeApp]);

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
          </Routes>
        </PageContainer>
      </QuickAddProvider>
    </Router>
  );
};

export default App;