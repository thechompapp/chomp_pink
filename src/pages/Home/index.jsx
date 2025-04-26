/* src/pages/Home/index.jsx */
import React, { useState, useCallback } from 'react';
import Results from './Results'; // Keep relative
import FilterPanel from '@/components/FilterPanel'; // Use FilterPanel for structure
import SearchBar from '@/components/UI/SearchBar'; // Use alias
import ToggleSwitch from '@/components/UI/ToggleSwitch'; // Use alias

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

  // State for search query (moved from Results)
  const [searchQuery, setSearchQuery] = useState('');

  // Callback for FilterPanel to update the state
  const handleFiltersChange = useCallback((newFilters) => {
    setFilters(prevFilters => {
      // Basic check to prevent unnecessary re-renders if filters haven't changed
      if (
        prevFilters.cityId === newFilters.cityId &&
        prevFilters.boroughId === newFilters.boroughId &&
        prevFilters.neighborhoodId === newFilters.neighborhoodId &&
        prevFilters.hashtags.length === newFilters.hashtags.length &&
        prevFilters.hashtags.every((tag, i) => tag === newFilters.hashtags[i])
      ) {
        return prevFilters;
      }
      console.log('[Home] Filters changed:', newFilters);
      return newFilters;
    });
  }, []);

  // Callback for SearchBar
  const handleSearch = useCallback((query) => {
     console.log('[Home] Search triggered:', query);
     setSearchQuery(query);
  }, []);

  // Callback for ToggleSwitch
  const handleContentTypeChange = useCallback((type) => {
     console.log('[Home] Content type changed:', type);
     setContentType(type);
  }, []);

  return (
    <div className="space-y-6 max-w-full mx-auto px-4 sm:px-6 md:px-8 py-6">
      {/* Centered Search Bar */}
       <div className="flex justify-center mb-6">
         <div className="w-full max-w-2xl">
           <SearchBar
             searchQuery={searchQuery}
             setSearchQuery={setSearchQuery} // Pass setter directly if SearchBar modifies it
             onSearch={handleSearch} // Or pass a handler if SearchBar only calls on submit
             contentType={contentType} // Pass current type for placeholder
           />
         </div>
       </div>

      {/* Centered Toggle Switch */}
       <div className="flex justify-center mb-6">
         <ToggleSwitch
           options={[
             { value: 'lists', label: 'Lists' },
             { value: 'restaurants', label: 'Restaurants' },
             { value: 'dishes', label: 'Dishes' },
           ]}
           selected={contentType}
           onChange={handleContentTypeChange}
         />
       </div>

      {/* Filter Panel */}
      <div className="mb-6 lg:mb-8">
        {/* Pass selected filters and the update callback */}
        <FilterPanel
          cityId={filters.cityId}
          boroughId={filters.boroughId}
          neighborhoodId={filters.neighborhoodId}
          hashtags={filters.hashtags} // Pass current hashtags if needed
          onFiltersChange={handleFiltersChange}
        />
      </div>

      {/* Results Display Area */}
      <div>
        {/* Pass filters, search query, and content type to Results */}
        <Results
          cityId={filters.cityId}
          boroughId={filters.boroughId} // Pass boroughId
          neighborhoodId={filters.neighborhoodId}
          hashtags={filters.hashtags}
          contentType={contentType}
          searchQuery={searchQuery} // Pass search query
        />
      </div>
    </div>
  );
};

export default Home;