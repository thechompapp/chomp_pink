/* src/pages/Home/Results.jsx */
import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { trendingService } from '@/services/trendingService';
import DishCard from '@/components/UI/DishCard';
import RestaurantCard from '@/components/UI/RestaurantCard';
import ListCard from '@/pages/Lists/ListCard';
// Corrected: Use named import for the store hook
import { useUIStateStore } from '@/stores/useUIStateStore';
import useAuthStore from '@/stores/useAuthStore';
import { ChevronDown, ChevronUp, Flame, Utensils, Bookmark } from 'lucide-react';
import ErrorMessage from '@/components/UI/ErrorMessage';
import RestaurantCardSkeleton from '@/components/UI/RestaurantCardSkeleton';
import DishCardSkeleton from '@/components/UI/DishCardSkeleton';
import ListCardSkeleton from '@/pages/Lists/ListCardSkeleton';
import { useQuickAdd } from '@/context/QuickAddContext';
import Button from '@/components/UI/Button';
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import HeaderBillboard from '@/components/HeaderBillboard';
import { useShallow } from 'zustand/react/shallow'; // Import useShallow if needed, or use individual selectors

// Fetcher function (remains the same)
const fetchAllTrendingData = async () => {
  try {
    const [restaurants, dishes, lists] = await Promise.all([
      trendingService.getTrendingRestaurants(),
      trendingService.getTrendingDishes(),
      trendingService.getTrendingLists(),
    ]);
    return {
        restaurants: Array.isArray(restaurants) ? restaurants : [],
        dishes: Array.isArray(dishes) ? dishes : [],
        lists: Array.isArray(lists) ? lists : []
    };
  } catch (error) {
    console.error('[Results] Error fetching trending data:', error);
    throw new Error(error.message || 'Failed to load trending data');
  }
};

const skeletonMap = { dishes: DishCardSkeleton, restaurants: RestaurantCardSkeleton, lists: ListCardSkeleton };

// Use individual selectors for stability
const useCityId = () => useUIStateStore(state => state.cityId);
const useNeighborhoodId = () => useUIStateStore(state => state.neighborhoodId);
const useHashtags = () => useUIStateStore(state => state.hashtags || []); // Default to empty array

