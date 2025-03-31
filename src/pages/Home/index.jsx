// src/pages/Home/index.jsx
import React, { useState, useEffect } from "react"; // Removed useCallback as attemptInitialize is removed
import useAppStore from "@/hooks/useAppStore.js";
import SearchBar from "@/components/UI/SearchBar.jsx";
import FilterSection from "@/pages/Home/FilterSection.jsx";
import Results from "@/pages/Home/Results.jsx";
import Button from "@/components/Button.jsx";

const Home = () => {
  const {
    trendingItems,
    trendingDishes,
    popularLists,
    isLoadingTrending, // Use this for loading state
    initializationError, // Use this for error state
    searchQuery,
    setSearchQuery,
    initializeApp, // Keep for retry button
    isInitializing, // Use this to check loading state
  } = useAppStore();

  const [expandedSections, setExpandedSections] = useState({
    restaurants: false,
    dishes: false,
    lists: false,
  });

  // REMOVED: useEffect hook calling initializeApp

  // Display loading indicator based on global state
  // Use isInitializing OR isLoadingTrending to cover both initial load and potential background refreshes if added later
  if (isInitializing || isLoadingTrending) {
    console.log("[Home] Rendering Loading State. isInitializing:", isInitializing, "isLoadingTrending:", isLoadingTrending);
    return <div className="text-center py-10 text-gray-500">Loading Trending Data...</div>;
  }

  // Display error message based on global state
  if (initializationError) {
    console.error("[Home] Rendering Error State:", initializationError);
    return (
      <div className="text-center py-10">
        <p className="text-red-500 mb-4">
          Error loading data: {initializationError}. Is the backend running on localhost:5001?
        </p>
        {/* Directly call initializeApp for retry */}
        <Button onClick={initializeApp} variant="primary" className="px-4 py-2">Retry Load</Button>
      </div>
    );
  }

  // Render results if no error and not loading
  console.log("[Home] Rendering Results. Data:", { items: trendingItems.length, dishes: trendingDishes.length, lists: popularLists.length });
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <SearchBar onSearch={setSearchQuery} />
      <FilterSection />
      <Results
        trendingItems={Array.isArray(trendingItems) ? trendingItems : []}
        trendingDishes={Array.isArray(trendingDishes) ? trendingDishes : []}
        popularLists={Array.isArray(popularLists) ? popularLists : []}
        expandedSections={expandedSections}
        setExpandedSections={setExpandedSections}
        searchQuery={searchQuery}
      />
    </div>
  );
};

export default Home;