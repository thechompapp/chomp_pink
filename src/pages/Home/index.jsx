// src/pages/Home/index.jsx (Select state individually)
import React, { useState } from "react"; // Removed useEffect as initializeApp is in App.jsx
import useAppStore from "@/hooks/useAppStore.js";
import SearchBar from "@/components/UI/SearchBar.jsx";
import FilterSection from "@/pages/Home/FilterSection.jsx";
import Results from "@/pages/Home/Results.jsx";
import Button from "@/components/Button.jsx";

const Home = () => {
  // --- Global State ---
  // Select necessary state slices individually
  const trendingItems = useAppStore(state => state.trendingItems) || []; // Default to empty array
  const trendingDishes = useAppStore(state => state.trendingDishes) || []; // Default to empty array
  const popularLists = useAppStore(state => state.popularLists) || []; // Default to empty array
  // Select loading/error states if needed for display within Home specifically
  // (Currently handled primarily by initializeApp and potentially displayed globally or in Results)
  const isLoading = useAppStore(state => state.isInitializing || state.isLoadingTrending); // Combine relevant loading flags
  const error = useAppStore(state => state.initializationError || state.trendingError);
  // Select search query and setter
  const searchQuery = useAppStore(state => state.searchQuery);
  const setSearchQuery = useAppStore(state => state.setSearchQuery);
  // Select initializeApp for retry button if needed here
  const initializeApp = useAppStore(state => state.initializeApp);


  // Local state for expanding sections remains the same
  const [expandedSections, setExpandedSections] = useState({
    restaurants: false,
    dishes: false,
    lists: false,
  });


  // --- Loading / Error Handling ---
  // Display loading indicator based on global state
  if (isLoading) {
    console.log("[Home] Rendering Loading State.");
    return <div className="text-center py-10 text-gray-500">Loading Trending Data...</div>;
  }

  // Display error message based on global state
  if (error) {
    console.error("[Home] Rendering Error State:", error);
    return (
      <div className="text-center py-10">
        <p className="text-red-500 mb-4">
          Error loading data: {error}.
        </p>
        {/* Provide a retry mechanism */}
        <Button onClick={initializeApp} variant="primary" className="px-4 py-2">Retry Load</Button>
      </div>
    );
  }

  // --- Render Page ---
  console.log("[Home] Rendering Results. Data:", { items: trendingItems.length, dishes: trendingDishes.length, lists: popularLists.length });
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Search Bar - Pass stable setter */}
      <SearchBar onSearch={setSearchQuery} />
      {/* Filter Section - Reads state internally */}
      <FilterSection />
      {/* Results - Pass data arrays and search query */}
      <Results
        trendingItems={trendingItems}
        trendingDishes={trendingDishes}
        popularLists={popularLists}
        expandedSections={expandedSections}
        setExpandedSections={setExpandedSections}
        searchQuery={searchQuery}
      />
    </div>
  );
};

export default Home;