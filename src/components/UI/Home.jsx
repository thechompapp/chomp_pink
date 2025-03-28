import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import useAppStore from '../../hooks/useAppStore';
import FilterSection from './FilterSection';
import RestaurantCard from './RestaurantCard';
import DishCard from './DishCard';
import ListCard from './ListCard';

const Home = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFilter, setExpandedFilter] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    dishes: false,
    restaurants: false,
    lists: false
  });
  
  // Get data and filters from store
  const trendingItems = useAppStore((state) => state.trendingItems);
  const setTrendingItems = useAppStore((state) => state.setTrendingItems);
  const activeFilters = useAppStore((state) => state.activeFilters || { city: null, neighborhood: null, tags: [] });
  const setSearchQuery_store = useAppStore((state) => state.setSearchQuery || (() => {}));

  // Sample data for trending dishes and popular lists
  const [trendingDishes, setTrendingDishes] = useState([]);
  const [popularLists, setPopularLists] = useState([]);
  
  // Refs for scroll containers
  const dishesRef = useRef(null);
  const restaurantsRef = useRef(null);
  const listsRef = useRef(null);

  useEffect(() => {
    // Simulate fetching data
    const fetchAllData = async () => {
      // Sample restaurants
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
      
      // Sample dishes
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
      
      // Sample popular lists
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
    setSearchQuery(query);
    if (setSearchQuery_store) setSearchQuery_store(query);
  };

  // Apply filters to all data
  const applyFilters = (items) => {
    return items.filter(item => {
      // Apply city filter
      if (activeFilters.city && item.city !== activeFilters.city) {
        return false;
      }
      
      // Apply neighborhood filter
      if (activeFilters.neighborhood && item.neighborhood !== activeFilters.neighborhood) {
        return false;
      }
      
      // Apply tags filter
      if (activeFilters.tags && activeFilters.tags.length > 0) {
        // Item must have at least one of the selected tags
        if (!item.tags || !item.tags.some(tag => activeFilters.tags.includes(tag))) {
          return false;
        }
      }
      
      // Apply search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const nameMatch = item.name.toLowerCase().includes(query);
        const cityMatch = item.city && item.city.toLowerCase().includes(query);
        const neighborhoodMatch = item.neighborhood && item.neighborhood.toLowerCase().includes(query);
        const tagsMatch = item.tags && item.tags.some(tag => tag.toLowerCase().includes(query));
        const restaurantMatch = item.restaurant && item.restaurant.toLowerCase().includes(query);
        
        if (!(nameMatch || cityMatch || neighborhoodMatch || tagsMatch || restaurantMatch)) {
          return false;
        }
      }
      
      return true;
    });
  };

  // Filter all data based on search query and active filters
  const filteredRestaurants = applyFilters(trendingItems);
  const filteredDishes = applyFilters(trendingDishes);
  const filteredLists = applyFilters(popularLists);

  // Toggle section expansion
  const toggleSectionExpansion = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Render horizontal scrolling section or expanded grid
  const renderSection = (title, items, renderItem, sectionKey, sectionRef) => {
    if (items.length === 0) return null;
    
    const isExpanded = expandedSections[sectionKey];
    
    return (
      <section className="mb-12">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">{title}</h2>
          <button 
            onClick={() => toggleSectionExpansion(sectionKey)}
            className="flex items-center text-gray-500 hover:text-black"
          >
            {isExpanded ? 'Collapse' : 'Expand'}
            {isExpanded ? <ChevronUp size={16} className="ml-1" /> : <ChevronDown size={16} className="ml-1" />}
          </button>
        </div>
        
        {isExpanded ? (
          // Expanded grid view
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((item, index) => renderItem(item, index))}
          </div>
        ) : (
          // Horizontal scrolling view
          <div 
            ref={sectionRef}
            className="flex overflow-x-auto pb-4 space-x-4 no-scrollbar"
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
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Hero section with search */}
      <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-200 shadow-sm">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Discover Great Places</h1>
        <p className="text-gray-600 text-lg mb-6">Find the best restaurants, dishes, and curated lists</p>
        
        <div className="relative">
          <input
            type="text"
            placeholder="Search for restaurants, dishes, or cuisines..."
            className="w-full py-3 px-5 pr-12 rounded-full border border-gray-300 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
            onChange={(e) => handleSearch(e.target.value)}
            value={searchQuery}
          />
          <Search className="absolute right-4 top-3.5 text-gray-500" size={20} />
        </div>
      </div>
      
      {/* Toggle filter section */}
      <div>
        <button 
          onClick={() => setExpandedFilter(!expandedFilter)}
          className="mb-4 flex items-center text-gray-700 font-medium hover:text-black transition-colors"
        >
          <span>Filters</span>
          <ChevronRight className={`ml-1 transition-transform ${expandedFilter ? 'rotate-90' : ''}`} size={18} />
        </button>
        
        {/* Collapsible filter section */}
        {expandedFilter && <FilterSection />}
      </div>
      
      {/* Trending Dishes Section */}
      {renderSection(
        "Trending Dishes", 
        filteredDishes, 
        (dish, index) => <DishCard key={`${dish.name}-${index}`} {...dish} />,
        "dishes",
        dishesRef
      )}
      
      {/* Trending Restaurants Section */}
      {renderSection(
        "Trending Restaurants", 
        filteredRestaurants, 
        (restaurant, index) => <RestaurantCard key={`${restaurant.name}-${index}`} {...restaurant} />,
        "restaurants",
        restaurantsRef
      )}
      
      {/* Popular Lists Section */}
      {renderSection(
        "Popular Lists", 
        filteredLists, 
        (list) => <ListCard key={list.id} {...list} />,
        "lists",
        listsRef
      )}
      
      {/* No results message */}
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
            className="mt-4 px-4 py-2 border border-black text-black hover:bg-black hover:text-white rounded-lg transition-colors"
          >
            Clear all filters
          </button>
        </div>
      )}
      
      {/* Add CSS for hiding scrollbars */}
      <style jsx>{`
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