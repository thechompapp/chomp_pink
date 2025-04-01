// src/pages/Home/Results.jsx (Corrected useCallback dependency)
import React, { useCallback, useMemo } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import RestaurantCard from "@/components/UI/RestaurantCard";
import DishCard from "@/components/UI/DishCard";
import ListCard from "../Lists/ListCard";
import useAppStore from "@/hooks/useAppStore";
import Button from "@/components/Button";
// Removed shallow import

// Wrap Results with React.memo for performance optimization
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
    const activeFilters = useAppStore(state => state.activeFilters) || { cityId: null, neighborhoodId: null, tags: [] };
    const cities = useAppStore(state => state.cities);
    const neighborhoods = useAppStore(state => state.neighborhoods);
    const clearFilters = useAppStore(state => state.clearFilters);


    // --- Filtering Logic ---
    const applyFilters = useCallback((items = []) => {
      if (!Array.isArray(items)) return [];
      const cityId = activeFilters.cityId;
      const neighborhoodId = activeFilters.neighborhoodId;
      const selectedTags = activeFilters.tags || [];
      const selectedCityName = Array.isArray(cities) ? cities.find(c => c.id === cityId)?.name : null;
      const selectedNeighborhoodName = Array.isArray(neighborhoods) ? neighborhoods.find(n => n.id === neighborhoodId)?.name : null;

      return items.filter((item) => {
        if (!item) return false;
        const itemCity = item.city || "";
        const itemNeighborhood = item.neighborhood || "";
        const itemTags = Array.isArray(item.tags) ? item.tags : [];
        const itemName = item.name || "";
        const itemRestaurant = item.restaurant || item.restaurant_name || "";

        if (cityId && (!selectedCityName || itemCity.toLowerCase() !== selectedCityName.toLowerCase())) return false;
        if (cityId && neighborhoodId && (!selectedNeighborhoodName || itemNeighborhood.toLowerCase() !== selectedNeighborhoodName.toLowerCase())) return false;
        if (selectedTags.length > 0) {
          if (!itemTags.some(t => selectedTags.some(ft => String(t).toLowerCase() === String(ft).toLowerCase()))) return false;
        }
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          if (!(itemName.toLowerCase().includes(query) || itemCity.toLowerCase().includes(query) || itemNeighborhood.toLowerCase().includes(query) || itemTags.some(t => String(t).toLowerCase().includes(query)) || itemRestaurant.toLowerCase().includes(query))) return false;
        }
        return true;
      });
    }, [activeFilters.cityId, activeFilters.neighborhoodId, activeFilters.tags, cities, neighborhoods, searchQuery]);


    // Memoize filtered results
    const filteredRestaurants = useMemo(() => applyFilters(trendingItems), [applyFilters, trendingItems]);
    const filteredDishes = useMemo(() => applyFilters(trendingDishes), [applyFilters, trendingDishes]);
    const filteredLists = useMemo(() => applyFilters(popularLists), [applyFilters, popularLists]);

    // --- Event Handlers ---
    const toggleSectionExpansion = useCallback((section) => {
      setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
    }, [setExpandedSections]);


    // --- Rendering ---
    // Define renderSection within useCallback but DO NOT include renderItem in dependencies
    const renderSection = useCallback((title, allItems, filteredItems, renderItem, sectionKey) => {
      const hadDataInitially = Array.isArray(allItems) && allItems.length > 0;
      const hasDataAfterFilter = Array.isArray(filteredItems) && filteredItems.length > 0;
      const isExpanded = expandedSections[sectionKey];

      return (
        <section className="mb-12">
          {/* Section Header */}
          <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-2">
            <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
            {hasDataAfterFilter && (
                <button onClick={() => toggleSectionExpansion(sectionKey)} className="flex items-center text-gray-500 hover:text-[#D1B399] font-medium text-sm" aria-expanded={isExpanded} aria-controls={`${sectionKey}-content`} >
                  {isExpanded ? "Collapse" : "Expand"}
                  {isExpanded ? <ChevronUp size={16} className="ml-1" /> : <ChevronDown size={16} className="ml-1" />}
                </button>
             )}
          </div>
           {/* Section Content */}
           <div id={`${sectionKey}-content`}>
             {!hasDataAfterFilter && hadDataInitially && (
               <div className="text-center py-8 px-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                 <h3 className="text-lg font-medium text-gray-700 mb-2">No results match your filters</h3>
                 <p className="text-gray-500 mb-4">Try adjusting your filters or search query.</p>
                 <Button onClick={clearFilters} variant="tertiary" className="px-4 py-2 border-[#D1B399] text-[#D1B399] hover:bg-[#D1B399]/10" > Clear all filters </Button>
               </div>
             )}
              {!hadDataInitially && ( <div className="text-center py-8 px-4 bg-white border border-gray-200 rounded-lg shadow-sm"> <p className="text-gray-500">No {title.toLowerCase()} available currently.</p> </div> )}
              {hasDataAfterFilter && isExpanded && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 place-items-start">
                  {/* Pass item directly to renderItem function */}
                  {filteredItems.map((item) => ( <div key={item?.id || `${sectionKey}-${item?.name}`}> {renderItem(item)} </div> ))}
                </div>
              )}
              {hasDataAfterFilter && !isExpanded && (
                <div className="flex overflow-x-auto space-x-6 pb-4 no-scrollbar">
                   {/* Pass item directly to renderItem function */}
                  {filteredItems.map((item) => ( <div key={item?.id || `${sectionKey}-${item?.name}`} className="flex-shrink-0"> {renderItem(item)} </div> ))}
                </div>
              )}
          </div>
        </section>
      );
    // *** CORRECTED Dependency Array: Removed renderItem ***
    }, [expandedSections, toggleSectionExpansion, clearFilters]);


    // Determine overall data state
    const hasAnyDataInitially = (trendingItems.length + trendingDishes.length + popularLists.length) > 0;
    const hasAnyDataAfterFilter = (filteredRestaurants.length + filteredDishes.length + filteredLists.length) > 0;

    return (
      <>
        {/* Render Sections: Pass inline render functions */}
        {renderSection( "Trending Dishes", trendingDishes, filteredDishes, (dish) => <DishCard {...dish} restaurant={dish.restaurant_name || dish.restaurant} />, "dishes" )}
        {renderSection( "Trending Restaurants", trendingItems, filteredRestaurants, (restaurant) => <RestaurantCard {...restaurant} />, "restaurants" )}
        {renderSection( "Popular Lists", popularLists, filteredLists, (list) => <ListCard {...list} isFollowing={list.is_following} canFollow={true} />, "lists" )}

        {/* Fallback */}
        {!hasAnyDataInitially && (
          <div className="text-center py-12 bg-white border border-gray-200 rounded-lg shadow-sm">
            <h3 className="text-xl font-medium text-gray-700 mb-2">No Trending Items Found</h3>
            <p className="text-gray-500">There's currently no trending data available.</p>
          </div>
        )}
      </>
    );
  }
); // End of React.memo

export default Results;