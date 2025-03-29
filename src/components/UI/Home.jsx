import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import useAppStore from '../../hooks/useAppStore';
import FilterSection from './FilterSection';
import RestaurantCard from './RestaurantCard';
import DishCard from './DishCard';
import ListCard from './ListCard';
import doofLogo from '../../assets/doof.svg';

const Home = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFilter, setExpandedFilter] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    dishes: false,
    restaurants: false,
    lists: false
  });
  
  const trendingItems = useAppStore((state) => state.trendingItems);
  const setTrendingItems = useAppStore((state) => state.setTrendingItems);
  const activeFilters = useAppStore((state) => state.activeFilters || { city: null, neighborhood: null, tags: [] });
  const setSearchQuery_store = useAppStore((state) => state.setSearchQuery || (() => {}));

  const [trendingDishes, setTrendingDishes] = useState([]);
  const [popularLists, setPopularLists] = useState([]);
  
  const dishesRef = useRef(null);
  const restaurantsRef = useRef(null);
  const listsRef = useRef(null);

  useEffect(() => {
    console.log('activeFilters updated:', JSON.stringify(activeFilters));
  }, [activeFilters]);

  useEffect(() => {
    const fetchAllData = async () => {
      const restaurantData = [
        { name: "Joe's Pizza", neighborhood: 'Greenwich Village', city: 'New York', tags: ['pizza', 'italian'] },
        { name: "Shake Shack", neighborhood: 'Midtown', city: 'New York', tags: ['burgers', 'fast-food'] },
        { name: "Katz's Delicatessen", neighborhood: 'Lower East Side', city: 'New York', tags: ['deli', 'sandwiches'] },
        { name: "Blue Ribbon Sushi", neighborhood: 'SoHo', city: 'New York', tags: ['sushi', 'japanese'] },
        { name: "The Halal Guys", neighborhood: 'Upper West Side', city: 'New York', tags: ['middle-eastern', 'street-food'] },
        { name: "In-N-Out Burger", neighborhood: 'Hollywood', city: 'Los Angeles', tags: ['burgers', 'fast-food'] },
        { name: "Pizzeria Mozza", neighborhood: 'Hollywood', city: 'Los Angeles', tags: ['pizza', 'italian'] },
        { name: "Gjelina", neighborhood: 'Venice', city: 'Los Angeles', tags: ['american', 'vegetarian'] },
        { name: "Grand Central Market", neighborhood: 'Downtown', city: 'Los Angeles', tags: ['food-hall', 'variety'] },
        { name: "Au Cheval", neighborhood: 'Loop', city: 'Chicago', tags: ['burgers', 'american'] },
        { name: "Lou Malnati's", neighborhood: 'River North', city: 'Chicago', tags: ['pizza', 'deep-dish'] },
        { name: "Joe's Stone Crab", neighborhood: 'South Beach', city: 'Miami', tags: ['seafood', 'upscale'] }
      ];
      
      const dishData = [
        { name: "Margherita Pizza", restaurant: "Joe's Pizza", tags: ['pizza', 'vegetarian'], city: 'New York', neighborhood: 'Greenwich Village' },
        { name: "ShackBurger", restaurant: "Shake Shack", tags: ['burger', 'beef'], city: 'New York', neighborhood: 'Midtown' },
        { name: "Pastrami Sandwich", restaurant: "Katz's Delicatessen", tags: ['sandwich', 'meat'], city: 'New York', neighborhood: 'Lower East Side' },
        { name: "Dragon Roll", restaurant: "Blue Ribbon Sushi", tags: ['sushi', 'spicy'], city: 'New York', neighborhood: 'SoHo' },
        { name: "Chicken Over Rice", restaurant: "The Halal Guys", tags: ['halal', 'chicken'], city: 'New York', neighborhood: 'Upper West Side' },
        { name: "Double-Double", restaurant: "In-N-Out Burger", tags: ['burger', 'beef'], city: 'Los Angeles', neighborhood: 'Hollywood' },
        { name: "Butterscotch Budino", restaurant: "Pizzeria Mozza", tags: ['dessert', 'italian'], city: 'Los Angeles', neighborhood: 'Hollywood' },
        { name: "Braised Short Ribs", restaurant: "Gjelina", tags: ['meat', 'dinner'], city: 'Los Angeles', neighborhood: 'Venice' },
        { name: "Chicago-style Hot Dog", restaurant: "Portillo's", tags: ['hot-dog', 'beef'], city: 'Chicago', neighborhood: 'River North' },
        { name: "Deep Dish Pizza", restaurant: "Lou Malnati's", tags: ['pizza', 'cheese'], city: 'Chicago', neighborhood: 'River North' },
        { name: "Stone Crab Claws", restaurant: "Joe's Stone Crab", tags: ['seafood', 'signature'], city: 'Miami', neighborhood: 'South Beach' }
      ];
      
      const listData = [
        { id: 101, name: "NYC Pizza Tour", itemCount: 8, savedCount: 245, isPublic: true, city: 'New York', tags: ['pizza', 'italian'] },
        { id: 102, name: "Best Burgers in Manhattan", itemCount: 12, savedCount: 187, isPublic: true, city: 'New York', tags: ['burgers', 'beef'] },
        { id: 103, name: "Late Night Eats", itemCount: 5, savedCount: 92, isPublic: true, city: 'Los Angeles', tags: ['late-night', 'casual'] },
        { id: 104, name: "Michelin Star Experience", itemCount: 7, savedCount: 156, isPublic: true, city: 'Chicago', tags: ['fine-dining', 'upscale'] },
        { id: 105, name: "Budget-Friendly Bites", itemCount: 15, savedCount: 201, isPublic: true, city: 'New York', tags: ['cheap-eats', 'casual'] },
        { id: 106, name: "Date Night Spots", itemCount: 10, savedCount: 172, isPublic: true, city: 'Miami', tags: ['romantic', 'dinner'] }
      ];
      
      setTrendingItems(restaurantData);
      setTrendingDishes(dishData);
      setPopularLists(listData);
    };

    fetchAllData();
  }, [setTrendingItems]);

  const handleSearch = (query) => {
    console.log('handleSearch called with query:', query);
    setSearchQuery(query);
    if (setSearchQuery_store) setSearchQuery_store(query);
  };

  const applyFilters = (items) => {
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
          // Case-insensitive tag comparison
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
  };

  const filteredRestaurants = applyFilters(trendingItems);
  const filteredDishes = applyFilters(trendingDishes);
  const filteredLists = applyFilters(popularLists);

  const toggleSectionExpansion = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const renderSection = (title, items, renderItem, sectionKey, sectionRef) => {
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
  };

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
        {expandedFilter && <FilterSection />}
      </div>
      {renderSection("Trending Dishes", filteredDishes, (dish, index) => <DishCard key={`${dish.name}-${index}`} {...dish} />, "dishes", dishesRef)}
      {renderSection("Trending Restaurants", filteredRestaurants, (restaurant, index) => <RestaurantCard key={`${restaurant.name}-${index}`} {...restaurant} />, "restaurants", restaurantsRef)}
      {renderSection("Popular Lists", filteredLists, (list) => <ListCard key={list.id} {...list} />, "lists", listsRef)}
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