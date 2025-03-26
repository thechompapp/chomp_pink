import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Flame, ChevronDown, ChevronUp, TrendingUp, Expand } from 'lucide-react';
import Navbar from '../components/Navbar';
import FloatingQuickAdd from '../components/FloatingQuickAdd';
import QuickCreateForm from '../components/QuickCreateForm';

// Define debounce function
const debounce = (func, delay) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
};

// Reusable Carousel/List Component
const ExpandableList = ({
  title,
  items = [],
  type,
  isExpanded,
  toggleExpand,
  onQuickAdd,
}) => {
  const CardContent = ({ item }) => (
    <>
      {type === 'dishes' ? (
        <>
          <h3 className="text-gray-900 font-bold text-lg">{item.name.split(' at ')[0]}</h3>
          <p className="text-gray-600 text-sm mt-1">at {item.name.split(' at ')[1]}</p>
        </>
      ) : (
        <h3 className="text-gray-900 font-medium">{item.name}</h3>
      )}
      <div className="flex flex-wrap mt-2 gap-2">
        {item.tags.map((tag) => (
          <span key={tag} className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600">
            #{tag}
          </span>
        ))}
      </div>
      <div className="mt-3 flex items-center space-x-3">
        <span className="text-gray-500 text-sm">{item.neighborhood}, {item.city}</span>
        <div className="bg-green-100 rounded-full px-3 py-1 flex items-center">
          <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
          <span className="text-green-700 text-sm font-medium">+{Math.floor(Math.random() * 100)}</span>
        </div>
      </div>
    </>
  );

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center space-x-2">
          <h2 className="text-lg font-bold">{title}</h2>
          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </span>
        </div>
        <button
          onClick={() => toggleExpand(type)}
          className="p-2 hover:bg-gray-100 rounded-full"
          aria-label={`Toggle ${title} view`}
        >
          <Expand 
            className={`h-5 w-5 transform transition-transform ${
              isExpanded ? '' : 'rotate-90'
            }`}
          />
        </button>
      </div>

      {isExpanded ? (
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="bg-white p-4 rounded-lg shadow-md relative">
              <Link to={item.url} className="block pr-16">
                <CardContent item={item} />
              </Link>
              <button
                className="absolute top-4 right-4 w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center text-white shadow hover:bg-pink-600 transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onQuickAdd(e, item); // Pass the full item instead of just the ID
                }}
                aria-label={`Quick add ${item.name}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto flex space-x-4 pb-4 no-scrollbar">
          {items.map((item) => (
            <div
              key={item.id}
              className="carousel-item flex-shrink-0 w-72 bg-white p-4 rounded-lg shadow-md relative"
            >
              <Link to={item.url} className="block pr-16">
                <CardContent item={item} />
              </Link>
              <button
                className="absolute top-4 right-4 w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center text-white shadow hover:bg-pink-600 transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onQuickAdd(e, item); // Pass the full item instead of just the ID
                }}
                aria-label={`Quick add ${item.name}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const Home = () => {
  const [expandedSections, setExpandedSections] = useState({
    restaurants: false,
    dishes: false,
    lists: false,
  });
  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState(null);
  const [activeHashtag, setActiveHashtag] = useState(null);
  const [showPopover, setShowPopover] = useState(null);
  const [showCities, setShowCities] = useState(true);
  const [showNeighborhoods, setShowNeighborhoods] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [carouselPositions, setCarouselPositions] = useState({
    restaurants: 0,
    dishes: 0,
    lists: 0
  });
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [quickAddTarget, setQuickAddTarget] = useState(null);
  const popoverRef = useRef(null);
  const carouselRefs = {
    restaurants: useRef(null),
    dishes: useRef(null),
    lists: useRef(null)
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setShowPopover(null);
      }
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
    { id: 6, name: "Minetta Tavern (0.6m)", type: "Restaurant", tags: ["american"], city: "NYC", neighborhood: "Greenwich Village" },
    { id: 7, name: "Balthazar (0.4m)", type: "Restaurant", tags: ["french"], city: "NYC", neighborhood: "Soho" },
    { id: 8, name: "Nobu (0.9m)", type: "Restaurant", tags: ["japanese"], city: "NYC", neighborhood: "Tribeca" },
    { id: 9, name: "Peter Luger (1.3m)", type: "Restaurant", tags: ["steakhouse"], city: "NYC", neighborhood: "Brooklyn" },
    { id: 10, name: "Lombardi's (0.5m)", type: "Restaurant", tags: ["pizza"], city: "NYC", neighborhood: "Little Italy" },
    { id: 11, name: "Cacio e Pepe at Via Carota (0.4m)", type: "Dish", tags: ["italian", "pasta"], city: "NYC", neighborhood: "Manhattan" },
    { id: 12, name: "Ramen at Ippudo (0.9m)", type: "Dish", tags: ["ramen", "japanese"], city: "NYC", neighborhood: "Manhattan" },
    { id: 13, name: "Pizza at Joe's (0.6m)", type: "Dish", tags: ["pizza"], city: "NYC", neighborhood: "Manhattan" },
    { id: 14, name: "Sushi Omakase at Sushi Nakazawa (1.1m)", type: "Dish", tags: ["sushi", "japanese"], city: "NYC", neighborhood: "Manhattan" },
    { id: 15, name: "Burger at J.G. Melon (0.8m)", type: "Dish", tags: ["burger"], city: "NYC", neighborhood: "Manhattan" },
    { id: 16, name: "Cronut at Dominique Ansel (0.7m)", type: "Dish", tags: ["dessert", "pastry"], city: "NYC", neighborhood: "Soho" },
    { id: 17, name: "Pastrami Sandwich at Katz's (1.2m)", type: "Dish", tags: ["sandwich", "deli"], city: "NYC", neighborhood: "Lower East Side" },
    { id: 18, name: "Spicy Cumin Lamb at Xi'an Famous Foods (0.5m)", type: "Dish", tags: ["chinese", "spicy"], city: "NYC", neighborhood: "Various" },
    { id: 19, name: "Chicken and Waffles at Sweet Chick (0.8m)", type: "Dish", tags: ["southern", "brunch"], city: "NYC", neighborhood: "Various" },
    { id: 20, name: "Bagel with Lox at Russ & Daughters (1.0m)", type: "Dish", tags: ["breakfast", "jewish"], city: "NYC", neighborhood: "Lower East Side" },
    { id: 21, name: "Best Italian Spots by @pastafan", type: "List", tags: ["italian"] },
    { id: 22, name: "Late Night Eats by @nycnights", type: "List", tags: ["late-night"] },
    { id: 23, name: "Top Cocktail Bars by @mixology", type: "List", tags: ["cocktails"] },
    { id: 24, name: "Best Desserts by @sweettooth", type: "List", tags: ["dessert"] },
    { id: 25, name: "Hidden Gems in Brooklyn by @bkexp", type: "List", tags: ["brooklyn"] },
    { id: 26, name: "Pizza Crawl Guide by @pizzalover", type: "List", tags: ["pizza"] },
    { id: 27, name: "Brunch Champions by @brunchclub", type: "List", tags: ["brunch"] },
    { id: 28, name: "Rooftop Bars by @viewseeker", type: "List", tags: ["bars", "views"] },
    { id: 29, name: "Date Night Spots by @romanceexpert", type: "List", tags: ["romantic", "date-night"] },
    { id: 30, name: "Affordable Michelin by @budgetfoodie", type: "List", tags: ["michelin", "value"] }
  ];

  const handleQuickAdd = useCallback((e, item) => {
    e.preventDefault();
    e.stopPropagation();
    setQuickAddTarget(item); // Store the item being added
  }, []);

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

  const handleScrollStart = () => {
    setIsUserScrolling(true);
    setTimeout(() => setIsUserScrolling(false), 300); // Reset after 300ms
  };

  const scrollCarousel = useCallback((type, direction) => {
    if (isUserScrolling) return; // Skip programmatic scrolling if the user is scrolling manually

    const carouselRef = carouselRefs[type].current;
    if (!carouselRef) return;

    const itemWidth = carouselRef.querySelector('.carousel-item').offsetWidth + 16; // Item width + gap
    const visibleWidth = carouselRef.offsetWidth;
    const scrollAmount = Math.floor(visibleWidth / itemWidth) * itemWidth;

    let newPosition = carouselPositions[type];

    if (direction === 'left') {
      newPosition = Math.max(0, newPosition - scrollAmount);
    } else {
      const maxScroll = carouselRef.scrollWidth - visibleWidth;
      newPosition = Math.min(maxScroll, newPosition + scrollAmount);
    }

    carouselRef.scrollTo({
      left: newPosition,
      behavior: 'smooth',
    });

    setCarouselPositions((prev) => ({
      ...prev,
      [type]: newPosition,
    }));
  }, [carouselPositions, isUserScrolling]);

  const updateCarouselState = useCallback(
    debounce((type) => {
      const carouselRef = carouselRefs[type].current;
      if (!carouselRef) return;

      const position = carouselRef.scrollLeft;

      setCarouselPositions((prev) => ({
        ...prev,
        [type]: position,
      }));
    }, 100),
    []
  );

  const openQuickCreate = () => {
    setShowQuickCreate(true);
  };

  const closeQuickCreate = () => {
    setShowQuickCreate(false);
  };

  const toggleMobileFilters = () => {
    setShowMobileFilters(!showMobileFilters);
  };

  const isMobile = windowWidth < 768;

  const trendingRestaurants = [
    { id: 1, name: "Piccola Cucina", tags: ["italian"], neighborhood: "Soho", city: "NYC", url: "/restaurant/1" },
    { id: 2, name: "Carbone", tags: ["italian"], neighborhood: "Manhattan", city: "NYC", url: "/restaurant/2" },
    { id: 3, name: "Joe's Pizza", tags: ["pizza"], neighborhood: "Greenwich", city: "NYC", url: "/restaurant/3" },
  ];

  const trendingDishes = filteredItems.filter(item => item.type === "Dish").map(item => ({
    ...item,
    url: getDetailPageUrl(item)
  }));

  const trendingLists = filteredItems.filter(item => item.type === "List").map(item => ({
    ...item,
    url: getDetailPageUrl(item)
  }));

  const toggleExpand = (type) => {
    setExpandedSections((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  const QuickAddPopup = ({ item, onClose }) => {
    const [userLists] = useState([
      { id: 1, name: "My Favorites" },
      { id: 2, name: "Want to Try" },
      { id: 3, name: "Weekend Plans" }
    ]);
  
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
          <div className="p-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Add to List</h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-500">×</button>
            </div>
          </div>
          <div className="p-4">
            <div className="space-y-2">
              {userLists.map(list => (
                <button
                  key={list.id}
                  onClick={() => {
                    // Handle adding item to list
                    console.log(`Adding ${item.name} to ${list.name}`);
                    onClose();
                  }}
                  className="w-full text-left px-4 py-3 rounded-lg hover:bg-pink-50 flex items-center justify-between group"
                >
                  <span>{list.name}</span>
                  <span className="text-pink-500">+</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto font-sans text-gray-800">
      <Navbar /> {/* Using the reusable Navbar component */}
      <div className="pt-40"> {/* Added padding-top to prevent navbar overlap */}
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
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Filter Path/Breadcrumbs */}
      <div className="bg-gray-100 py-3 px-4 flex items-center flex-wrap">
        <div className="text-sm font-medium text-gray-600 mr-2 mb-2">Filters:</div>
        <div className="flex flex-wrap gap-2">
          {searchQuery.trim() !== '' && (
            <span className="bg-pink-100 text-pink-800 px-3 py-1 rounded-full text-sm flex items-center mb-2">
              "{searchQuery}"
              <button onClick={() => setSearchQuery('')} className="ml-2 text-pink-500 hover:text-pink-700">
                ×
              </button>
            </span>
          )}
          
          {selectedCity ? (
            <span className="bg-pink-100 text-pink-800 px-3 py-1 rounded-full text-sm flex items-center mb-2">
              {selectedCity}
              <button onClick={removeCity} className="ml-2 text-pink-500 hover:text-pink-700">
                ×
              </button>
            </span>
          ) : (
            <span className="text-sm text-gray-500 mb-2">Select a City</span>
          )}
          
          {selectedNeighborhood && (
            <span className="bg-pink-100 text-pink-800 px-3 py-1 rounded-full text-sm flex items-center mb-2">
              {selectedNeighborhood}
              <button onClick={removeNeighborhood} className="ml-2 text-pink-500 hover:text-pink-700">
                ×
              </button>
            </span>
          )}
          
          {activeHashtag && (
            <span className="bg-pink-100 text-pink-800 px-3 py-1 rounded-full text-sm flex items-center mb-2">
              {activeHashtag}
              <button onClick={removeHashtag} className="ml-2 text-pink-500 hover:text-pink-700">
                ×
              </button>
            </span>
          )}
          
          {(searchQuery || selectedCity || selectedNeighborhood || activeHashtag) && (
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
      <div className={`bg-gray-100 py-4 px-4 mb-6 ${isMobile && !showMobileFilters ? 'hidden' : ''}`}>
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

      {/* Display Items in Carousels */}
      <div className="mb-8 px-4">
        {/* Trending Restaurants Section */}
        <ExpandableList
          title="Trending Restaurants"
          items={trendingRestaurants}
          type="restaurants"
          isExpanded={expandedSections.restaurants}
          toggleExpand={toggleExpand}
          onQuickAdd={handleQuickAdd}
          showPopover={showPopover}
          setShowPopover={setShowPopover}
        />
        
        {/* Trending Dishes Section */}
        <ExpandableList
          title="Trending Dishes"
          items={trendingDishes}
          type="dishes"
          isExpanded={expandedSections.dishes}
          toggleExpand={toggleExpand}
          onQuickAdd={handleQuickAdd}
          showPopover={showPopover}
          setShowPopover={setShowPopover}
        />
        
        {/* Trending Lists Section */}
        <ExpandableList
          title="Trending Lists"
          items={trendingLists}
          type="lists"
          isExpanded={expandedSections.lists}
          toggleExpand={toggleExpand}
          onQuickAdd={handleQuickAdd}
          showPopover={showPopover}
          setShowPopover={setShowPopover}
        />
      </div>
      
      {/* QuickAdd Popup */}
      {quickAddTarget && (
        <QuickAddPopup
          item={quickAddTarget}
          onClose={() => setQuickAddTarget(null)}
        />
      )}

      {/* QuickCreate Modal */}
      {showQuickCreate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="relative w-full max-w-md">
            <div className="absolute top-2 right-2 z-10">
              <button 
                onClick={closeQuickCreate}
                className="bg-white rounded-full p-1 shadow-md hover:bg-gray-100"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <QuickCreateForm onClose={closeQuickCreate} selectedItem={selectedItem} />
          </div>
        </div>
      )}

      {/* Floating Quick Add Button - using FloatingQuickAdd component */}
      <FloatingQuickAdd onClick={openQuickCreate} />
      
      {/* Custom CSS for scroll and carousel behavior */}
      <style jsx>{`
        /* Hide scrollbar for Chrome, Safari and Opera */
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        
        /* Hide scrollbar for IE, Edge and Firefox */
        .no-scrollbar {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
      `}</style>
    </div>
    </div>
  );
};

export default Home;
