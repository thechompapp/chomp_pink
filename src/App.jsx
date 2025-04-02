// src/App.jsx
// Added setTimeout to the fetchUserLists call in the second useEffect

import React, { useEffect, useRef } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QuickAddProvider } from "@/context/QuickAddContext.jsx";
import useAppStore from "@/hooks/useAppStore";
import PageContainer from "@/layouts/PageContainer.jsx";
import Home from "@/pages/Home/index.jsx";
import Lists from "@/pages/Lists/index.jsx";
import ListDetail from "@/pages/Lists/ListDetail.jsx";
// Import other page components as needed

const App = () => {
  // Select actions and states needed
  const initializeApp = useAppStore(state => state.initializeApp);
  const fetchUserLists = useAppStore(state => state.fetchUserLists);
  const isInitializing = useAppStore(state => state.isInitializing);
  const initializationError = useAppStore(state => state.initializationError);
  // Removed hasFetchedUserLists dependency here as we use a ref guard now

  const hasCalledInitialize = useRef(false);
  const hasCalledFetchUserLists = useRef(false);

  // Effect for Core Initialization (runs once on mount)
  useEffect(() => {
    if (!hasCalledInitialize.current) {
      console.log("[App Core Init Effect] Triggering initializeApp...");
      initializeApp();
      hasCalledInitialize.current = true;
    }
  }, [initializeApp]); // Dependency: initializeApp action

  // Effect for Fetching User Lists (runs AFTER core init finishes successfully)
  useEffect(() => {
    // Check conditions: core init done, no error, fetch not already attempted
    if (!isInitializing && !initializationError && !hasCalledFetchUserLists.current) {
       console.log("[App User List Effect] Core init complete. Triggering fetchUserLists with delay...");
       hasCalledFetchUserLists.current = true; // Mark as attempted immediately

       // Add a short delay before fetching user lists
       const timerId = setTimeout(() => {
           console.log("[App User List Effect] setTimeout finished. Calling fetchUserLists.");
           fetchUserLists();
       }, 100); // 100ms delay

       // Cleanup function to clear the timeout if the component unmounts
       // or dependencies change before the timeout finishes
       return () => clearTimeout(timerId);
    }
  // Dependencies: Watch core init status, error, and the fetch action itself
  }, [isInitializing, initializationError, fetchUserLists]);


  return (
    <QuickAddProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<PageContainer />}>
            <Route path="/" element={<Home />} />
            <Route path="/lists" element={<Lists />}>
              <Route path=":id" element={<ListDetail />} />
            </Route>
            {/* Other routes */}
          </Route>
        </Routes>
      </BrowserRouter>
    </QuickAddProvider>
  );
};

export default App;