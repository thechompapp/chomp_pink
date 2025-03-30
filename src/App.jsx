import React, { Suspense, lazy, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import PageContainer from "@/layouts/PageContainer";
import QuickAddPopup from "@/components/QuickAddPopup";
import useAppStore from "@/hooks/useAppStore";
import { QuickAddProvider } from "@/context/QuickAddContext";

const Home = lazy(() => import("@/pages/Home/index.jsx"));
const Trending = lazy(() => import("@/pages/Trending/index.jsx"));
const Lists = lazy(() => import("@/pages/Lists/index.jsx"));
const MyLists = lazy(() => import("@/pages/Lists/MyLists.jsx"));
const ListDetail = lazy(() => import("@/pages/Lists/ListDetail.jsx"));
const NightPlanner = lazy(() => import("@/pages/NightPlanner/index.jsx"));
const Dashboard = lazy(() => import("@/pages/Dashboard/index.jsx"));
const RestaurantDetail = lazy(() => import("@/pages/RestaurantDetail/index.jsx"));
const DishDetail = lazy(() => import("@/pages/DishDetail/index.jsx"));

const App = React.memo(() => {
  const setUserLists = useAppStore((state) => state.setUserLists);
  const initializeTrendingData = useAppStore((state) => state.initializeTrendingData);

  useEffect(() => {
    const sampleLists = [
      { id: 1, name: "My Favorites", items: [], isPublic: false, createdByUser: true },
      { id: 2, name: "Must Try", items: [], isPublic: false, createdByUser: true },
      { id: 3, name: "West Village Gems", items: [], isPublic: false, createdByUser: true },
    ];
    setUserLists(sampleLists);
    initializeTrendingData();
  }, [setUserLists, initializeTrendingData]);

  return (
    <Router>
      <QuickAddProvider>
        <PageContainer>
          <Suspense fallback={<div className="flex justify-center items-center h-screen"><div className="text-primary text-lg">Loading...</div></div>}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/trending" element={<Trending />} />
              <Route path="/lists" element={<Lists />}>
                <Route path="my-lists" element={<MyLists />} />
                <Route path=":id" element={<ListDetail />} />
              </Route>
              <Route path="/night-planner" element={<NightPlanner />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/restaurant/:id" element={<RestaurantDetail />} />
              <Route path="/dish/:id" element={<DishDetail />} />
              <Route path="/search" element={<Home />} />
            </Routes>
            <QuickAddPopup />
          </Suspense>
        </PageContainer>
      </QuickAddProvider>
    </Router>
  );
});

export default App;