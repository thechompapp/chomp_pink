// src/pages/Trending/index.jsx
import React, { useState, useCallback } from "react";
import { useQuery } from '@tanstack/react-query';
import useAuthStore from '@/stores/useAuthStore';
import RestaurantCard from "@/components/UI/RestaurantCard";
import DishCard from "@/components/UI/DishCard";
import ListCard from "@/pages/Lists/ListCard"; // Using alias
import { trendingService } from '@/services/trendingService';
import ErrorMessage from '@/components/UI/ErrorMessage';
import RestaurantCardSkeleton from '@/components/UI/RestaurantCardSkeleton';
import DishCardSkeleton from "@/components/UI/DishCardSkeleton";
import ListCardSkeleton from '@/pages/Lists/ListCardSkeleton'; // Using alias
import Button from "@/components/Button";
import { Flame, Utensils, Bookmark } from 'lucide-react';
import { useQuickAdd } from '@/context/QuickAddContext';

const Trending = () => {
  const [activeTab, setActiveTab] = useState("restaurants");
  const [sortMethod, setSortMethod] = useState("popular"); // Default sort
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const { openQuickAdd } = useQuickAdd();

  const queryOptions = {
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    placeholderData: [], // Start with empty array to prevent layout shifts
  };

  const { data: trendingRestaurants = [], isLoading: isLoadingRestaurants, isError: isErrorRestaurants, error: errorRestaurants, refetch: refetchRestaurants } = useQuery({
    queryKey: ['trendingRestaurantsPage'],
    queryFn: trendingService.getTrendingRestaurants,
    ...queryOptions
  });
  const { data: trendingDishes = [], isLoading: isLoadingDishes, isError: isErrorDishes, error: errorDishes, refetch: refetchDishes } = useQuery({
    queryKey: ['trendingDishesPage'],
    queryFn: trendingService.getTrendingDishes,
    ...queryOptions
  });
  const { data: trendingLists = [], isLoading: isLoadingLists, isError: isErrorLists, error: errorLists, refetch: refetchLists } = useQuery({
    queryKey: ['trendingListsPage'],
    queryFn: trendingService.getTrendingLists,
    ...queryOptions
  });

  // Combine loading and error states
  const isLoading = isLoadingRestaurants || isLoadingDishes || isLoadingLists;
  const isError = isErrorRestaurants || isErrorDishes || isErrorLists;
  // Combine errors, prioritizing the active tab's error if multiple exist
  const error = activeTab === 'restaurants' ? errorRestaurants : activeTab === 'dishes' ? errorDishes : errorLists;

  // Sorting logic memoized with useCallback
  const sortData = useCallback((items) => {
    if (!Array.isArray(items)) return [];
    const sortedItems = [...items]; // Create a new array to sort
    switch (sortMethod) {
      case "popular":
        // Sort by 'adds' for restaurants/dishes, 'saved_count' for lists
        return sortedItems.sort((a, b) => (b.adds ?? b.saved_count ?? 0) - (a.adds ?? a.saved_count ?? 0));
      case "newest":
        // Sort by creation date (ensure created_at exists or handle undefined)
        return sortedItems.sort((a, b) => (new Date(b.created_at || 0) - new Date(a.created_at || 0)));
      case "alphabetical":
        // Sort alphabetically by name
        return sortedItems.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      default:
        return sortedItems; // Return original order if sort method is unknown
    }
  }, [sortMethod]); // Dependency on sortMethod

  // Determine active data based on tab and sort
  const activeData = sortData(
    activeTab === "restaurants" ? trendingRestaurants :
    activeTab === "dishes" ? trendingDishes :
    trendingLists
  );

  // Skeleton mapping
  const skeletonMap = { restaurants: RestaurantCardSkeleton, dishes: DishCardSkeleton, lists: ListCardSkeleton };
  const SkeletonComponent = skeletonMap[activeTab];
  // Show skeletons only if loading AND there's no data yet for the active tab
  const showSkeletons = (
     (activeTab === 'restaurants' && isLoadingRestaurants && trendingRestaurants.length === 0) ||
     (activeTab === 'dishes' && isLoadingDishes && trendingDishes.length === 0) ||
     (activeTab === 'lists' && isLoadingLists && trendingLists.length === 0)
  );

  // Tab configuration
  const tabs = [
    { id: "restaurants", label: "Restaurants", Icon: Flame, count: trendingRestaurants.length, isLoading: isLoadingRestaurants },
    { id: "dishes", label: "Dishes", Icon: Utensils, count: trendingDishes.length, isLoading: isLoadingDishes },
    { id: "lists", label: "Lists", Icon: Bookmark, count: trendingLists.length, isLoading: isLoadingLists },
  ];

  // Quick add handler
  const handleQuickAdd = useCallback((item, type) => {
    if (!item || !type) return;
    openQuickAdd({
        id: item.id,
        name: item.name,
        // Provide restaurant name only for dishes, ensure correct property access
        restaurantName: type === 'dish' ? (item.restaurant || item.restaurant_name) : undefined,
        tags: item.tags, // Pass tags if available
        type: type
    });
  }, [openQuickAdd]);

  // Determine which refetch function to call based on the active tab
  const handleRetry = () => {
      if (activeTab === 'restaurants') refetchRestaurants();
      else if (activeTab === 'dishes') refetchDishes();
      else if (activeTab === 'lists') refetchLists();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Trending</h1>
        {/* Optional: Add overall actions here if needed */}
      </div>
      <div className="flex flex-col sm:flex-row justify-between border-b border-gray-200">
         {/* Tabs */}
         <div className="flex overflow-x-auto pb-1 no-scrollbar">
           {tabs.map((tab) => (
             <button
               key={tab.id}
               onClick={() => setActiveTab(tab.id)}
               className={`py-2 px-4 text-sm font-medium rounded-t-md focus:outline-none focus:ring-1 focus:ring-[#D1B399] focus:z-10 whitespace-nowrap flex items-center gap-1.5 transition-colors ${
                 activeTab === tab.id
                   ? 'text-[#A78B71] border-b-2 border-[#A78B71]'
                   : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'
               }`}
             >
               {tab.Icon && <tab.Icon size={16} />}
               {tab.label}
               {/* Show count only when not loading */}
               {!tab.isLoading && ` (${tab.count})`}
             </button>
           ))}
         </div>
         {/* Sort Dropdown */}
         <div className="flex items-center pb-1 pt-2 sm:pt-0">
           <label htmlFor="sort-by" className="mr-2 text-sm text-gray-600">Sort:</label>
           <select
             id="sort-by"
             value={sortMethod}
             onChange={(e) => setSortMethod(e.target.value)}
             className="text-sm border-gray-300 rounded-md focus:border-[#D1B399] focus:ring focus:ring-[#D1B399] focus:ring-opacity-50"
           >
             <option value="popular">Most Popular</option>
             <option value="newest">Newest</option>
             <option value="alphabetical">A-Z</option>
           </select>
         </div>
      </div>

      {/* Content Area */}
      <div className="mt-4">
        {/* Skeleton Loading State */}
        {showSkeletons && SkeletonComponent && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 place-items-start">
            {/* Render fixed number of skeletons */}
            {Array.from({ length: 10 }).map((_, index) => <SkeletonComponent key={`skel-<span class="math-inline">\{activeTab\}\-</span>{index}`} />)}
          </div>
        )}

        {/* Error State */}
        {!isLoading && isError && !showSkeletons && (
          <ErrorMessage
            message={error?.message || `Failed to load trending ${activeTab}`}
            onRetry={handleRetry}
            isLoadingRetry={isLoading} // Pass combined loading state
            containerClassName="mt-6"
          />
        )}

        {/* Empty State (after successful load with no data) */}
        {!isLoading && !isError && activeData.length === 0 && !showSkeletons && (
          <div className="text-center py-10 text-gray-500">
            {`No trending ${activeTab} found.`}
          </div>
        )}

        {/* Success State with Data */}
        {!isLoading && !isError && activeData.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 place-items-start">
            {activeData.map((item) => {
              // Ensure item and ID are valid before rendering
              if (!item || item.id == null) return null;
              const key = `<span class="math-inline">\{activeTab\}\-</span>{item.id}`;
              let props = { ...item }; // Base props

              // Render specific card based on activeTab
              if (activeTab === "restaurants")
                return <RestaurantCard key={key} {...props} onQuickAdd={(e) => { e.stopPropagation(); e.preventDefault(); handleQuickAdd(item, 'restaurant'); }} />;
              if (activeTab === "dishes")
                // Pass restaurant name correctly
                return <DishCard key={key} {...props} restaurant={item.restaurant || item.restaurant_name} onQuickAdd={(e) => { e.stopPropagation(); e.preventDefault(); handleQuickAdd(item, 'dish'); }} />;
              if (activeTab === "lists")
                // ListCard doesn't need onQuickAdd directly here
                return <ListCard key={key} {...props} />;
              return null; // Should not happen
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Trending;