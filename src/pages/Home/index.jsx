/* src/pages/Home/index.jsx */
import React, { useState, useCallback } from 'react';
import Results from './Results'; // Keep relative
import FilterContainer from '@/components/Filters/FilterContainer'; // Use the new FilterContainer
import SearchBar from '@/components/UI/SearchBar'; // Use alias
import ToggleSwitch from '@/components/UI/ToggleSwitch'; // Use alias
import TrendingTicker from '@/components/UI/TrendingTicker'; // Add trending ticker
import { logDebug } from '@/utils/logger';

const Home = () => {
  // Lifted state for filters
  const [filters, setFilters] = useState({
    cityId: null,
    boroughId: null, // Added boroughId
    neighborhoodId: null,
    hashtags: [],
  });

  // State for content type toggle (moved from Results)
  const [contentType, setContentType] = useState('lists'); // Default to lists

  // Filter change handler
  const handleFilterChange = useCallback((newFilters) => {
    logDebug('[Home] Filter changed:', newFilters);
    setFilters(newFilters);
  }, []);

  // Content type toggle handler
  const handleContentTypeChange = useCallback((type) => {
    logDebug('[Home] Content type changed to:', type);
    setContentType(type);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Section */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pt-20">
          <div className="text-center mb-6">
            {/* Main Logo Marquee */}
            <div className="flex justify-center mb-4">
              <img 
                src="/images/dooflogo.png" 
                alt="DOOF Logo" 
                className="h-24 sm:h-32 w-auto"
              />
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Discover Amazing Food
            </h1>
            <p className="text-gray-600">
              Find restaurants, dishes, and curated lists from food lovers
            </p>
          </div>
          
          <SearchBar 
            className="mb-6" 
            contentType={contentType}
          />
          
          {/* Content Type Toggle */}
          <div className="flex justify-center">
            <ToggleSwitch
              options={[
                { value: 'lists', label: 'Lists' },
                { value: 'restaurants', label: 'Restaurants' },
                { value: 'dishes', label: 'Dishes' }
              ]}
              selected={contentType}
              onChange={handleContentTypeChange}
              className="mb-4"
            />
          </div>
        </div>
      </div>

      {/* Trending Ticker */}
      <TrendingTicker 
        refreshInterval={180000} // 3 minutes
        scrollSpeed="normal"
        pauseOnHover={true}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters Section - Now on Top */}
        <div className="mb-8">
          <FilterContainer 
            filters={filters}
            onFilterChange={handleFilterChange}
          />
        </div>

        {/* Results Section - Full Width */}
        <div className="w-full">
          <Results 
            filters={filters}
            contentType={contentType}
          />
        </div>
      </div>
    </div>
  );
};

export default Home;