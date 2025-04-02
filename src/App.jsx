// src/App.jsx
// Added MyLists import and index route for /lists

import React, { useEffect, useRef } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QuickAddProvider } from "@/context/QuickAddContext.jsx";
import useAppStore from "@/hooks/useAppStore";
import PageContainer from "@/layouts/PageContainer.jsx";
import Home from "@/pages/Home/index.jsx";
import Lists from "@/pages/Lists/index.jsx"; // Parent layout component for /lists/*
import MyLists from "@/pages/Lists/MyLists.jsx"; // *** IMPORT MyLists ***
import ListDetail from "@/pages/Lists/ListDetail.jsx";
// Import other page components as needed

const App = () => {
  // Store selections and effects remain the same as previous step
  const initializeApp = useAppStore(state => state.initializeApp);
  const fetchUserLists = useAppStore(state => state.fetchUserLists);
  const isInitializing = useAppStore(state => state.isInitializing);
  const initializationError = useAppStore(state => state.initializationError);

  const hasCalledInitialize = useRef(false);
  const hasCalledFetchUserLists = useRef(false);

  // Effect for Core Initialization
  useEffect(() => {
    if (!hasCalledInitialize.current) {
      console.log("[App Core Init Effect] Triggering initializeApp...");
      initializeApp();
      hasCalledInitialize.current = true;
    }
  }, [initializeApp]);

  // Effect for Fetching User Lists
  useEffect(() => {
    if (!isInitializing && !initializationError && !hasCalledFetchUserLists.current) {
       console.log("[App User List Effect] Core init complete. Triggering fetchUserLists with delay...");
       hasCalledFetchUserLists.current = true;
       const timerId = setTimeout(() => {
           console.log("[App User List Effect] setTimeout finished. Calling fetchUserLists.");
           fetchUserLists();
       }, 100);
       return () => clearTimeout(timerId);
    }
  }, [isInitializing, initializationError, fetchUserLists]);


  return (
    <QuickAddProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<PageContainer />}>
            <Route path="/" element={<Home />} />

            {/* Define /lists parent route and its nested routes */}
            <Route path="/lists" element={<Lists />}>
               {/* *** ADD INDEX ROUTE for /lists path itself *** */}
               <Route index element={<MyLists />} />
               {/* Keep nested route for /lists/:id */}
               <Route path=":id" element={<ListDetail />} />
            </Route>

            {/* Other top-level routes */}
            {/* <Route path="/trending" element={ <Trending /> } /> */}
            {/* ... etc ... */}

          </Route>
        </Routes>
      </BrowserRouter>
    </QuickAddProvider>
  );
};

export default App;