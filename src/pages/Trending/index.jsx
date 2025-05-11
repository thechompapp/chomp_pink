/* src/pages/Trending/index.jsx */
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import useAuthStore from '@/stores/useAuthStore'; // <-- Corrected default import
import useFollowStore from '@/stores/useFollowStore'; // Import the follow store
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
        console.log('[TrendingPage] Restaurant data fetched:', data);
        // Ensure we properly handle all possible return formats
        if (Array.isArray(data)) {
            return data;
        } else if (data && typeof data === 'object' && Array.isArray(data.data)) {
            // Handle case where API returns { data: [...], success: true }
            return data.data;
        } else {
            console.warn('[TrendingPage] Unexpected data format from trendingService:', data);
            return [];
        }
    } catch (error) {
        console.error("[TrendingPage] Error fetching restaurants:", error);
        // Return empty array instead of re-throwing to prevent auth issues
        return [];
    }
};
const fetchTrendingDishes = async () => {
     try {
        const data = await trendingService.getTrendingDishes();
        console.log('[TrendingPage] Dish data fetched:', data);
        // Ensure we properly handle all possible return formats
        if (Array.isArray(data)) {
            return data;
        } else if (data && typeof data === 'object' && Array.isArray(data.data)) {
            // Handle case where API returns { data: [...], success: true }
            return data.data;
        } else {
            console.warn('[TrendingPage] Unexpected data format from trendingService:', data);
            return [];
        }
    } catch (error) {
        console.error("[TrendingPage] Error fetching dishes:", error);
        // Return empty array instead of re-throwing to prevent auth issues
        return [];
    }
};
const fetchTrendingLists = async () => {
     try {
        const data = await trendingService.getTrendingLists();
        console.log('[TrendingPage] List data fetched:', data);
        // Ensure we properly handle all possible return formats
        if (Array.isArray(data)) {
            return data;
        } else if (data && typeof data === 'object' && Array.isArray(data.data)) {
            // Handle case where API returns { data: [...], success: true }
            return data.data;
        } else {
            console.warn('[TrendingPage] Unexpected data format from trendingService:', data);
            return [];
        }
    } catch (error) {
        console.error("[TrendingPage] Error fetching lists:", error);
        // Instead of re-throwing and potentially causing auth issues,
        // return an empty array so the page can still function
        return [];
    }
};

