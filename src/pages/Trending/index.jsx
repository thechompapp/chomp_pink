import React, { useState, useCallback } from "react";
import { useQuery } from '@tanstack/react-query';
import useAuthStore from '@/stores/useAuthStore';
import RestaurantCard from "@/components/UI/RestaurantCard";
import DishCard from "@/components/UI/DishCard";
import ListCard from "@/pages/Lists/ListCard";
import { trendingService } from '@/services/trendingService';
import ErrorMessage from '@/components/UI/ErrorMessage';
import RestaurantCardSkeleton from '@/components/UI/RestaurantCardSkeleton';
import DishCardSkeleton from "@/components/UI/DishCardSkeleton";
import ListCardSkeleton from '@/pages/Lists/ListCardSkeleton';
import Button from "@/components/Button";
import { Flame, Utensils, Bookmark } from 'lucide-react';
import { useQuickAdd } from '@/context/QuickAddContext';

const Trending = () => {
  const [activeTab, setActiveTab] = useState("restaurants");
  const [sortMethod, setSortMethod] = useState("popular");
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const { openQuickAdd } = useQuickAdd();

  const { data: trendingRestaurants = [], isLoading: isLoadingRestaurants, isError: isErrorRestaurants, error: errorRestaurants, refetch: refetchRestaurants } = useQuery({ 
    queryKey: ['trendingRestaurantsPage'], 
    queryFn: trendingService.getTrendingRestaurants, 
    staleTime: 5 * 60 * 1000, 
    refetchOnWindowFocus: true
  });
  const { data: trendingDishes = [], isLoading: isLoadingDishes, isError: isErrorDishes, error: errorDishes, refetch: refetchDishes } = useQuery({ 
    queryKey: ['trendingDishesPage'], 
    queryFn: trendingService.getTrendingDishes, 
    staleTime: 5 * 60 * 1000, 
    refetchOnWindowFocus: true
  });
  const { data: trendingLists = [], isLoading: isLoadingLists, isError: isErrorLists, error: errorLists, refetch: refetchLists } = useQuery({ 
    queryKey: ['trendingListsPage'], 
    queryFn: trendingService.getTrendingLists, 
    staleTime: 5 * 60 * 1000, 
    refetchOnWindowFocus: true
  });

  console.log('[Trending] trendingLists:', JSON.stringify(trendingLists.map(l => ({ id: l.id, is_following: l.is_following })), null, 2));

  const isLoading = isLoadingRestaurants || isLoadingDishes || isLoadingLists;
  const isError = isErrorRestaurants || isErrorDishes || isErrorLists;
  const error = errorRestaurants || errorDishes || errorLists;

  const sortData = useCallback((items) => { 
    if (!Array.isArray(items)) return []; 
    const sortedItems = [...items]; 
    switch (sortMethod) { 
      case "popular": 
        return sortedItems.sort((a, b) => (b.adds ?? b.saved_count ?? 0) - (a.adds ?? a.saved_count ?? 0)); 
      case "newest": 
        return sortedItems.sort((a, b) => (new Date(b.created_at) - new Date(a.created_at))); 
      case "alphabetical": 
        return sortedItems.sort((a, b) => (a.name || '').localeCompare(b.name || '')); 
      default: 
        return sortedItems; 
    } 
  }, [sortMethod]);

  const activeData = sortData(
    activeTab === "restaurants" ? trendingRestaurants :
    activeTab === "dishes" ? trendingDishes :
    trendingLists
  );

  const skeletonMap = { restaurants: RestaurantCardSkeleton, dishes: DishCardSkeleton, lists: ListCardSkeleton };
  const SkeletonComponent = skeletonMap[activeTab];
  const showSkeletons = isLoading && activeData.length === 0;
  const tabs = [ 
    { id: "restaurants", label: "Restaurants", Icon: Flame, count: trendingRestaurants.length, isLoading: isLoadingRestaurants }, 
    { id: "dishes", label: "Dishes", Icon: Utensils, count: trendingDishes.length, isLoading: isLoadingDishes }, 
    { id: "lists", label: "Lists", Icon: Bookmark, count: trendingLists.length, isLoading: isLoadingLists }, 
  ];
  const handleQuickAdd = useCallback((item, type) => { 
    if (!item || !type) return; 
    openQuickAdd({ id: item.id, name: item.name, restaurantName: type === 'dish' ? (item.restaurant_name || item.restaurant) : undefined, tags: item.tags, type: type }); 
  }, [openQuickAdd]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"> 
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Trending</h1> 
      </div>
      <div className="flex flex-col sm:flex-row justify-between border-b border-gray-200">
         <div className="flex overflow-x-auto pb-1"> 
           {tabs.map((tab) => ( 
             <button 
               key={tab.id} 
               onClick={() => setActiveTab(tab.id)} 
               className={`py-2 px-4 text-sm font-medium rounded-t-md focus:outline-none focus:ring-1 focus:ring-[#D1B399] focus:z-10 whitespace-nowrap flex items-center gap-1.5 ${ activeTab === tab.id ? 'text-[#A78B71] border-b-2 border-[#A78B71]' : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'}`}
             > 
               {tab.Icon && <tab.Icon size={16} />} 
               {tab.label} 
               {!tab.isLoading && tab.count > 0 && `(${tab.count})`} 
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
      <div className="mt-4">
        {showSkeletons && SkeletonComponent && ( 
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 place-items-start"> 
            {Array.from({ length: 10 }).map((_, index) => <SkeletonComponent key={`skel-${activeTab}-${index}`} />)} 
          </div> 
        )}
        {!isLoading && isError && !showSkeletons && ( 
          <ErrorMessage 
            message={error?.message || `Failed to load trending ${activeTab}`} 
            onRetry={() => { 
              if (activeTab === 'restaurants') refetchRestaurants(); 
              else if (activeTab === 'dishes') refetchDishes(); 
              else if (activeTab === 'lists') refetchLists(); 
            }} 
            isLoadingRetry={isLoading} 
            containerClassName="mt-6" 
          /> 
        )}
        {!isLoading && !isError && activeData.length === 0 && !showSkeletons && ( 
          <div className="text-center py-10 text-gray-500"> 
            {`No trending ${activeTab} found.`}
          </div> 
        )}
        {!isLoading && !isError && activeData.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 place-items-start">
            {activeData.map((item) => {
              if (!item || typeof item.id === 'undefined') return null;
              const key = `${activeTab}-${item.id}`;
              let props = {...item};
              if (activeTab === "restaurants") 
                return <RestaurantCard key={key} {...props} onQuickAdd={(e) => { e.stopPropagation(); e.preventDefault(); handleQuickAdd(item, 'restaurant'); }} />;
              if (activeTab === "dishes") 
                return <DishCard key={key} {...props} restaurant={item.restaurant_name || item.restaurant} onQuickAdd={(e) => { e.stopPropagation(); e.preventDefault(); handleQuickAdd(item, 'dish'); }} />;
              if (activeTab === "lists") 
                return <ListCard key={key} {...props} />;
              return null;
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Trending;