import React, { useEffect, useState } from "react";
import useAppStore from "@/hooks/useAppStore";
import SearchBar from "@/components/UI/SearchBar";
import FilterSection from "@/pages/Home/FilterSection";
import Results from "@/pages/Home/Results";

const Home = () => {
  const {
    trendingItems,
    trendingDishes,
    popularLists,
    initializeTrendingData,
    isLoadingTrending,
    trendingError,
    searchQuery,
    setSearchQuery,
  } = useAppStore();

  const [retryCount, setRetryCount] = useState(0);
  const [expandedSections, setExpandedSections] = useState({
    restaurants: false,
    dishes: false,
    lists: false,
  });

  useEffect(() => {
    initializeTrendingData();
  }, [initializeTrendingData, retryCount]);

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
  };

  if (isLoadingTrending) {
    return <div className="text-center py-10 text-gray-500">Loading...</div>;
  }

  if (trendingError) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500 mb-4">Error: {trendingError}</p>
        <button
          onClick={handleRetry}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <SearchBar onSearch={setSearchQuery} />
      <FilterSection />
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