const Results = () => {
  // Use individual selectors from the store
  const cityId = useCityId();
  const neighborhoodId = useNeighborhoodId();
  const hashtags = useHashtags();

  const { openQuickAdd } = useQuickAdd();
  const isAuthenticated = useAuthStore(state => state.isAuthenticated); // Select only what's needed

  const hasActiveFilters = !!cityId || !!neighborhoodId || hashtags.length > 0;

  const {
    data: trendingData,
    isLoading,
    isSuccess,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['trendingDataHome'],
    queryFn: fetchAllTrendingData,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    placeholderData: { restaurants: [], dishes: [], lists: [] },
  });

  const [expandedSections, setExpandedSections] = useState({ dishes: true, restaurants: true, lists: true });

  const filterItems = useCallback(
    (items) => {
      if (!Array.isArray(items)) return [];
      if (!hasActiveFilters) return items;

      return items.filter(item => {
        const itemCityId = item?.city_id != null ? parseInt(String(item.city_id), 10) : null;
        const itemNeighborhoodId = item?.neighborhood_id != null ? parseInt(String(item.neighborhood_id), 10) : null;
        const filterCityId = cityId != null ? parseInt(String(cityId), 10) : null;
        const filterNeighborhoodId = neighborhoodId != null ? parseInt(String(neighborhoodId), 10) : null;

        const matchesCity = !filterCityId || (itemCityId === filterCityId);
        const matchesNeighborhood = !filterNeighborhoodId || (itemNeighborhoodId === filterNeighborhoodId);
        const itemTags = Array.isArray(item.tags) ? item.tags : [];
        const matchesHashtags =
          hashtags.length === 0 ||
          hashtags.every(tag => itemTags.includes(tag));

        return matchesCity && matchesNeighborhood && matchesHashtags;
      });
    },
    [cityId, neighborhoodId, hashtags, hasActiveFilters]
  );

  // Memoize filtered results
  const filteredRestaurants = useMemo(
    () => filterItems(trendingData?.restaurants),
    [trendingData?.restaurants, filterItems]
  );
  const filteredDishes = useMemo(
    () => filterItems(trendingData?.dishes),
    [trendingData?.dishes, filterItems]
  );
  const filteredLists = useMemo(
    () => filterItems(trendingData?.lists),
    [trendingData?.lists, filterItems]
  );

  const toggleSection = useCallback(
    (section) => setExpandedSections(prev => ({ ...prev, [section]: !prev[section] })),
    []
  );

  const handleQuickAdd = useCallback(
    (item, sectionKey) => {
        if (!isAuthenticated) {
             console.log("User not authenticated, cannot quick add.");
             // Optionally navigate to login or show message
             return;
        }
      const type = sectionKey === 'restaurants' ? 'restaurant' : 'dish';
      openQuickAdd({
        id: item.id,
        name: item.name,
        restaurantId: sectionKey === 'dishes' ? item.restaurant_id : undefined,
        restaurantName: sectionKey === 'dishes' ? (item.restaurant_name || item.restaurant) : undefined,
        tags: item.tags || [],
        type,
      });
    },
    [openQuickAdd, isAuthenticated]
  );

  const renderSection = useCallback(
    (title, items, Component, sectionKey, Icon) => {
      if (!Array.isArray(items)) return null; // Guard against non-array items

      const isExpanded = expandedSections[sectionKey];
      const SkeletonComponent = skeletonMap[sectionKey];
      const displayLimit = 5;
      const displayItems = isExpanded ? items : items.slice(0, displayLimit);
      const hasMoreItems = items.length > displayLimit;

      // Check underlying data state
      const underlyingItems = trendingData ? trendingData[sectionKey] : [];
      const hasUnderlyingData = Array.isArray(underlyingItems) && underlyingItems.length > 0;

       // Case 1: Filters active, no matches, but underlying data exists
       if (items.length === 0 && !isLoading && hasActiveFilters && hasUnderlyingData) {
         return (
           <div className="mb-8">
             <div className="flex justify-between items-center mb-3">
               <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                 {Icon && <Icon size={20} className="text-[#A78B71]" />}
                 {title} (0)
               </h2>
               {/* Show expand/collapse only if underlying data had more items initially */}
                {underlyingItems.length > displayLimit && (
                    <Button /* ... toggle button ... */ >
                        {isExpanded ? 'Show Less' : 'Show More'}
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </Button>
                )}
             </div>
             <p className="text-gray-500 text-sm italic pl-1 border border-dashed border-gray-200 bg-gray-50 rounded-md p-4 text-center">
               No {title.toLowerCase()} match the current filters.
             </p>
           </div>
         );
       }

       // Case 2: No underlying data at all (and not loading)
       if (items.length === 0 && !isLoading && !hasUnderlyingData) {
           return null; // Don't render the section
       }

       // Case 3: Data exists or loading
       return (
         <div className="mb-8">
           <div className="flex justify-between items-center mb-3">
             <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
               {Icon && <Icon size={20} className="text-[#A78B71]" />}
               {title} ({isLoading ? '...' : items.length})
             </h2>
             {/* Show expand/collapse only if there are more items than display limit */}
             {hasMoreItems && (
                 <Button
                    variant="tertiary"
                    size="sm"
                    onClick={() => toggleSection(sectionKey)}
                    className="text-gray-500 hover:text-gray-800 flex items-center gap-1 !px-2 !py-1"
                    aria-expanded={isExpanded}
                 >
                    {isExpanded ? 'Show Less' : 'Show More'}
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                 </Button>
             )}
           </div>
           {/* Loading Skeletons */}
           {isLoading && SkeletonComponent && (
             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
               {Array.from({ length: displayLimit }).map((_, index) => (
                 <SkeletonComponent key={`skeleton-${sectionKey}-${index}`} />
               ))}
             </div>
           )}
           {/* Display Items */}
           {!isLoading && items.length > 0 && (
             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
               {displayItems.map(item => {
                 if (!item || typeof item.id === 'undefined' || item.id === null) return null;
                 let props = { ...item };
                 if (Component === DishCard) props.restaurant = item.restaurant_name || item.restaurant;
                 if (sectionKey !== "lists") props.onQuickAdd = (e) => { e.stopPropagation(); e.preventDefault(); handleQuickAdd(item, sectionKey); };
                 if (Component === ListCard) props.type = item.list_type || item.type || 'mixed';
                 return <Component key={`${sectionKey}-${item.id}`} {...props} />;
               })}
             </div>
           )}
         </div>
       );
    },
    // Ensure dependencies are correct, especially those from useMemo/useCallback
    [expandedSections, isLoading, isSuccess, toggleSection, handleQuickAdd, trendingData, hasActiveFilters, filterItems]
  );

  // Determine overall state for messages
   const hasAnyFilteredResults = !isLoading && (filteredRestaurants?.length > 0 || filteredDishes?.length > 0 || filteredLists?.length > 0);
   const hasAnyUnderlyingData = !isLoading && trendingData && (trendingData.restaurants?.length > 0 || trendingData.dishes?.length > 0 || trendingData.lists?.length > 0);

  return (
    <div className="mt-4">
       <HeaderBillboard />

      {/* Show spinner only during initial load when no data exists */}
      {isLoading && !hasAnyUnderlyingData && (
        <LoadingSpinner message="Loading trending items..." />
      )}

       {/* Render sections once loading is complete */}
       {!isLoading && isSuccess && (
            <>
                {renderSection('Trending Restaurants', filteredRestaurants, RestaurantCard, 'restaurants', Flame)}
                {renderSection('Trending Dishes', filteredDishes, DishCard, 'dishes', Utensils)}
                {renderSection('Popular Lists', filteredLists, ListCard, 'lists', Bookmark)}
            </>
       )}

      {/* Message for no results matching filters */}
      {isSuccess && !isError && !hasAnyFilteredResults && hasActiveFilters && hasAnyUnderlyingData && (
        <p className="text-gray-500 text-center py-6 border border-dashed border-gray-200 rounded-lg bg-gray-50">
          No trending items found matching your selected filters.
        </p>
      )}

       {/* Message for absolutely no data available */}
       {isSuccess && !isError && !hasAnyUnderlyingData && (
           <p className="text-gray-500 text-center py-6 border border-dashed border-gray-200 rounded-lg bg-gray-50">
               No trending items available right now.
           </p>
       )}

      {/* Error message display */}
      {isError && !isLoading && (
        <ErrorMessage
          message={error?.message || 'Failed to load trending data.'}
          onRetry={refetch}
          isLoadingRetry={isLoading} // Use isLoading for retry spinner state
          containerClassName="mt-6"
        />
      )}
    </div>
  );
};

export default Results;