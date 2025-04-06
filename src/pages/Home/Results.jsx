/* src/pages/Home/Results.jsx */
import React, { useMemo, useState, useCallback, useEffect } from 'react';
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
import HeaderBillboard from '@/components/HeaderBillboard';

const fetchAllTrendingData = async () => {
  try {
    const [restaurants, dishes, lists] = await Promise.all([
      trendingService.getTrendingRestaurants(),
      trendingService.getTrendingDishes(),
      trendingService.getTrendingLists(),
    ]);
    return { restaurants: restaurants || [], dishes: dishes || [], lists: lists || [] };
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
    staleTime: 0,
    placeholderData: { restaurants: [], dishes: [], lists: [] },
  });

  const [expandedSections, setExpandedSections] = useState({ dishes: false, restaurants: false, lists: false });

  const filterItems = useCallback(
    (items) => {
      if (!Array.isArray(items)) return [];
      return items.filter(item => {
        const matchesCity = !cityId || (item.city_id === cityId);
        const matchesNeighborhood = !neighborhoodId || (item.neighborhood_id === neighborhoodId);
        const matchesHashtags =
          hashtags.length === 0 ||
          (Array.isArray(item.tags) && hashtags.every(tag => item.tags.includes(tag)));
        return matchesCity && matchesNeighborhood && matchesHashtags;
      });
    },
    [cityId, neighborhoodId, hashtags]
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
      const type = sectionKey === 'restaurants' ? 'restaurant' : 'dish';
      openQuickAdd({
        id: item.id,
        name: item.name,
        restaurantName: sectionKey === 'dishes' ? (item.restaurant_name || item.restaurant) : undefined,
        tags: item.tags,
        type,
      });
    },
    [openQuickAdd]
  );

  const renderSection = useCallback(
    (title, items, Component, sectionKey, Icon) => {
      if (!Array.isArray(items)) return null;
      const isExpanded = expandedSections[sectionKey];
      const SkeletonComponent = skeletonMap[sectionKey];
      const displayLimit = 5;
      const displayItems = isExpanded ? items : items.slice(0, displayLimit);
      const hasMoreItems = items.length > displayLimit;

      if (items.length === 0 && !isLoading) {
        const underlyingItems = trendingData ? trendingData[sectionKey] : [];
        if (underlyingItems.length > 0 && hasActiveFilters) {
          return (
            <div className="mb-8">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                  <Icon size={20} className="text-[#A78B71]" />
                  {title} (0)
                </h2>
              </div>
              <p className="text-gray-500 text-sm italic pl-1">
                No items match the current filters in this section.
              </p>
            </div>
          );
        }
        return null;
      }

      return (
        <div className="mb-8">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <Icon size={20} className="text-[#A78B71]" />
              {title} ({items.length})
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
          {isLoading && (
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
                if (Component === DishCard) props.restaurant = item.restaurant_name || item.restaurant;
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

  const hasAnyFilteredResults = isSuccess && (filteredRestaurants?.length > 0 || filteredDishes?.length > 0 || filteredLists?.length > 0);

  return (
    <div className="mt-4">
      <HeaderBillboard />
      {isLoading && (!trendingData?.restaurants?.length && !trendingData?.dishes?.length && !trendingData?.lists?.length) && (
        <LoadingSpinner message="Loading trending items..." />
      )}
      {isSuccess && (
        <>
          {renderSection('Trending Restaurants', filteredRestaurants, RestaurantCard, 'restaurants', Flame)}
          {renderSection('Trending Dishes', filteredDishes, DishCard, 'dishes', Utensils)}
          {renderSection('Popular Lists', filteredLists, ListCard, 'lists', Bookmark)}
        </>
      )}
      {isSuccess && !isError && !hasAnyFilteredResults && hasActiveFilters && (
        <p className="text-gray-500 text-center py-6 border border-dashed border-gray-200 rounded-lg bg-gray-50">
          No trending items found matching your selected filters.
        </p>
      )}
      {isSuccess && !isError && !hasAnyFilteredResults && !hasActiveFilters && trendingData && !(trendingData.restaurants?.length > 0 || trendingData.dishes?.length > 0 || trendingData.lists?.length > 0) && (
        <p className="text-gray-500 text-center py-6">No trending items available right now.</p>
      )}
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
};

export default Results;