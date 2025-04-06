// src/pages/Home/Results.jsx
import React, { memo, useMemo, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { trendingService } from '@/services/trendingService';
import DishCard from '@/components/UI/DishCard';
import RestaurantCard from '@/components/UI/RestaurantCard';
import ListCard from '@/pages/Lists/ListCard';
import useUIStateStore from '@/stores/useUIStateStore.js';
import useAuthStore from '@/stores/useAuthStore';
import { ChevronDown, ChevronUp, Flame, Utensils, Bookmark } from 'lucide-react';
import ErrorMessage from '@/components/UI/ErrorMessage';
import RestaurantCardSkeleton from '@/components/UI/RestaurantCardSkeleton';
import DishCardSkeleton from '@/components/UI/DishCardSkeleton';
import ListCardSkeleton from '@/pages/Lists/ListCardSkeleton';
import { useQuickAdd } from '@/context/QuickAddContext';
import Button from '@/components/Button';
import LoadingSpinner from '@/components/UI/LoadingSpinner';

// Fetcher function
const fetchAllTrendingData = async () => {
  console.log('[Results] Fetching all trending data via service...');
  try {
    const [restaurants, dishes, lists] = await Promise.all([
      trendingService.getTrendingRestaurants(),
      trendingService.getTrendingDishes(),
      trendingService.getTrendingLists(),
    ]);
     console.log(`[Results] Fetched: ${restaurants?.length || 0} restaurants, ${dishes?.length || 0} dishes, ${lists?.length || 0} lists.`);
    // Ensure service returns necessary fields for ListCard (user_id, creator_handle)
    return {
      restaurants: restaurants || [],
      dishes: dishes || [],
      lists: lists || [],
    };
  } catch (error) {
    console.error('[Results] Error fetching trending data:', error);
    throw new Error(error.message || 'Failed to load trending data');
  }
};

const skeletonMap = {
  dishes: DishCardSkeleton,
  restaurants: RestaurantCardSkeleton,
  lists: ListCardSkeleton,
};

// Store selectors
const useCityId = () => useUIStateStore(state => state.cityId);
// const useNeighborhoodId = () => useUIStateStore(state => state.neighborhoodId); // Not currently used for filtering here
const useHashtags = () => useUIStateStore(state => state.hashtags || []);

const Results = memo(() => {
  // Hooks
  const cityId = useCityId();
  // const neighborhoodId = useNeighborhoodId(); // Not used
  const hashtags = useHashtags(); // This is the array of selected hashtag strings
  const { openQuickAdd } = useQuickAdd();
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const user = useAuthStore(state => state.user);

  // Define hasActiveFilters within this component's scope
  const hasActiveFilters = !!cityId || hashtags.length > 0;

  // React Query setup
  const {
    data: trendingData,
    isLoading,
    isSuccess,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['trendingDataHome'], // Only one key, fetch all trending data
    queryFn: fetchAllTrendingData,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    placeholderData: { restaurants: [], dishes: [], lists: [] },
  });

  // Default sections to collapsed
  const [expandedSections, setExpandedSections] = useState({ dishes: false, restaurants: false, lists: false });

  // Filtering logic (Client-side filtering)
  const filterItems = useCallback((items) => {
    if (!Array.isArray(items)) return [];
    return items.filter(item => {
      // Filter by City ID if selected
      const matchesCity = !cityId || (item.city_id === cityId);

      // Filter by Hashtags: item must include *all* selected hashtags
      const matchesHashtags = hashtags.length === 0 || (Array.isArray(item.tags) && hashtags.every(tag => item.tags.includes(tag)));
      // Alternative: Use .some if you want items matching *any* selected tag:
      // const matchesHashtags = hashtags.length === 0 || (Array.isArray(item.tags) && hashtags.some(tag => item.tags.includes(tag)));

      // Combine filters (only city and hashtags are used here)
      return matchesCity && matchesHashtags;
    });
  }, [cityId, hashtags]); // Dependencies: cityId and hashtags array

  // Memoized Data
  const filteredRestaurants = useMemo(() => filterItems(trendingData?.restaurants), [trendingData?.restaurants, filterItems]);
  const filteredDishes = useMemo(() => filterItems(trendingData?.dishes), [trendingData?.dishes, filterItems]);
  const filteredLists = useMemo(() => filterItems(trendingData?.lists), [trendingData?.lists, filterItems]);

  const toggleSection = useCallback((section) => {
       setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
   }, []);

  const handleQuickAdd = useCallback((item, sectionKey) => {
       const type = sectionKey === 'restaurants' ? 'restaurant' : 'dish';
       openQuickAdd({ id: item.id, name: item.name, restaurantName: sectionKey === 'dishes' ? (item.restaurant_name || item.restaurant) : undefined, tags: item.tags, type });
   }, [openQuickAdd]);

  // Section Rendering
  const renderSection = useCallback((title, items, Component, sectionKey, Icon) => {
    // Note: `items` here are the *already filtered* items
    if (!Array.isArray(items)) return null;

    const isExpanded = expandedSections[sectionKey];
    const SkeletonComponent = skeletonMap[sectionKey];
    const displayLimit = 5; // Number of items to show when collapsed
    const displayItems = isExpanded ? items : items.slice(0, displayLimit);
    const hasMoreItems = items.length > displayLimit;

    // Render section container only if loading OR if there are items to display
    // Don't render section if not loading AND filtered items array is empty.
    if (items.length === 0 && !isLoading) {
        return null;
    }

    return (
      <div className="mb-8">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Icon size={20} className="text-[#A78B71]" /> {title} ({items.length}) {/* Show total count */}
          </h2>
          {/* Show toggle button only if there are more items than the display limit */}
          {hasMoreItems && (
             <Button
                variant="tertiary" size="sm" onClick={() => toggleSection(sectionKey)}
                className="text-gray-500 hover:text-gray-800 flex items-center gap-1 !px-2 !py-1"
                aria-expanded={isExpanded}
              >
                {isExpanded ? 'Show Less' : 'Show More'}
                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
             </Button>
          )}
        </div>

        {/* Render Skeletons when loading */}
        {isLoading && (
             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                 {/* Show fewer skeletons if sections start collapsed */}
                 {Array.from({ length: displayLimit }).map((_, index) => <SkeletonComponent key={`skeleton-${sectionKey}-${index}`} />)}
             </div>
         )}

        {/* Render items only if NOT loading and items exist */}
        {!isLoading && items.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                 {displayItems.map(item => {
                     if (!item || typeof item.id === 'undefined' || item.id === null) return null;
                     let props = { ...item }; // Spread all item properties
                     if (Component === DishCard) props.restaurant = item.restaurant_name || item.restaurant;
                     // Pass necessary props for ListCard's internal logic
                     if (Component === ListCard) {
                         props.is_following = item.is_following ?? false; // Ensure default
                         // user_id and creator_handle should be present from the API data
                     }
                     // Pass quick add handler only for relevant types
                     if (sectionKey !== "lists") props.onQuickAdd = (e) => { e.stopPropagation(); e.preventDefault(); handleQuickAdd(item, sectionKey); };

                     return <Component key={`${sectionKey}-${item.id}`} {...props} />;
                 })}
            </div>
        )}

        {/* Message if underlying data exists but all items are filtered out */}
        {/* This condition might be tricky to get right if trendingData exists but filtered is empty */}
        {!isLoading && trendingData && items.length === 0 && hasActiveFilters && ( // Check hasActiveFilters here
             <p className="text-gray-500 text-sm italic pl-1">No items match the current filters in this section.</p>
         )}
      </div>
    );
  }, [expandedSections, isLoading, isSuccess, toggleSection, handleQuickAdd, isAuthenticated, user, trendingData, hasActiveFilters]); // Added hasActiveFilters dependency

  // Check for results AFTER filtering
  const hasAnyFilteredResults = isSuccess && (
                         (filteredRestaurants?.length || 0) > 0 ||
                         (filteredDishes?.length || 0) > 0 ||
                         (filteredLists?.length || 0) > 0
                     );

  return (
    <div className="mt-4">
       {/* Initial loading spinner for the whole section */}
       {isLoading && (!trendingData?.restaurants?.length && !trendingData?.dishes?.length && !trendingData?.lists?.length) &&
            <LoadingSpinner message="Loading trending items..." />
       }

      {/* Render sections only if query was successful (even if filtered results are empty) */}
      {isSuccess && (
          <>
              {renderSection('Trending Restaurants', filteredRestaurants, RestaurantCard, 'restaurants', Flame)}
              {renderSection('Trending Dishes', filteredDishes, DishCard, 'dishes', Utensils)}
              {renderSection('Popular Lists', filteredLists, ListCard, 'lists', Bookmark)}
          </>
       )}

      {/* No results message (if successful fetch but NO items match filters) */}
      {/* Use the correctly defined hasActiveFilters here */}
      {isSuccess && !isError && !hasAnyFilteredResults && hasActiveFilters && (
        <p className="text-gray-500 text-center py-6 border border-dashed border-gray-200 rounded-lg bg-gray-50">
            No trending items found matching your selected filters.
        </p>
      )}
       {/* Message if successful fetch but backend returned nothing at all */}
       {isSuccess && !isError && !hasAnyFilteredResults && !hasActiveFilters && trendingData &&
         !(trendingData.restaurants?.length > 0 || trendingData.dishes?.length > 0 || trendingData.lists?.length > 0) && (
             <p className="text-gray-500 text-center py-6">No trending items available right now.</p>
         )
       }

      {/* Error message */}
      {isError && (
        <ErrorMessage
          message={error?.message || 'Failed to load trending data.'}
          onRetry={refetch}
          isLoadingRetry={isLoading}
          containerClassName="mt-6"
        />
      )}
    </div>
  );
});

export default Results;