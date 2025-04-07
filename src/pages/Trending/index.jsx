// src/pages/Trending/index.jsx
import React, { useState, useCallback, useMemo } from "react";
import { useQuery } from '@tanstack/react-query';
import useAuthStore from '@/stores/useAuthStore';
import RestaurantCard from "@/components/UI/RestaurantCard";
import DishCard from "@/components/UI/DishCard";
import ListCard from "@/pages/Lists/ListCard";
import TrendChart from "@/components/UI/TrendChart";
import { trendingService } from '@/services/trendingService';
import ErrorMessage from '@/components/UI/ErrorMessage';
import RestaurantCardSkeleton from '@/components/UI/RestaurantCardSkeleton';
import DishCardSkeleton from "@/components/UI/DishCardSkeleton";
import ListCardSkeleton from '@/pages/Lists/ListCardSkeleton';
import Button from "@/components/Button";
import { Flame, Utensils, Bookmark, SortAsc, Clock, Star, Store, List as ListIcon } from 'lucide-react'; // Added Store, ListIcon
import { useQuickAdd } from '@/context/QuickAddContext';

// Define sort options
const SORT_OPTIONS = [
    { id: 'popular', label: 'Most Popular', Icon: Star },
    { id: 'newest', label: 'Newest', Icon: Clock },
    { id: 'alphabetical', label: 'A-Z', Icon: SortAsc },
];

// Define chart view types
const CHART_VIEW_OPTIONS = [
    { id: 'restaurant', label: 'Restaurants', Icon: Store },
    { id: 'dish', label: 'Dishes', Icon: Utensils },
    // { id: 'list', label: 'Lists', Icon: ListIcon }, // Can add lists later if needed
];