const Trending = () => {
  const [activeTab, setActiveTab] = useState('restaurants');
  const [sortMethod, setSortMethod] = useState('popular');
  const [chartViewType, setChartViewType] = useState('restaurant');
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { openQuickAdd } = useQuickAdd();
  const queryClient = useQueryClient();
  
  // Access the follow store to track followed lists
  const { initializeFollowedLists } = useFollowStore();

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

  // Initialize the follow store with lists data when it loads
  useEffect(() => {
    if (listsQuery.data && Array.isArray(listsQuery.data)) {
      console.log('[TrendingPage] Initializing follow store with', listsQuery.data.length, 'lists');
      initializeFollowedLists(listsQuery.data);
    }
  }, [listsQuery.data, initializeFollowedLists]);
  
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
            // Optionally trigger login prompt or UI state change
            // useUIStateStore.getState().showError("Please log in to add items.");
            return;
        }
        openQuickAdd({
            id: item.id,
            name: item.name,
             // Ensure correct mapping based on incoming data structure
             // These might differ slightly between restaurant, dish, list cards
            restaurantId: type === 'dish' ? item.restaurant_id : undefined,
            restaurantName: type === 'dish' ? (item.restaurant_name || item.restaurant) : undefined,
            tags: item.tags || item.hashtags || [], // Handle different tag properties
            type: type,
            city: item.city_name || item.city, // Handle different location properties
            neighborhood: item.neighborhood_name || item.neighborhood,
            photo_url: item.photo_url, // Include photo if available
             // Add any other relevant details for the QuickAdd context
             description: item.description,
        });
    }, [openQuickAdd, isAuthenticated]);


  const tabs = useMemo(() => [
    { id: "restaurants", label: "Restaurants", Icon: Flame, query: restaurantsQuery },
    { id: "dishes", label: "Dishes", Icon: Utensils, query: dishesQuery },
    { id: "lists", label: "Lists", Icon: Bookmark, query: listsQuery },
  ], [restaurantsQuery, dishesQuery, listsQuery]);

  const initialError = useMemo(() => {
      // Return the first encountered error among the initial queries
      return restaurantsQuery.error || dishesQuery.error || listsQuery.error;
  }, [restaurantsQuery.error, dishesQuery.error, listsQuery.error]);

  // Determine initial loading state based on all queries
  const isInitialLoading = useMemo(() => {
      return restaurantsQuery.isLoading || dishesQuery.isLoading || listsQuery.isLoading;
  }, [restaurantsQuery.isLoading, dishesQuery.isLoading, listsQuery.isLoading]);

  const gridClasses = "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3";

  const LoadingComponent = useMemo(() => {
    // Determine which skeleton to show based on the active tab
    const SkeletonComponent =
        activeTab === 'restaurants' ? RestaurantCardSkeleton :
        activeTab === 'dishes' ? DishCardSkeleton :
        ListCardSkeleton; // Assumes ListCardSkeleton exists and is imported
    return (
        <div className={gridClasses}>
            {[...Array(10)].map((_, index) => ( // Show 10 skeletons
                <SkeletonComponent key={`${activeTab}-skel-${index}`} />
            ))}
        </div>
    );
  }, [activeTab, gridClasses]); // Recompute only when activeTab changes

  // --- Render Logic ---

   // Show a central loading spinner only during the initial combined load
   if (isInitialLoading) {
       return (
           <div className="flex justify-center items-center h-[calc(100vh-300px)]">
                <LoadingSpinner message="Loading trending data..." />
           </div>
       );
   }

   // Show a general error message if any of the initial queries failed
   if (initialError && !isInitialLoading) { // Check !isInitialLoading to avoid showing error during load
       return (
           <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6">
               <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">Trending</h1>
                <ErrorMessage
                   message={initialError.message || 'Failed to load some trending data.'}
                   onRetry={() => { // Retry all initial queries
                       restaurantsQuery.refetch();
                       dishesQuery.refetch();
                       listsQuery.refetch();
                   }}
                   // Disable retry button if any query is currently fetching
                   isLoadingRetry={restaurantsQuery.isFetching || dishesQuery.isFetching || listsQuery.isFetching}
                   containerClassName="mt-6"
               />
           </div>
       );
   }


  // Main content render once initial load/error states are passed
  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100">Trending</h1>
         {/* Maybe add a global refresh button here? */}
      </div>

      {/* Aggregate Trend Chart Section */}
       <div className="mb-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
           <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-3 text-center">Popularity Trends</h2>
           <TrendChart itemType={chartViewType} />
           <div className="flex justify-center gap-2 mt-3">
                {CHART_VIEW_OPTIONS.map(option => (
                    <Button
                        key={option.id}
                        variant={chartViewType === option.id ? 'primary' : 'tertiary'}
                        size="sm"
                        onClick={() => setChartViewType(option.id)}
                        className="!px-2.5 !py-1 flex items-center gap-1 capitalize"
                        aria-pressed={chartViewType === option.id}
                        disabled={ // Disable if the corresponding query is fetching
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
       <div className="flex flex-col sm:flex-row justify-between border-b border-gray-200 dark:border-gray-700">
         {/* Tabs */}
         <div className="flex overflow-x-auto pb-1 no-scrollbar">
            {tabs.map((tab) => {
                // Display count or loading indicator
                const displayCount = tab.query.isFetching ? '...' : (Array.isArray(tab.query.data) ? tab.query.data.length : '0');
                return (
                 <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 py-2 px-4 text-sm font-medium rounded-t-md focus:outline-none focus:ring-1 focus:ring-[#D1B399] focus:z-10 transition-colors whitespace-nowrap ${
                        activeTab === tab.id
                            ? 'text-[#A78B71] dark:text-[#D1B399] border-b-2 border-[#A78B71]'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 border-b-2 border-transparent'
                    }`}
                    aria-selected={activeTab === tab.id}
                    disabled={tab.query.isFetching} // Disable tab while its data is loading
                 >
                     {tab.Icon && <tab.Icon size={16} />} {tab.label} ({displayCount})
                 </button>
                );
            })}
         </div>
         {/* Sort Controls */}
         <div className="flex items-center pb-1 pt-2 sm:pt-0 gap-2 flex-wrap justify-start sm:justify-end">
             <span className="mr-1 text-sm text-gray-600 dark:text-gray-400">Sort:</span>
             {SORT_OPTIONS.map(({ id, label, Icon }) => (
                 <Button
                      key={id}
                      variant={sortMethod === id ? 'primary' : 'tertiary'} // Use primary/tertiary for active/inactive
                      size="sm"
                      onClick={() => setSortMethod(id)}
                      className="!px-2.5 !py-1 flex items-center gap-1"
                      aria-pressed={sortMethod === id}
                      disabled={activeQueryResult.isFetching} // Disable sort when loading
                 >
                     {Icon && <Icon size={14} />} {label}
                 </Button>
             ))}
         </div>
      </div>

      {/* Content Area */}
      <div className="mt-4 min-h-[300px]"> {/* Ensure minimum height */}
        <QueryResultDisplay
            queryResult={activeQueryResult} // Pass the whole query result for the active tab
            loadingMessage={null} // Handled by LoadingComponent
            errorMessagePrefix={`Failed to load trending ${activeTab}`}
            noDataMessage={`No trending ${activeTab} found.`}
            LoadingComponent={LoadingComponent} // Use the memoized skeleton grid
        >
            {(data) => { // data here is guaranteed to be non-null and not an error state by QueryResultDisplay
                const sortedItems = sortData(data); // Sort the data received from the active query
                return (
                   <div className={gridClasses}>
                       {sortedItems.map((item) => {
                           // Basic check for item validity
                           if (!item || item.id == null) {
                                console.warn("[TrendingPage] Skipping render for invalid item:", item);
                                return null;
                           }
                           const key = `${activeTab}-${item.id}`;
                           // Render the appropriate card based on the active tab
                            if (activeTab === "restaurants") {
                                return <RestaurantCard 
                                    key={key} 
                                    {...item} 
                                    onQuickAdd={() => handleQuickAdd(item, 'restaurant')} 
                                />;
                            }
                            if (activeTab === "dishes") {
                                // Ensure restaurant name is passed correctly
                                return <DishCard 
                                    key={key} 
                                    {...item} 
                                    restaurant={item.restaurant || item.restaurant_name} 
                                    onQuickAdd={() => handleQuickAdd(item, 'dish')} 
                                />;
                            }
                           if (activeTab === "lists") {
                               // Pass the entire item as the 'list' prop as ListCard expects
                               return <ListCard 
                                    key={key} 
                                    list={item} 
                                    onQuickAdd={() => handleQuickAdd(item, 'list')} 
                                />;
                           }
                           return null; // Should not happen if activeTab matches one of the cases
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