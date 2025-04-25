// src/pages/Home/index.jsx
import React, { useState, useCallback } from 'react'; // Import useState, useCallback
import Results from './Results';
import FilterSection from '@/components/FilterSection'; // Use alias

const Home = () => {
  // Lifted state for filters
  const [filters, setFilters] = useState({
    cityId: null,
    neighborhoodId: null,
    hashtags: [],
  });

  // Callback for FilterSection to update the state
  const handleFiltersChange = useCallback((newFilters) => {
    // Ensure stable reference for hashtags array if it didn't change
    setFilters(prevFilters => {
      if (
        prevFilters.cityId === newFilters.cityId &&
        prevFilters.neighborhoodId === newFilters.neighborhoodId &&
        // Shallow compare hashtags array
        prevFilters.hashtags.length === newFilters.hashtags.length &&
        prevFilters.hashtags.every((tag, i) => tag === newFilters.hashtags[i])
      ) {
        return prevFilters; // Return previous state if no change
      }
      return newFilters; // Otherwise update
    });
  }, []);

  return (
    // Apply the same container classes as the Trending page for consistency
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6">
        {/* Filter Section - Pass callback */}
        <div className="mb-6 lg:mb-8"> {/* Keep existing margin if needed */}
            <FilterSection onFiltersChange={handleFiltersChange} />
        </div>
        {/* Results Section - Pass filter state */}
        <div>
            <Results
              cityId={filters.cityId}
              neighborhoodId={filters.neighborhoodId}
              hashtags={filters.hashtags}
            />
        </div>
    </div>
  );
};

export default Home;