import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import FloatingQuickAdd from '../components/FloatingQuickAdd';

// Reusable Trending Item Component
const TrendingItem = ({ item, showPopover, handleQuickAdd, handleAddToList, userLists, getDetailPageUrl }) => (
  <div className="bg-white rounded-lg shadow-md overflow-visible relative hover:shadow-lg transition">
    <div className="relative p-4">
      <Link to={getDetailPageUrl(item)} className="block">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-medium text-gray-900 hover:text-pink-600 pr-6">{item.name}</h3>
            {item.type === 'Dish' && (
              <p className="text-sm text-gray-600 mt-1">at {item.restaurant}</p>
            )}
          </div>
          {item.trending && (
            <span className="text-red-500 text-lg" title="Trending">🔥</span>
          )}
        </div>
        <div className="mt-2">
          <span className="inline-block bg-gray-100 text-gray-800 px-2 py-0.5 rounded text-xs">
            #{item.category}
          </span>
        </div>
        <div className="mt-3 text-sm text-gray-500 flex justify-between items-center">
          <span>{item.location}</span>
          <span className="font-medium text-pink-600">+{item.adds.toLocaleString()}</span>
        </div>
      </Link>

      {/* Quick Add Button */}
      <button
        onClick={(e) => handleQuickAdd(e, item.id)}
        data-item-id={item.id}
        className="absolute top-3 right-3 w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center text-white shadow-sm hover:bg-pink-600 transition-colors"
        title="Quick add to a list"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
        </svg>
      </button>

      {/* Quick Add Popover */}
      {showPopover === item.id && (
        <div
          className="absolute right-0 top-11 w-auto min-w-[12rem] z-50 bg-white p-3 shadow-xl rounded-lg border border-gray-200"
          data-popover-for={item.id}
        >
          <div className="text-sm font-medium text-gray-700 mb-2">Add to list:</div>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {userLists.map((list) => (
              <button
                key={list.id}
                onClick={(e) => handleAddToList(e, item.id, list.id)}
                className="w-full text-left px-3 py-2 text-sm rounded hover:bg-pink-50 transition flex items-center"
              >
                <span className="truncate">{list.name}</span>
              </button>
            ))}
          </div>
          <div className="border-t border-gray-100 mt-2 pt-2">
            <button
              className="w-full text-left px-3 py-2 text-sm text-pink-600 hover:bg-pink-50 rounded transition"
            >
              + Create New List
            </button>
          </div>
        </div>
      )}
    </div>
  </div>
);

// Reusable Trending List Component
const TrendingList = ({ list }) => (
  <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
    <Link to={`/list/${list.id}`} className="block p-4">
      <div className="flex justify-between items-start">
        <h3 className="font-medium text-gray-900 hover:text-pink-600">{list.title}</h3>
        {list.trending && (
          <span className="text-red-500 text-lg" title="Trending">🔥</span>
        )}
      </div>
      <div className="mt-1 text-sm text-gray-600">by @{list.author}</div>
      <div className="mt-2">
        <span className="inline-block bg-gray-100 text-gray-800 px-2 py-0.5 rounded text-xs">
          #{list.category}
        </span>
      </div>
      <div className="mt-3 text-sm text-gray-500 flex justify-between items-center">
        <span>{list.city}</span>
        <span className="font-medium text-pink-600">{list.follows.toLocaleString()} follows</span>
      </div>
    </Link>
  </div>
);

