// src/pages/Trending/index.jsx
import React, { useState, useCallback, useMemo } from "react";
import { useQuery } from '@tanstack/react-query';
import useAuthStore from '@/stores/useAuthStore';
import useUIStateStore from '@/stores/useUIStateStore';
import RestaurantCard from "@/components/UI/RestaurantCard";
import DishCard from "@/components/UI/DishCard";
import ListCard from "@/pages/Lists/ListCard";
import { useShallow } from 'zustand/react/shallow';
// Add any other imports you need

// Fetcher function 
const fetchAllTrendingData = async () => {
  try {
    const response = await fetch('/api/trending');
    if (!response.ok) throw new Error('Failed to fetch trending data');
    return await response.json();
  } catch (error) {
    console.error("Error fetching trending data:", error);
    throw error;
  }
};

const Trending = () => {
  // UI state with individual primitive selectors
  const cityId = useUIStateStore(state => state.cityId);
  const neighborhoodId = useUIStateStore(state => state.neighborhoodId);
  const hashtags = useUIStateStore(state => state.hashtags || []);
  
  // Auth state with individual primitive selectors - fixes the object selector issue
  const user = useAuthStore(state => state.user);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  // React Query setup
  const { 
    data: trendingData = { 
      restaurants: [], 
      dishes: [], 
      lists: [] 
    }, 
    isLoading: isLoadingTrending,
    isError: isTrendingError,
    error: trendingError,
    refetch: refetchTrending
  } = useQuery({
    queryKey: ['trending', cityId, neighborhoodId, hashtags],
    queryFn: fetchAllTrendingData,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true
  });

  const [activeTab, setActiveTab] = useState("restaurants");
  const [sortMethod, setSortMethod] = useState("popular");

  // Filtering Logic 
  const filterItems = useCallback((items) => {
    if (!items || !Array.isArray(items)) return [];
    
    let filtered = [...items];
    
    // Apply city filter
    if (cityId) {
      filtered = filtered.filter(item => item.city_id === cityId);
    }
    
    // Apply neighborhood filter
    if (neighborhoodId) {
      filtered = filtered.filter(item => item.neighborhood_id === neighborhoodId);
    }
    
    // Apply hashtag filters
    if (hashtags.length > 0) {
      filtered = filtered.filter(item => {
        const itemTags = item.tags || [];
        return hashtags.some(tag => itemTags.includes(tag));
      });
    }
    
    return filtered;
  }, [cityId, neighborhoodId, hashtags]);

  // Memoized Filtered Data with proper dependencies
  const filteredRestaurants = useMemo(() => 
    filterItems(trendingData.restaurants), 
    [filterItems, trendingData.restaurants]
  );
  
  const filteredDishes = useMemo(() => 
    filterItems(trendingData.dishes), 
    [filterItems, trendingData.dishes]
  );
  
  const filteredLists = useMemo(() => 
    filterItems(trendingData.lists), 
    [filterItems, trendingData.lists]
  );

  // Sorting Logic
  const sortData = useCallback((items) => {
    if (!items || !Array.isArray(items)) return [];
    
    const sortedItems = [...items];
    
    switch (sortMethod) {
      case "popular":
        return sortedItems.sort((a, b) => (b.adds || 0) - (a.adds || 0));
      case "newest":
        return sortedItems.sort((a, b) => {
          const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
          const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
          return dateB - dateA;
        });
      case "alphabetical":
        return sortedItems.sort((a, b) => {
          const nameA = (a.name || '').toLowerCase();
          const nameB = (b.name || '').toLowerCase();
          return nameA.localeCompare(nameB);
        });
      default:
        return sortedItems;
    }
  }, [sortMethod]);

  // Memoized Active Data with proper dependencies
  const activeData = useMemo(() => {
    switch (activeTab) {
      case "restaurants":
        return sortData(filteredRestaurants);
      case "dishes":
        return sortData(filteredDishes);
      case "lists":
        return sortData(filteredLists);
      default:
        return [];
    }
  }, [activeTab, sortData, filteredRestaurants, filteredDishes, filteredLists]);

  // Tab config
  const tabs = [
    { id: "restaurants", label: "Restaurants", count: filteredRestaurants.length },
    { id: "dishes", label: "Dishes", count: filteredDishes.length },
    { id: "lists", label: "Lists", count: filteredLists.length }
  ];

  // Skeletons setup
  const showSkeletons = isLoadingTrending && activeData.length === 0;
  
  const renderSkeletons = () => {
    return Array(10).fill(0).map((_, index) => {
      if (activeTab === "restaurants") {
        return <RestaurantCardSkeleton key={`skeleton-${index}`} />;
      } else if (activeTab === "dishes") {
        return <DishCardSkeleton key={`skeleton-${index}`} />;
      } else {
        return <ListCardSkeleton key={`skeleton-${index}`} />;
      }
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Trending</h1>
        {/* Any header buttons or controls can go here */}
      </div>

      {/* Filter Section - Add your filter components here */}
      <div className="flex flex-wrap items-center gap-2">
        {/* City Selector, Neighborhood Selector, Tag Selector, etc. */}
      </div>

      {/* Tabs & Sorting Controls */}
      <div className="flex flex-col sm:flex-row justify-between border-b border-gray-200">
        <div className="flex overflow-x-auto pb-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-4 text-sm font-medium rounded-t-md focus:outline-none focus:ring-1 focus:ring-[#D1B399] focus:z-10 whitespace-nowrap
                ${activeTab === tab.id 
                  ? 'text-[#A78B71] border-b-2 border-[#A78B71]' 
                  : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'}`}
            >
              {tab.label} {tab.count > 0 && `(${tab.count})`}
            </button>
          ))}
        </div>

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

      {/* Results Area */}
      <div className="mt-4">
        {showSkeletons && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 place-items-start">
            {renderSkeletons()}
          </div>
        )}
        
        {!isLoadingTrending && !isTrendingError && activeData.length === 0 && !showSkeletons && (
          <div className="text-center py-10">
            <p className="text-gray-500">No {activeTab} found matching your filters.</p>
          </div>
        )}

        {!isLoadingTrending && activeData.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 place-items-start">
            {activeData.map((item) => {
              if (!item || typeof item.id === 'undefined') return null;
              const key = `${activeTab}-${item.id}`;

              if (activeTab === "restaurants")
                return <RestaurantCard key={key} {...item} />;
              
              if (activeTab === "dishes") {
                const restaurantName = item.restaurant_name || item.restaurant || 'Unknown Restaurant';
                return <DishCard key={key} {...item} restaurant={restaurantName} />;
              }
              
              if (activeTab === "lists") {
                // Calculate showFollowButton here properly using individual selectors
                const showFollow = isAuthenticated && !!user && item.user_id !== user.id;
                
                return (
                  <ListCard
                    key={key}
                    {...item}
                    is_following={item.is_following ?? false}
                    showFollowButton={showFollow}
                  />
                );
              }
              
              return null;
            })}
          </div>
        )}

        {isTrendingError && !showSkeletons && (
          <div className="text-center py-10">
            <p className="text-red-500">Error loading trending {activeTab}. Please try again later.</p>
            <button 
              onClick={() => refetchTrending()}
              className="mt-4 px-4 py-2 bg-[#A78B71] text-white rounded-md hover:bg-[#8A7262] transition-colors"
            >
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Trending;