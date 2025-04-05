// src/pages/Trending/index.jsx
import React, { useState, useCallback, useMemo } from "react";
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, SortAsc, SortDesc, Map } from "lucide-react";
import useUIStateStore from '@/stores/useUIStateStore.js';
import FilterSection from "@/pages/Home/FilterSection";
import RestaurantCard from "@/components/UI/RestaurantCard";
import DishCard from "@/components/UI/DishCard";
import ListCard from "@/pages/Lists/ListCard"; // <<< CORRECTED PATH
import Button from "@/components/Button";
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import ErrorMessage from '@/components/UI/ErrorMessage';
import apiClient from '@/utils/apiClient';
// Import Skeletons
import RestaurantCardSkeleton from '@/components/UI/RestaurantCardSkeleton';
import DishCardSkeleton from '@/components/UI/DishCardSkeleton';
import ListCardSkeleton from '@/pages/Lists/ListCardSkeleton'; // <<< CORRECTED PATH

// Fetch function (remains the same)
const fetchAllTrendingData = async () => { /* ... */ };

const Trending = () => {
    // Hooks and state setup (remains the same)
    const cityId = useUIStateStore((state) => state.cityId);
    const neighborhoodId = useUIStateStore((state) => state.neighborhoodId);
    const hashtags = useUIStateStore((state) => state.hashtags || []);
    const { data: trendingData = { restaurants: [], dishes: [], lists: [] }, isLoading: isLoadingTrending, isError: isTrendingError, error: trendingError, refetch: refetchTrendingData } = useQuery({ queryKey: ['trendingData'], queryFn: fetchAllTrendingData, staleTime: 5 * 60 * 1000 });
    const [activeTab, setActiveTab] = useState("restaurants");
    const [sortMethod, setSortMethod] = useState("popular");

    // Callbacks and Memoized values (remain the same)
    const filterItems = useCallback((items) => { /* ... */ }, [cityId, neighborhoodId, hashtags]);
    const filteredRestaurants = useMemo(() => filterItems(trendingData.restaurants), [trendingData.restaurants, filterItems]);
    const filteredDishes = useMemo(() => filterItems(trendingData.dishes), [trendingData.dishes, filterItems]);
    const filteredLists = useMemo(() => filterItems(trendingData.lists), [trendingData.lists, filterItems]);
    const sortData = useCallback((items) => { /* ... */ }, [sortMethod]);
    const activeData = useMemo(() => { /* ... */ }, [activeTab, filteredRestaurants, filteredDishes, filteredLists, sortData]);

    const tabs = [ /* ... */ ];
    const showSkeletons = isLoadingTrending && activeData.length === 0;
    // Ensure correct skeleton component is referenced
    const SkeletonComponent = activeTab === 'restaurants' ? RestaurantCardSkeleton : activeTab === 'dishes' ? DishCardSkeleton : ListCardSkeleton;

  // --- Render Logic --- (ensure ListCard component is used correctly)
  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6">
        {/* ... Header, FilterSection, Tabs/Sorting ... */}
      <div className="mt-4">
         {/* Skeletons */}
         {showSkeletons && SkeletonComponent && ( /* ... Skeleton rendering ... */ )}
         {/* No Results */}
         {!isLoadingTrending && !isTrendingError && activeData.length === 0 && ( /* ... No results message ... */ )}
         {/* Actual Data */}
         {!isLoadingTrending && activeData.length > 0 && (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 place-items-start">
                 {activeData.map((item) => {
                       if (!item || typeof item.id === 'undefined') return null;
                       const key = `${activeTab}-${item.id}`;
                       if (activeTab === "restaurants") return <RestaurantCard key={key} {...item} />;
                       if (activeTab === "dishes") { const restaurantName = item.restaurant_name || item.restaurant; return <DishCard key={key} {...item} restaurant={restaurantName} />; }
                       // Use ListCard (correctly imported) for the 'lists' tab
                       if (activeTab === "lists") { return <ListCard key={key} {...item} is_following={item.is_following ?? false} />; }
                       return null;
                 })}
             </div>
         )}
         {/* Error message */}
         {isTrendingError && !showSkeletons && ( /* ... Error message component ... */ )}
      </div>
    </div>
  );
};

export default Trending;