/* src/pages/Trending/index.jsx */
/* REMOVED: All TypeScript syntax */
import React, { useState, useCallback, useMemo, useEffect } from 'react'; // Added useEffect
import { useQuery } from '@tanstack/react-query';
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
import { Flame, Utensils, Bookmark, SortAsc, Clock, Store, List as ListIcon, TrendingUp } from 'lucide-react';
import { useQuickAdd } from '@/context/QuickAddContext';

// Sort options remain the same
const SORT_OPTIONS = [ /* ... */ ];
const CHART_VIEW_OPTIONS = [ /* ... */ ];

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

  const queryOptions = useMemo(() => ({
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    placeholderData: [], // Use empty array as placeholder
  }), []);

  const restaurantsQuery = useQuery({ queryKey: ['trendingRestaurantsPage'], queryFn: fetchTrendingRestaurants, ...queryOptions });
  const dishesQuery = useQuery({ queryKey: ['trendingDishesPage'], queryFn: fetchTrendingDishes, ...queryOptions });
  const listsQuery = useQuery({ queryKey: ['trendingListsPage'], queryFn: fetchTrendingLists, ...queryOptions });

  // Listen for external list follow updates and invalidate lists query
  useEffect(() => {
      const handleListUpdate = () => {
          console.log('[TrendingPage] List follow toggled, invalidating lists query');
          listsQuery.refetch(); // Or queryClient.invalidateQueries(['trendingListsPage']) if using client directly
      };
      window.addEventListener('listFollowToggled', handleListUpdate);
      return () => window.removeEventListener('listFollowToggled', handleListUpdate);
  }, [listsQuery]); // Depend on listsQuery to get the refetch function reference

  const activeQueryResult = useMemo(() => {
    switch (activeTab) {
      case 'dishes': return dishesQuery;
      case 'lists': return listsQuery;
      case 'restaurants': default: return restaurantsQuery;
    }
  }, [activeTab, restaurantsQuery, dishesQuery, listsQuery]);

  // Sorting logic
  const sortData = useCallback((items = []) => {
    const sortedItems = [...items];
    switch (sortMethod) {
      case "popular":
        // Sort by 'adds' for dishes/restaurants, 'saved_count' for lists, fallback to score
        return sortedItems.sort((a, b) => (b.adds ?? b.saved_count ?? b.trending_score ?? 0) - (a.adds ?? a.saved_count ?? a.trending_score ?? 0));
      case "newest":
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
          console.log("User not authenticated, cannot quick add.");
          // Consider navigating to login: navigate('/login');
          return;
      }
      // Ensure all necessary fields are passed based on type
      openQuickAdd({
        type: type,
        id: item.id,
        name: item.name,
        restaurantId: type === 'dish' ? item.restaurant_id : undefined,
        restaurantName: type === 'dish' ? (item.restaurant_name || item.restaurant) : undefined,
        tags: item.tags || [],
        // Add location info if available on the item object
        city: item.city_name || item.city,
        neighborhood: item.neighborhood_name || item.neighborhood,
      });
    }, [openQuickAdd, isAuthenticated]); // Added isAuthenticated

  // Tab definitions
  const tabs = useMemo(() => [
    { id: "restaurants", label: "Restaurants", Icon: Flame, count: restaurantsQuery.data?.length ?? 0, isLoading: restaurantsQuery.isLoading || restaurantsQuery.isFetching },
    { id: "dishes", label: "Dishes", Icon: Utensils, count: dishesQuery.data?.length ?? 0, isLoading: dishesQuery.isLoading || dishesQuery.isFetching },
    { id: "lists", label: "Lists", Icon: Bookmark, count: listsQuery.data?.length ?? 0, isLoading: listsQuery.isLoading || listsQuery.isFetching },
  ], [restaurantsQuery, dishesQuery, listsQuery]);

  const gridClasses = "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3";

  // Loading component skeletons
  const LoadingComponent = useMemo(() => {
       const SkeletonComponent = {
         restaurants: RestaurantCardSkeleton,
         dishes: DishCardSkeleton,
         lists: ListCardSkeleton
       }[activeTab];
       if (!SkeletonComponent) return null;
       return (
           <div className={gridClasses}>
               {Array.from({ length: 5 }).map((_, i) => <SkeletonComponent key={`skel-${activeTab}-${i}`}/>)}
           </div>
       );
   }, [activeTab, gridClasses]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Trending</h1>
      </div>

      {/* Aggregate Trend Chart Section */}
      <div className="mb-6">
           <TrendChart itemType={chartViewType} /> {/* Pass state to prop */}
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
                 <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`... ${activeTab === tab.id ? '...' : '...'}`} aria-selected={activeTab === tab.id} >
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
            {(data) => { // data is guaranteed to be non-empty array here
                const sortedItems = sortData(data);
                return (
                   <div className={gridClasses}>
                       {sortedItems.map((item) => {
                           if (!item || item.id == null) return null;
                           const key = `${activeTab}-${item.id}`;
                           if (activeTab === "restaurants") return <RestaurantCard key={key} {...item} onQuickAdd={(e) => { e.stopPropagation(); e.preventDefault(); handleQuickAdd(item, 'restaurant'); }} />;
                           if (activeTab === "dishes") return <DishCard key={key} {...item} restaurant={item.restaurant || item.restaurant_name} onQuickAdd={(e) => { e.stopPropagation(); e.preventDefault(); handleQuickAdd(item, 'dish'); }} />;
                           if (activeTab === "lists") return <ListCard key={key} {...item} type={item.type || item.list_type} />; // Pass necessary props
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