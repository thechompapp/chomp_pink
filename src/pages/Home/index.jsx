import React, { useState, useCallback } from "react";
import { Search, ChevronRight } from "lucide-react";
import useAppStore from "@/hooks/useAppStore";
import FilterSection from "./FilterSection";
import Results from "./Results";
import doofLogo from "@/assets/doof.svg";

const Home = React.memo(() => {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFilter, setExpandedFilter] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    dishes: false,
    restaurants: false,
    lists: false,
  });

  const trendingItems = useAppStore((state) => state.trendingItems || []);
  const trendingDishes = useAppStore((state) => state.trendingDishes || []);
  const popularLists = useAppStore((state) => state.popularLists || []);
  const setSearchQuery_store = useAppStore((state) => state.setSearchQuery);

  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    if (typeof setSearchQuery_store === 'function') {
      setSearchQuery_store(query);
    }
  }, [setSearchQuery_store]);

  const toggleFilterExpansion = useCallback(() => {
    setExpandedFilter((prev) => !prev);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-primary p-8 md:p-12">
        <img src={doofLogo} alt="Doof Logo" className="h-12 w-auto mx-auto mb-6" />
        <h1 className="text-4xl md:text-5xl font-bold text-white text-center mb-4">
          Discover Great Places
        </h1>
        <p className="text-lg text-white text-center mb-8">
          What's next on your list?
        </p>
        <div className="relative max-w-3xl mx-auto">
          <input
            type="text"
            placeholder="Search for restaurants, dishes, or cuisines..."
            className="w-full py-3 px-5 pr-12 rounded-lg border-none bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-dark shadow-sm text-lg"
            onChange={(e) => handleSearch(e.target.value)}
            value={searchQuery}
          />
          <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={24} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-12">
        <div className="mb-8">
          <button
            onClick={toggleFilterExpansion}
            className="flex items-center text-gray-700 font-semibold text-lg hover:text-primary"
          >
            <span>Filters</span>
            <ChevronRight
              className={`ml-2 ${expandedFilter ? "rotate-90" : ""}`}
              size={20}
            />
          </button>
          {expandedFilter && <FilterSection />}
        </div>

        <Results
          trendingItems={trendingItems}
          trendingDishes={trendingDishes}
          popularLists={popularLists}
          expandedSections={expandedSections}
          setExpandedSections={setExpandedSections}
          searchQuery={searchQuery}
        />
      </div>
    </div>
  );
});

export default Home;