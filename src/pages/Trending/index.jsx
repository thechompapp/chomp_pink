/* src/pages/Trending/index.jsx */
import React, { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import useAuthStore from '@/stores/useAuthStore'; // Global alias
import RestaurantCard from '@/components/UI/RestaurantCard'; // Global alias
import DishCard from '@/components/UI/DishCard'; // Global alias
import ListCard from '@/pages/Lists/ListCard'; // Global alias
import TrendChart from '@/components/UI/TrendChart'; // Global alias
import { trendingService } from '@/services/trendingService'; // Global alias
import ErrorMessage from '@/components/UI/ErrorMessage'; // Used for non-query errors if needed
import RestaurantCardSkeleton from '@/components/UI/RestaurantCardSkeleton'; // Global alias
import DishCardSkeleton from '@/components/UI/DishCardSkeleton'; // Global alias
import ListCardSkeleton from '@/pages/Lists/ListCardSkeleton'; // Global alias
import Button from '@/components/UI/Button'; // Global alias
import QueryResultDisplay from '@/components/QueryResultDisplay'; // Import the new component
import { Flame, Utensils, Bookmark, SortAsc, Clock, Star, Store, List as ListIcon, TrendingUp } from 'lucide-react'; // Added TrendingUp
import { useQuickAdd } from '@/context/QuickAddContext'; // Global alias

// Define sort options
const SORT_OPTIONS = [
  { id: "popular", label: "Popular", Icon: Flame },
  { id: "newest", label: "Newest", Icon: Clock },
  { id: "alphabetical", label: "A-Z", Icon: SortAsc },
];

// Define chart view options
const CHART_VIEW_OPTIONS = [
    { id: "restaurant", label: "Restaurants", Icon: Store },
    { id: "dish", label: "Dishes", Icon: Utensils },
    { id: "list", label: "Lists", Icon: ListIcon }, // Use ListIcon alias
];


// Fetcher functions remain the same
const fetchTrendingRestaurants = () => trendingService.getTrendingRestaurants();
const fetchTrendingDishes = () => trendingService.getTrendingDishes();
const fetchTrendingLists = () => trendingService.getTrendingLists();

const Trending = () => {
  const [activeTab, setActiveTab] = useState('restaurants');
  const [sortMethod, setSortMethod] = useState('popular');
  const [chartViewType, setChartViewType] = useState('restaurant');
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated); // Use selector
  const { openQuickAdd } = useQuickAdd();

  const queryOptions = useMemo(() => ({ // Memoize options if static
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    placeholderData: [], // Default to empty array
  }), []);

  // Use Query hooks
  const restaurantsQuery = useQuery({ queryKey: ['trendingRestaurantsPage'], queryFn: fetchTrendingRestaurants, ...queryOptions });
  const dishesQuery = useQuery({ queryKey: ['trendingDishesPage'], queryFn: fetchTrendingDishes, ...queryOptions });
  const listsQuery = useQuery({ queryKey: ['trendingListsPage'], queryFn: fetchTrendingLists, ...queryOptions });

  // Determine active query based on tab
  const activeQueryResult = useMemo(() => {
    switch (activeTab) {
      case 'dishes': return dishesQuery;
      case 'lists': return listsQuery;
      case 'restaurants':
      default: return restaurantsQuery;
    }
  }, [activeTab, restaurantsQuery, dishesQuery, listsQuery]);

  // Sorting logic (Ensure checks for potential missing fields)
  const sortData = useCallback((items = []) => {
    const sortedItems = [...items];
    switch (sortMethod) {
      case "popular":
        return sortedItems.sort((a, b) => (b.adds ?? b.saved_count ?? b.trending_score ?? 0) - (a.adds ?? a.saved_count ?? a.trending_score ?? 0));
      case "newest":
        // Handle potentially invalid dates gracefully
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return (isNaN(dateB) ? 0 : dateB) - (isNaN(dateA) ? 0 : dateA);
      case "alphabetical":
        return sortedItems.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      default:
        return sortedItems;
    }
  }, [sortMethod]);


  // Quick Add handler
  const handleQuickAdd = useCallback((item, type) => {
      if (!isAuthenticated) {
          // Optionally navigate to login or show a message
          console.log("User not authenticated, cannot quick add.");
          return;
      }
      openQuickAdd({
        type: type,
        id: item.id,
        name: item.name,
        restaurantId: type === 'dish' ? item.restaurant_id : undefined,
        restaurantName: type === 'dish' ? (item.restaurant_name || item.restaurant) : undefined,
        tags: item.tags || [],
      });
    }, [openQuickAdd, isAuthenticated]); // Added isAuthenticated

  // Tab definitions (updated counts and loading state)
  const tabs = useMemo(() => [
    { id: "restaurants", label: "Restaurants", Icon: Flame, count: restaurantsQuery.data?.length ?? 0, isLoading: restaurantsQuery.isLoading || restaurantsQuery.isFetching },
    { id: "dishes", label: "Dishes", Icon: Utensils, count: dishesQuery.data?.length ?? 0, isLoading: dishesQuery.isLoading || dishesQuery.isFetching },
    { id: "lists", label: "Lists", Icon: Bookmark, count: listsQuery.data?.length ?? 0, isLoading: listsQuery.isLoading || listsQuery.isFetching },
  ], [restaurantsQuery, dishesQuery, listsQuery]); // Dependencies updated

  const gridClasses = "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3";

  // Define LoadingComponent for QueryResultDisplay (renders multiple skeletons)
  const LoadingComponent = useMemo(() => {
       const SkeletonComponent = {
         restaurants: RestaurantCardSkeleton,
         dishes: DishCardSkeleton,
         lists: ListCardSkeleton
       }[activeTab];

       if (!SkeletonComponent) return null; // Should not happen if activeTab is valid

       return (
           <div className={gridClasses}>
               {Array.from({ length: 5 }).map((_, i) => <SkeletonComponent key={`skel-${activeTab}-${i}`}/>)}
           </div>
       );
   }, [activeTab, gridClasses]); // Recompute when tab changes

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Trending</h1>
      </div>

       {/* Aggregate Trend Chart Section */}
       <div className="mb-6">
           {/* TrendChart component expects itemType */}
           <TrendChart itemType={chartViewType} />
           {/* Buttons to change the chart view */}
           <div className="flex justify-center gap-2 mt-2">
                {CHART_VIEW_OPTIONS.map(option => (
                    <Button
                        key={option.id}
                        variant={chartViewType === option.id ? 'primary' : 'tertiary'}
                        size="sm"
                        onClick={() => setChartViewType(option.id)}
                        className="!px-2.5 !py-1 flex items-center gap-1"
                        aria-pressed={chartViewType === option.id}
                    >
                        {option.Icon && <option.Icon size={14} />} {/* Render icon */}
                        {option.label}
                    </Button>
                ))}
           </div>
       </div>

      {/* Tabs and Sort Controls */}
      <div className="flex flex-col sm:flex-row justify-between border-b border-gray-200">
         <div className="flex overflow-x-auto pb-1 no-scrollbar">
            {tabs.map((tab) => (
                 <button
                     key={tab.id}
                     onClick={() => setActiveTab(tab.id)}
                     className={`flex items-center gap-1.5 py-2 px-4 text-sm font-medium rounded-t-md focus:outline-none focus:ring-1 focus:ring-[#D1B399] focus:z-10 transition-colors whitespace-nowrap ${activeTab === tab.id ? 'text-[#A78B71] border-b-2 border-[#A78B71]' : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'}`}
                     aria-selected={activeTab === tab.id}
                 >
                     {tab.Icon && <tab.Icon size={16} />}
                     {tab.label} ({tab.isLoading ? '...' : tab.count})
                 </button>
            ))}
         </div>
         <div className="flex items-center pb-1 pt-2 sm:pt-0 gap-2 flex-wrap">
             <span className="mr-1 text-sm text-gray-600">Sort:</span>
             {SORT_OPTIONS.map(({ id, label, Icon }) => (
                 <Button
                    key={id}
                    variant={sortMethod === id ? 'primary' : 'tertiary'}
                    size="sm"
                    onClick={() => setSortMethod(id)}
                    className="!px-2.5 !py-1 flex items-center gap-1"
                    aria-pressed={sortMethod === id}
                 >
                    {Icon && <Icon size={14} />}
                    {label}
                 </Button>
             ))}
         </div>
      </div>

      {/* Content Area - Use QueryResultDisplay */}
      <div className="mt-4 min-h-[300px]">
        <QueryResultDisplay
            queryResult={activeQueryResult}
            loadingMessage={`Loading trending ${activeTab}...`} // Not shown if LoadingComponent is used
            errorMessagePrefix={`Failed to load trending ${activeTab}`}
            noDataMessage={`No trending ${activeTab} found.`}
            // Pass the skeletons as the loading component
            LoadingComponent={LoadingComponent}
        >
            {(data) => {
                const sortedItems = sortData(data);
                return (
                   <div className={gridClasses}>
                       {sortedItems.map((item) => {
                           if (!item || item.id == null) return null;
                           const key = `${activeTab}-${item.id}`;
                           if (activeTab === "restaurants") return <RestaurantCard key={key} {...item} onQuickAdd={(e) => { e.stopPropagation(); e.preventDefault(); handleQuickAdd(item, 'restaurant'); }} />;
                           if (activeTab === "dishes") return <DishCard key={key} {...item} restaurant={item.restaurant || item.restaurant_name} onQuickAdd={(e) => { e.stopPropagation(); e.preventDefault(); handleQuickAdd(item, 'dish'); }} />;
                           // Pass necessary props, ensure keys are correct (e.g., list_type or type)
                           if (activeTab === "lists") return <ListCard key={key} {...item} type={item.type || item.list_type} />;
                           return null;
                       })}
                   </div>
                );
            }}
        </QueryResultDisplay>
      </div>
    </div>
  );
};

export default Trending;