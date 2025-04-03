// src/hooks/useFilteredData.js
// FIX: Guarantee returning arrays even if store state is initially undefined
import useTrendingStore from '@/stores/useTrendingStore.js';
import useUIStateStore from '@/stores/useUIStateStore.js';

const useFilteredData = () => {
  // Select filter criteria
  const cityId = useUIStateStore((state) => state.cityId);

  // Select raw data arrays, explicitly providing default empty arrays
  // Use the optional chaining ?. and nullish coalescing ?? for extra safety
  const trendingItems = useTrendingStore((state) => state?.trendingItems) ?? [];
  const trendingDishes = useTrendingStore((state) => state?.trendingDishes) ?? [];
  const popularLists = useTrendingStore((state) => state?.popularLists) ?? [];

  console.log('[useFilteredData Hook] Selecting raw data:', {
      cityId,
      // Ensure length check is safe even if array is somehow null/undefined initially
      rawTrendingItemsLength: trendingItems?.length ?? 0,
      rawTrendingDishesLength: trendingDishes?.length ?? 0,
      rawPopularListsLength: popularLists?.length ?? 0,
  });

  // Return the raw data and filter criteria, ensuring they are arrays
  return {
    cityId,
    rawRestaurants: Array.isArray(trendingItems) ? trendingItems : [],
    rawDishes: Array.isArray(trendingDishes) ? trendingDishes : [],
    rawLists: Array.isArray(popularLists) ? popularLists : [],
  };
};

export default useFilteredData;