// src/pages/Home/Results.jsx
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
    const activeFilters = useAppStore((state) => state.activeFilters || { city: null, neighborhood: null, tags: [] });
    const clearFilters = useAppStore((state) => state.clearFilters || (() => {}));

    const applyFilters = useCallback((items = []) => {
      if (!Array.isArray(items)) return [];
      return items.filter((item) => {
        if (!item) return false;
        const city = item.city || "";
        const neighborhood = item.neighborhood || "";
        const tags = Array.isArray(item.tags) ? item.tags : [];
        const name = item.name || "";
        const restaurant = item.restaurant || item.restaurant_name || "";

        if (activeFilters.city && city !== activeFilters.city) return false;
        if (activeFilters.neighborhood) {
          if (activeFilters.neighborhood === "Manhattan" && !["Greenwich Village", "Midtown", "Lower East Side", "SoHo", "Upper West Side"].includes(neighborhood)) return false;
          else if (activeFilters.neighborhood !== "Manhattan" && neighborhood !== activeFilters.neighborhood) return false;
        }
        if (activeFilters.tags?.length > 0) {
          if (!tags.some(t => activeFilters.tags.some(ft => String(t).toLowerCase() === String(ft).toLowerCase()))) return false;
        }
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          if (!(name.toLowerCase().includes(query) || city.toLowerCase().includes(query) || neighborhood.toLowerCase().includes(query) || tags.some(t => String(t).toLowerCase().includes(query)) || restaurant.toLowerCase().includes(query))) return false;
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
      const filteredItems = applyFilters(items);
      if (!Array.isArray(filteredItems) || filteredItems.length === 0) {
        return (
          <section className="mb-12">
            <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-2">
              <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
            </div>
            <p className="text-gray-500 text-center py-4">No {title.toLowerCase()} available.</p>
          </section>
        );
      }
      const isExpanded = expandedSections[sectionKey];
      return (
        <section className="mb-12">
          <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-2">
            <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
            <button
              onClick={() => toggleSectionExpansion(sectionKey)}
              className="flex items-center text-gray-500 hover:text-[#D1B399] font-medium text-sm"
            >
              {isExpanded ? "Collapse" : "Expand"}
              {isExpanded ? <ChevronUp size={16} className="ml-1" /> : <ChevronDown size={16} className="ml-1" />}
            </button>
          </div>
          {isExpanded ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 place-items-start">
              {filteredItems.map((item, index) => (
                <div key={item?.id || `${title}-${index}`}>
                  {renderItem(item, index)}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex overflow-x-auto space-x-6 pb-4 no-scrollbar">
              {filteredItems.map((item, index) => (
                <div key={item?.id || `${title}-${index}`} className="flex-shrink-0">
                  {renderItem(item, index)}
                </div>
              ))}
            </div>
          )}
        </section>
      );
    }, [expandedSections, toggleSectionExpansion, applyFilters]);

    const hasData = trendingItems.length > 0 || trendingDishes.length > 0 || popularLists.length > 0;
    const hasFilteredData = filteredRestaurants.length > 0 || filteredDishes.length > 0 || filteredLists.length > 0;

    return (
      <>
        {renderSection(
          "Trending Dishes",
          trendingDishes,
          (dish) => <DishCard {...dish} restaurant={dish.restaurant_name || dish.restaurant} />,
          "dishes"
        )}
        {renderSection(
          "Trending Restaurants",
          trendingItems,
          (restaurant) => <RestaurantCard {...restaurant} />,
          "restaurants"
        )}
        {renderSection(
          "Popular Lists",
          popularLists,
          (list) => <ListCard {...list} isFollowing={list.is_following} canFollow={true} />,
          "lists"
        )}

        {!hasFilteredData && hasData && (
          <div className="text-center py-12 bg-white border border-gray-200 rounded-lg shadow-sm">
            <h3 className="text-xl font-medium text-gray-700 mb-2">No results match your filters</h3>
            <p className="text-gray-500 mb-4">Try adjusting your filters or search query.</p>
            <Button
              onClick={clearFilters}
              variant="tertiary"
              className="px-4 py-2 border-[#D1B399] text-[#D1B399] hover:bg-[#D1B399]/10"
            >
              Clear all filters
            </Button>
          </div>
        )}

        {!hasData && (
          <div className="text-center py-12 bg-white border border-gray-200 rounded-lg shadow-sm">
            <h3 className="text-xl font-medium text-gray-700 mb-2">No Trending Items</h3>
            <p className="text-gray-500">There's currently no trending data available from the database.</p>
          </div>
        )}
      </>
    );
  }
);

export default Results;