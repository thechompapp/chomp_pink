/* src/pages/Home/Results.jsx */
/* REMOVED: All TypeScript syntax */
import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { trendingService } from '@/services/trendingService';
import DishCard from '@/components/UI/DishCard';
import RestaurantCard from '@/components/UI/RestaurantCard';
import ListCard from '@/pages/Lists/ListCard';
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
import HeaderBillboard from '@/components/HeaderBillboard'; // Assuming JS/JSX
import { useShallow } from 'zustand/react/shallow';
import QueryResultDisplay from '@/components/QueryResultDisplay'; // Use the component

// Fetcher function
const fetchAllTrendingData = async () => {
  try {
    const [restaurants, dishes, lists] = await Promise.all([
      trendingService.getTrendingRestaurants(),
      trendingService.getTrendingDishes(),
      trendingService.getTrendingLists(),
    ]);
    // Ensure results are arrays
    return {
        restaurants: Array.isArray(restaurants) ? restaurants : [],
        dishes: Array.isArray(dishes) ? dishes : [],
        lists: Array.isArray(lists) ? lists : []
    };
  } catch (error) {
    console.error('[Results] Error fetching trending data:', error);
    // Throw a more specific error or return a default structure
    throw new Error(error instanceof Error ? error.message : 'Failed to load trending data');
  }
};

const skeletonMap = { dishes: DishCardSkeleton, restaurants: RestaurantCardSkeleton, lists: ListCardSkeleton };

// Use individual selectors for stability
const useCityId = () => useUIStateStore(state => state.cityId);
const useNeighborhoodId = () => useUIStateStore(state => state.neighborhoodId);
const useHashtags = () => useUIStateStore(state => state.hashtags || []);

