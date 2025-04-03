// src/pages/Home/Results.jsx
import React, { memo, useMemo, useState, useRef, useCallback, useEffect } from 'react';
import DishCard from '@/components/UI/DishCard';
import RestaurantCard from '@/components/UI/RestaurantCard';
import ListCard from '@/pages/Lists/ListCard';
// Import stores directly
import useTrendingStore from '@/stores/useTrendingStore.js';
import useUIStateStore from '@/stores/useUIStateStore.js';
import { ChevronDown, ChevronUp, Loader2, AlertTriangle } from 'lucide-react';
import Button from '@/components/Button';

const Results = memo(() => {
  // --- Select State Directly from Stores ---
  const cityId = useUIStateStore(state => state.cityId);

  // *** FIX: Select state individually from useTrendingStore ***
  const rawRestaurants = useTrendingStore((state) => state.trendingItems ?? []);
  const rawDishes = useTrendingStore((state) => state.trendingDishes ?? []);
  const rawLists = useTrendingStore((state) => state.popularLists ?? []);
  const isLoadingTrending = useTrendingStore((state) => state.isLoading);
  const errorTrending = useTrendingStore((state) => state.error);
  const fetchTrendingData = useTrendingStore((state) => state.fetchTrendingData);
  // --- End State Selection Fix ---

  // Local state for expanding sections
  const [expandedSections, setExpandedSections] = useState({
      dishes: false, restaurants: false, lists: false,
  });
  const renderCount = useRef(0);
  renderCount.current += 1;

  // --- Fetch Trending Data ---
  useEffect(() => {
    console.log("[Results useEffect] Hook triggered/re-ran.");
    const hasData = rawRestaurants.length > 0 || rawDishes.length > 0 || rawLists.length > 0;
    // Fetch if we have no data and are not currently loading
    const shouldFetch = !hasData;

    console.log(`[Results useEffect] Checking conditions - shouldFetch: ${shouldFetch}, isLoadingTrending: ${isLoadingTrending}`);

    if (shouldFetch && !isLoadingTrending) {
        console.log("[Results useEffect] Conditions met. Calling fetchTrendingData...");
        fetchTrendingData().catch(err => {
            console.error("[Results useEffect] Error calling fetchTrendingData:", err);
        });
    } else if (isLoadingTrending) {
        console.log("[Results useEffect] Conditions NOT met: Already loading.");
    } else if (!shouldFetch) {
        console.log("[Results useEffect] Conditions NOT met: Data already exists (shouldFetch is false).");
    }
  // ** FIX: Dependencies should reflect the state values used in the effect logic **
  // Include the lengths to re-evaluate if data arrives.
  }, [fetchTrendingData, isLoadingTrending, rawRestaurants.length, rawDishes.length, rawLists.length]);
  // --- End Fetch Trending Data ---


  // --- Filtering Logic ---
  const filterByCity = useCallback((items) => {
      // Ensure items is always an array before filtering
      const safeItems = Array.isArray(items) ? items : [];
      if (!cityId) return safeItems;
      // Ensure item and item.city_id exist before comparing
      return safeItems.filter(item => item && typeof item.city_id !== 'undefined' && item.city_id === cityId);
  }, [cityId]);

  const filteredRestaurants = useMemo(() => filterByCity(rawRestaurants), [rawRestaurants, filterByCity]);
  const filteredDishes = useMemo(() => filterByCity(rawDishes), [rawDishes, filterByCity]);
  const filteredLists = useMemo(() => filterByCity(rawLists), [rawLists, filterByCity]);
  // --- End Filtering Logic ---

  // Main component render count log
   console.log(
     `[Results Render ${renderCount.current}] ` +
     `Raw: {R: ${rawRestaurants?.length ?? 'N/A'}, D: ${rawDishes?.length ?? 'N/A'}, L: ${rawLists?.length ?? 'N/A'}} ` +
     `Filtered: {R: ${filteredRestaurants?.length ?? 'N/A'}, D: ${filteredDishes?.length ?? 'N/A'}, L: ${filteredLists?.length ?? 'N/A'}} ` +
     `CityID: ${cityId}, Loading: ${isLoadingTrending}, Error: ${errorTrending || 'null'}` // Ensure error displays null correctly
   );


  const toggleSection = (section) => { setExpandedSections(prev => ({ ...prev, [section]: !prev[section] })); };

  // renderSection function (ensure safety checks inside)
  const renderSection = (title, items, Component, sectionKey) => {
      // Ensure items is treated as an array
       const safeItems = Array.isArray(items) ? items : [];
      const isExpanded = expandedSections[sectionKey];
      const displayLimit = isExpanded ? 12 : 4;
      // Slice safely
      const displayItems = safeItems.slice(0, displayLimit);
      const canExpand = safeItems.length > 4;

      return (
        <div className="mb-6">
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
                  No {title.toLowerCase()} found {cityId ? 'for the selected city' : ''}.
              </div>
             ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 place-items-start">
                  {displayItems.map(item => {
                      // Added more robust check for item and id
                      if (!item || typeof item.id === 'undefined' || item.id === null) {
                          console.warn(`[Results Render] Skipping invalid item in ${sectionKey}:`, item);
                          return null;
                      }
                      let props = {...item};
                      // Pass restaurant name correctly for DishCard
                      if (Component === DishCard) { props.restaurant = item.restaurant_name || item.restaurant; }
                      // Ensure is_following defaults to false for ListCard
                      if (Component === ListCard) { props.is_following = item.is_following ?? false; }
                      return <Component key={`${sectionKey}-${item.id}`} {...props} />;
                  })}
              </div>
             )}
        </div>
      );
  };


  // --- Render Logic ---

  // 1. Handle Loading State (Show only if no data has ever been loaded)
   const hasAnyRawData = rawRestaurants.length > 0 || rawDishes.length > 0 || rawLists.length > 0;
   if (isLoadingTrending && !hasAnyRawData) {
        return <div className="text-center py-10 text-gray-500 flex justify-center items-center"><Loader2 className="animate-spin h-6 w-6 mr-2"/> Loading trending data...</div>;
   }

  // 2. Handle Error State (Show only if no data has ever been loaded)
  if (errorTrending && !hasAnyRawData) {
       return (
           <div className="text-center py-10 max-w-lg mx-auto px-4">
               <AlertTriangle className="h-10 w-10 text-red-400 mx-auto mb-3" />
               <p className="text-red-600 mb-4">Error loading trending data: {errorTrending}</p>
               {/* Disable retry button while loading */}
               <Button onClick={() => !isLoadingTrending && fetchTrendingData()} variant="primary" size="sm" disabled={isLoadingTrending}>Retry</Button>
           </div>
       );
   }

  // 3. Handle Case: No Raw Data Available (After loading and no error)
   const noRawDataAfterLoad = !isLoadingTrending && !errorTrending && !hasAnyRawData;
   if (noRawDataAfterLoad) {
       return (
           <div className="text-center py-10 bg-gray-50 border border-gray-200 rounded-lg shadow-sm">
               <h3 className="text-lg font-medium text-gray-700 mb-1">No Trending Items Found</h3>
               <p className="text-sm text-gray-500">No trending data seems to be available currently.</p>
           </div>
        );
   }

  // 4. Render Sections with Filtered Data
  // Check if there are results *after* filtering
   const noFilteredResults = filteredDishes.length === 0 && filteredRestaurants.length === 0 && filteredLists.length === 0;

  return (
    <div className="mt-4">
        {/* Show message only if filtering is active (cityId exists) AND there was raw data to filter from */}
       {noFilteredResults && cityId && hasAnyRawData && (
            <div className="text-center py-6 text-sm text-gray-500 border border-dashed border-gray-200 rounded-lg mb-4">
                No trending items match the selected city filter.
            </div>
       )}

      {/* Render sections using the FILTERED data */}
      {renderSection('Trending Dishes', filteredDishes, DishCard, 'dishes')}
      {renderSection('Trending Restaurants', filteredRestaurants, RestaurantCard, 'restaurants')}
      {renderSection('Popular Lists', filteredLists, ListCard, 'lists')}

       {/* Show subtle loading indicator if loading in the background AFTER initial data is shown */}
       {isLoadingTrending && hasAnyRawData && (
             <div className="flex justify-center items-center pt-4">
                 <Loader2 className="h-4 w-4 animate-spin mr-1 text-gray-400"/>
                 <p className="text-xs text-gray-400">Updating...</p>
             </div>
       )}
    </div>
  );
});

export default Results;