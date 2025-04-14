/* src/pages/Trending/index.jsx */
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query'; // Added useQueryClient
import useAuthStore from '@/stores/useAuthStore';
import RestaurantCard from '@/components/UI/RestaurantCard';
import DishCard from '@/components/UI/DishCard';
import ListCard from '@/pages/Lists/ListCard';
import TrendChart from '@/components/UI/TrendChart';
import { trendingService } from '@/services/trendingService';
import ErrorMessage from '@/components/UI/ErrorMessage';
import RestaurantCardSkeleton from '@/components/UI/RestaurantCardSkeleton';
import DishCardSkeleton from '@/components/UI/DishCardSkeleton';
import ListCardSkeleton from '@/pages/Lists/ListCardSkeleton';
import Button from '@/components/UI/Button';
import QueryResultDisplay from '@/components/QueryResultDisplay';
// FIX: Using consistent icons from lucide-react
import { Flame, Utensils, Bookmark, Star, Clock, SortAlphaDown, List as ListIcon, TrendingUp } from 'lucide-react';
import { useQuickAdd } from '@/context/QuickAddContext';

// FIX: Sort options with consistent icons
const SORT_OPTIONS = [
  { id: "popular", label: "Popular", Icon: Star }, // Changed from Flame
  { id: "newest", label: "Newest", Icon: Clock },
  { id: "alphabetical", label: "A-Z", Icon: SortAlphaDown } // Changed from SortAsc
];

// FIX: Chart view options with consistent icons
const CHART_VIEW_OPTIONS = [
  { id: "restaurant", label: "Restaurants", Icon: Flame }, // Keep Flame for restaurants
  { id: "dish", label: "Dishes", Icon: Utensils },
  { id: "list", label: "Lists", Icon: Bookmark } // Use Bookmark for lists
];

// Fetcher functions remain the same
const fetchTrendingRestaurants = () => trendingService.getTrendingRestaurants();
const fetchTrendingDishes = () => trendingService.getTrendingDishes();
const fetchTrendingLists = () => trendingService.getTrendingLists();

