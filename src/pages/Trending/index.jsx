// src/pages/Trending/index.jsx
// UPDATE: Removed useFilteredData hook. Select raw data directly from stores and filter locally.
import React, { useState, useCallback, useMemo } from "react"; // Added useMemo
import { TrendingUp, SortAsc, SortDesc, Map, Loader2, AlertTriangle } from "lucide-react";

// Import specific stores needed
import useTrendingStore from '@/stores/useTrendingStore.js';
import useUIStateStore from '@/stores/useUIStateStore.js';

// Import components using correct alias
import FilterSection from "@/pages/Home/FilterSection"; // Keep FilterSection
import RestaurantCard from "@/components/UI/RestaurantCard";
import DishCard from "@/components/UI/DishCard";
import ListCard from "@/pages/Lists/ListCard";
import Button from "@/components/Button";

const Trending = () => {
  // --- Select State Directly from Stores ---
  // Select filter criteria
  const cityId = useUIStateStore((state) => state.cityId);
  // Select raw data arrays, providing defaults
  const rawRestaurants = useTrendingStore((state) => state.trendingItems ?? []);
  const rawDishes = useTrendingStore((state) => state.trendingDishes ?? []);
  const rawLists = useTrendingStore((state) => state.popularLists ?? []);
  // Select loading/error states
  const isLoadingTrending = useTrendingStore((state) => state.isLoading);
  const trendingError = useTrendingStore((state) => state.error);
  // Select fetch action if needed for retry
  const fetchTrendingData = useTrendingStore((state) => state.fetchTrendingData);
  // Global initialization states (can potentially be removed if App.jsx handles this robustly)
  const isAppInitializing = useUIStateStore((state) => state.isInitializing);
  const appInitializationError = useUIStateStore((state) => state.initializationError);
  // --- End State Selection ---

  // State for this page (tabs, sorting)
  const [activeTab, setActiveTab] = useState("restaurants"); // 'restaurants', 'dishes', 'lists'
  const [sortMethod, setSortMethod] = useState("popular"); // 'popular', 'a-z', 'z-a', 'distance'

  // --- Filtering Logic (Now inside the component) ---
  const filterByCity = useCallback((items) => {
    const safeItems = Array.isArray(items) ? items : [];
    if (!cityId) return safeItems;
    return safeItems.filter(item => item && typeof item.city_id !== 'undefined' && item.city_id === cityId);
  }, [cityId]);

  const filteredRestaurants = useMemo(() => filterByCity(rawRestaurants), [rawRestaurants, filterByCity]);
  const filteredDishes = useMemo(() => filterByCity(rawDishes), [rawDishes, filterByCity]);
  const filteredLists = useMemo(() => filterByCity(rawLists), [rawLists, filterByCity]);
  // --- End Filtering Logic ---

  // --- Sorting Logic (Applied after filtering) ---
  const sortData = useCallback((items) => {
    // Ensure items is an array before sorting
    if (!Array.isArray(items)) return [];
    const sorted = [...items]; // Create a copy to sort
    try {
        if (sortMethod === "popular") {
           return sorted.sort((a, b) => (b?.saved_count ?? b?.adds ?? 0) - (a?.saved_count ?? a?.adds ?? 0));
        }
        if (sortMethod === "a-z") {
            return sorted.sort((a, b) => (a?.name || "").localeCompare(b?.name || ""));
         }
        if (sortMethod === "z-a") {
           return sorted.sort((a, b) => (b?.name || "").localeCompare(a?.name || ""));
         }
        if (sortMethod === "distance") {
           console.warn("Distance sorting not yet implemented.");
           return sorted; // Return original order for now
        }
    } catch (error) {
        console.error("Error during sorting:", error);
    }
    return sorted; // Return copy of original order if sort fails or method unknown
  }, [sortMethod]); // Depend only on sortMethod

  // Get the active data based on the tab, apply filtering, then sorting
  const activeData = useMemo(() => {
    let dataToUse = [];
    switch (activeTab) {
      case "restaurants": dataToUse = filteredRestaurants; break;
      case "dishes": dataToUse = filteredDishes; break;
      case "lists": dataToUse = filteredLists; break;
      default: dataToUse = [];
    }
    // Ensure dataToUse is an array before sorting
    return sortData(Array.isArray(dataToUse) ? dataToUse : []);
  }, [activeTab, filteredRestaurants, filteredDishes, filteredLists, sortData]); // Dependencies include filtered data and sort logic

  // --- Render Logic ---
  // Loading and Error States (Keep existing logic, uses store states directly)
   if (appInitializationError) { /* ... existing error display ... */ }
   if (isAppInitializing) { /* ... existing loading display ... */ }
   if (trendingError) {
       return (
            <div className="text-center py-10 px-4">
                <AlertTriangle className="h-10 w-10 text-red-400 mx-auto mb-3" />
                <p className="text-red-600 mb-4">Error loading trending data: {trendingError}</p>
                <Button onClick={fetchTrendingData} variant="primary" size="sm" disabled={isLoadingTrending}>Retry Load</Button>
            </div>
       );
   }
   // Show loading only if no data is displayed yet
   const hasActiveData = Array.isArray(activeData) && activeData.length > 0;
   if (isLoadingTrending && !hasActiveData) {
      return (
           <div className="flex justify-center items-center py-10">
               <Loader2 className="h-6 w-6 animate-spin mr-2 text-gray-500"/>
               <p className="text-gray-500">Loading trending items...</p>
           </div>
       );
   }

  // Main component render (JSX structure remains largely the same)
  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6">
      {/* Header */}
      <div className="pt-2 md:pt-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={24} className="text-[#D1B399]" />
          <h1 className="text-xl md:text-2xl font-bold text-gray-800">Trending Now</h1>
        </div>
      </div>

      {/* Filter Component - Renders city/neighborhood filters */}
      <FilterSection /> {/* FilterSection manages its own state/fetches */}

      {/* Tabs & Sorting Controls (Keep existing JSX) */}
      <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm mb-4">
         {/* ... existing Tabs and Sorting Buttons JSX ... */}
         {/* Make sure onClick handlers for tabs and sort buttons update local state correctly */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Tabs */}
            <div className="flex justify-center">
              <div className="inline-flex rounded-md border border-[#D1B399]/50 p-0.5">
                <Button onClick={() => setActiveTab("restaurants")} variant={activeTab === "restaurants" ? "primary" : "tertiary"} size="sm" className={`rounded-sm !text-xs flex-1 justify-center ${activeTab === "restaurants" ? "" : "text-[#A78B71] bg-transparent hover:bg-[#D1B399]/10 border-none shadow-none"}`}>Restaurants</Button>
                <Button onClick={() => setActiveTab("dishes")} variant={activeTab === "dishes" ? "primary" : "tertiary"} size="sm" className={`rounded-sm !text-xs flex-1 justify-center ${activeTab === "dishes" ? "" : "text-[#A78B71] bg-transparent hover:bg-[#D1B399]/10 border-none shadow-none"}`}>Dishes</Button>
                <Button onClick={() => setActiveTab("lists")} variant={activeTab === "lists" ? "primary" : "tertiary"} size="sm" className={`rounded-sm !text-xs flex-1 justify-center ${activeTab === "lists" ? "" : "text-[#A78B71] bg-transparent hover:bg-[#D1B399]/10 border-none shadow-none"}`}>Lists</Button>
              </div>
            </div>
            {/* Sorting Buttons */}
            <div className="flex flex-wrap justify-center gap-1.5">
              <Button onClick={() => setSortMethod("popular")} variant={sortMethod === "popular" ? "primary" : "tertiary"} size="sm" className="!rounded-full !text-xs !px-2.5">Popular</Button>
              <Button onClick={() => setSortMethod("a-z")} variant={sortMethod === "a-z" ? "primary" : "tertiary"} size="sm" className="!rounded-full !text-xs !px-2.5 flex items-center"><SortAsc size={12} className="mr-0.5" />A-Z</Button>
              <Button onClick={() => setSortMethod("z-a")} variant={sortMethod === "z-a" ? "primary" : "tertiary"} size="sm" className="!rounded-full !text-xs !px-2.5 flex items-center"><SortDesc size={12} className="mr-0.5" />Z-A</Button>
              <Button onClick={() => setSortMethod("distance")} variant={sortMethod === "distance" ? "primary" : "tertiary"} size="sm" className="!rounded-full !text-xs !px-2.5 flex items-center" disabled><Map size={12} className="mr-0.5" />Distance</Button>
            </div>
          </div>
      </div>

      {/* Results Display */}
      <div className="mt-4">
        {/* Check if filtered & sorted data (activeData) is empty */}
        {!hasActiveData ? (
          <div className="text-center py-10 bg-white border border-gray-200 rounded-lg shadow-sm">
            <h3 className="text-lg font-medium text-gray-700 mb-1">No results found</h3>
            <p className="text-sm text-gray-500">
                {cityId ? 'Try adjusting your city filter.' : 'No trending items available.'}
            </p>
          </div>
        ) : (
          // Render the activeData (filtered and sorted)
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 place-items-start">
            {activeData.map((item) => { // Removed index from map as key generation is sufficient
              if (!item || typeof item.id === 'undefined') {
                  console.warn("[Trending Render] Skipping invalid item:", item);
                  return null;
              }
              const key = `${activeTab}-${item.id}`;

              if (activeTab === "restaurants") return <RestaurantCard key={key} {...item} />;
              if (activeTab === "dishes") {
                  // Ensure restaurant name is passed correctly
                  const restaurantName = item.restaurant_name || item.restaurant;
                  return <DishCard key={key} {...item} restaurant={restaurantName} />;
              }
              if (activeTab === "lists") {
                  // Ensure is_following defaults to false if not present
                  return <ListCard key={key} {...item} is_following={item.is_following ?? false} />;
              }
              return null;
            })}
          </div>
        )}
        {/* Subtle loading indicator if loading more data in background */}
        {isLoadingTrending && hasActiveData && (
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