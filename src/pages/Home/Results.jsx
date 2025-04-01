// src/pages/Home/Results.jsx (Use new hook)
import React, { useCallback, useMemo } from "react"; // Removed useState
import { ChevronUp, ChevronDown } from "lucide-react";
import RestaurantCard from "@/components/UI/RestaurantCard";
import DishCard from "@/components/UI/DishCard";
import ListCard from "../Lists/ListCard"; // Adjusted path potentially needed
import useAppStore from "@/hooks/useAppStore";
import useFilteredData from "@/hooks/useFilteredData"; // *** IMPORT THE HOOK ***
import Button from "@/components/Button";
// Removed shallow import

const Results = React.memo(
  ({
    trendingItems = [],
    trendingDishes = [],
    popularLists = [],
    expandedSections,
    setExpandedSections,
    searchQuery // Passed from Home component
  }) => {

    // --- Global State ---
    // Only need clearFilters action now, filtering handled by hook
    const clearFilters = useAppStore(state => state.clearFilters);

    // --- Filtering ---
    // Use the hook for each data type
    const filteredRestaurants = useFilteredData(trendingItems);
    const filteredDishes = useFilteredData(trendingDishes);
    const filteredLists = useFilteredData(popularLists);

    // --- Event Handlers ---
    const toggleSectionExpansion = useCallback((section) => {
      setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
    }, [setExpandedSections]);


    // --- Rendering ---
    // Define renderSection within useCallback
    // No longer depends on applyFilters, clearFilters needed for button
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
                  {filteredItems.map((item) => ( <div key={item?.id || `${sectionKey}-${item?.name}`}> {renderItem(item)} </div> ))}
                </div>
              )}
              {hasDataAfterFilter && !isExpanded && (
                <div className="flex overflow-x-auto space-x-6 pb-4 no-scrollbar">
                  {filteredItems.map((item) => ( <div key={item?.id || `${sectionKey}-${item?.name}`} className="flex-shrink-0"> {renderItem(item)} </div> ))}
                </div>
              )}
          </div>
        </section>
      );
    }, [expandedSections, toggleSectionExpansion, clearFilters]); // Removed renderItem dependency manually


    // Determine overall data state
    const hasAnyDataInitially = (trendingItems.length + trendingDishes.length + popularLists.length) > 0;
    // Use filtered data lengths to check if anything remains after filtering
    const hasAnyDataAfterFilter = (filteredRestaurants.length + filteredDishes.length + filteredLists.length) > 0;


    return (
      <>
        {/* Render Sections: Pass inline render functions */}
        {renderSection( "Trending Dishes", trendingDishes, filteredDishes, (dish) => <DishCard {...dish} restaurant={dish.restaurant_name || dish.restaurant} />, "dishes" )}
        {renderSection( "Trending Restaurants", trendingItems, filteredRestaurants, (restaurant) => <RestaurantCard {...restaurant} />, "restaurants" )}
        {renderSection( "Popular Lists", popularLists, filteredLists, (list) => <ListCard {...list} isFollowing={list.is_following} canFollow={true} />, "lists" )}

        {/* Fallback: Changed logic slightly - show only if NO data existed initially */}
        {!hasAnyDataInitially && (
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