const Trending = () => {
  const [activeTab, setActiveTab] = useState('restaurants');
  const [sortMethod, setSortMethod] = useState('popular');
  const [chartViewType, setChartViewType] = useState('restaurant');
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { openQuickAdd } = useQuickAdd();
  const queryClient = useQueryClient(); // Get query client instance

  const queryOptions = useMemo(() => ({
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    placeholderData: [],
  }), []);

  const restaurantsQuery = useQuery({ queryKey: ['trendingRestaurantsPage'], queryFn: fetchTrendingRestaurants, ...queryOptions });
  const dishesQuery = useQuery({ queryKey: ['trendingDishesPage'], queryFn: fetchTrendingDishes, ...queryOptions });
  const listsQuery = useQuery({ queryKey: ['trendingListsPage'], queryFn: fetchTrendingLists, ...queryOptions });

  // Listen for external list follow updates and invalidate lists query
  useEffect(() => {
      const handleListUpdate = () => {
          console.log('[TrendingPage] List follow toggled, invalidating lists query');
          queryClient.invalidateQueries({ queryKey: ['trendingListsPage'] }); // Use queryClient
      };
      window.addEventListener('listFollowToggled', handleListUpdate);
      return () => window.removeEventListener('listFollowToggled', handleListUpdate);
  }, [queryClient]); // Depend on queryClient

  const activeQueryResult = useMemo(() => {
    switch (activeTab) {
      case 'dishes': return dishesQuery;
      case 'lists': return listsQuery;
      case 'restaurants': default: return restaurantsQuery;
    }
  }, [activeTab, restaurantsQuery, dishesQuery, listsQuery]);

  // Sorting logic (no changes needed)
  const sortData = useCallback((items = []) => { /* ... */ }, [sortMethod]);

  // Quick Add handler (no changes needed)
  const handleQuickAdd = useCallback((item, type) => { /* ... */ }, [openQuickAdd, isAuthenticated]);

  // FIX: Tab definitions with consistent icons
  const tabs = useMemo(() => [
    { id: "restaurants", label: "Restaurants", Icon: Flame, count: restaurantsQuery.data?.length ?? 0, isLoading: restaurantsQuery.isLoading || restaurantsQuery.isFetching },
    { id: "dishes", label: "Dishes", Icon: Utensils, count: dishesQuery.data?.length ?? 0, isLoading: dishesQuery.isLoading || dishesQuery.isFetching },
    { id: "lists", label: "Lists", Icon: Bookmark, count: listsQuery.data?.length ?? 0, isLoading: listsQuery.isLoading || listsQuery.isFetching },
  ], [restaurantsQuery, dishesQuery, listsQuery]);

  // FIX: Define gridClasses for consistent card layout
  const gridClasses = "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3";

  // Loading component skeletons (no changes needed)
  const LoadingComponent = useMemo(() => { /* ... */ }, [activeTab, gridClasses]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Trending</h1>
      </div>

      {/* Aggregate Trend Chart Section */}
      <div className="mb-6">
           <TrendChart itemType={chartViewType} />
           <div className="flex justify-center gap-2 mt-2">
                {CHART_VIEW_OPTIONS.map(option => (
                    <Button
                        key={option.id}
                        variant={chartViewType === option.id ? 'primary' : 'tertiary'}
                        size="sm"
                        onClick={() => setChartViewType(option.id)}
                        className="!px-2.5 !py-1 flex items-center gap-1 capitalize"
                        aria-pressed={chartViewType === option.id}
                    >
                        {option.Icon && <option.Icon size={14} />}
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
                    className={`flex items-center gap-1.5 py-2 px-4 text-sm font-medium rounded-t-md focus:outline-none focus:ring-1 focus:ring-[#D1B399] focus:z-10 transition-colors whitespace-nowrap ${
                        activeTab === tab.id ? 'text-[#A78B71] border-b-2 border-[#A78B71]' : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'
                    }`}
                    aria-selected={activeTab === tab.id}
                 >
                     {tab.Icon && <tab.Icon size={16} />} {tab.label} ({tab.isLoading ? '...' : tab.count})
                 </button>
            ))}
         </div>
         <div className="flex items-center pb-1 pt-2 sm:pt-0 gap-2 flex-wrap">
             <span className="mr-1 text-sm text-gray-600">Sort:</span>
             {SORT_OPTIONS.map(({ id, label, Icon }) => (
                 <Button key={id} variant={sortMethod === id ? 'primary' : 'tertiary'} size="sm" onClick={() => setSortMethod(id)} className="!px-2.5 !py-1 flex items-center gap-1" aria-pressed={sortMethod === id}>
                     {Icon && <Icon size={14} />} {label}
                 </Button>
             ))}
         </div>
      </div>


      {/* Content Area */}
      <div className="mt-4 min-h-[300px]">
        <QueryResultDisplay
            queryResult={activeQueryResult}
            loadingMessage={null} // Loading handled by LoadingComponent
            errorMessagePrefix={`Failed to load trending ${activeTab}`}
            noDataMessage={`No trending ${activeTab} found.`}
            LoadingComponent={LoadingComponent} // Pass skeleton grid
        >
            {(data) => {
                const sortedItems = sortData(data);
                return (
                   {/* FIX: Apply consistent grid classes */}
                   <div className={gridClasses}>
                       {sortedItems.map((item) => {
                           if (!item || item.id == null) return null;
                           const key = `${activeTab}-${item.id}`;
                           // FIX: Use reusable Card components
                           if (activeTab === "restaurants") return <RestaurantCard key={key} {...item} onQuickAdd={(e) => { e.stopPropagation(); e.preventDefault(); handleQuickAdd(item, 'restaurant'); }} />;
                           if (activeTab === "dishes") return <DishCard key={key} {...item} restaurant={item.restaurant || item.restaurant_name} onQuickAdd={(e) => { e.stopPropagation(); e.preventDefault(); handleQuickAdd(item, 'dish'); }} />;
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