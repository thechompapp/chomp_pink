import React, { useCallback, useMemo } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import RestaurantCard from "@/components/UI/RestaurantCard";
import DishCard from "@/components/UI/DishCard";
import ListCard from "../Lists/ListCard";
import useAppStore from "@/hooks/useAppStore";

const Results = React.memo(
  ({ 
    trendingItems = [], 
    trendingDishes = [], 
    popularLists = [], 
    expandedSections, 
    setExpandedSections, 
    searchQuery
  }) => {
    const activeFilters = useAppStore((state) => state.activeFilters || { city: null, neighborhood: null, tags: [] });
    const clearFilters = useAppStore((state) => state.clearFilters);

    const applyFilters = useCallback((items = []) => {
      if (!items || !Array.isArray(items)) return [];
      
      return items.filter((item) => {
        if (!item) return false;
        
        const city = item.city || "";
        const neighborhood = item.neighborhood || "";
        const tags = Array.isArray(item.tags) ? item.tags : [];
        const name = item.name || "";
        const restaurant = item.restaurant || "";

        if (activeFilters.city && city !== activeFilters.city) {
          return false;
        }

        if (activeFilters.neighborhood) {
          if (activeFilters.neighborhood === "Manhattan") {
            const manhattanNeighborhoods = [
              "Greenwich Village", "Midtown", "Lower East Side", "SoHo", "Upper West Side",
            ];
            if (!manhattanNeighborhoods.includes(neighborhood)) {
              return false;
            }
          } else if (neighborhood !== activeFilters.neighborhood) {
            return false;
          }
        }

        if (activeFilters.tags && activeFilters.tags.length > 0) {
          const hasMatchingTag = activeFilters.tags.some((tag) =>
            tags.some((itemTag) => String(itemTag).toLowerCase() === String(tag).toLowerCase())
          );
          if (!hasMatchingTag) {
            return false;
          }
        }

        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          const nameMatch = name.toLowerCase().includes(query);
          const cityMatch = city.toLowerCase().includes(query);
          const neighborhoodMatch = neighborhood.toLowerCase().includes(query);
          const tagsMatch = tags.some((tag) => String(tag).toLowerCase().includes(query));
          const restaurantMatch = restaurant.toLowerCase().includes(query);
          if (!(nameMatch || cityMatch || neighborhoodMatch || tagsMatch || restaurantMatch)) {
            return false;
          }
        }

        return true;
      });
    }, [activeFilters, searchQuery]);

    const filteredRestaurants = useMemo(() => applyFilters(trendingItems), [applyFilters, trendingItems]);
    const filteredDishes = useMemo(() => applyFilters(trendingDishes), [applyFilters, trendingDishes]);
    const filteredLists = useMemo(() => applyFilters(popularLists), [applyFilters, popularLists]);

    const toggleSectionExpansion = useCallback((section) => {
      setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
    }, [setExpandedSections]);

    const renderSection = useCallback((title, items, renderItem, sectionKey) => {
      if (!items || items.length === 0) return null;
      
      const isExpanded = expandedSections[sectionKey];
      
      return (
        <section className="mb-12">
          <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-2">
            <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
            <button
              onClick={() => toggleSectionExpansion(sectionKey)}
              className="flex items-center text-gray-500 hover:text-primary font-medium"
            >
              {isExpanded ? "Collapse" : "Expand"}
              {isExpanded ? <ChevronUp size={16} className="ml-2" /> : <ChevronDown size={16} className="ml-2" />}
            </button>
          </div>
          {isExpanded ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {items.map((item, index) => (
                <div key={item?.id || `${item?.name || 'item'}-${index}`}>
                  {renderItem(item, index)}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex overflow-x-auto space-x-6 no-scrollbar">
              {items.map((item, index) => (
                <div key={item?.id || `${item?.name || 'item'}-${index}`} className="flex-shrink-0">
                  {renderItem(item, index)}
                </div>
              ))}
            </div>
          )}
        </section>
      );
    }, [expandedSections, toggleSectionExpansion]);

    return (
      <>
        {renderSection(
          "Trending Dishes",
          filteredDishes,
          (dish) => <DishCard {...dish} />,
          "dishes"
        )}
        
        {renderSection(
          "Trending Restaurants",
          filteredRestaurants,
          (restaurant) => <RestaurantCard {...restaurant} />,
          "restaurants"
        )}
        
        {renderSection(
          "Popular Lists",
          filteredLists,
          (list) => <ListCard {...list} isFollowing={list.isFollowing || false} />,
          "lists"
        )}
        
        {filteredRestaurants.length === 0 && 
         filteredDishes.length === 0 && 
         filteredLists.length === 0 && (
          <div className="text-center py-12 bg-white border border-gray-200 rounded-lg shadow-sm">
            <h3 className="text-xl font-medium text-gray-700 mb-2">No results found</h3>
            <p className="text-gray-500 mb-4">Try adjusting your filters or search query</p>
            <button
              onClick={clearFilters}
              className="px-4 py-2 border border-primary text-primary rounded-lg font-medium hover:bg-primary hover:text-white"
            >
              Clear all filters
            </button>
          </div>
        )}
      </>
    );
  }
);

export default Results;