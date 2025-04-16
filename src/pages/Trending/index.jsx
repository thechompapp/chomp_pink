/* src/pages/Trending/index.jsx */
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
// FIX: Corrected icon import from SortAlphaDown to SortAsc
import { Flame, Utensils, Bookmark, Star, Clock, SortAsc, List as ListIcon, TrendingUp } from 'lucide-react';
import { useQuickAdd } from '@/context/QuickAddContext';
import LoadingSpinner from '@/components/UI/LoadingSpinner';

// FIX: Use correct icon (SortAsc)
const SORT_OPTIONS = [
  { id: "popular", label: "Popular", Icon: Star },
  { id: "newest", label: "Newest", Icon: Clock },
  { id: "alphabetical", label: "A-Z", Icon: SortAsc } // Changed from SortAlphaDown
];

const CHART_VIEW_OPTIONS = [
  { id: "restaurant", label: "Restaurants", Icon: Flame },
  { id: "dish", label: "Dishes", Icon: Utensils },
  { id: "list", label: "Lists", Icon: Bookmark }
];

// Fetcher functions
const fetchTrendingRestaurants = async () => {
    try {
        const data = await trendingService.getTrendingRestaurants();
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error("[TrendingPage] Error fetching restaurants:", error);
        throw error; // Re-throw for React Query
    }
};
const fetchTrendingDishes = async () => {
     try {
        const data = await trendingService.getTrendingDishes();
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error("[TrendingPage] Error fetching dishes:", error);
        throw error; // Re-throw for React Query
    }
};
const fetchTrendingLists = async () => {
     try {
        const data = await trendingService.getTrendingLists();
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error("[TrendingPage] Error fetching lists:", error);
        throw error; // Re-throw for React Query
    }
};

const Trending = () => {
  const [activeTab, setActiveTab] = useState('restaurants');
  const [sortMethod, setSortMethod] = useState('popular');
  const [chartViewType, setChartViewType] = useState('restaurant');
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { openQuickAdd } = useQuickAdd();
  const queryClient = useQueryClient();

  const queryOptions = useMemo(() => ({
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    placeholderData: [],
    retry: (failureCount, error) => {
        const status = error?.status;
        if (status && status >= 400 && status < 500) return false;
        return failureCount < 1;
    },
  }), []);

  const restaurantsQuery = useQuery({ queryKey: ['trendingRestaurantsPage'], queryFn: fetchTrendingRestaurants, ...queryOptions });
  const dishesQuery = useQuery({ queryKey: ['trendingDishesPage'], queryFn: fetchTrendingDishes, ...queryOptions });
  const listsQuery = useQuery({ queryKey: ['trendingListsPage'], queryFn: fetchTrendingLists, ...queryOptions });

  useEffect(() => {
      const handleListUpdate = () => {
          console.log('[TrendingPage] List follow toggled, invalidating lists query');
          queryClient.invalidateQueries({ queryKey: ['trendingListsPage'] });
      };
      window.addEventListener('listFollowToggled', handleListUpdate);
      return () => window.removeEventListener('listFollowToggled', handleListUpdate);
  }, [queryClient]);

  const activeQueryResult = useMemo(() => {
    switch (activeTab) {
      case 'dishes': return dishesQuery;
      case 'lists': return listsQuery;
      case 'restaurants': default: return restaurantsQuery;
    }
  }, [activeTab, restaurantsQuery, dishesQuery, listsQuery]);

  const sortData = useCallback((items = []) => {
    if (!Array.isArray(items)) return [];
    const sorted = [...items];
    switch (sortMethod) {
      case 'newest':
        sorted.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
        break;
      case 'alphabetical':
        sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        break;
      case 'popular': default: break;
    }
    return sorted;
  }, [sortMethod]);

  const handleQuickAdd = useCallback((item, type) => {
        if (!isAuthenticated) {
            console.log("User not authenticated, cannot quick add.");
            return;
        }
        openQuickAdd({
            id: item.id,
            name: item.name,
            restaurantId: type === 'dish' ? item.restaurant_id : undefined,
            restaurantName: type === 'dish' ? (item.restaurant_name || item.restaurant) : undefined,
            tags: item.tags || [],
            type: type,
            city: item.city_name || item.city,
            neighborhood: item.neighborhood_name || item.neighborhood,
        });
    }, [openQuickAdd, isAuthenticated]);


  const tabs = useMemo(() => [
    { id: "restaurants", label: "Restaurants", Icon: Flame, query: restaurantsQuery },
    { id: "dishes", label: "Dishes", Icon: Utensils, query: dishesQuery },
    { id: "lists", label: "Lists", Icon: Bookmark, query: listsQuery },
  ], [restaurantsQuery, dishesQuery, listsQuery]);

  const initialError = useMemo(() => {
      return restaurantsQuery.error || dishesQuery.error || listsQuery.error;
  }, [restaurantsQuery.error, dishesQuery.error, listsQuery.error]);

  const isInitialLoading = restaurantsQuery.isLoading || dishesQuery.isLoading || listsQuery.isLoading;

  const gridClasses = "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3";

  const LoadingComponent = useMemo(() => {
    const SkeletonComponent =
        activeTab === 'restaurants' ? RestaurantCardSkeleton :
        activeTab === 'dishes' ? DishCardSkeleton :
        ListCardSkeleton;
    return (
        <div className={gridClasses}>
            {[...Array(10)].map((_, index) => (
                <SkeletonComponent key={`${activeTab}-skel-${index}`} />
            ))}
        </div>
    );
  }, [activeTab, gridClasses]);

  // --- Render Logic ---

  if (isInitialLoading) {
      return (
          <div className="flex justify-center items-center h-[calc(100vh-300px)]">
               <LoadingSpinner message="Loading trending data..." />
          </div>
      );
  }

  if (initialError && !isInitialLoading) {
      return (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">Trending</h1>
               <ErrorMessage
                  message={initialError.message || 'Failed to load some trending data.'}
                  onRetry={() => {
                      restaurantsQuery.refetch();
                      dishesQuery.refetch();
                      listsQuery.refetch();
                  }}
                  isLoadingRetry={restaurantsQuery.isFetching || dishesQuery.isFetching || listsQuery.isFetching}
                  containerClassName="mt-6"
              />
          </div>
      );
  }

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
                        disabled={
                            (option.id === 'restaurant' && restaurantsQuery.isFetching) ||
                            (option.id === 'dish' && dishesQuery.isFetching) ||
                            (option.id === 'list' && listsQuery.isFetching)
                        }
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
            {tabs.map((tab) => {
                const displayCount = tab.query.isLoading || !tab.query.data ? '...' : tab.query.data.length;
                return (
                 <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 py-2 px-4 text-sm font-medium rounded-t-md focus:outline-none focus:ring-1 focus:ring-[#D1B399] focus:z-10 transition-colors whitespace-nowrap ${
                        activeTab === tab.id ? 'text-[#A78B71] border-b-2 border-[#A78B71]' : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'
                    }`}
                    aria-selected={activeTab === tab.id}
                 >
                     {tab.Icon && <tab.Icon size={16} />} {tab.label} ({displayCount})
                 </button>
                );
            })}
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
            loadingMessage={null}
            errorMessagePrefix={`Failed to load trending ${activeTab}`}
            noDataMessage={`No trending ${activeTab} found.`}
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