// src/pages/Trending/index.jsx (Use new hook)
import React, { useState } from "react"; // Removed useMemo
import { TrendingUp, SortAsc, SortDesc, Map } from "lucide-react";
import useAppStore from "@/hooks/useAppStore";
import useFilteredData from "@/hooks/useFilteredData"; // *** IMPORT THE HOOK ***
import FilterSection from "@/pages/Home/FilterSection"; // Ensure path is correct
import RestaurantCard from "@/components/UI/RestaurantCard"; // Ensure path is correct
import DishCard from "@/components/UI/DishCard"; // Ensure path is correct
import ListCard from "@/pages/Lists/ListCard"; // Ensure path is correct
import Button from "@/components/Button"; // Ensure path is correct

const Trending = () => {
  // Get raw data and loading/error states from the store
  const {
    trendingItems: storeRestaurants,
    trendingDishes: storeDishes,
    popularLists: storeLists,
    isLoadingTrending, // Use this for loading indicator if needed
    initializationError, // Use this for error display
    isInitializing,    // Use this for initial loading state
    initializeApp      // For retry button
  } = useAppStore(); // Select only needed data/actions

  // State for this page (tabs, sorting)
  const [activeTab, setActiveTab] = useState("restaurants");
  const [sortMethod, setSortMethod] = useState("popular"); // Default sort

  // --- Filtering ---
  // Use the hook to get filtered data for each category
  // Pass the raw data array to the hook
  const filteredRestaurants = useFilteredData(storeRestaurants);
  const filteredDishes = useFilteredData(storeDishes);
  const filteredLists = useFilteredData(storeLists);

  // --- Sorting ---
  // Apply sorting *after* filtering
  const sortData = (items) => {
    if (!Array.isArray(items)) return [];
    const sorted = [...items]; // Create a copy to sort
    try {
        if (sortMethod === "popular") {
           // Sort by 'adds' for dishes/restaurants, 'savedCount' for lists
           return sorted.sort((a, b) => (b.savedCount || b.adds || 0) - (a.savedCount || a.adds || 0));
        }
        if (sortMethod === "a-z") {
            return sorted.sort((a, b) => (a?.name || "").localeCompare(b?.name || ""));
         }
        if (sortMethod === "z-a") {
           return sorted.sort((a, b) => (b?.name || "").localeCompare(a?.name || ""));
         }
        if (sortMethod === "distance") {
           console.warn("Distance sorting not yet implemented."); // Placeholder
           return sorted;
        }
    } catch (error) {
        console.error("Error during sorting:", error);
    }
    return sorted; // Return original order if sort fails
  };

  // Get the active data based on the tab, already filtered by the hook
  const getActiveData = () => {
    switch (activeTab) {
      case "restaurants": return sortData(filteredRestaurants);
      case "dishes": return sortData(filteredDishes);
      case "lists": return sortData(filteredLists);
      default: return [];
    }
  };

  const activeData = getActiveData(); // This is now filtered AND sorted

  // --- Render Logic ---
  // Loading and Error States
  if (isInitializing) return <div className="text-center py-10 text-gray-500">Initializing Application...</div>;
  if (initializationError) return (
    <div className="text-center py-10">
      <p className="text-red-500 mb-4">Error loading data: {initializationError}</p>
      <Button onClick={() => initializeApp()} variant="primary" className="px-4 py-2">Retry Load</Button>
    </div>
  );

  // Main component render
  return (
    <div className="space-y-8 mx-auto px-4 sm:px-6 md:px-8 max-w-7xl">
      {/* Header */}
      <div className="pt-4 md:pt-6">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp size={28} className="text-[#D1B399]" />
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Trending Now</h1>
        </div>
      </div>

      {/* Filter Component */}
      <FilterSection />

      {/* Tabs & Sorting Controls */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Tabs */}
          <div className="flex justify-center">
            <div className="inline-flex rounded-md border border-[#D1B399] p-1">
              <Button onClick={() => setActiveTab("restaurants")} variant={activeTab === "restaurants" ? "primary" : "tertiary"} size="sm" className={`rounded ${activeTab === "restaurants" ? "" : "text-[#D1B399] hover:bg-[#D1B399]/10"}`}>Restaurants</Button>
              <Button onClick={() => setActiveTab("dishes")} variant={activeTab === "dishes" ? "primary" : "tertiary"} size="sm" className={`rounded ${activeTab === "dishes" ? "" : "text-[#D1B399] hover:bg-[#D1B399]/10"}`}>Dishes</Button>
              <Button onClick={() => setActiveTab("lists")} variant={activeTab === "lists" ? "primary" : "tertiary"} size="sm" className={`rounded ${activeTab === "lists" ? "" : "text-[#D1B399] hover:bg-[#D1B399]/10"}`}>Lists</Button>
            </div>
          </div>
          {/* Sorting */}
          <div className="flex flex-wrap justify-center gap-2">
            <Button onClick={() => setSortMethod("popular")} variant={sortMethod === "popular" ? "primary" : "tertiary"} size="sm" className="rounded-full">Popular</Button>
            <Button onClick={() => setSortMethod("a-z")} variant={sortMethod === "a-z" ? "primary" : "tertiary"} size="sm" className="rounded-full flex items-center"><SortAsc size={12} className="mr-1" />A-Z</Button>
            <Button onClick={() => setSortMethod("z-a")} variant={sortMethod === "z-a" ? "primary" : "tertiary"} size="sm" className="rounded-full flex items-center"><SortDesc size={12} className="mr-1" />Z-A</Button>
            <Button onClick={() => setSortMethod("distance")} variant={sortMethod === "distance" ? "primary" : "tertiary"} size="sm" className="rounded-full flex items-center"><Map size={12} className="mr-1" />Distance</Button>
          </div>
        </div>
      </div>

      {/* Results Display */}
      <div className="mt-6">
        {/* Check if initial data was empty */}
        {(storeRestaurants.length === 0 && storeDishes.length === 0 && storeLists.length === 0) ? (
          <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
            <h3 className="text-xl font-medium text-gray-700 mb-2">No Trending Items Found</h3>
            <p className="text-gray-500">No trending data seems to be available.</p>
          </div>
        ) : activeData.length === 0 ? ( // Check if filtered & sorted data is empty
          <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
            <h3 className="text-xl font-medium text-gray-700 mb-2">No results match your filters</h3>
            <p className="text-gray-500">Try adjusting your filters or search criteria.</p>
            {/* Consider adding a clear filters button here too */}
          </div>
        ) : (
          // Render the filtered and sorted data
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 place-items-center">
            {activeData.map((item, index) => {
              const key = `${activeTab}-${item?.id || index}`; // Generate unique key
              if (!item) return null; // Skip rendering null items

              if (activeTab === "restaurants") return <RestaurantCard key={key} {...item} />;
              if (activeTab === "dishes") return <DishCard key={key} {...item} restaurant={item.restaurant_name || item.restaurant} />; // Pass restaurant name
              if (activeTab === "lists") return (
                 <ListCard key={key} {...item} isFollowing={item.is_following} canFollow={false} /> // Disable follow button on trending page? Or keep enabled?
              );
              return null; // Should not happen
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Trending;