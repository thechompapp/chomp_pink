// src/pages/Home/index.jsx
import React, { useMemo } from "react"; // Removed useEffect, useRef
import useAppStore from "@/hooks/useAppStore.js";
import SearchBar from "@/components/UI/SearchBar.jsx";
import FilterSection from "@/pages/Home/FilterSection.jsx";
import Results from "@/pages/Home/Results.jsx";
import Button from "@/components/Button.jsx";
import { Loader2, AlertTriangle } from "lucide-react"; // Import icons

const Home = () => {
  // Select state slices individually - No change needed here
  const trendingItems = useAppStore(state => state.trendingItems);
  const trendingDishes = useAppStore(state => state.trendingDishes);
  const popularLists = useAppStore(state => state.popularLists);
  const isInitializing = useAppStore(state => state.isInitializing);
  const initializationError = useAppStore(state => state.initializationError);
  const setSearchQuery = useAppStore(state => state.setSearchQuery);
  const initializeApp = useAppStore(state => state.initializeApp); // Keep for Retry button
  // Check if data has been loaded at least once (even if empty or error occurred)
  const hasAttemptedInit = useAppStore(state => !state.isInitializing); // Can likely be simplified now

  // --- REMOVED useEffect hook that called initializeApp ---

  // --- Loading State ---
  // Show loading indicator if initialization is in progress
  if (isInitializing) {
     console.log("[Home Render] Showing Loading State");
     return (
       <div className="flex justify-center items-center h-[calc(100vh-200px)]">
         <div className="text-center text-gray-500">
           <Loader2 className="animate-spin h-10 w-10 mx-auto mb-3" />
           Loading Trending Data...
         </div>
       </div>
     );
   }

  // --- Error State ---
  // Show error if initialization finished AND resulted in an error
  // Note: !isInitializing is implicitly true if we reach this point
  if (initializationError) {
     console.error("[Home Render] Showing Error State:", initializationError);
     return (
       <div className="max-w-2xl mx-auto text-center py-10 px-4">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-700 mb-2">Failed to Load Data</h2>
          <p className="text-red-600 mb-6">{initializationError || "An unknown error occurred."}</p>
          <Button
            onClick={() => {
               console.log("[Home] Retry button clicked.");
               // Directly call initializeApp - App.jsx's guard should prevent duplicates if needed
               initializeApp();
            }}
            variant="primary"
            className="px-6 py-2"
          >
             Retry Load
           </Button>
       </div>
     );
   }

  // --- Success/Content State ---
  // Render content if initialization is finished (isInitializing is false) and there's no error
  console.log("[Home Render] Rendering Main Content.");
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <SearchBar onSearch={setSearchQuery} />
      <FilterSection />
      <Results
        // Ensure arrays are passed, even if empty
        trendingItems={Array.isArray(trendingItems) ? trendingItems : []}
        trendingDishes={Array.isArray(trendingDishes) ? trendingDishes : []}
        popularLists={Array.isArray(popularLists) ? popularLists : []}
      />
    </div>
  );
};

export default Home;