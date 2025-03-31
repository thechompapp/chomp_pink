// src/pages/Trending/index.jsx
import React, { useState, useMemo } from "react";
import { TrendingUp, SortAsc, SortDesc, Map } from "lucide-react";
import useAppStore from "@/hooks/useAppStore";
import FilterSection from "@/pages/Home/FilterSection";
import RestaurantCard from "@/components/UI/RestaurantCard";
import DishCard from "@/components/UI/DishCard";
import ListCard from "@/pages/Lists/ListCard";
import Button from "@/components/Button";

const Trending = () => {
  const {
    trendingItems: storeRestaurants,
    trendingDishes: storeDishes,
    popularLists: storeLists,
    isLoadingTrending,
    trendingError,
    isInitializing,
    initializationError,
    activeFilters,
    searchQuery,
    initializeApp
  } = useAppStore();
  const [activeTab, setActiveTab] = useState("restaurants");
  const [sortMethod, setSortMethod] = useState("popular");

  const applyFilters = useMemo(() => {
    return (items) => {
      if (!Array.isArray(items)) return [];
      return items.filter((item) => {
        if (!item) return false;
        const city = item.city || "";
        const neighborhood = item.neighborhood || "";
        const tags = Array.isArray(item.tags) ? item.tags : [];
        const name = item.name || "";
        const restaurant = item.restaurant || item.restaurant_name || "";
        if (activeFilters.city && city !== activeFilters.city) return false;
        if (activeFilters.neighborhood && neighborhood !== activeFilters.neighborhood) return false;
        if (activeFilters.tags?.length > 0 && !tags.some((t) => activeFilters.tags.includes(t))) return false;
        if (searchQuery && !name.toLowerCase().includes(searchQuery.toLowerCase()) && !restaurant.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
      });
    };
  }, [activeFilters, searchQuery]);

  const sortData = useMemo(() => {
    return (items) => {
      if (!Array.isArray(items)) return [];
      const sorted = [...items];
      if (sortMethod === "popular") return sorted.sort((a, b) => (b.savedCount || b.adds || 0) - (a.savedCount || a.adds || 0));
      if (sortMethod === "a-z") return sorted.sort((a, b) => a.name.localeCompare(b.name));
      if (sortMethod === "z-a") return sorted.sort((a, b) => b.name.localeCompare(a.name));
      if (sortMethod === "distance") return sorted; // Placeholder, requires geolocation
      return sorted;
    };
  }, [sortMethod]);

  const getActiveData = () => {
    let baseData = [];
    switch (activeTab) {
      case "restaurants": baseData = storeRestaurants; break;
      case "dishes": baseData = storeDishes; break;
      case "lists": baseData = storeLists; break;
      default: baseData = [];
    }
    return sortData(applyFilters(baseData));
  };

  const activeData = getActiveData();

  if (isInitializing) return <div className="text-center py-10 text-gray-500">Initializing Application...</div>;
  const errorToShow = initializationError || trendingError;
  if (errorToShow) return (
    <div className="text-center py-10">
      <p className="text-red-500 mb-4">Error loading data: {errorToShow}</p>
      <Button onClick={() => initializeApp()} variant="primary" className="px-4 py-2">Retry Load</Button>
    </div>
  );

  return (
    <div className="space-y-8 mx-auto px-4 sm:px-6 md:px-8 max-w-7xl">
      <div className="pt-4 md:pt-6">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp size={28} className="text-[#D1B399]" />
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Trending Now</h1>
        </div>
      </div>
      <FilterSection />
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex justify-center">
            <div className="inline-flex rounded-md border border-[#D1B399] p-1">
              <Button onClick={() => setActiveTab("restaurants")} variant={activeTab === "restaurants" ? "primary" : "tertiary"} size="sm" className={`rounded ${activeTab === "restaurants" ? "" : "text-[#D1B399] hover:bg-[#D1B399]/10"}`}>Restaurants</Button>
              <Button onClick={() => setActiveTab("dishes")} variant={activeTab === "dishes" ? "primary" : "tertiary"} size="sm" className={`rounded ${activeTab === "dishes" ? "" : "text-[#D1B399] hover:bg-[#D1B399]/10"}`}>Dishes</Button>
              <Button onClick={() => setActiveTab("lists")} variant={activeTab === "lists" ? "primary" : "tertiary"} size="sm" className={`rounded ${activeTab === "lists" ? "" : "text-[#D1B399] hover:bg-[#D1B399]/10"}`}>Lists</Button>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <Button onClick={() => setSortMethod("popular")} variant={sortMethod === "popular" ? "primary" : "tertiary"} size="sm" className="rounded-full">Popular</Button>
            <Button onClick={() => setSortMethod("a-z")} variant={sortMethod === "a-z" ? "primary" : "tertiary"} size="sm" className="rounded-full flex items-center"><SortAsc size={12} className="mr-1" />A-Z</Button>
            <Button onClick={() => setSortMethod("z-a")} variant={sortMethod === "z-a" ? "primary" : "tertiary"} size="sm" className="rounded-full flex items-center"><SortDesc size={12} className="mr-1" />Z-A</Button>
            <Button onClick={() => setSortMethod("distance")} variant={sortMethod === "distance" ? "primary" : "tertiary"} size="sm" className="rounded-full flex items-center"><Map size={12} className="mr-1" />Distance</Button>
          </div>
        </div>
      </div>

      <div className="mt-6">
        {(storeRestaurants.length === 0 && storeDishes.length === 0 && storeLists.length === 0) ? (
          <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
            <h3 className="text-xl font-medium text-gray-700 mb-2">No Trending Items Found</h3>
            <p className="text-gray-500">No trending data seems to be available.</p>
          </div>
        ) : activeData.length === 0 ? (
          <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
            <h3 className="text-xl font-medium text-gray-700 mb-2">No results match your filters</h3>
            <p className="text-gray-500">Try adjusting your filters or search criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 place-items-center">
            {activeData.map((item, index) => {
              const key = `${activeTab}-${item?.id || index}`;
              if (activeTab === "restaurants") return <RestaurantCard key={key} {...item} />;
              if (activeTab === "dishes") return <DishCard key={key} {...item} restaurant={item.restaurant_name || item.restaurant} />;
              if (activeTab === "lists") return (
                <ListCard
                  key={key}
                  {...item}
                  isFollowing={item.is_following}
                  /* Explicitly disable follow action here */
                  canFollow={false}
                />
              );
              return null; /* Should not happen */
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Trending;