import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState(null);
  const [activeHashtag, setActiveHashtag] = useState(null);
  const [showPopover, setShowPopover] = useState(null);
  const [showCities, setShowCities] = useState(true);
  const [showNeighborhoods, setShowNeighborhoods] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const popoverRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setShowPopover(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const cities = ["NYC", "LA", "MIA", "SF", "CHI"];
  
  const neighborhoods = {
    NYC: ["Soho", "Brooklyn", "Manhattan", "Queens"],
    LA: ["Hollywood", "Venice", "Downtown", "Santa Monica"],
    MIA: ["Wynwood", "Brickell", "South Beach", "Little Havana"],
    SF: ["Mission", "Chinatown", "Nob Hill", "SoMa"],
    CHI: ["River North", "West Loop", "Lincoln Park", "Wicker Park"]
  };
  
  const hashtags = ["#italian", "#pizza", "#cocktails", "#salads", "#seafood", "#brunch", "#vegan", "#dessert", "#sushi", "#ramen"];
  
  const allItems = [
    { id: 1, name: "Piccola Cucina (0.7m)", type: "Restaurant", tags: ["italian"], city: "NYC", neighborhood: "Soho" },
    { id: 2, name: "Cipriani (0.3m)", type: "Restaurant", tags: ["italian"], city: "NYC", neighborhood: "Soho" },
    { id: 3, name: "Carbone (0.8m)", type: "Restaurant", tags: ["italian"], city: "NYC", neighborhood: "Manhattan" },
    { id: 4, name: "Katz's Deli (1.2m)", type: "Restaurant", tags: ["sandwich"], city: "NYC", neighborhood: "Manhattan" },
    { id: 5, name: "Le Bernardin (0.5m)", type: "Restaurant", tags: ["seafood"], city: "NYC", neighborhood: "Manhattan" },
    { id: 6, name: "Cacio e Pepe at Via Carota (0.4m)", type: "Dish", tags: ["italian", "pasta"], city: "NYC", neighborhood: "Manhattan" },
    { id: 7, name: "Ramen at Ippudo (0.9m)", type: "Dish", tags: ["ramen", "japanese"], city: "NYC", neighborhood: "Manhattan" },
    { id: 8, name: "Pizza at Joe's (0.6m)", type: "Dish", tags: ["pizza"], city: "NYC", neighborhood: "Manhattan" },
    { id: 9, name: "Sushi Omakase at Sushi Nakazawa (1.1m)", type: "Dish", tags: ["sushi", "japanese"], city: "NYC", neighborhood: "Manhattan" },
    { id: 10, name: "Burger at J.G. Melon (0.8m)", type: "Dish", tags: ["burger"], city: "NYC", neighborhood: "Manhattan" },
    { id: 11, name: "Best Italian Spots by @pastafan", type: "List", tags: ["italian"] },
    { id: 12, name: "Late Night Eats by @nycnights", type: "List", tags: ["late-night"] },
    { id: 13, name: "Top Cocktail Bars by @mixology", type: "List", tags: ["cocktails"] },
    { id: 14, name: "Best Desserts by @sweettooth", type: "List", tags: ["dessert"] }
  ];

  const handleQuickAdd = (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    setShowPopover(id);
  };

  const handleCitySelect = (city) => {
    setSelectedCity(city);
    setSelectedNeighborhood(null);
    setActiveHashtag(null);
    setShowCities(false);
    setShowNeighborhoods(true);
    setShowCategories(false);
  };

  const handleNeighborhoodSelect = (neighborhood) => {
    setSelectedNeighborhood(neighborhood);
    setShowNeighborhoods(false);
    setShowCategories(true);
  };

  const handleHashtagSelect = (hashtag) => {
    setActiveHashtag(hashtag);
  };

  const resetFilters = () => {
    setSelectedCity(null);
    setSelectedNeighborhood(null);
    setActiveHashtag(null);
    setShowCities(true);
    setShowNeighborhoods(false);
    setShowCategories(false);
    setSearchQuery('');
  };

  const removeCity = () => {
    setSelectedCity(null);
    setSelectedNeighborhood(null);
    setActiveHashtag(null);
    setShowCities(true);
    setShowNeighborhoods(false);
    setShowCategories(false);
  };

  const removeNeighborhood = () => {
    setSelectedNeighborhood(null);
    setActiveHashtag(null);
    setShowNeighborhoods(true);
    setShowCategories(false);
  };

  const removeHashtag = () => {
    setActiveHashtag(null);
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const getDetailPageUrl = (item) => {
    const itemId = item.id;
    if (item.type === "Restaurant") {
      return `/restaurant/${itemId}`;
    } else if (item.type === "Dish") {
      return `/dish/${itemId}`;
    } else if (item.type === "List") {
      return `/list/${itemId}`;
    }
    return "#";
  };

  const filteredItems = allItems.filter(item => {
    // Search query filter
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      const matchesName = item.name.toLowerCase().includes(query);
      const matchesTags = item.tags && item.tags.some(tag => tag.toLowerCase().includes(query));
      if (!matchesName && !matchesTags) return false;
    }
    
    // Filter by city and neighborhood
    if (selectedCity && item.city && item.city !== selectedCity) return false;
    if (selectedNeighborhood && item.neighborhood && item.neighborhood !== selectedNeighborhood) return false;
    
    // Filter by hashtag/category
    if (activeHashtag) {
      const tagToMatch = activeHashtag.slice(1).toLowerCase();
      return item.tags && item.tags.some(tag => tag.toLowerCase().includes(tagToMatch));
    }
    
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto font-sans text-gray-800">
      {/* App Header */}
      <div className="flex justify-between items-center py-4 px-4 bg-white">
        <div className="text-2xl font-bold text-pink-500">chomp</div>
        <div className="flex items-center space-x-6">
          <Link to="/" className="text-gray-700 hover:text-gray-900">Home</Link>
          <Link to="/trending" className="text-gray-700 hover:text-gray-900">Trending</Link>
          <Link to="/mylists" className="text-gray-700 hover:text-gray-900">My Lists</Link>
          <Link to="/createlist" className="bg-gradient-to-r from-pink-500 to-orange-400 text-white py-2 px-4 rounded-full hover:from-pink-600 hover:to-orange-500 transition">
            Create a List
          </Link>
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-700">
            <span>U</span>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-gray-100 pt-4 px-4">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearch}
            placeholder="Search for restaurants, dishes, or lists..."
            className="w-full px-4 py-3 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          />
          <div className="absolute right-4 top-3 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Filter Path/Breadcrumbs */}
      <div className="bg-gray-100 py-3 px-4 flex items-center">
        <div className="text-sm font-medium text-gray-600 mr-2">Filters:</div>
        <div className="flex flex-wrap gap-2">
          {searchQuery.trim() !== '' && (
            <span className="bg-pink-100 text-pink-800 px-3 py-1 rounded-full text-sm flex items-center">
              "{searchQuery}"
              <button onClick={() => setSearchQuery('')} className="ml-2 text-pink-500 hover:text-pink-700">
                ×
              </button>
            </span>
          )}
          
          {selectedCity ? (
            <span className="bg-pink-100 text-pink-800 px-3 py-1 rounded-full text-sm flex items-center">
              {selectedCity}
              <button onClick={removeCity} className="ml-2 text-pink-500 hover:text-pink-700">
                ×
              </button>
            </span>
          ) : (
            <span className="text-sm text-gray-500">Select a City</span>
          )}
          
          {selectedNeighborhood && (
            <span className="bg-pink-100 text-pink-800 px-3 py-1 rounded-full text-sm flex items-center">
              {selectedNeighborhood}
              <button onClick={removeNeighborhood} className="ml-2 text-pink-500 hover:text-pink-700">
                ×
              </button>
            </span>
          )}
          
          {activeHashtag && (
            <span className="bg-pink-100 text-pink-800 px-3 py-1 rounded-full text-sm flex items-center">
              {activeHashtag}
              <button onClick={removeHashtag} className="ml-2 text-pink-500 hover:text-pink-700">
                ×
              </button>
            </span>
          )}
          
          {(searchQuery || selectedCity || selectedNeighborhood || activeHashtag) && (
            <button 
              onClick={resetFilters}
              className="text-sm text-pink-600 hover:text-pink-800 ml-2"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-gray-100 py-4 px-4 mb-6">
        {showCities && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">Select City:</h3>
            <div className="flex space-x-2 overflow-x-auto pb-2">
              {cities.map(city => (
                <button
                  key={city}
                  onClick={() => handleCitySelect(city)}
                  className="px-3 py-1 rounded-full text-sm bg-white text-gray-800 border border-gray-300 hover:bg-pink-50"
                >
                  {city}
                </button>
              ))}
            </div>
          </div>
        )}

        {showNeighborhoods && selectedCity && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">Select Neighborhood:</h3>
            <div className="flex space-x-2 overflow-x-auto pb-2">
              <button
                onClick={() => handleNeighborhoodSelect('All')}
                className="px-3 py-1 rounded-full text-sm bg-white text-gray-800 border border-gray-300 hover:bg-pink-50"
              >
                All {selectedCity}
              </button>
              {neighborhoods[selectedCity].map(neighborhood => (
                <button
                  key={neighborhood}
                  onClick={() => handleNeighborhoodSelect(neighborhood)}
                  className="px-3 py-1 rounded-full text-sm bg-white text-gray-800 border border-gray-300 hover:bg-pink-50"
                >
                  {neighborhood}
                </button>
              ))}
            </div>
          </div>
        )}

        {showCategories && (
          <div>
            <h3 className="text-sm font-semibold text-gray-600 mb-2">Select Categories:</h3>
            <div className="flex flex-wrap gap-2">
              {hashtags.map(hashtag => (
                <button
                  key={hashtag}
                  onClick={() => handleHashtagSelect(hashtag)}
                  className={`px-3 py-1 rounded-full text-sm ${
                    activeHashtag === hashtag 
                      ? 'bg-pink-500 text-white' 
                      : 'bg-white text-gray-800 border border-gray-300 hover:bg-pink-50'
                  }`}
                >
                  {hashtag}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Display Items */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 px-4">
        {["Trending Restaurants", "Trending Dishes", "Trending Lists"].map((section, index) => (
          <div key={index} className="bg-white p-4 rounded-lg shadow-md">
            <h2 className="text-lg font-bold mb-3">{section}</h2>
            {filteredItems.filter(item => 
              (index === 0 && item.type === "Restaurant") ||
              (index === 1 && item.type === "Dish") ||
              (index === 2 && item.type === "List")
            ).map(item => (
              <div key={item.id} className="flex justify-between items-center mb-2 relative hover:bg-gray-50 rounded p-1">
                <Link 
                  to={getDetailPageUrl(item)} 
                  className="truncate pr-2 flex-grow text-gray-800 hover:text-pink-600"
                >
                  {item.name}
                </Link>
                <button 
                  className="text-pink-500 hover:text-pink-700 flex-shrink-0"
                  onClick={(e) => handleQuickAdd(e, item.id)}
                >+</button>
                {showPopover === item.id && (
                  <div 
                    ref={popoverRef} 
                    className="absolute right-0 top-6 bg-white p-4 shadow-lg rounded-lg w-48 z-10 border border-gray-200"
                  >
                    <p className="text-sm font-medium mb-2">Add to List:</p>
                    <button className="w-full text-left py-2 px-3 hover:bg-gray-100 rounded mb-1 text-sm">Favorites</button>
                    <button className="w-full text-left py-2 px-3 hover:bg-gray-100 rounded mb-1 text-sm">Brunch Spots</button>
                    <button className="w-full text-left py-2 px-3 hover:bg-gray-100 rounded mb-1 text-sm">Best Eats</button>
                    <div className="border-t border-gray-200 mt-2 pt-2">
                      <button className="w-full text-left py-2 px-3 text-pink-500 hover:bg-pink-50 rounded text-sm">+ Create New List</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {filteredItems.filter(item => 
              (index === 0 && item.type === "Restaurant") ||
              (index === 1 && item.type === "Dish") ||
              (index === 2 && item.type === "List")
            ).length === 0 && (
              <p className="text-gray-500 text-sm italic">No items match your filters</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;
