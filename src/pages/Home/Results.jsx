// src/pages/Home/Results.jsx
import React, { memo, useMemo, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import DishCard from '@/components/UI/DishCard';
import RestaurantCard from '@/components/UI/RestaurantCard';
import ListCard from '@/pages/Lists/ListCard';
import useUIStateStore from '@/stores/useUIStateStore.js';
import { ChevronDown, ChevronUp } from 'lucide-react';
import Button from '@/components/Button';
// API_BASE_URL might not be needed if only apiClient is used
// import { API_BASE_URL } from '@/config';
import ErrorMessage from '@/components/UI/ErrorMessage';
import apiClient from '@/utils/apiClient'; // Import apiClient
// Import Skeletons
import RestaurantCardSkeleton from '@/components/UI/RestaurantCardSkeleton';
import DishCardSkeleton from '@/components/UI/DishCardSkeleton';
import ListCardSkeleton from '@/pages/Lists/ListCardSkeleton';

// Updated fetcher function using apiClient and ensuring defined object return
const fetchAllTrendingData = async () => {
    // Removed console.log
    try {
        const [restaurants, dishes, lists] = await Promise.all([
            // Use apiClient for each parallel request
            apiClient('/api/trending/restaurants', 'Home Results Restaurants'),
            apiClient('/api/trending/dishes', 'Home Results Dishes'),
            apiClient('/api/trending/lists', 'Home Results Popular Lists'),
        ]);

        // Format data, ensuring arrays and defaults
        const formatItems = (items) => (Array.isArray(items) ? items : []).map(item => ({
            ...item,
            tags: Array.isArray(item.tags) ? item.tags : []
        }));
        const formatLists = (lists) => (Array.isArray(lists) ? lists : []).map(list => ({
             ...list,
             tags: Array.isArray(list.tags) ? list.tags : [],
             is_following: list.is_following ?? false
         }));

        // Always return a defined object structure
        return {
            restaurants: formatItems(restaurants),
            dishes: formatItems(dishes),
            lists: formatLists(lists),
        };
    } catch (error) {
        console.error('[fetchAllTrendingData] Error fetching trending data:', error);
        // Re-throw error for useQuery to handle
        // Let apiClient handle 401 logout
        throw new Error(error.message || 'Failed to load trending data');
    }
};


// Define skeleton components map
const skeletonMap = {
    dishes: DishCardSkeleton,
    restaurants: RestaurantCardSkeleton,
    lists: ListCardSkeleton,
};

const Results = memo(() => {
  const cityId = useUIStateStore(state => state.cityId);

  // Add default value for data during destructuring
  const {
      data: trendingData = { restaurants: [], dishes: [], lists: [] }, // Default value here
      isLoading, isError, error, refetch
  } = useQuery({
      queryKey: ['trendingData'],
      queryFn: fetchAllTrendingData,
      // Optional: Add staleTime if desired
      // staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const [expandedSections, setExpandedSections] = useState({ dishes: true, restaurants: true, lists: true });

  const filterByCity = useCallback((items) => {
       const safeItems = Array.isArray(items) ? items : [];
       if (!cityId) return safeItems;
       return safeItems.filter(item => item && typeof item.city_id !== 'undefined' && item.city_id === cityId);
   }, [cityId]);

   // Use optional chaining just in case, though default value helps
  const filteredRestaurants = useMemo(() => filterByCity(trendingData?.restaurants), [trendingData?.restaurants, filterByCity]);
  const filteredDishes = useMemo(() => filterByCity(trendingData?.dishes), [trendingData?.dishes, filterByCity]);
  const filteredLists = useMemo(() => filterByCity(trendingData?.lists), [trendingData?.lists, filterByCity]);

  const toggleSection = (section) => { setExpandedSections(prev => ({ ...prev, [section]: !prev[section] })); };

  // renderSection logic remains the same, using skeletons during isLoading
  const renderSection = (title, items, Component, sectionKey) => {
       const safeItems = Array.isArray(items) ? items : [];
       const isExpanded = expandedSections[sectionKey];
       const displayLimit = isExpanded ? 12 : 4;
       const displayItems = safeItems.slice(0, displayLimit);
       const canExpand = safeItems.length > 4;
       const SkeletonComponent = skeletonMap[sectionKey];

       return (
         <div className="mb-6">
             <div className="flex justify-between items-center mb-3 flex-wrap">
                 <h2 className="text-lg font-semibold text-gray-800">{title} ({isLoading ? '...' : safeItems.length})</h2>
                 {canExpand && !isLoading && (
                     <button onClick={() => toggleSection(sectionKey)} className="text-xs text-[#A78B71] hover:text-[#D1B399] flex items-center font-medium py-1" aria-expanded={isExpanded}>
                         {isExpanded ? 'Show Less' : 'Show More'}
                         {isExpanded ? <ChevronUp size={14} className="ml-1"/> : <ChevronDown size={14} className="ml-1"/> }
                     </button>
                  )}
             </div>
             {/* Loading State */}
             {isLoading && SkeletonComponent && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 place-items-start">
                   {[...Array(4)].map((_, index) => <SkeletonComponent key={`skel-${sectionKey}-${index}`} />)}
                </div>
             )}
             {/* Loaded State - Empty */}
             {!isLoading && safeItems.length === 0 ? (
               <div className="text-center text-gray-500 py-4 text-sm border border-dashed border-gray-200 rounded-lg"> No {title.toLowerCase()} found {cityId ? 'for the selected city' : ''}. </div>
              ) : null}
             {/* Loaded State - Data */}
             {!isLoading && safeItems.length > 0 ? (
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 place-items-start">
                   {displayItems.map(item => {
                       if (!item || typeof item.id === 'undefined' || item.id === null) { return null; }
                       let props = {...item};
                       if (Component === DishCard) { props.restaurant = item.restaurant_name || item.restaurant; }
                       if (Component === ListCard) { props.is_following = item.is_following ?? false; }
                       return <Component key={`${sectionKey}-${item.id}`} {...props} />;
                   })}
               </div>
              ) : null}
         </div>
       );
   };

  // --- Render Logic ---
  // Show top-level error only if fetch failed and *still* no data (even default)
  if (isError && (!trendingData || (trendingData.restaurants.length === 0 && trendingData.dishes.length === 0 && trendingData.lists.length === 0))) {
       return ( <ErrorMessage message={error?.message || 'Error loading trending data.'} onRetry={refetch} isLoadingRetry={isLoading} containerClassName="mt-6" /> );
  }

  // Check for no results after loading and filtering
  const noFilteredResults = !isLoading && !isError && filteredDishes.length === 0 && filteredRestaurants.length === 0 && filteredLists.length === 0;
  // Check if there was *any* data fetched, even if filtered out
  const hasAnyFetchedData = !isError && trendingData && (trendingData.restaurants.length > 0 || trendingData.dishes.length > 0 || trendingData.lists.length > 0);

  return (
    <div className="mt-4">
       {noFilteredResults && cityId && hasAnyFetchedData && (
           <div className="text-center py-6 text-sm text-gray-500 border border-dashed border-gray-200 rounded-lg mb-4">
               No trending items match the selected city filter.
           </div>
        )}

      {/* Sections will now render skeletons internally if isLoading */}
      {renderSection('Trending Dishes', filteredDishes, DishCard, 'dishes')}
      {renderSection('Trending Restaurants', filteredRestaurants, RestaurantCard, 'restaurants')}
      {renderSection('Popular Lists', filteredLists, ListCard, 'lists')}

    </div>
  );
});

export default Results;