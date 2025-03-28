import React, { useState, useEffect } from "react";
import Button from "../UI/Button";
import RestaurantCard from "../UI/RestaurantCard";
import DishCard from "../UI/DishCard";
import FilterSection from "../UI/FilterSection";
import { TrendingUp, ArrowUpRight, ChevronDown } from "lucide-react";
import useAppStore from "../../hooks/useAppStore";

const Trending = () => {
  const [activeTab, setActiveTab] = useState("restaurants");
  const [expandedFilter, setExpandedFilter] = useState(false);
  const [sortMethod, setSortMethod] = useState("popular");
  const [trendingData, setTrendingData] = useState({ restaurants: [], dishes: [] });
  const [showSortOptions, setShowSortOptions] = useState(false);
  
  // Get filters from store
  const activeFilters = useAppStore((state) => state.activeFilters || { city: null, neighborhood: null, tags: [] });
  const searchQuery = useAppStore((state) => state.searchQuery || '');

  useEffect(() => {
    // Simulate fetching data
    const fetchTrendingData = async () => {
      // Sample restaurants
      const restaurantData = [
        { name: "Joe's Pizza", neighborhood: 'Greenwich Village', city: 'New York', tags: ['pizza', 'italian'], trending: 95 },
        { name: "Shake Shack", neighborhood: 'Midtown', city: 'New York', tags: ['burgers', 'fast-food'], trending: 92 },
        { name: "Katz's Delicatessen", neighborhood: 'Lower East Side', city: 'New York', tags: ['deli', 'sandwiches'], trending: 88 },
        { name: "Blue Ribbon Sushi", neighborhood: 'SoHo', city: 'New York', tags: ['sushi', 'japanese'], trending: 85 },
        { name: "The Halal Guys", neighborhood: 'Upper West Side', city: 'New York', tags: ['middle-eastern', 'street-food'], trending: 82 },
        { name: "In-N-Out Burger", neighborhood: 'Hollywood', city: 'Los Angeles', tags: ['burgers', 'fast-food'], trending: 94 },
        { name: "Pizzeria Mozza", neighborhood: 'Hollywood', city: 'Los Angeles', tags: ['pizza', 'italian'], trending: 87 },
        { name: "Gjelina", neighborhood: 'Venice', city: 'Los Angeles', tags: ['american', 'vegetarian'], trending: 83 },
        { name: "Grand Central Market", neighborhood: 'Downtown', city: 'Los Angeles', tags: ['food-hall', 'variety'], trending: 81 },
        { name: "Au Cheval", neighborhood: 'Loop', city: 'Chicago', tags: ['burgers', 'american'], trending: 90 },
        { name: "Lou Malnati's", neighborhood: 'River North', city: 'Chicago', tags: ['pizza', 'deep-dish'], trending: 86 },
        { name: "Girl & The Goat", neighborhood: 'West Loop', city: 'Chicago', tags: ['american', 'small-plates'], trending: 89 },
        { name: "Joe's Stone Crab", neighborhood: 'South Beach', city: 'Miami', tags: ['seafood', 'upscale'], trending: 91 }
      ];
      
      // Sample dishes
      const dishData = [
        { name: "Margherita Pizza", restaurant: "Joe's Pizza", tags: ['pizza', 'vegetarian'], city: 'New York', neighborhood: 'Greenwich Village', trending: 96 },
        { name: "ShackBurger", restaurant: "Shake Shack", tags: ['burger', 'beef'], city: 'New York', neighborhood: 'Midtown', trending: 93 },
        { name: "Pastrami Sandwich", restaurant: "Katz's Delicatessen", tags: ['sandwich', 'meat'], city: 'New York', neighborhood: 'Lower East Side', trending: 89 },
        { name: "Dragon Roll", restaurant: "Blue Ribbon Sushi", tags: ['sushi', 'spicy'], city: 'New York', neighborhood: 'SoHo', trending: 84 },
        { name: "Chicken Over Rice", restaurant: "The Halal Guys", tags: ['halal', 'chicken'], city: 'New York', neighborhood: 'Upper West Side', trending: 88 },
        { name: "Double-Double", restaurant: "In-N-Out Burger", tags: ['burger', 'beef'], city: 'Los Angeles', neighborhood: 'Hollywood', trending: 97 },
        { name: "Butterscotch Budino", restaurant: "Pizzeria Mozza", tags: ['dessert', 'italian'], city: 'Los Angeles', neighborhood: 'Hollywood', trending: 85 },
        { name: "Braised Short Ribs", restaurant: "Gjelina", tags: ['meat', 'dinner'], city: 'Los Angeles', neighborhood: 'Venice', trending: 83 },
        { name: "Chicago-style Hot Dog", restaurant: "Portillo's", tags: ['hot-dog', 'beef'], city: 'Chicago', neighborhood: 'River North', trending: 92 },
        { name: "Deep Dish Pizza", restaurant: "Lou Malnati's", tags: ['pizza', 'cheese'], city: 'Chicago', neighborhood: 'River North', trending: 94 },
        { name: "Goat Empanadas", restaurant: "Girl & The Goat", tags: ['small-plates', 'fusion'], city: 'Chicago', neighborhood: 'West Loop', trending: 86 },
        { name: "Stone Crab Claws", restaurant: "Joe's Stone Crab", tags: ['seafood', 'signature'], city: 'Miami', neighborhood: 'South Beach', trending: 90 }
      ];
      
      setTrendingData({ restaurants: restaurantData, dishes: dishData });
    };

    fetchTrendingData();
  }, []);

  // Filter data based on active filters and search query
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

  // Apply sorting
  const sortData = (items) => {
    switch (sortMethod) {
      case 'popular':
        return [...items].sort((a, b) => b.trending - a.trending);
      case 'alphabetical':
        return [...items].sort((a, b) => a.name.localeCompare(b.name));
      case 'nearest':
        // In a real app, this would use geolocation
        return items;
      default:
        return items;
    }
  };

  const filteredRestaurants = sortData(applyFilters(trendingData.restaurants));
  const filteredDishes = sortData(applyFilters(trendingData.dishes));

  const activeData = activeTab === "restaurants" ? filteredRestaurants : filteredDishes;
  
  const sortOptions = [
    { id: 'popular', label: 'Most Popular' },
    { id: 'alphabetical', label: 'Alphabetical' },
    { id: 'nearest', label: 'Nearest to Me' }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <TrendingUp size={24} className="text-pink-500" />
          <h1 className="text-3xl font-bold text-gray-800">Trending Now</h1>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Tab selector */}
          <div className="bg-gray-100 rounded-lg p-1 flex">
            <button
              onClick={() => setActiveTab("restaurants")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === "restaurants"
                  ? "bg-white shadow text-pink-500"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Restaurants
            </button>
            <button
              onClick={() => setActiveTab("dishes")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === "dishes"
                  ? "bg-white shadow text-pink-500"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Dishes
            </button>
          </div>
          
          {/* Sort dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSortOptions(!showSortOptions)}
              className="flex items-center px-3 py-2 text-sm font-medium bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Sort: {sortOptions.find(opt => opt.id === sortMethod)?.label}
              <ChevronDown size={16} className="ml-1" />
            </button>
            
            {showSortOptions && (
              <div className="absolute right-0 mt-1 bg-white rounded-lg shadow-lg py-1 z-10 min-w-[160px]">
                {sortOptions.map(option => (
                  <button
                    key={option.id}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                      sortMethod === option.id
                        ? 'text-pink-500 bg-pink-50'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={() => {
                      setSortMethod(option.id);
                      setShowSortOptions(false);
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filter toggle */}
      <div>
        <Button 
          variant="secondary"
          size="sm"
          onClick={() => setExpandedFilter(!expandedFilter)}
          className="mb-4"
        >
          {expandedFilter ? "Hide Filters" : "Show Filters"}
        </Button>
        
        {/* Collapsible filter section */}
        {expandedFilter && <FilterSection />}
      </div>

      {/* No results message */}
      {activeData.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm">
          <h3 className="text-xl font-medium text-gray-700 mb-2">No trending {activeTab} found</h3>
          <p className="text-gray-500 mb-4">Try adjusting your filters or search criteria</p>
          <Button 
            onClick={() => {
              const clearFilters = useAppStore.getState().clearFilters;
              if (clearFilters) clearFilters();
            }}
            variant="primary"
          >
            Clear all filters
          </Button>
        </div>
      )}

      {/* Results grid */}
      {activeData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeTab === "restaurants" ? (
            // Restaurant cards
            activeData.map((restaurant, index) => (
              <div key={`${restaurant.name}-${index}`} className="relative">
                <div className="absolute top-3 right-3 z-10 bg-pink-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center">
                  <TrendingUp size={12} className="mr-1" />
                  {restaurant.trending}
                </div>
                <RestaurantCard {...restaurant} />
              </div>
            ))
          ) : (
            // Dish cards
            activeData.map((dish, index) => (
              <div key={`${dish.name}-${index}`} className="relative">
                <div className="absolute top-3 right-3 z-10 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center">
                  <TrendingUp size={12} className="mr-1" />
                  {dish.trending}
                </div>
                <DishCard {...dish} />
              </div>
            ))
          )}
        </div>
      )}
      
      {/* View more button */}
      {activeData.length > 12 && (
        <div className="text-center mt-8">
          <Button 
            variant="secondary" 
            size="lg"
            onClick={() => console.log("Load more")}
            className="mx-auto"
          >
            Load more
          </Button>
        </div>
      )}
    </div>
  );
};

export default Trending;