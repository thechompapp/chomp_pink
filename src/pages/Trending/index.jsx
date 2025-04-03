// src/pages/Trending/index.jsx
// UPDATE: Use specific Zustand stores (useTrendingStore, useUIStateStore) instead of useAppStore
import React, { useState, useCallback } from "react"; // Removed useMemo
import { TrendingUp, SortAsc, SortDesc, Map, Loader2, AlertTriangle } from "lucide-react"; // Added Loader2, AlertTriangle

// ** FIX: Import specific stores **
import useTrendingStore from '@/stores/useTrendingStore.js';
import useUIStateStore from '@/stores/useUIStateStore.js';
// ** FIX: Import hook using correct alias **
import useFilteredData from "@/hooks/useFilteredData.js";
// Import components using correct alias
import FilterSection from "@/pages/Home/FilterSection";
import RestaurantCard from "@/components/UI/RestaurantCard";
import DishCard from "@/components/UI/DishCard";
import ListCard from "@/pages/Lists/ListCard";
import Button from "@/components/Button";

const Trending = () => {
  // ** FIX: Get data and loading/error states from specific stores **
  const storeRestaurants = useTrendingStore((state) => state.trendingItems || []);
  const storeDishes = useTrendingStore((state) => state.trendingDishes || []);
  const storeLists = useTrendingStore((state) => state.popularLists || []);
  const isLoadingTrending = useTrendingStore((state) => state.isLoading); // Loading state for trending data itself
  const trendingError = useTrendingStore((state) => state.error); // Error state specific to trending fetch

  // Get global initialization states (might be redundant if App.jsx handles this before rendering)
  const isAppInitializing = useUIStateStore((state) => state.isInitializing);
  const appInitializationError = useUIStateStore((state) => state.initializationError);
  // ** REMOVE: initializeApp action seems redundant with App.jsx logic **
  // const initializeApp = useUIStateStore((state) => state.initializeApp); // Or wherever it was moved

  // State for this page (tabs, sorting)
  const [activeTab, setActiveTab] = useState("restaurants"); // 'restaurants', 'dishes', 'lists'
  const [sortMethod, setSortMethod] = useState("popular"); // 'popular', 'a-z', 'z-a', 'distance'

  // --- Filtering ---
  // Use the hook to get filtered data for each category based on UIStateStore filters (e.g., cityId)
  // The hook now selects trending data internally from useTrendingStore
  const { filteredRestaurants, filteredDishes, filteredLists } = useFilteredData();

  // --- Sorting ---
  // Apply sorting *after* filtering using local state `sortMethod`
  const sortData = useCallback((items) => {
    if (!Array.isArray(items)) return [];
    const sorted = [...items]; // Create a copy to sort
    try {
        if (sortMethod === "popular") {
           // Sort by 'adds' for dishes/restaurants, 'saved_count' for lists
           // Use optional chaining and nullish coalescing for safety
           return sorted.sort((a, b) => (b?.saved_count ?? b?.adds ?? 0) - (a?.saved_count ?? a?.adds ?? 0));
        }
        if (sortMethod === "a-z") {
            return sorted.sort((a, b) => (a?.name || "").localeCompare(b?.name || ""));
         }
        if (sortMethod === "z-a") {
           return sorted.sort((a, b) => (b?.name || "").localeCompare(a?.name || ""));
         }
        if (sortMethod === "distance") {
           console.warn("Distance sorting not yet implemented."); // Placeholder
           return sorted; // Return original order for now
        }
    } catch (error) {
        console.error("Error during sorting:", error);
    }
    return sorted; // Return copy of original order if sort fails
  }, [sortMethod]); // Depend on sortMethod

  // Get the active data based on the tab, already filtered by the hook, then sort it
  const getActiveData = useCallback(() => {
    let dataToUse = [];
    switch (activeTab) {
      case "restaurants": dataToUse = filteredRestaurants; break;
      case "dishes": dataToUse = filteredDishes; break;
      case "lists": dataToUse = filteredLists; break;
      default: dataToUse = [];
    }
    // Ensure dataToUse is an array before sorting
    return sortData(Array.isArray(dataToUse) ? dataToUse : []);
  }, [activeTab, filteredRestaurants, filteredDishes, filteredLists, sortData]);

  const activeData = getActiveData();

  // --- Render Logic ---
  // Loading and Error States
  // Priority: Global initialization error > Global initializing > Trending fetch error > Trending loading
   if (appInitializationError) {
       // This case should ideally be handled by App.jsx, but added as a fallback
       return (
           <div className="text-center py-10 px-4">
               <AlertTriangle className="h-10 w-10 text-red-400 mx-auto mb-3" />
               <p className="text-red-600">Error initializing application: {appInitializationError}</p>
               {/* Optional: Add retry button if App.jsx doesn't handle it */}
           </div>
       );
   }
   if (isAppInitializing) {
        // This case should ideally be handled by App.jsx
       return (
           <div className="flex justify-center items-center py-10">
               <Loader2 className="h-6 w-6 animate-spin mr-2 text-gray-500"/>
               <p className="text-gray-500">Initializing Application...</p>
           </div>
       );
   }
    if (trendingError) {
        return (
             <div className="text-center py-10 px-4">
                 <AlertTriangle className="h-10 w-10 text-red-400 mx-auto mb-3" />
                 <p className="text-red-600 mb-4">Error loading trending data: {trendingError}</p>
                 {/* Add a retry button for the trending fetch specifically */}
                 <Button onClick={() => useTrendingStore.getState().fetchTrendingData()} variant="primary" size="sm">Retry Load</Button>
             </div>
        );
    }
   if (isLoadingTrending && activeData.length === 0) { // Show loading only if no data is displayed yet
      return (
           <div className="flex justify-center items-center py-10">
               <Loader2 className="h-6 w-6 animate-spin mr-2 text-gray-500"/>
               <p className="text-gray-500">Loading trending items...</p>
           </div>
       );
   }


  // Main component render
  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6"> {/* Reduced spacing and padding */}
      {/* Header */}
      <div className="pt-2 md:pt-4"> {/* Reduced top padding */}
        <div className="flex items-center gap-2 mb-4"> {/* Reduced margin */}
          <TrendingUp size={24} className="text-[#D1B399]" /> {/* Slightly smaller icon */}
          <h1 className="text-xl md:text-2xl font-bold text-gray-800">Trending Now</h1> {/* Slightly smaller heading */}
        </div>
      </div>

      {/* Filter Component - Renders city/neighborhood filters */}
      <FilterSection />

      {/* Tabs & Sorting Controls */}
      <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm mb-4"> {/* Reduced padding and margin */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Tabs */}
          <div className="flex justify-center">
             {/* Use Radix UI Tabs or similar for better accessibility if needed, or keep simple buttons */}
            <div className="inline-flex rounded-md border border-[#D1B399]/50 p-0.5">
              <Button onClick={() => setActiveTab("restaurants")} variant={activeTab === "restaurants" ? "primary" : "tertiary"} size="sm" className={`rounded-sm !text-xs flex-1 justify-center ${activeTab === "restaurants" ? "" : "text-[#A78B71] bg-transparent hover:bg-[#D1B399]/10 border-none shadow-none"}`}>Restaurants</Button>
              <Button onClick={() => setActiveTab("dishes")} variant={activeTab === "dishes" ? "primary" : "tertiary"} size="sm" className={`rounded-sm !text-xs flex-1 justify-center ${activeTab === "dishes" ? "" : "text-[#A78B71] bg-transparent hover:bg-[#D1B399]/10 border-none shadow-none"}`}>Dishes</Button>
              <Button onClick={() => setActiveTab("lists")} variant={activeTab === "lists" ? "primary" : "tertiary"} size="sm" className={`rounded-sm !text-xs flex-1 justify-center ${activeTab === "lists" ? "" : "text-[#A78B71] bg-transparent hover:bg-[#D1B399]/10 border-none shadow-none"}`}>Lists</Button>
            </div>
          </div>
          {/* Sorting Buttons */}
          <div className="flex flex-wrap justify-center gap-1.5"> {/* Reduced gap */}
            <Button onClick={() => setSortMethod("popular")} variant={sortMethod === "popular" ? "primary" : "tertiary"} size="sm" className="!rounded-full !text-xs !px-2.5">Popular</Button>
            <Button onClick={() => setSortMethod("a-z")} variant={sortMethod === "a-z" ? "primary" : "tertiary"} size="sm" className="!rounded-full !text-xs !px-2.5 flex items-center"><SortAsc size={12} className="mr-0.5" />A-Z</Button>
            <Button onClick={() => setSortMethod("z-a")} variant={sortMethod === "z-a" ? "primary" : "tertiary"} size="sm" className="!rounded-full !text-xs !px-2.5 flex items-center"><SortDesc size={12} className="mr-0.5" />Z-A</Button>
            <Button onClick={() => setSortMethod("distance")} variant={sortMethod === "distance" ? "primary" : "tertiary"} size="sm" className="!rounded-full !text-xs !px-2.5 flex items-center" disabled><Map size={12} className="mr-0.5" />Distance</Button> {/* Disabled distance sort */}
          </div>
        </div>
      </div>

      {/* Results Display */}
      <div className="mt-4">
        {/* Check if filtered & sorted data is empty */}
        {activeData.length === 0 ? (
          <div className="text-center py-10 bg-white border border-gray-200 rounded-lg shadow-sm">
            <h3 className="text-lg font-medium text-gray-700 mb-1">No results found</h3>
            <p className="text-sm text-gray-500">Try adjusting your city/neighborhood filter.</p>
            {/* Consider adding a clear filters button here */}
          </div>
        ) : (
          // Render the filtered and sorted data
          // Use grid layout consistent with Results.jsx or MyLists.jsx
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 place-items-start">
            {activeData.map((item, index) => {
              // Ensure item and id are valid
              if (!item || typeof item.id === 'undefined') {
                  console.warn("[Trending Render] Skipping invalid item:", item);
                  return null;
              }
              const key = `${activeTab}-${item.id}`; // Generate unique key

              // Render appropriate card based on active tab
              if (activeTab === "restaurants") return <RestaurantCard key={key} {...item} />;
              if (activeTab === "dishes") {
                  // Ensure restaurant name is passed correctly to DishCard
                  const restaurantName = item.restaurant_name || item.restaurant; // Check both potential fields
                  return <DishCard key={key} {...item} restaurant={restaurantName} />;
              }
              if (activeTab === "lists") {
                  // Pass relevant props to ListCard, including follow state
                  return <ListCard key={key} {...item} isFollowing={item.is_following ?? false} />;
              }
              return null; // Should not happen
            })}
          </div>
        )}
        {/* Show loading indicator subtly if loading more data in background? */}
        {isLoadingTrending && activeData.length > 0 && (
            <div className="flex justify-center items-center pt-4">
                <Loader2 className="h-4 w-4 animate-spin mr-1 text-gray-400"/>
                <p className="text-xs text-gray-400">Updating...</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default Trending;