const Results = () => {
  const cityId = useCityId();
  const neighborhoodId = useNeighborhoodId();
  const hashtags = useHashtags();

  const { openQuickAdd } = useQuickAdd();
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  const hasActiveFilters = !!cityId || !!neighborhoodId || hashtags.length > 0;

  // UseQuery setup
  const queryResult = useQuery({ // Changed variable name
    queryKey: ['trendingDataHome'],
    queryFn: fetchAllTrendingData,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    placeholderData: { restaurants: [], dishes: [], lists: [] }, // Provide placeholder
  });

  // Destructure from queryResult for easier access
  const { data: trendingData, isLoading, isSuccess, isError, error, refetch, isFetching } = queryResult;

  const [expandedSections, setExpandedSections] = useState({ dishes: true, restaurants: true, lists: true });

  const filterItems = useCallback(
    (items) => {
      if (!Array.isArray(items)) return [];
      if (!hasActiveFilters) return items;

      return items.filter(item => {
         // Ensure IDs are numbers for comparison
        const itemCityId = item?.city_id != null ? parseInt(String(item.city_id), 10) : null;
        const itemNeighborhoodId = item?.neighborhood_id != null ? parseInt(String(item.neighborhood_id), 10) : null;
        const filterCityId = cityId != null ? parseInt(String(cityId), 10) : null;
        const filterNeighborhoodId = neighborhoodId != null ? parseInt(String(neighborhoodId), 10) : null;

        const matchesCity = !filterCityId || (itemCityId === filterCityId);
        const matchesNeighborhood = !filterNeighborhoodId || (itemNeighborhoodId === filterNeighborhoodId);
        const itemTags = Array.isArray(item.tags) ? item.tags : [];
        const matchesHashtags =
          hashtags.length === 0 ||
          hashtags.every(tag => itemTags.some(itemTag => itemTag.toLowerCase() === tag.toLowerCase())); // Case-insensitive tag matching

        return matchesCity && matchesNeighborhood && matchesHashtags;
      });
    },
    [cityId, neighborhoodId, hashtags, hasActiveFilters]
  );

  const filteredRestaurants = useMemo(() => filterItems(trendingData?.restaurants), [trendingData?.restaurants, filterItems]);
  const filteredDishes = useMemo(() => filterItems(trendingData?.dishes), [trendingData?.dishes, filterItems]);
  const filteredLists = useMemo(() => filterItems(trendingData?.lists), [trendingData?.lists, filterItems]);

  const toggleSection = useCallback((section) => setExpandedSections(prev => ({ ...prev, [section]: !prev[section] })), []);

  const handleQuickAdd = useCallback((item, sectionKey) => {
        if (!isAuthenticated) {
             console.log("User not authenticated, cannot quick add.");
             return;
        }
        const type = sectionKey === 'restaurants' ? 'restaurant' : 'dish';
        // Ensure all necessary fields are passed
        openQuickAdd({
            id: item.id,
            name: item.name,
            restaurantId: sectionKey === 'dishes' ? item.restaurant_id : undefined,
            restaurantName: sectionKey === 'dishes' ? (item.restaurant_name || item.restaurant) : undefined, // Use backend name first
            tags: item.tags || [],
            type,
            city: item.city_name || item.city, // Pass location info if available
            neighborhood: item.neighborhood_name || item.neighborhood,
        });
    }, [openQuickAdd, isAuthenticated]);

  // Component to render a section grid
  const SectionGrid = ({ items, Component, sectionKey }) => (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {items.map(item => {
              if (!item || item.id == null) return null;
              let props = { ...item };
              // Map fields specific to card components
              if (Component === DishCard) props.restaurant = item.restaurant_name || item.restaurant;
              if (sectionKey !== "lists") props.onQuickAdd = (e) => { e.stopPropagation(); e.preventDefault(); handleQuickAdd(item, sectionKey); };
              if (Component === ListCard) props.type = item.list_type || item.type || 'mixed'; // Handle list type variations

              return <Component key={`${sectionKey}-${item.id}`} {...props} />;
          })}
      </div>
  );

  const renderSection = useCallback(
    (title, items, Component, sectionKey, Icon) => {
      if (!Array.isArray(items)) return null;

      const isExpanded = expandedSections[sectionKey];
      const SkeletonComponent = skeletonMap[sectionKey];
      const displayLimit = 5; // Show 5 initially
      const displayItems = isExpanded ? items : items.slice(0, displayLimit);
      const hasMoreItems = items.length > displayLimit;

      const underlyingItems = trendingData ? trendingData[sectionKey] : [];
      const hasUnderlyingData = Array.isArray(underlyingItems) && underlyingItems.length > 0;

      // Render loading state using skeletons
      if (isLoading || (isFetching && !isSuccess)) { // Show skeletons also during refetch if desired
          return (
               <div className="mb-8">
                   <div className="flex justify-between items-center mb-3">
                       <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                           {Icon && <Icon size={20} className="text-[#A78B71]" />} {title} (...)
                       </h2>
                   </div>
                   {SkeletonComponent && (
                       <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                           {Array.from({ length: displayLimit }).map((_, index) => (
                               <SkeletonComponent key={`skeleton-${sectionKey}-${index}`} />
                           ))}
                       </div>
                   )}
               </div>
           );
       }

       // Render "no match" message if filters active and no results for this section
       if (items.length === 0 && hasActiveFilters && hasUnderlyingData) {
           return (
               <div className="mb-8">
                   <div className="flex justify-between items-center mb-3">
                       <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                           {Icon && <Icon size={20} className="text-[#A78B71]" />} {title} (0)
                       </h2>
                       {/* Show expand/collapse only if underlying data existed */}
                       {underlyingItems.length > displayLimit && (
                            <Button variant="tertiary" size="sm" onClick={() => toggleSection(sectionKey)} className="..." aria-expanded={isExpanded}>
                                {isExpanded ? 'Show Less' : 'Show More'} {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </Button>
                       )}
                   </div>
                   <p className="text-gray-500 text-sm italic pl-1 border border-dashed border-gray-200 bg-gray-50 rounded-md p-4 text-center">
                       No {title.toLowerCase()} match the current filters.
                   </p>
               </div>
           );
       }

       // Render nothing if no data ever existed for this section
       if (items.length === 0 && !hasUnderlyingData) {
           return null;
       }

       // Render the actual data
       return (
         <div className="mb-8">
           <div className="flex justify-between items-center mb-3">
             <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
               {Icon && <Icon size={20} className="text-[#A78B71]" />} {title} ({items.length})
             </h2>
             {hasMoreItems && (
                 <Button variant="tertiary" size="sm" onClick={() => toggleSection(sectionKey)} className="text-gray-500 hover:text-gray-800 flex items-center gap-1 !px-2 !py-1" aria-expanded={isExpanded}>
                     {isExpanded ? 'Show Less' : 'Show More'} {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                 </Button>
             )}
           </div>
           <SectionGrid items={displayItems} Component={Component} sectionKey={sectionKey} />
         </div>
       );
    },
    [expandedSections, isLoading, isFetching, isSuccess, toggleSection, handleQuickAdd, trendingData, hasActiveFilters, filterItems] // Added isFetching
  );

  const hasAnyFilteredResults = filteredRestaurants?.length > 0 || filteredDishes?.length > 0 || filteredLists?.length > 0;
  const hasAnyUnderlyingData = trendingData && (trendingData.restaurants?.length > 0 || trendingData.dishes?.length > 0 || trendingData.lists?.length > 0);

  return (
    <div className="mt-4">
       <HeaderBillboard />

      {/* Removed initial loading spinner, handled by QueryResultDisplay logic within renderSection */}

       {/* Display ErrorMessage if the main query failed */}
       {isError && !isLoading && (
         <ErrorMessage
           message={error?.message || 'Failed to load trending data.'}
           onRetry={refetch}
           isLoadingRetry={isFetching} // Use isFetching for retry spinner state
           containerClassName="mt-6"
         />
       )}

       {/* Render sections only when successful */}
       {isSuccess && !isError && (
           <>
                {renderSection('Trending Restaurants', filteredRestaurants, RestaurantCard, 'restaurants', Flame)}
                {renderSection('Trending Dishes', filteredDishes, DishCard, 'dishes', Utensils)}
                {renderSection('Popular Lists', filteredLists, ListCard, 'lists', Bookmark)}

                {/* Message for no results matching filters (shown only if sections didn't render it) */}
                {!hasAnyFilteredResults && hasActiveFilters && hasAnyUnderlyingData && (
                    <p className="text-gray-500 text-center py-6 border border-dashed border-gray-200 rounded-lg bg-gray-50">
                    No trending items found matching your selected filters.
                    </p>
                )}

                {/* Message for absolutely no data available (shown only if sections didn't render it) */}
                {!hasAnyUnderlyingData && (
                    <p className="text-gray-500 text-center py-6 border border-dashed border-gray-200 rounded-lg bg-gray-50">
                        No trending items available right now.
                    </p>
                )}
           </>
       )}

    </div>
  );
};

export default Results;