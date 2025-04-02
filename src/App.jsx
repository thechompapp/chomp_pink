// src/App.jsx
import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QuickAddProvider } from "@/context/QuickAddContext.jsx";
import useAppStore from "@/hooks/useAppStore"; // Import at top level
import PageContainer from "@/layouts/PageContainer.jsx";
import Home from "@/pages/Home/index.jsx";
import Lists from "@/pages/Lists/index.jsx";
import MyLists from "@/pages/Lists/MyLists.jsx";
import ListDetail from "@/pages/Lists/ListDetail.jsx";

const App = () => {
  // Log the store object to inspect it
  console.log("[App] useAppStore object:", useAppStore);

  // Store selections
  const initializeApp = useAppStore((state) => state.initializeApp);
  const testSyncAction = useAppStore((state) => state.testSyncAction);
  const fetchUserLists = useAppStore((state) => state.fetchUserLists);
  const isInitializing = useAppStore((state) => state.isInitializing);
  const initializationError = useAppStore((state) => state.initializationError);

  // Effect for Core Initialization
  useEffect(() => {
    console.log("[App Core Init Effect] Running effect (mount).");
    console.log("[App Core Init Effect] initializeApp function:", initializeApp);
    console.log("[App Core Init Effect] testSyncAction function:", testSyncAction);
    console.log("[App Core Init Effect] >>> Calling initializeApp() NOW <<<");
    initializeApp();
    console.log("[App Core Init Effect] >>> Calling testSyncAction() NOW <<<");
    testSyncAction();
    console.log("[App Core Init Effect] Effect completed initial calls.");
  }, []); // Runs once on mount

  // Effect for Fetching User Lists
  useEffect(() => {
    if (!isInitializing && !initializationError && !hasCalledFetchUserLists.current) {
      console.log("[App User List Effect] Core init complete. Triggering fetchUserLists...");
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
            <Route path="/lists" element={<Lists />}>
              <Route index element={<MyLists />} />
              <Route path=":id" element={<ListDetail />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </QuickAddProvider>
  );
};

const hasCalledFetchUserLists = { current: false };

export default App;