// src/pages/Home/Results.jsx
// UPDATE: Refactored to use React Query (useQuery) for fetching all trending data
import React, { memo, useMemo, useState, useCallback } from 'react'; // Removed useEffect, useRef
import { useQuery } from '@tanstack/react-query'; // *** IMPORT useQuery ***
import DishCard from '@/components/UI/DishCard';
import RestaurantCard from '@/components/UI/RestaurantCard';
import ListCard from '@/pages/Lists/ListCard';
// Import UI state store for filtering
import useUIStateStore from '@/stores/useUIStateStore.js';
import { ChevronDown, ChevronUp, Loader2, AlertTriangle } from 'lucide-react';
import Button from '@/components/Button';
import { API_BASE_URL } from '@/config'; // Import base URL

// *** Define Fetcher Function outside component ***
const fetchAllTrendingData = async () => {
    console.log('[fetchAllTrendingData] Fetching all trending data...');
    const endpoints = {
        restaurants: `${API_BASE_URL}/api/trending/restaurants`,
        dishes: `${API_BASE_URL}/api/trending/dishes`,
        lists: `${API_BASE_URL}/api/trending/lists`,
    };

    try {
        const results = await Promise.all([
            fetch(endpoints.restaurants).then(res => res.ok ? res.json() : Promise.reject(new Error(`Workspace failed for restaurants: ${res.status}`))),
            fetch(endpoints.dishes).then(res => res.ok ? res.json() : Promise.reject(new Error(`Workspace failed for dishes: ${res.status}`))),
            fetch(endpoints.lists).then(res => res.ok ? res.json() : Promise.reject(new Error(`Workspace failed for lists: ${res.status}`)))
        ]);

        const [restaurants, dishes, lists] = results;

        // Basic validation and formatting
        const formattedRestaurants = (Array.isArray(restaurants) ? restaurants : []).map(r => ({...r, tags: Array.isArray(r.tags) ? r.tags : [] }));
        const formattedDishes = (Array.isArray(dishes) ? dishes : []).map(d => ({...d, tags: Array.isArray(d.tags) ? d.tags : [] }));
        const formattedLists = (Array.isArray(lists) ? lists : []).map(l => ({...l, tags: Array.isArray(l.tags) ? l.tags : [], is_following: l.is_following ?? false }));

        console.log(`[fetchAllTrendingData] Fetched Data - Restaurants: ${formattedRestaurants.length}, Dishes: ${formattedDishes.length}, Lists: ${formattedLists.length}`);
        return {
            restaurants: formattedRestaurants,
            dishes: formattedDishes,
            lists: formattedLists,
        };
    } catch (error) {
        console.error('[fetchAllTrendingData] Error fetching trending data:', error);
        throw new Error(error.message || 'Failed to load trending data'); // Re-throw error
    }
};


