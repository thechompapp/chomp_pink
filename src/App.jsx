import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./components/UI/Home";
import Trending from "./components/UI/Trending";
import MyLists from "./components/UI/Lists";
import NightPlanner from "./components/UI/NightPlanner";
import RestaurantDetail from "./components/UI/RestaurantDetail";
import DishDetail from "./components/UI/DishDetail";
import ListDetail from "./components/UI/ListDetail";
import PageContainer from "./components/Layout/PageContainer";
import FloatingQuickAdd from "./components/QuickAdd/FloatingQuickAdd";

const App = () => {
  return (
    <Router>
      <PageContainer>
        <Routes>
          <Route path="/" element={
            <>
              <Home />
              <FloatingQuickAdd />
            </>
          } />
          <Route path="/trending" element={
            <>
              <Trending />
              <FloatingQuickAdd />
            </>
          } />
          <Route path="/lists" element={
            <>
              <MyLists />
              <FloatingQuickAdd />
            </>
          } />
          <Route path="/lists/:id" element={
            <>
              <ListDetail />
              <FloatingQuickAdd />
            </>
          } />
          <Route path="/night-planner" element={
            <>
              <NightPlanner />
              <FloatingQuickAdd />
            </>
          } />
          <Route path="/restaurant/:id" element={
            <>
              <RestaurantDetail />
              <FloatingQuickAdd />
            </>
          } />
          <Route path="/dish/:id" element={
            <>
              <DishDetail />
              <FloatingQuickAdd />
            </>
          } />
          {/* Add a search route to match the "Back to search" link in detail pages */}
          <Route path="/search" element={
            <>
              <Home />
              <FloatingQuickAdd />
            </>
          } />
        </Routes>
      </PageContainer>
    </Router>
  );
};

export default App;