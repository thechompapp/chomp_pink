/* src/pages/Home/Results.jsx */
import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { trendingService } from '@/services/trendingService';
import DishCard from '@/components/UI/DishCard';
import RestaurantCard from '@/components/UI/RestaurantCard';
import ListCard from '@/pages/Lists/ListCard';
// Corrected import path
import useUIStateStore from '@/stores/useUIStateStore';
import useAuthStore from '@/stores/useAuthStore';
import { ChevronDown, ChevronUp, Flame, Utensils, Bookmark } from 'lucide-react';
import ErrorMessage from '@/components/UI/ErrorMessage';
import RestaurantCardSkeleton from '@/components/UI/RestaurantCardSkeleton';
import DishCardSkeleton from '@/components/UI/DishCardSkeleton';
import ListCardSkeleton from '@/pages/Lists/ListCardSkeleton';
import { useQuickAdd } from '@/context/QuickAddContext';
import Button from '@/components/Button';
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import HeaderBillboard from '@/components/HeaderBillboard';

const fetchAllTrendingData = async () => {
  try {
    const [restaurants, dishes, lists] = await Promise.all([
      trendingService.getTrendingRestaurants(),
      trendingService.getTrendingDishes(),
      trendingService.getTrendingLists(),
    ]);
    // Ensure arrays are returned even if service returns null/undefined
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
const useCityId = () => useUIStateStore(state => state.cityId);
const useNeighborhoodId = () => useUIStateStore(state => state.neighborhoodId);
const useHashtags = () => useUIStateStore(state => state.hashtags || []);

const Results = () => {
  const cityId = useCityId();
  const neighborhoodId = useNeighborhoodId();
  const hashtags = useHashtags();
  const { openQuickAdd } = useQuickAdd();
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const user = useAuthStore(state => state.user);
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
    staleTime: 0, // Refetch on mount/navigation to home
    refetchOnWindowFocus: true, // Refetch if window regains focus
    placeholderData: { restaurants: [], dishes: [], lists: [] },
  });

  const [expandedSections, setExpandedSections] = useState({ dishes: true, restaurants: true, lists: true }); // Expand by default

  const filterItems = useCallback(
    (items) => {
      if (!Array.isArray(items)) return [];
      // If no filters active, return all items immediately
      if (!hasActiveFilters) return items;

      return items.filter(item => {
        // Ensure IDs are numbers for comparison if they exist
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
    [cityId, neighborhoodId, hashtags, hasActiveFilters] // Include hasActiveFilters
  );

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
             // Optionally navigate to login or show a message
             console.log("User not authenticated, cannot quick add.");
             return;
        }
      const type = sectionKey === 'restaurants' ? 'restaurant' : 'dish';
      openQuickAdd({
        id: item.id,
        name: item.name,
        // Ensure correct restaurant context for dishes
        restaurantId: sectionKey === 'dishes' ? item.restaurant_id : undefined,
        restaurantName: sectionKey === 'dishes' ? (item.restaurant_name || item.restaurant) : undefined,
        tags: item.tags || [],
        type,
      });
    },
    [openQuickAdd, isAuthenticated] // Add isAuthenticated dependency
  );

  const renderSection = useCallback(
    (title, items, Component, sectionKey, Icon) => {
      if (!Array.isArray(items)) return null;
      const isExpanded = expandedSections[sectionKey];
      const SkeletonComponent = skeletonMap[sectionKey];
      const displayLimit = 5;
      const displayItems = isExpanded ? items : items.slice(0, displayLimit);
      const hasMoreItems = items.length > displayLimit;

      // Determine if underlying data exists even if filtered result is empty
      const underlyingItems = trendingData ? trendingData[sectionKey] : [];
      const hasUnderlyingData = Array.isArray(underlyingItems) && underlyingItems.length > 0;

      // Show 'no items match' only if filters are active and underlying data exists
      if (items.length === 0 && !isLoading && hasActiveFilters && hasUnderlyingData) {
          return (
             <div className="mb-8">
               <div className="flex justify-between items-center mb-3">
                 <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                   <Icon size={20} className="text-[#A78B71]" />
                   {title} (0)
                 </h2>
                  {/* *** CORRECTED - Expand toggle button *** */}
                  {hasMoreItems && hasUnderlyingData && (
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
                   {/* *** END CORRECTION *** */}
               </div>
               <p className="text-gray-500 text-sm italic pl-1 border border-dashed border-gray-200 bg-gray-50 rounded-md p-4 text-center">
                 No {title.toLowerCase()} match the current filters.
               </p>
             </div>
           );
      }
       // Don't render the section at all if there's no underlying data and it's not loading
       if (items.length === 0 && !isLoading && !hasUnderlyingData) {
           return null;
       }


      return (
        <div className="mb-8">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <Icon size={20} className="text-[#A78B71]" />
              {/* Show count based on filtered items */}
              {title} ({isLoading ? '...' : items.length})
            </h2>
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
          {isLoading && SkeletonComponent && ( // Show skeletons only if component exists
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {Array.from({ length: displayLimit }).map((_, index) => (
                <SkeletonComponent key={`skeleton-${sectionKey}-${index}`} />
              ))}
            </div>
          )}
          {!isLoading && items.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {displayItems.map(item => {
                if (!item || typeof item.id === 'undefined' || item.id === null) return null;
                let props = { ...item };
                // Pass correct restaurant context for DishCard
                if (Component === DishCard) props.restaurant = item.restaurant_name || item.restaurant;
                // Pass quick add handler only for restaurants/dishes
                if (sectionKey !== "lists") props.onQuickAdd = (e) => { e.stopPropagation(); e.preventDefault(); handleQuickAdd(item, sectionKey); };
                return <Component key={`${sectionKey}-${item.id}`} {...props} />;
              })}
            </div>
          )}
        </div>
      );
    },
    [expandedSections, isLoading, isSuccess, toggleSection, handleQuickAdd, trendingData, hasActiveFilters, filterItems]
  );

   // Check if *any* data exists after filtering, considering loading state
   const hasAnyFilteredResults = !isLoading && (filteredRestaurants?.length > 0 || filteredDishes?.length > 0 || filteredLists?.length > 0);
   // Check if *any* underlying data exists before filtering
   const hasAnyUnderlyingData = !isLoading && trendingData && (trendingData.restaurants?.length > 0 || trendingData.dishes?.length > 0 || trendingData.lists?.length > 0);


  return (
    <div className="mt-4">
       {/* HeaderBillboard might go here or in Home/index.jsx */}
       <HeaderBillboard />

      {/* Show initial loading spinner only if no data is available yet */}
      {isLoading && !hasAnyUnderlyingData && (
        <LoadingSpinner message="Loading trending items..." />
      )}

       {/* Display sections if loading is complete */}
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
      {isError && !isLoading && ( // Show error only if not initially loading
        <ErrorMessage
          message={error?.message || 'Failed to load trending data.'}
          onRetry={refetch}
          isLoadingRetry={isLoading}
          containerClassName="mt-6"
        />
      )}
    </div>
  );
};

export default Results;