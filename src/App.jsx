import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./components/UI/Home";
import Trending from "./components/UI/Trending";
import MyLists from "./components/UI/Lists";
import NightPlanner from "./components/UI/NightPlanner";
import RestaurantDetail from "./components/UI/RestaurantDetail";
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
        </Routes>
      </PageContainer>
    </Router>
  );
};

export default App;