const Results = memo(() => {
  // --- Select Filter State ---
  const cityId = useUIStateStore(state => state.cityId);

  // --- Fetch Data with React Query ---
  const {
      data: trendingData, // Contains { restaurants: [], dishes: [], lists: [] }
      isLoading, // Replaces isLoadingTrending
      isError,   // Replaces error checks
      error,     // Replaces errorTrending
      refetch    // Function to refetch data
  } = useQuery({
      queryKey: ['trendingData'], // Unique key for all trending data
      queryFn: fetchAllTrendingData, // Use the combined fetcher function
      // Optional: configure staleTime etc.
      // staleTime: 1000 * 60 * 2, // Data fresh for 2 minutes
  });
  // --- End React Query ---

  // Local state for expanding sections (keep as is)
  const [expandedSections, setExpandedSections] = useState({
      dishes: false, restaurants: false, lists: false,
  });

  // --- Filtering Logic (Uses data from useQuery) ---
  const filterByCity = useCallback((items) => {
      const safeItems = Array.isArray(items) ? items : [];
      if (!cityId) return safeItems;
      return safeItems.filter(item => item && typeof item.city_id !== 'undefined' && item.city_id === cityId);
  }, [cityId]);

  // Filter data fetched by useQuery
  const filteredRestaurants = useMemo(() => filterByCity(trendingData?.restaurants), [trendingData?.restaurants, filterByCity]);
  const filteredDishes = useMemo(() => filterByCity(trendingData?.dishes), [trendingData?.dishes, filterByCity]);
  const filteredLists = useMemo(() => filterByCity(trendingData?.lists), [trendingData?.lists, filterByCity]);
  // --- End Filtering Logic ---

  console.log(
    `[Results Render] ` +
    `Filtered: {R: ${filteredRestaurants?.length ?? 'N/A'}, D: ${filteredDishes?.length ?? 'N/A'}, L: ${filteredLists?.length ?? 'N/A'}} ` +
    `CityID: ${cityId}, Loading: ${isLoading}, IsError: ${isError}, Error: ${error?.message || 'null'}`
  );

  const toggleSection = (section) => { setExpandedSections(prev => ({ ...prev, [section]: !prev[section] })); };

  // renderSection function (uses filtered data derived from useQuery)
  const renderSection = (title, items, Component, sectionKey) => {
      // Note: 'items' passed here is already the filtered array
      const safeItems = Array.isArray(items) ? items : [];
      const isExpanded = expandedSections[sectionKey];
      const displayLimit = isExpanded ? 12 : 4;
      const displayItems = safeItems.slice(0, displayLimit);
      const canExpand = safeItems.length > 4;

      return (
        <div className="mb-6">
            {/* ... (Keep existing header/toggle button logic) ... */}
             <div className="flex justify-between items-center mb-3 flex-wrap">
                <h2 className="text-lg font-semibold text-gray-800">{title} ({safeItems.length})</h2>
                {canExpand && (
                   <button onClick={() => toggleSection(sectionKey)} className="text-xs text-[#A78B71] hover:text-[#D1B399] flex items-center font-medium py-1" aria-expanded={isExpanded}>
                       {isExpanded ? 'Show Less' : 'Show More'}
                       {isExpanded ? <ChevronUp size={14} className="ml-1"/> : <ChevronDown size={14} className="ml-1"/> }
                   </button>
                )}
             </div>
            {/* Check filtered items length for empty message */}
            {safeItems.length === 0 ? (
              <div className="text-center text-gray-500 py-4 text-sm border border-dashed border-gray-200 rounded-lg">
                  No {title.toLowerCase()} found {cityId ? 'for the selected city' : 'in trending data'}.
              </div>
             ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 place-items-start">
                  {displayItems.map(item => {
                      if (!item || typeof item.id === 'undefined' || item.id === null) {
                          console.warn(`[Results Render] Skipping invalid item in ${sectionKey}:`, item);
                          return null;
                      }
                      let props = {...item};
                      if (Component === DishCard) { props.restaurant = item.restaurant_name || item.restaurant; }
                      if (Component === ListCard) { props.is_following = item.is_following ?? false; }
                      return <Component key={`${sectionKey}-${item.id}`} {...props} />;
                  })}
              </div>
             )}
        </div>
      );
  };

  // --- Render Logic ---

  // 1. Handle Loading State (Show only if NO data exists yet)
  const hasAnyData = trendingData && (trendingData.restaurants.length > 0 || trendingData.dishes.length > 0 || trendingData.lists.length > 0);
  if (isLoading && !hasAnyData) {
        return <div className="text-center py-10 text-gray-500 flex justify-center items-center"><Loader2 className="animate-spin h-6 w-6 mr-2"/> Loading trending data...</div>;
   }

  // 2. Handle Error State (Show only if NO data exists yet)
  if (isError && !hasAnyData) {
       return (
           <div className="text-center py-10 max-w-lg mx-auto px-4">
               <AlertTriangle className="h-10 w-10 text-red-400 mx-auto mb-3" />
               <p className="text-red-600 mb-4">Error loading trending data: {error?.message || 'Unknown error'}</p>
               <Button onClick={() => refetch()} variant="primary" size="sm" disabled={isLoading}>Retry</Button>
           </div>
       );
   }

  // 3. Handle Case: No Data Available (After loading and no error)
   const noDataAfterLoad = !isLoading && !isError && !hasAnyData;
   if (noDataAfterLoad) {
       return (
           <div className="text-center py-10 bg-gray-50 border border-gray-200 rounded-lg shadow-sm">
               <h3 className="text-lg font-medium text-gray-700 mb-1">No Trending Items Found</h3>
               <p className="text-sm text-gray-500">No trending data seems to be available currently.</p>
           </div>
        );
   }

  // 4. Render Sections with Filtered Data
   const noFilteredResults = filteredDishes.length === 0 && filteredRestaurants.length === 0 && filteredLists.length === 0;

  return (
    <div className="mt-4">
        {/* Show message only if filtering is active AND there was initial data */}
       {noFilteredResults && cityId && hasAnyData && (
            <div className="text-center py-6 text-sm text-gray-500 border border-dashed border-gray-200 rounded-lg mb-4">
                No trending items match the selected city filter.
            </div>
       )}

      {/* Render sections using the FILTERED data */}
      {renderSection('Trending Dishes', filteredDishes, DishCard, 'dishes')}
      {renderSection('Trending Restaurants', filteredRestaurants, RestaurantCard, 'restaurants')}
      {renderSection('Popular Lists', filteredLists, ListCard, 'lists')}

       {/* Show subtle loading indicator if loading in the background AFTER initial data is shown */}
       {isLoading && hasAnyData && (
             <div className="flex justify-center items-center pt-4">
                 <Loader2 className="h-4 w-4 animate-spin mr-1 text-gray-400"/>
                 <p className="text-xs text-gray-400">Updating...</p>
             </div>
       )}
    </div>
  );
});

export default Results;