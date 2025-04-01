// src/pages/Home/Results.jsx (Restored logic/JSX - FINAL CHECK)
import React, { useCallback, useMemo } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import RestaurantCard from "@/components/UI/RestaurantCard";
import DishCard from "@/components/UI/DishCard";
import ListCard from "../Lists/ListCard";
import useAppStore from "@/hooks/useAppStore";
import Button from "@/components/Button";

const Results = React.memo(
  ({
    trendingItems = [],
    trendingDishes = [],
    popularLists = [],
    expandedSections,
    setExpandedSections,
    searchQuery
  }) => {

    // --- Global State ---
    const cityId = useAppStore(state => state.activeFilters?.cityId);
    const neighborhoodId = useAppStore(state => state.activeFilters?.neighborhoodId);
    const tags = useAppStore(state => state.activeFilters?.tags) || [];
    const cities = useAppStore(state => state.cities) || [];
    const neighborhoods = useAppStore(state => state.neighborhoods) || [];
    const clearFilters = useAppStore(state => state.clearFilters);


    // --- Derived State (Memoized) ---
    const selectedCityName = useMemo(() => {
        return Array.isArray(cities) ? cities.find(c => c.id === cityId)?.name : null;
    }, [cities, cityId]);

    const selectedNeighborhoodName = useMemo(() => {
        if (!cityId) return null;
        return Array.isArray(neighborhoods) ? neighborhoods.find(n => n.id === neighborhoodId)?.name : null;
    }, [neighborhoods, neighborhoodId, cityId]);


    // --- Filtering Logic ---
    const applyFilters = useCallback((items = []) => {
      if (!Array.isArray(items)) return [];
      const selectedTags = Array.isArray(tags) ? tags : []; // Ensure tags is array

      return items.filter((item) => {
        if (!item) return false;
        const itemCity = item.city || "";
        const itemNeighborhood = item.neighborhood || "";
        const itemTags = Array.isArray(item.tags) ? item.tags : [];
        const itemName = item.name || "";
        const itemRestaurant = item.restaurant || item.restaurant_name || "";

        if (cityId && (!selectedCityName || itemCity.toLowerCase() !== selectedCityName.toLowerCase())) return false;
        if (cityId && neighborhoodId && (!selectedNeighborhoodName || itemNeighborhood.toLowerCase() !== selectedNeighborhoodName.toLowerCase())) return false;
        if (selectedTags.length > 0) { if (!itemTags.some(t => selectedTags.some(ft => String(t).toLowerCase() === String(ft).toLowerCase()))) return false; }
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          if (!(itemName.toLowerCase().includes(query) || itemCity.toLowerCase().includes(query) || itemNeighborhood.toLowerCase().includes(query) || itemTags.some(t => String(t).toLowerCase().includes(query)) || itemRestaurant.toLowerCase().includes(query))) return false;
        }
        return true;
      });
    }, [cityId, neighborhoodId, tags, selectedCityName, selectedNeighborhoodName, searchQuery]);


    // Memoize filtered results
    const filteredRestaurants = useMemo(() => applyFilters(trendingItems), [applyFilters, trendingItems]);
    const filteredDishes = useMemo(() => applyFilters(trendingDishes), [applyFilters, trendingDishes]);
    const filteredLists = useMemo(() => applyFilters(popularLists), [applyFilters, popularLists]);

    // --- Event Handlers ---
    const toggleSectionExpansion = useCallback((section) => {
      setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
    }, [setExpandedSections]);


    // --- Rendering ---
    const renderSection = useCallback((title, allItems, filteredItems, renderItem, sectionKey) => {
        // Ensure arrays are valid before accessing length
        const safeAllItems = Array.isArray(allItems) ? allItems : [];
        const safeFilteredItems = Array.isArray(filteredItems) ? filteredItems : [];

        const hadDataInitially = safeAllItems.length > 0;
        const hasDataAfterFilter = safeFilteredItems.length > 0;
        const isExpanded = expandedSections[sectionKey];

        return (
            <section className="mb-12">
            <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-2"> <h2 className="text-2xl font-bold text-gray-800">{title}</h2> {hasDataAfterFilter && ( <button onClick={() => toggleSectionExpansion(sectionKey)} className="flex items-center text-gray-500 hover:text-[#D1B399] font-medium text-sm" aria-expanded={isExpanded} aria-controls={`${sectionKey}-content`} > {isExpanded ? "Collapse" : "Expand"} {isExpanded ? <ChevronUp size={16} className="ml-1" /> : <ChevronDown size={16} className="ml-1" />} </button> )} </div>
            <div id={`${sectionKey}-content`}>
                {!hasDataAfterFilter && hadDataInitially && ( <div className="text-center py-8 px-4 bg-white border border-gray-200 rounded-lg shadow-sm"> <h3 className="text-lg font-medium text-gray-700 mb-2">No results match your filters</h3> <p className="text-gray-500 mb-4">Try adjusting your filters or search query.</p> <Button onClick={clearFilters} variant="tertiary" className="px-4 py-2 border-[#D1B399] text-[#D1B399] hover:bg-[#D1B399]/10" > Clear all filters </Button> </div> )}
                {!hadDataInitially && ( <div className="text-center py-8 px-4 bg-white border border-gray-200 rounded-lg shadow-sm"> <p className="text-gray-500">No {title.toLowerCase()} available currently.</p> </div> )}
                {hasDataAfterFilter && isExpanded && ( <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 place-items-start"> {safeFilteredItems.map((item) => ( <div key={item?.id || `${sectionKey}-${item?.name}`}> {renderItem(item)} </div> ))} </div> )}
                {hasDataAfterFilter && !isExpanded && ( <div className="flex overflow-x-auto space-x-6 pb-4 no-scrollbar"> {safeFilteredItems.map((item) => ( <div key={item?.id || `${sectionKey}-${item?.name}`} className="flex-shrink-0"> {renderItem(item)} </div> ))} </div> )}
            </div>
            </section>
        );
    }, [expandedSections, toggleSectionExpansion, clearFilters]); // renderItem is implicitly captured, doesn't need to be dep


    // Corrected logic using safe arrays
    const safeTrendingItems = Array.isArray(trendingItems) ? trendingItems : [];
    const safeTrendingDishes = Array.isArray(trendingDishes) ? trendingDishes : [];
    const safePopularLists = Array.isArray(popularLists) ? popularLists : [];
    const safeFilteredRestaurants = Array.isArray(filteredRestaurants) ? filteredRestaurants : [];
    const safeFilteredDishes = Array.isArray(filteredDishes) ? filteredDishes : [];
    const safeFilteredLists = Array.isArray(filteredLists) ? filteredLists : [];

    const hasAnyDataInitially = safeTrendingItems.length > 0 || safeTrendingDishes.length > 0 || safePopularLists.length > 0;
    const hasAnyDataAfterFilter = safeFilteredRestaurants.length > 0 || safeFilteredDishes.length > 0 || safeFilteredLists.length > 0;


    // Correct Main Return JSX
    return (
      <>
        {renderSection( "Trending Dishes", safeTrendingDishes, safeFilteredDishes, (dish) => <DishCard {...dish} restaurant={dish.restaurant_name || dish.restaurant} />, "dishes" )}
        {renderSection( "Trending Restaurants", safeTrendingItems, safeFilteredRestaurants, (restaurant) => <RestaurantCard {...restaurant} />, "restaurants" )}
        {renderSection( "Popular Lists", safePopularLists, safeFilteredLists, (list) => <ListCard {...list} isFollowing={list.is_following} canFollow={true} />, "lists" )}
        {!hasAnyDataInitially && !hasAnyDataAfterFilter && (
          <div className="text-center py-12 bg-white border border-gray-200 rounded-lg shadow-sm">
            <h3 className="text-xl font-medium text-gray-700 mb-2">No Trending Items Found</h3>
            <p className="text-gray-500">There's currently no trending data available.</p>
          </div>
        )}
      </>
    );
  }
);

export default Results;