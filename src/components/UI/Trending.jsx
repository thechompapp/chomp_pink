import React, { useState, useEffect } from "react";
import { TrendingUp, SortAsc, SortDesc, Map } from "lucide-react";
import useAppStore from "../../hooks/useAppStore";
import FilterSection from "./FilterSection";
import RestaurantCard from "./RestaurantCard";
import DishCard from "./DishCard";
import ListCard from "./ListCard";

const Trending = () => {
  const [activeTab, setActiveTab] = useState("restaurants");
  const [sortMethod, setSortMethod] = useState("popular");
  const [trendingData, setTrendingData] = useState({ restaurants: [], dishes: [], lists: [] });
  
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
      
      // Sample lists
      const listData = [
        { id: 101, name: "NYC Pizza Tour", itemCount: 8, savedCount: 245, isPublic: true, city: 'New York', tags: ['pizza', 'italian'], trending: 95 },
        { id: 102, name: "Best Burgers in Manhattan", itemCount: 12, savedCount: 187, isPublic: true, city: 'New York', tags: ['burgers', 'beef'], trending: 88 },
        { id: 103, name: "Late Night Eats", itemCount: 5, savedCount: 92, isPublic: true, city: 'Los Angeles', tags: ['late-night', 'casual'], trending: 82 },
        { id: 104, name: "Michelin Star Experience", itemCount: 7, savedCount: 156, isPublic: true, city: 'Chicago', tags: ['fine-dining', 'upscale'], trending: 91 },
        { id: 105, name: "Budget-Friendly Bites", itemCount: 15, savedCount: 201, isPublic: true, city: 'New York', tags: ['cheap-eats', 'casual'], trending: 89 },
        { id: 106, name: "Date Night Spots", itemCount: 10, savedCount: 172, isPublic: true, city: 'Miami', tags: ['romantic', 'dinner'], trending: 86 },
        { id: 107, name: "Hidden Gems of Chicago", itemCount: 9, savedCount: 134, isPublic: true, city: 'Chicago', tags: ['local', 'unique'], trending: 84 },
        { id: 108, name: "LA's Best Tacos", itemCount: 14, savedCount: 287, isPublic: true, city: 'Los Angeles', tags: ['tacos', 'mexican'], trending: 93 }
      ];
      
      setTrendingData({ 
        restaurants: restaurantData, 
        dishes: dishData,
        lists: listData 
      });
    };

    fetchTrendingData();
  }, []);

  // Apply filters to data
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

  // Apply sorting to data
  const sortData = (items) => {
    switch (sortMethod) {
      case 'a-z':
        return [...items].sort((a, b) => a.name.localeCompare(b.name));
      case 'z-a':
        return [...items].sort((a, b) => b.name.localeCompare(a.name));
      case 'distance':
        // In a real app, this would use geolocation to sort by distance
        return items;
      case 'popular':
      default:
        return [...items].sort((a, b) => b.trending - a.trending);
    }
  };

  // Get filtered and sorted data for current tab
  const getActiveData = () => {
    const tabData = {
      restaurants: trendingData.restaurants,
      dishes: trendingData.dishes,
      lists: trendingData.lists
    }[activeTab] || [];
    
    // Apply filters and sorting
    return sortData(applyFilters(tabData));
  };

  const activeData = getActiveData();

  return (
    <div className="space-y-8 mx-auto px-4 sm:px-6 md:px-8 max-w-7xl">
      {/* Header with title */}
      <div className="pt-4 md:pt-6">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp size={28} className="text-[#D1B399]" />
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Trending Now</h1>
        </div>
      </div>

      {/* Filters - always visible */}
      <FilterSection />
      
      {/* Tab selector and sort options */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
          {/* Content type tabs */}
          <div className="flex justify-center">
            <div className="inline-flex rounded-md border border-[#D1B399] p-1">
              <button
                onClick={() => setActiveTab("restaurants")}
                className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
                  activeTab === "restaurants"
                    ? "bg-[#D1B399] text-white"
                    : "text-[#D1B399] hover:bg-[#D1B399]/10"
                }`}
              >
                Restaurants
              </button>
              <button
                onClick={() => setActiveTab("dishes")}
                className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
                  activeTab === "dishes"
                    ? "bg-[#D1B399] text-white"
                    : "text-[#D1B399] hover:bg-[#D1B399]/10"
                }`}
              >
                Dishes
              </button>
              <button
                onClick={() => setActiveTab("lists")}
                className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
                  activeTab === "lists"
                    ? "bg-[#D1B399] text-white"
                    : "text-[#D1B399] hover:bg-[#D1B399]/10"
                }`}
              >
                Lists
              </button>
            </div>
          </div>
          
          {/* Sort options - smaller text */}
          <div className="flex flex-wrap justify-center gap-2">
            <button
              onClick={() => setSortMethod("popular")}
              className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
                sortMethod === "popular"
                  ? "bg-[#D1B399] text-white border-[#D1B399]"
                  : "text-gray-700 border-gray-300 hover:border-[#D1B399] hover:text-[#D1B399]"
              }`}
            >
              Popular
            </button>
            <button
              onClick={() => setSortMethod("a-z")}
              className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors flex items-center ${
                sortMethod === "a-z"
                  ? "bg-[#D1B399] text-white border-[#D1B399]"
                  : "text-gray-700 border-gray-300 hover:border-[#D1B399] hover:text-[#D1B399]"
              }`}
            >
              <SortAsc size={12} className="mr-1" />A-Z
            </button>
            <button
              onClick={() => setSortMethod("z-a")}
              className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors flex items-center ${
                sortMethod === "z-a"
                  ? "bg-[#D1B399] text-white border-[#D1B399]"
                  : "text-gray-700 border-gray-300 hover:border-[#D1B399] hover:text-[#D1B399]"
              }`}
            >
              <SortDesc size={12} className="mr-1" />Z-A
            </button>
            <button
              onClick={() => setSortMethod("distance")}
              className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors flex items-center ${
                sortMethod === "distance"
                  ? "bg-[#D1B399] text-white border-[#D1B399]"
                  : "text-gray-700 border-gray-300 hover:border-[#D1B399] hover:text-[#D1B399]"
              }`}
            >
              <Map size={12} className="mr-1" />Distance
            </button>
          </div>
        </div>
      </div>
      
      {/* Results section - always in vertical grid */}
      <div className="mt-6">
        {activeData.length === 0 ? (
          <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
            <h3 className="text-xl font-medium text-gray-700 mb-2">No results found</h3>
            <p className="text-gray-500">Try adjusting your filters or search criteria</p>
          </div>
        ) : (
          // Vertical grid view with centered cards on mobile
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 place-items-center">
            {activeData.map((item, index) => {
              if (activeTab === "restaurants") {
                return <RestaurantCard key={`restaurant-${index}`} {...item} />;
              } else if (activeTab === "dishes") {
                return <DishCard key={`dish-${index}`} {...item} />;
              } else {
                return <ListCard key={`list-${item.id}`} {...item} />;
              }
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Trending;