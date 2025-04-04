// src/pages/Trending/index.jsx
import React, { useState, useCallback, useMemo } from "react";
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, SortAsc, SortDesc, Map } from "lucide-react";
import useUIStateStore from '@/stores/useUIStateStore.js';
import FilterSection from "@/pages/Home/FilterSection";
import RestaurantCard from "@/components/UI/RestaurantCard";
import DishCard from "@/components/UI/DishCard";
import ListCard from "@/pages/Lists/ListCard"; // Use correct path
import Button from "@/components/Button";
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import ErrorMessage from '@/components/UI/ErrorMessage';
import apiClient from '@/utils/apiClient';
// Import Skeletons
import RestaurantCardSkeleton from '@/components/UI/RestaurantCardSkeleton';
import DishCardSkeleton from '@/components/UI/DishCardSkeleton';
import ListCardSkeleton from '@/pages/Lists/ListCardSkeleton'; // Use correct path

// Fetcher Function (remains the same)
const fetchTrendingPageData = async () => { /* ... */ };

const Trending = () => {
  const cityId = useUIStateStore((state) => state.cityId);
  const isAppInitializing = useUIStateStore((state) => state.isInitializing);
  const appInitializationError = useUIStateStore((state) => state.error); // Use unified error

  const {
      data: trendingData,
      isLoading: isLoadingTrending,
      isError: isTrendingError,
      error: trendingError,
      refetch: refetchTrendingData
  } = useQuery({
      queryKey: ['trendingPageData'],
      queryFn: fetchTrendingPageData,
  });

  const [activeTab, setActiveTab] = useState("restaurants");
  const [sortMethod, setSortMethod] = useState("popular");

  const filterByCity = useCallback((items) => { /* ... */ }, [cityId]);

  const filteredRestaurants = useMemo(() => filterByCity(trendingData?.restaurants ?? []), [trendingData?.restaurants, filterByCity]);
  const filteredDishes = useMemo(() => filterByCity(trendingData?.dishes ?? []), [trendingData?.dishes, filterByCity]);
  const filteredLists = useMemo(() => filterByCity(trendingData?.lists ?? []), [trendingData?.lists, filterByCity]);

  const sortData = useCallback((items) => { /* ... */ }, [sortMethod]);

  const activeData = useMemo(() => { /* ... */ }, [activeTab, filteredRestaurants, filteredDishes, filteredLists, sortData]);

  // --- Render Logic ---
   if (appInitializationError) {
       return <ErrorMessage message={`App initialization failed: ${appInitializationError}`} />;
   }
   if (isAppInitializing) {
       return <LoadingSpinner message="Initializing..." />;
   }

   if (isTrendingError && !isLoadingTrending && !trendingData) { // Show full page error only if loading failed completely
       return (
            <ErrorMessage
                message={trendingError?.message || 'Error loading trending data.'}
                onRetry={refetchTrendingData}
                isLoadingRetry={isLoadingTrending}
                containerClassName="py-10 px-4 max-w-lg mx-auto"
            />
       );
   }

   // Determine if we should show skeletons
   const showSkeletons = isLoadingTrending && activeData.length === 0;
   const SkeletonComponent = activeTab === 'restaurants' ? RestaurantCardSkeleton : activeTab === 'dishes' ? DishCardSkeleton : ListCardSkeleton;

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6">
      {/* Header */}
      <div className="pt-2 md:pt-4"> {/* ... */} </div>

      {/* Filter Component */}
      <FilterSection />

      {/* Tabs & Sorting Controls */}
      <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm mb-4"> {/* ... */} </div>

      {/* Results Display */}
      <div className="mt-4">
         {/* Show Skeletons */}
         {showSkeletons && SkeletonComponent && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 place-items-start">
                 {[...Array(8)].map((_, index) => <SkeletonComponent key={`skel-${activeTab}-${index}`} />)}
            </div>
          )}

         {/* Show No Results Message */}
         {!isLoadingTrending && !isTrendingError && activeData.length === 0 && (
            <div className="text-center py-10 bg-white border border-gray-200 rounded-lg shadow-sm">
              <h3 className="text-lg font-medium text-gray-700 mb-1">No results found</h3>
              <p className="text-sm text-gray-500">
                  {cityId ? 'Try adjusting your city filter.' : 'No trending items available currently.'}
              </p>
            </div>
         )}

         {/* Show Actual Data */}
         {!showSkeletons && activeData.length > 0 && (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 place-items-start">
                 {activeData.map((item) => {
                     // ... card rendering logic ...
                       if (!item || typeof item.id === 'undefined') return null;
                       const key = `${activeTab}-${item.id}`;
                       if (activeTab === "restaurants") return <RestaurantCard key={key} {...item} />;
                       if (activeTab === "dishes") {
                           const restaurantName = item.restaurant_name || item.restaurant;
                           return <DishCard key={key} {...item} restaurant={restaurantName} />;
                       }
                       if (activeTab === "lists") {
                           return <ListCard key={key} {...item} is_following={item.is_following ?? false} />;
                       }
                       return null;
                 })}
             </div>
         )}
      </div>
    </div>
  );
};

export default Trending;