const Trending = () => {
  const [activeTab, setActiveTab] = useState("restaurants");
  const [sortMethod, setSortMethod] = useState("popular");
  const [chartViewType, setChartViewType] = useState('restaurant');
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const { openQuickAdd } = useQuickAdd();

  const queryOptions = {
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    placeholderData: [],
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

  // *** CORRECTED LOGIC for loading/error states ***
  const isActiveTabLoading = useMemo(() => (
      (activeTab === 'restaurants' && isLoadingRestaurants) ||
      (activeTab === 'dishes' && isLoadingDishes) ||
      (activeTab === 'lists' && isLoadingLists)
  ), [activeTab, isLoadingRestaurants, isLoadingDishes, isLoadingLists]);

   const isActiveTabError = useMemo(() => (
      (activeTab === 'restaurants' && isErrorRestaurants) ||
      (activeTab === 'dishes' && isErrorDishes) ||
      (activeTab === 'lists' && isErrorLists)
  ), [activeTab, isErrorRestaurants, isErrorDishes, isErrorLists]);

  const activeTabError = useMemo(() => (
      activeTab === 'restaurants' ? errorRestaurants :
      activeTab === 'dishes' ? errorDishes :
      errorLists
  ), [activeTab, errorRestaurants, errorDishes, errorLists]);
  // *** END CORRECTION ***

  const sortData = useCallback((items) => {
    if (!Array.isArray(items)) return [];
    const sortedItems = [...items];
    switch (sortMethod) {
      case "popular":
        return sortedItems.sort((a, b) => (b.adds ?? b.saved_count ?? b.trending_score ?? 0) - (a.adds ?? a.saved_count ?? a.trending_score ?? 0));
      case "newest":
        return sortedItems.sort((a, b) => (new Date(b.created_at || 0) - new Date(a.created_at || 0)));
      case "alphabetical":
        return sortedItems.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      default:
        return sortedItems;
    }
  }, [sortMethod]);

  const activeData = useMemo(() => sortData(
    activeTab === "restaurants" ? trendingRestaurants :
    activeTab === "dishes" ? trendingDishes :
    trendingLists
  ), [activeTab, trendingRestaurants, trendingDishes, trendingLists, sortData]);

  const skeletonMap = { restaurants: RestaurantCardSkeleton, dishes: DishCardSkeleton, lists: ListCardSkeleton };
  const SkeletonComponent = skeletonMap[activeTab];
  const showSkeletons = isActiveTabLoading && activeData.length === 0;

  const tabs = [
    { id: "restaurants", label: "Restaurants", Icon: Flame, count: trendingRestaurants.length, isLoading: isLoadingRestaurants },
    { id: "dishes", label: "Dishes", Icon: Utensils, count: trendingDishes.length, isLoading: isLoadingDishes },
    { id: "lists", label: "Lists", Icon: Bookmark, count: trendingLists.length, isLoading: isLoadingLists },
  ];

  const handleQuickAdd = useCallback((item, type) => {
    if (!item || !type) return;
    openQuickAdd({
        id: item.id,
        name: item.name,
        restaurantName: type === 'dish' ? (item.restaurant || item.restaurant_name) : undefined,
        tags: item.tags,
        type: type
    });
  }, [openQuickAdd]);

  const handleRetry = () => {
      if (activeTab === 'restaurants') refetchRestaurants();
      else if (activeTab === 'dishes') refetchDishes();
      else if (activeTab === 'lists') refetchLists();
  };

  const gridClasses = "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3";

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Trending</h1>
      </div>

       {/* Aggregate Trend Chart Section */}
       <div className="mb-6">
           {/* Conditionally render chart based on whether *any* data has loaded successfully for the chosen type */}
           { (chartViewType === 'restaurant' && !isLoadingRestaurants && !isErrorRestaurants && trendingRestaurants.length > 0) ||
             (chartViewType === 'dish' && !isLoadingDishes && !isErrorDishes && trendingDishes.length > 0) ||
             (chartViewType === 'list' && !isLoadingLists && !isErrorLists && trendingLists.length > 0) ? (
               <TrendChart itemType={chartViewType} />
           ) : (
               // Optional: Show a placeholder or message if chart data can't be loaded yet
               <div className="p-4 bg-gray-100 rounded-lg text-center text-sm text-gray-500 min-h-[350px] flex items-center justify-center">
                   {isActiveTabLoading ? 'Loading data for chart...' : 'Trend data unavailable.'}
               </div>
           )}
           {/* Controls to switch chart view type */}
           <div className="flex justify-center gap-2 mt-2">
               {CHART_VIEW_OPTIONS.map(option => (
                   <Button
                       key={option.id}
                       variant={chartViewType === option.id ? 'primary' : 'tertiary'}
                       size="sm"
                       onClick={() => setChartViewType(option.id)}
                       className="!px-3 !py-1 flex items-center gap-1.5"
                       aria-pressed={chartViewType === option.id}
                   >
                       <option.Icon size={14} /> Show {option.label}
                   </Button>
               ))}
           </div>
       </div>
       {/* End Trend Chart Section */}


      {/* Tabs and Sort Controls */}
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
               {!tab.isLoading && ` (${tab.count})`}
             </button>
           ))}
         </div>

         {/* Sort Buttons */}
         <div className="flex items-center pb-1 pt-2 sm:pt-0 gap-2 flex-wrap">
             <span className="mr-1 text-sm text-gray-600">Sort:</span>
             {SORT_OPTIONS.map(({ id, label, Icon }) => (
                <Button
                    key={id}
                    variant={sortMethod === id ? 'primary' : 'tertiary'}
                    size="sm"
                    onClick={() => setSortMethod(id)}
                    className="!px-3 !py-1 flex items-center gap-1"
                    aria-pressed={sortMethod === id}
                >
                    <Icon size={14} />
                    {label}
                </Button>
             ))}
         </div>
      </div>

      {/* Content Area */}
      <div className="mt-4">
        {showSkeletons && SkeletonComponent && (
          <div className={gridClasses}>
            {Array.from({ length: 10 }).map((_, index) => <SkeletonComponent key={`skel-${activeTab}-${index}`} />)}
          </div>
        )}

        {!isActiveTabLoading && isActiveTabError && !showSkeletons && (
          <ErrorMessage
            message={activeTabError?.message || `Failed to load trending ${activeTab}`}
            onRetry={handleRetry}
            isLoadingRetry={isActiveTabLoading}
            containerClassName="mt-6"
          />
        )}

        {!isActiveTabLoading && !isActiveTabError && activeData.length === 0 && !showSkeletons && (
          <div className="text-center py-10 text-gray-500">
            {`No trending ${activeTab} found.`}
          </div>
        )}

        {!isActiveTabLoading && !isActiveTabError && activeData.length > 0 && (
          <div className={gridClasses}>
            {activeData.map((item) => {
              if (!item || item.id == null) return null;
              const key = `${activeTab}-${item.id}`;

              if (activeTab === "restaurants") {
                return (
                    <RestaurantCard
                        key={key}
                        id={item.id}
                        name={item.name}
                        city={item.city_name}
                        neighborhood={item.neighborhood_name}
                        tags={item.tags}
                        adds={item.adds}
                        onQuickAdd={(e) => { e.stopPropagation(); e.preventDefault(); handleQuickAdd(item, 'restaurant'); }}
                    />
                );
              }

              if (activeTab === "dishes") {
                return (
                    <DishCard
                        key={key}
                        id={item.id}
                        name={item.name}
                        restaurant={item.restaurant || item.restaurant_name}
                        tags={item.tags}
                        adds={item.adds}
                        onQuickAdd={(e) => { e.stopPropagation(); e.preventDefault(); handleQuickAdd(item, 'dish'); }}
                    />
                );
              }

              if (activeTab === "lists") {
                return (
                    <ListCard
                        key={key}
                        id={item.id}
                        name={item.name}
                        description={item.description}
                        saved_count={item.saved_count}
                        item_count={item.item_count}
                        is_following={item.is_following}
                        creator_handle={item.creator_handle}
                        user_id={item.user_id}
                        is_public={item.is_public}
                        type={item.type || item.list_type}
                        tags={item.tags}
                    />
                );
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