import React, { useState, useRef, useMemo, useCallback } from 'react';
import { Search, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import useAppStore from '../../hooks/useAppStore';
import FilterSection from './FilterSection';
import RestaurantCard from './RestaurantCard';
import DishCard from './DishCard';
import ListCard from './ListCard';
import doofLogo from '../../assets/doof.svg';
import { shallow } from 'zustand/shallow';

const Home = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFilter, setExpandedFilter] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    dishes: false,
    restaurants: false,
    lists: false
  });

  const { trendingItems, trendingDishes, popularLists, activeFilters } = useAppStore(
    state => ({
      trendingItems: state.trendingItems,
      trendingDishes: state.trendingDishes,
      popularLists: state.popularLists,
      activeFilters: state.activeFilters || { city: null, neighborhood: null, tags: [] }
    }),
    shallow
  );

  const dishesRef = useRef(null);
  const restaurantsRef = useRef(null);
  const listsRef = useRef(null);

  const handleSearch = useCallback((query) => {
    console.log('handleSearch called with query:', query);
    setSearchQuery(query);
  }, []);

  const applyFilters = useCallback((items) => {
    console.log('Applying filters - Active Filters:', JSON.stringify(activeFilters), 'Search Query:', searchQuery);
    return items.filter(item => {
      if (activeFilters.city && item.city !== activeFilters.city) return false;
      if (activeFilters.neighborhood) {
        if (activeFilters.neighborhood === "Manhattan") {
          const manhattanNeighborhoods = [
            'Greenwich Village',
            'Midtown',
            'Lower East Side',
            'SoHo',
            'Upper West Side'
          ];
          if (!manhattanNeighborhoods.includes(item.neighborhood)) return false;
        } else if (item.neighborhood !== activeFilters.neighborhood) {
          return false;
        }
      }
      if (activeFilters.tags && activeFilters.tags.length > 0) {
        if (!item.tags || !Array.isArray(item.tags)) return false;
        for (const tag of activeFilters.tags) {
          if (!item.tags.some(itemTag => itemTag.toLowerCase() === tag.toLowerCase())) return false;
        }
      }
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const nameMatch = item.name.toLowerCase().includes(query);
        const cityMatch = item.city && item.city.toLowerCase().includes(query);
        const neighborhoodMatch = item.neighborhood && item.neighborhood.toLowerCase().includes(query);
        const tagsMatch = item.tags && item.tags.some(tag => tag.toLowerCase().includes(query));
        const restaurantMatch = item.restaurant && item.restaurant.toLowerCase().includes(query);
        if (!(nameMatch || cityMatch || neighborhoodMatch || tagsMatch || restaurantMatch)) return false;
      }
      return true;
    });
  }, [activeFilters, searchQuery]);

  const filteredRestaurants = useMemo(() => applyFilters(trendingItems), [trendingItems, applyFilters]);
  const filteredDishes = useMemo(() => applyFilters(trendingDishes), [trendingDishes, applyFilters]);
  const filteredLists = useMemo(() => applyFilters(popularLists), [popularLists, applyFilters]);

  const toggleSectionExpansion = useCallback((section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  }, []);

  const renderDishItem = useCallback((dish, index) => (
    <DishCard key={`${dish.name}-${index}`} {...dish} />
  ), []);

  const renderRestaurantItem = useCallback((restaurant, index) => (
    <RestaurantCard key={`${restaurant.name}-${index}`} {...restaurant} />
  ), []);

  const renderListItem = useCallback((list) => (
    <ListCard key={list.id} {...list} />
  ), []);

  const renderSection = useCallback((title, items, renderItem, sectionKey, sectionRef) => {
    if (items.length === 0) return null;
    const isExpanded = expandedSections[sectionKey];
    console.log(`Rendering ${title} - Items:`, items);
    return (
      <section className="mb-12">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">{title}</h2>
          <button 
            onClick={() => toggleSectionExpansion(sectionKey)}
            className="flex items-center text-gray-500 hover:text-[#D1B399]"
          >
            {isExpanded ? 'Collapse' : 'Expand'}
            {isExpanded ? <ChevronUp size={16} className="ml-1" /> : <ChevronDown size={16} className="ml-1" />}
          </button>
        </div>
        {isExpanded ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {items.map((item, index) => renderItem(item, index))}
          </div>
        ) : (
          <div 
            ref={sectionRef}
            className="flex overflow-x-auto pb-4 space-x-4 no-scrollbar pl-1"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {items.map((item, index) => (
              <div key={index} className="flex-shrink-0">
                {renderItem(item, index)}
              </div>
            ))}
          </div>
        )}
      </section>
    );
  }, [expandedSections, toggleSectionExpansion]);

  const filterSectionComponent = useMemo(() => (
    expandedFilter ? <FilterSection /> : null
  ), [expandedFilter]);

  return (
    <div className="space-y-8 mx-auto px-4 sm:px-6 md:px-8 max-w-7xl">
      <div className="bg-[#D1B399] rounded-2xl p-5 md:p-8 shadow-sm">
        <img src={doofLogo} alt="Doof Logo" className="h-16 w-auto mx-auto mb-4" />
        <h1 className="text-2xl md:text-4xl font-bold text-white mb-3 md:mb-4">Discover Great Places</h1>
        <p className="text-white text-opacity-90 text-base md:text-lg mb-4 md:mb-6">What’s next on your list?</p>
        <div className="relative">
          <input
            type="text"
            placeholder="Search for restaurants, dishes, or cuisines..."
            className="w-full py-2 md:py-3 px-4 md:px-5 pr-10 md:pr-12 rounded-full border border-[#D1B399]/30 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#D1B399] focus:border-[#D1B399]"
            onChange={(e) => handleSearch(e.target.value)}
            value={searchQuery}
          />
          <Search className="absolute right-3 md:right-4 top-2.5 md:top-3.5 text-gray-500" size={20} />
        </div>
      </div>
      <div>
        <button 
          onClick={() => setExpandedFilter(!expandedFilter)}
          className="mb-4 flex items-center text-gray-700 font-medium hover:text-[#D1B399] transition-colors"
        >
          <span>Filters</span>
          <ChevronRight className={`ml-1 transition-transform ${expandedFilter ? 'rotate-90' : ''}`} size={18} />
        </button>
        {filterSectionComponent}
      </div>
      {renderSection("Trending Dishes", filteredDishes, renderDishItem, "dishes", dishesRef)}
      {renderSection("Trending Restaurants", filteredRestaurants, renderRestaurantItem, "restaurants", restaurantsRef)}
      {renderSection("Popular Lists", filteredLists, renderListItem, "lists", listsRef)}
      {filteredRestaurants.length === 0 && filteredDishes.length === 0 && filteredLists.length === 0 && (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
          <h3 className="text-xl font-medium text-gray-700 mb-2">No results found</h3>
          <p className="text-gray-500">Try adjusting your filters or search query</p>
          <button 
            onClick={() => {
              const clearFilters = useAppStore.getState().clearFilters;
              if (clearFilters) clearFilters();
              setSearchQuery('');
              setExpandedFilter(true);
            }}
            className="mt-4 px-4 py-2 border border-[#D1B399] text-[#D1B399] hover:bg-[#D1B399] hover:text-white rounded-lg transition-colors"
          >
            Clear all filters
          </button>
        </div>
      )}
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default Home;