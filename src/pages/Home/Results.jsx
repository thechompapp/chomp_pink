// src/pages/Home/Results.jsx
import React, { useCallback, useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import RestaurantCard from "@/components/UI/RestaurantCard";
import DishCard from "@/components/UI/DishCard";
import ListCard from "@/pages/Lists/ListCard.jsx"; // Updated to global import
import useAppStore from "@/hooks/useAppStore";
import useFilteredData from "@/hooks/useFilteredData";
import Button from "@/components/Button";

// Rest of the file remains unchanged
const Results = React.memo(
  ({
    trendingItems = [],
    trendingDishes = [],
    popularLists = [],
  }) => {
    const [expandedSections, setExpandedSections] = useState({
      restaurants: false,
      dishes: false,
      lists: false,
    });

    const clearFilters = useAppStore(state => state.clearFilters);
    const filteredRestaurants = useFilteredData(trendingItems);
    const filteredDishes = useFilteredData(trendingDishes);
    const filteredLists = useFilteredData(popularLists);

    const toggleSectionExpansion = useCallback((section) => {
      setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
    }, []);

    const renderSection = useCallback((title, allItems, filteredItemsFromHook, renderItem, sectionKey) => {
      const generateKey = (item, index) => {
        if (item && item.id != null && item.id !== '') {
          return `${sectionKey}-${item.id}`;
        }
        console.error(`[Results.jsx - ${sectionKey}] generateKey called with invalid item at index ${index}:`, item);
        return `${sectionKey}-invalid-${index}`;
      };

      const safeAllItems = Array.isArray(allItems) ? allItems : [];
      const safeFilteredItemsFromHook = Array.isArray(filteredItemsFromHook) ? filteredItemsFromHook : [];
      const validFilteredItems = safeFilteredItemsFromHook.filter(item => item && item.id != null && item.id !== '');
      const hadDataInitially = safeAllItems.length > 0;
      const hasDataAfterFilter = validFilteredItems.length > 0;
      const safeExpandedSections = expandedSections || { restaurants: false, dishes: false, lists: false };
      const isExpanded = safeExpandedSections[sectionKey];
      console.log(`[Results] Rendering section: ${title}, expandedSections:`, safeExpandedSections);
      const activeGlobalFilters = useAppStore.getState().activeFilters;
      const searchQuery = useAppStore.getState().searchQuery;
      const filtersAreActive = activeGlobalFilters.cityId || activeGlobalFilters.neighborhoodId || activeGlobalFilters.tags.length > 0 || !!searchQuery;

      return (
        <section className="mb-12">
          <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-2">
            <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
            {(hasDataAfterFilter || (hadDataInitially && filtersAreActive)) && (
              <button onClick={() => toggleSectionExpansion(sectionKey)} className="flex items-center text-gray-500 hover:text-[#D1B399] font-medium text-sm" aria-expanded={isExpanded} aria-controls={`${sectionKey}-content`}>
                {isExpanded ? "Collapse" : "Expand"} {isExpanded ? <ChevronUp size={16} className="ml-1" /> : <ChevronDown size={16} className="ml-1" />}
              </button>
            )}
          </div>
          <div id={`${sectionKey}-content`}>
            {!hasDataAfterFilter && filtersAreActive && hadDataInitially && (
              <div className="text-center py-8 px-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                <h3 className="text-lg font-medium text-gray-700 mb-2">No {title.toLowerCase()} match your filters</h3>
                <p className="text-gray-500 mb-4">Try adjusting your filters or search query.</p>
                <Button onClick={clearFilters} variant="tertiary" className="px-4 py-2 border-[#D1B399] text-[#D1B399] hover:bg-[#D1B399]/10"> Clear all filters </Button>
              </div>
            )}
            {!hadDataInitially && !filtersAreActive && (
              <div className="text-center py-8 px-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                <p className="text-gray-500">No {title.toLowerCase()} available currently.</p>
              </div>
            )}
            {hasDataAfterFilter && isExpanded && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 place-items-start">
                {validFilteredItems.map((item, index) => ( <div key={generateKey(item, index)}> {renderItem(item)} </div> ))}
              </div>
            )}
            {hasDataAfterFilter && !isExpanded && (
              <div className="flex overflow-x-auto space-x-6 pb-4 no-scrollbar">
                {validFilteredItems.map((item, index) => ( <div key={generateKey(item, index)} className="flex-shrink-0"> {renderItem(item)} </div> ))}
                <div className="flex-shrink-0 w-1"></div>
              </div>
            )}
          </div>
        </section>
      );
    }, [expandedSections, toggleSectionExpansion, clearFilters]);

    const safeTrendingItems = Array.isArray(trendingItems) ? trendingItems : [];
    const safeTrendingDishes = Array.isArray(trendingDishes) ? trendingDishes : [];
    const safePopularLists = Array.isArray(popularLists) ? popularLists : [];
    const hasAnyDataInitially = safeTrendingItems.length > 0 || safeTrendingDishes.length > 0 || safePopularLists.length > 0;
    const filtersAreActive = useAppStore.getState().activeFilters.cityId || useAppStore.getState().activeFilters.neighborhoodId || useAppStore.getState().activeFilters.tags.length > 0 || !!useAppStore.getState().searchQuery;
    const hasDataAfterFilter = filteredRestaurants.length > 0 || filteredDishes.length > 0 || filteredLists.length > 0;

    return (
      <>
        {renderSection("Trending Dishes", safeTrendingDishes, filteredDishes, (dish) => <DishCard {...dish} restaurant={dish.restaurant_name || dish.restaurant} restaurantId={dish.restaurant_id}/>, "dishes")}
        {renderSection("Trending Restaurants", safeTrendingItems, filteredRestaurants, (restaurant) => <RestaurantCard {...restaurant} />, "restaurants")}
        {renderSection("Popular Lists", safePopularLists, filteredLists, (list) => <ListCard {...list} isFollowing={list.is_following ?? false} canFollow={true} />, "lists")}
        {!hasAnyDataInitially && !filtersAreActive && (
          <div className="text-center py-12 bg-white border border-gray-200 rounded-lg shadow-sm">
            <h3 className="text-xl font-medium text-gray-700 mb-2">No Trending Items Found</h3>
            <p className="text-gray-500">There's currently no trending data available.</p>
          </div>
        )}
        {filtersAreActive && !hasDataAfterFilter && hasAnyDataInitially && (
          <div className="text-center py-12 bg-white border border-gray-200 rounded-lg shadow-sm">
            <h3 className="text-xl font-medium text-gray-700 mb-2">No results match your filters</h3>
            <p className="text-gray-500 mb-4">Try adjusting your filters or search query.</p>
            <Button onClick={clearFilters} variant="tertiary" className="px-4 py-2 border-[#D1B399] text-[#D1B399] hover:bg-[#D1B399]/10"> Clear all filters </Button>
          </div>
        )}
      </>
    );
  }
);

export default Results;