const Trending = () => {
  const [timeFrame, setTimeFrame] = useState('weekly');
  const [viewMode, setViewMode] = useState('all');
  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState(null);
  const [activeHashtag, setActiveHashtag] = useState(null);
  const [showCities, setShowCities] = useState(true);
  const [showNeighborhoods, setShowNeighborhoods] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [showPopover, setShowPopover] = useState(null);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const popoverRef = useRef(null);
  
  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if the click was on a quick add button (which has data-item-id)
      const clickedButton = event.target.closest('button[data-item-id]');
      if (clickedButton) {
        const itemId = parseInt(clickedButton.getAttribute('data-item-id'));
        if (itemId === showPopover) {
          // Don't close if clicking the same button that opened the popover
          return;
        }
      }
      
      // Check if the click was inside a popover (which has data-popover-for)
      const clickedPopover = event.target.closest('div[data-popover-for]');
      if (clickedPopover) {
        const popoverId = parseInt(clickedPopover.getAttribute('data-popover-for'));
        if (popoverId === showPopover) {
          // Don't close if clicking inside the active popover
          return;
        }
      }
      
      // Otherwise, close the popover
      setShowPopover(null);
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener('resize', handleResize);
    };
  }, [showPopover]);

  const cities = ["NYC", "LA", "MIA", "SF", "CHI"];
  
  const neighborhoods = {
    NYC: ["Soho", "Brooklyn", "Manhattan", "Queens"],
    LA: ["Hollywood", "Venice", "Downtown", "Santa Monica"],
    MIA: ["Wynwood", "Brickell", "South Beach", "Little Havana"],
    SF: ["Mission", "Chinatown", "Nob Hill", "SoMa"],
    CHI: ["River North", "West Loop", "Lincoln Park", "Wicker Park"]
  };
  
  const hashtags = ["#italian", "#pizza", "#cocktails", "#salads", "#seafood", "#brunch", "#vegan", "#dessert", "#sushi", "#ramen"];

  const trendingItems = [
    { id: 1, name: "Chicken Parm", type: "Dish", restaurant: "Tom's Restaurant", location: "Greenwich Village, NYC", adds: 2176, trending: true, category: "italian", city: "NYC", neighborhood: "Manhattan" },
    { id: 2, name: "Spicy Ramen", type: "Dish", restaurant: "Momofuku", location: "East Village, NYC", adds: 1892, trending: true, category: "ramen", city: "NYC", neighborhood: "Manhattan" },
    { id: 3, name: "French Toast", type: "Dish", restaurant: "Breakfast Club", location: "SoHo, NYC", adds: 1543, trending: false, category: "brunch", city: "NYC", neighborhood: "Soho" },
    { id: 4, name: "Tom's Restaurant", type: "Restaurant", location: "Greenwich Village, NYC", adds: 1872, trending: true, category: "italian", city: "NYC", neighborhood: "Manhattan" },
    { id: 5, name: "Momofuku", type: "Restaurant", location: "East Village, NYC", adds: 1654, trending: true, category: "asian", city: "NYC", neighborhood: "Manhattan" },
    { id: 6, name: "Breakfast Club", type: "Restaurant", location: "SoHo, NYC", adds: 1432, trending: false, category: "brunch", city: "NYC", neighborhood: "Soho" },
    { id: 7, name: "Bacon Burger", type: "Dish", restaurant: "Minetta Tavern", location: "West Village, NYC", adds: 1387, trending: false, category: "burger", city: "NYC", neighborhood: "Manhattan" },
    { id: 8, name: "Minetta Tavern", type: "Restaurant", location: "West Village, NYC", adds: 1298, trending: false, category: "american", city: "NYC", neighborhood: "Manhattan" },
    { id: 9, name: "Taco Tuesday", type: "Dish", restaurant: "La Esquina", location: "Nolita, NYC", adds: 1201, trending: false, category: "mexican", city: "NYC", neighborhood: "Manhattan" }
  ];

  const trendingLists = [
    { id: 101, title: "Best Date Spots in NYC", author: "mary216", follows: 786, trending: true, category: "date-night", city: "NYC" },
    { id: 102, title: "Affordable Hidden Gems", author: "foodhunter", follows: 654, trending: false, category: "budget", city: "NYC" },
    { id: 103, title: "Must-Try Desserts", author: "sweetooth", follows: 521, trending: false, category: "dessert", city: "NYC" }
  ];

  // Sample user lists for the quick add popover
  const userLists = [
    { id: 201, name: "My Favorites" },
    { id: 202, name: "Want to Try" },
    { id: 203, name: "Weekend Plans" },
    { id: 204, name: "Special Occasions" }
  ];

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

  const getDetailPageUrl = useCallback((item) => {
    if (item.type === "Restaurant") {
      return `/restaurant/${item.id}`;
    } else if (item.type === "Dish") {
      return `/dish/${item.id}`;
    } else {
      return `/list/${item.id}`;
    }
  }, []);
  
  const handleQuickAdd = useCallback((e, itemId) => {
    e.preventDefault();
    e.stopPropagation();
    setShowPopover(showPopover === itemId ? null : itemId);
  }, [showPopover]);
  
  const handleAddToList = useCallback((e, itemId, listId) => {
    e.preventDefault();
    e.stopPropagation();
    console.log(`Added item ${itemId} to list ${listId}`);
    // In a real app, this would make an API call
    setShowPopover(null);
  }, []);
  
  const toggleMobileFilters = () => {
    setShowMobileFilters(!showMobileFilters);
  };

  const filteredItems = trendingItems.filter(item => {
    if (viewMode !== 'all' && viewMode !== item.type.toLowerCase()) return false;
    if (selectedCity && item.city && item.city !== selectedCity) return false;
    if (selectedNeighborhood && item.neighborhood && item.neighborhood !== selectedNeighborhood) return false;
    if (activeHashtag) {
      const tagToMatch = activeHashtag.slice(1).toLowerCase();
      return item.category && item.category.toLowerCase().includes(tagToMatch);
    }
    return true;
  });

  const filteredLists = trendingLists.filter(list => {
    if (viewMode !== 'all' && viewMode !== 'lists') return false;
    if (selectedCity && list.city && list.city !== selectedCity) return false;
    if (activeHashtag) {
      const tagToMatch = activeHashtag.slice(1).toLowerCase();
      return list.category && list.category.toLowerCase().includes(tagToMatch);
    }
    return true;
  });
  
  const isMobile = windowWidth < 768;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* App Header */}
      <div className="flex justify-between items-center py-4 mb-4">
        <Link to="/" className="w-full flex justify-center">
          <div className="text-center">
            <img 
              src="/logo-placeholder.png" 
              alt="Chomp Logo" 
              className="h-10 w-auto"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src =
                  "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='40' viewBox='0 0 100 40'%3E%3Crect width='100' height='40' fill='%23f472b6'%3E%3C/rect%3E%3Ctext x='50' y='25' font-family='Arial' font-size='16' text-anchor='middle' fill='white'%3Echomp%3C/text%3E%3C/svg%3E";
              }}
            />
          </div>
        </Link>
      </div>
      
      <div className="flex items-center space-x-6 mb-4 overflow-x-auto py-2 px-4 scrollbar-hide">
        <Link to="/" className="text-gray-700 hover:text-gray-900 whitespace-nowrap">Home</Link>
        <Link to="/trending" className="text-gray-700 hover:text-gray-900 font-medium whitespace-nowrap">Trending</Link>
        <Link to="/nightplanner" className="text-gray-700 hover:text-gray-900 whitespace-nowrap">Night Planner</Link>
        <Link to="/mylists" className="text-gray-700 hover:text-gray-900 whitespace-nowrap">My Lists</Link>
        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-700 flex-shrink-0">
          <span>U</span>
        </div>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-4">Trending Now</h1>
      
      {/* Time Frame Selector */}
      <div className="mb-4 overflow-x-auto scrollbar-hide">
        <div className="inline-flex rounded-md shadow-sm" role="group">
          <button
            onClick={() => setTimeFrame('daily')}
            className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
              timeFrame === 'daily'
                ? 'bg-pink-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
            }`}
          >
            Daily
          </button>
          <button
            onClick={() => setTimeFrame('weekly')}
            className={`px-4 py-2 text-sm font-medium ${
              timeFrame === 'weekly'
                ? 'bg-pink-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border-t border-b border-gray-300'
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => setTimeFrame('monthly')}
            className={`px-4 py-2 text-sm font-medium ${
              timeFrame === 'monthly'
                ? 'bg-pink-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border-t border-b border-gray-300'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setTimeFrame('yearly')}
            className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
              timeFrame === 'yearly'
                ? 'bg-pink-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
            }`}
          >
            Yearly
          </button>
        </div>
      </div>

      {/* View Mode Selector */}
      <div className="mb-4 overflow-x-auto scrollbar-hide">
        <div className="inline-flex rounded-md shadow-sm" role="group">
          <button
            onClick={() => setViewMode('all')}
            className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
              viewMode === 'all'
                ? 'bg-pink-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setViewMode('restaurant')}
            className={`px-4 py-2 text-sm font-medium ${
              viewMode === 'restaurant'
                ? 'bg-pink-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border-t border-b border-gray-300'
            }`}
          >
            Restaurants
          </button>
          <button
            onClick={() => setViewMode('dish')}
            className={`px-4 py-2 text-sm font-medium ${
              viewMode === 'dish'
                ? 'bg-pink-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border-t border-b border-gray-300'
            }`}
          >
            Dishes
          </button>
          <button
            onClick={() => setViewMode('lists')}
            className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
              viewMode === 'lists'
                ? 'bg-pink-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
            }`}
          >
            Lists
          </button>
        </div>
      </div>
      
      {/* Filter Path/Breadcrumbs */}
      <div className="bg-gray-100 py-3 px-4 rounded-t-lg flex items-center flex-wrap">
        <div className="text-sm font-medium text-gray-600 mr-2 mb-2">Filters:</div>
        <div className="flex flex-wrap gap-2">
          {selectedCity ? (
            <span className="bg-pink-100 text-pink-800 px-3 py-1 rounded-full text-sm flex items-center mb-2">
              {selectedCity}
              <button onClick={removeCity} className="ml-2 text-pink-500 hover:text-pink-700">×</button>
            </span>
          ) : (
            <span className="text-sm text-gray-500 mb-2">Select a City</span>
          )}
          
          {selectedNeighborhood && (
            <span className="bg-pink-100 text-pink-800 px-3 py-1 rounded-full text-sm flex items-center mb-2">
              {selectedNeighborhood}
              <button onClick={removeNeighborhood} className="ml-2 text-pink-500 hover:text-pink-700">×</button>
            </span>
          )}
          
          {activeHashtag && (
            <span className="bg-pink-100 text-pink-800 px-3 py-1 rounded-full text-sm flex items-center mb-2">
              {activeHashtag}
              <button onClick={removeHashtag} className="ml-2 text-pink-500 hover:text-pink-700">×</button>
            </span>
          )}
          
          {(selectedCity || selectedNeighborhood || activeHashtag) && (
            <button 
              onClick={resetFilters}
              className="text-sm text-pink-600 hover:text-pink-800 ml-2 mb-2"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Mobile Filter Toggle Button */}
      {isMobile && (
        <div className="bg-gray-100 px-4 pb-2">
          <button
            onClick={toggleMobileFilters}
            className="w-full py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            {showMobileFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>
      )}

      {/* Filters Section */}
      <div className={`bg-gray-100 py-4 px-4 rounded-b-lg mb-6 ${isMobile && !showMobileFilters ? 'hidden' : ''}`}>
        {showCities && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">Select City:</h3>
            <div className="flex flex-wrap gap-2">
              {cities.map(city => (
                <button
                  key={city}
                  onClick={() => handleCitySelect(city)}
                  className="px-3 py-1 rounded-full text-sm bg-white text-gray-800 border border-gray-300 hover:bg-pink-50 mb-2"
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
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleNeighborhoodSelect('All')}
                className="px-3 py-1 rounded-full text-sm bg-white text-gray-800 border border-gray-300 hover:bg-pink-50 mb-2"
              >
                All {selectedCity}
              </button>
              {neighborhoods[selectedCity].map(neighborhood => (
                <button
                  key={neighborhood}
                  onClick={() => handleNeighborhoodSelect(neighborhood)}
                  className="px-3 py-1 rounded-full text-sm bg-white text-gray-800 border border-gray-300 hover:bg-pink-50 mb-2"
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
                  className={`px-3 py-1 rounded-full text-sm mb-2 ${
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
        {filteredItems.map(item => (
          <TrendingItem
            key={item.id}
            item={item}
            showPopover={showPopover}
            handleQuickAdd={handleQuickAdd}
            handleAddToList={handleAddToList}
            userLists={userLists}
            getDetailPageUrl={getDetailPageUrl}
          />
        ))}

        {(viewMode === 'all' || viewMode === 'lists') && filteredLists.map(list => (
          <TrendingList key={list.id} list={list} />
        ))}

        {filteredItems.length === 0 && ((viewMode !== 'lists') || (filteredLists.length === 0)) && (
          <div className="col-span-full text-center py-8 text-gray-500">
            No trending items match your filters. Try adjusting your filters to see more.
          </div>
        )}
      </div>

      {/* Floating Quick Add Button */}
      <FloatingQuickAdd />

      {/* Custom CSS for scrollbar */}
      <style jsx>{`
        /* Hide scrollbar for Chrome, Safari and Opera */
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        /* Hide scrollbar for IE, Edge and Firefox */
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default Trending;
