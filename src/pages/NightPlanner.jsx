import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Shuffle } from 'lucide-react';
import FloatingQuickAdd from '../components/FloatingQuickAdd';

// Reusable Recommendation Card Component
const RecommendationCard = ({ rec, index, isShuffling }) => (
  <div
    className={`bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 ${
      isShuffling ? 'opacity-50 translate-y-2' : 'opacity-100'
    }`}
    style={{
      animation: isShuffling ? `shake 0.5s ease-in-out infinite` : 'none',
    }}
  >
    <div className="p-4 border-b border-gray-100 bg-gray-50">
      <div className="flex items-center">
        <span className="w-8 h-8 rounded-full bg-pink-500 text-white flex items-center justify-center font-bold mr-3">
          {index + 1}
        </span>
        <h3 className="text-lg font-medium">{rec.description}</h3>
      </div>
    </div>
    <div className="p-4">
      <h4 className="text-xl font-bold text-gray-900">{rec.venue.name}</h4>
      <div className="flex flex-wrap items-center mt-2 text-sm text-gray-600">
        <span className="mr-3">{rec.venue.type}</span>
        <span className="mr-3">•</span>
        <span className="mr-3">
          {rec.venue.neighborhood}, {rec.venue.city}
        </span>
        <span className="mr-3">•</span>
        <span className="flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 text-yellow-500 mr-1"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          {rec.venue.rating}
        </span>
        <span className="mr-3 ml-3">•</span>
        <span>{rec.venue.priceLevel}</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <span className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full text-xs">
          #{rec.venue.category}
        </span>
        <span className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full text-xs">
          #{rec.venue.atmosphere || rec.venue.bestFor}
        </span>
      </div>
      <div className="mt-4 flex justify-between">
        <button className="px-3 py-1 border border-pink-500 text-pink-500 rounded-lg text-sm hover:bg-pink-50">
          Add to List
        </button>
        <button className="px-3 py-1 bg-pink-500 text-white rounded-lg text-sm hover:bg-pink-600">
          Get Directions
        </button>
      </div>
    </div>
  </div>
);

const NightPlanner = () => {
  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState(null);
  const [planType, setPlanType] = useState('dinner'); // 'dinner' or 'bars'
  const [showCities, setShowCities] = useState(true);
  const [showNeighborhoods, setShowNeighborhoods] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [recommendations, setRecommendations] = useState([]);

  const cities = ['NYC', 'LA', 'MIA', 'SF', 'CHI'];
  const neighborhoods = {
    NYC: ['Soho', 'Brooklyn', 'Manhattan', 'Queens'],
    LA: ['Hollywood', 'Venice', 'Downtown', 'Santa Monica'],
    MIA: ['Wynwood', 'Brickell', 'South Beach', 'Little Havana'],
    SF: ['Mission', 'Chinatown', 'Nob Hill', 'SoMa'],
    CHI: ['River North', 'West Loop', 'Lincoln Park', 'Wicker Park'],
  };

  // Sample bars and restaurants data
  const venues = {
    bars: [
      { id: 101, name: "The Aviary", type: "Cocktail Bar", neighborhood: "West Loop", city: "CHI", rating: 4.8, priceLevel: "$$$", category: "cocktails", atmosphere: "upscale" },
      { id: 102, name: "Death & Co", type: "Cocktail Bar", neighborhood: "East Village", city: "NYC", rating: 4.9, priceLevel: "$$$", category: "cocktails", atmosphere: "intimate" },
      { id: 103, name: "Attaboy", type: "Speakeasy", neighborhood: "Lower East Side", city: "NYC", rating: 4.7, priceLevel: "$$", category: "cocktails", atmosphere: "cozy" },
      { id: 104, name: "The NoMad Bar", type: "Hotel Bar", neighborhood: "NoMad", city: "NYC", rating: 4.6, priceLevel: "$$$", category: "cocktails", atmosphere: "elegant" },
      { id: 105, name: "Employees Only", type: "Speakeasy", neighborhood: "West Village", city: "NYC", rating: 4.5, priceLevel: "$$$", category: "cocktails", atmosphere: "lively" },
      { id: 106, name: "Bemelmans Bar", type: "Hotel Bar", neighborhood: "Upper East Side", city: "NYC", rating: 4.7, priceLevel: "$$$$", category: "cocktails", atmosphere: "classic" },
      { id: 107, name: "Broken Shaker", type: "Rooftop Bar", neighborhood: "Downtown", city: "LA", rating: 4.5, priceLevel: "$$", category: "cocktails", atmosphere: "trendy" },
      { id: 108, name: "Sweet Liberty", type: "Cocktail Bar", neighborhood: "South Beach", city: "MIA", rating: 4.6, priceLevel: "$$", category: "cocktails", atmosphere: "fun" },
      { id: 109, name: "Trick Dog", type: "Cocktail Bar", neighborhood: "Mission", city: "SF", rating: 4.6, priceLevel: "$$", category: "cocktails", atmosphere: "creative" },
      { id: 110, name: "The Violet Hour", type: "Speakeasy", neighborhood: "Wicker Park", city: "CHI", rating: 4.7, priceLevel: "$$$", category: "cocktails", atmosphere: "sophisticated" },
      { id: 111, name: "Bar Marmont", type: "Hotel Bar", neighborhood: "Hollywood", city: "LA", rating: 4.4, priceLevel: "$$$", category: "cocktails", atmosphere: "celebrity" },
      { id: 112, name: "Bourbon & Branch", type: "Speakeasy", neighborhood: "Nob Hill", city: "SF", rating: 4.5, priceLevel: "$$$", category: "cocktails", atmosphere: "secret" },
      { id: 113, name: "Mother's Ruin", type: "Casual Bar", neighborhood: "Nolita", city: "NYC", rating: 4.3, priceLevel: "$$", category: "cocktails", atmosphere: "casual" },
      { id: 114, name: "The Penrose", type: "Gastropub", neighborhood: "Upper East Side", city: "NYC", rating: 4.2, priceLevel: "$$", category: "beer", atmosphere: "relaxed" },
      { id: 115, name: "Apotheke", type: "Cocktail Bar", neighborhood: "Chinatown", city: "NYC", rating: 4.4, priceLevel: "$$$", category: "cocktails", atmosphere: "unique" }
    ],
    restaurants: [
      { id: 201, name: "Carbone", type: "Italian", neighborhood: "Greenwich Village", city: "NYC", rating: 4.7, priceLevel: "$$$$", category: "italian", bestFor: "dinner" },
      { id: 202, name: "Lilia", type: "Italian", neighborhood: "Williamsburg", city: "NYC", rating: 4.8, priceLevel: "$$$", category: "italian", bestFor: "dinner" },
      { id: 203, name: "Bestia", type: "Italian", neighborhood: "Downtown", city: "LA", rating: 4.7, priceLevel: "$$$", category: "italian", bestFor: "dinner" },
      { id: 204, name: "Eleven Madison Park", type: "Fine Dining", neighborhood: "Flatiron", city: "NYC", rating: 4.9, priceLevel: "$$$$", category: "american", bestFor: "special occasion" },
      { id: 205, name: "Nobu", type: "Japanese", neighborhood: "Tribeca", city: "NYC", rating: 4.6, priceLevel: "$$$$", category: "japanese", bestFor: "dinner" },
      { id: 206, name: "Le Bernardin", type: "Seafood", neighborhood: "Midtown", city: "NYC", rating: 4.9, priceLevel: "$$$$", category: "seafood", bestFor: "dinner" },
      { id: 207, name: "Majordomo", type: "Korean American", neighborhood: "Downtown", city: "LA", rating: 4.6, priceLevel: "$$$", category: "korean", bestFor: "dinner" },
      { id: 208, name: "Girl & the Goat", type: "New American", neighborhood: "West Loop", city: "CHI", rating: 4.7, priceLevel: "$$$", category: "american", bestFor: "dinner" },
      { id: 209, name: "Bern's Steak House", type: "Steakhouse", neighborhood: "SoHo", city: "MIA", rating: 4.8, priceLevel: "$$$$", category: "steak", bestFor: "dinner" },
      { id: 210, name: "State Bird Provisions", type: "New American", neighborhood: "Fillmore", city: "SF", rating: 4.6, priceLevel: "$$$", category: "american", bestFor: "dinner" },
      { id: 211, name: "Cosme", type: "Mexican", neighborhood: "Flatiron", city: "NYC", rating: 4.5, priceLevel: "$$$", category: "mexican", bestFor: "dinner" },
      { id: 212, name: "Atomix", type: "Korean", neighborhood: "NoMad", city: "NYC", rating: 4.9, priceLevel: "$$$$", category: "korean", bestFor: "special occasion" },
      { id: 213, name: "Alinea", type: "Molecular Gastronomy", neighborhood: "Lincoln Park", city: "CHI", rating: 4.9, priceLevel: "$$$$", category: "experimental", bestFor: "special occasion" },
      { id: 214, name: "Momofuku Ko", type: "New American", neighborhood: "East Village", city: "NYC", rating: 4.7, priceLevel: "$$$$", category: "american", bestFor: "dinner" },
      { id: 215, name: "Manhatta", type: "New American", neighborhood: "Financial District", city: "NYC", rating: 4.6, priceLevel: "$$$", category: "american", bestFor: "dinner" }
    ]
  };

  const generateRecommendations = useCallback(() => {
    setIsShuffling(true);

    // Filter venues based on city and neighborhood if selected
    let filteredBars = venues.bars.filter(bar => {
      if (selectedCity && bar.city !== selectedCity) return false;
      if (selectedNeighborhood && selectedNeighborhood !== 'All' && bar.neighborhood !== selectedNeighborhood) return false;
      return true;
    });
    
    let filteredRestaurants = venues.restaurants.filter(restaurant => {
      if (selectedCity && restaurant.city !== selectedCity) return false;
      if (selectedNeighborhood && selectedNeighborhood !== 'All' && restaurant.neighborhood !== selectedNeighborhood) return false;
      return true;
    });
    
    // Shuffle the arrays and pick recommendations
    const shuffleArray = (array) => {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    };
    
    filteredBars = shuffleArray([...filteredBars]);
    filteredRestaurants = shuffleArray([...filteredRestaurants]);
    
    let newRecommendations = [];
    
    if (planType === 'dinner') {
      // Pre-dinner bar and restaurant
      if (filteredBars.length > 0 && filteredRestaurants.length > 0) {
        newRecommendations = [
          {
            type: 'bar',
            venue: filteredBars[0],
            description: 'Start with pre-dinner drinks'
          },
          {
            type: 'restaurant',
            venue: filteredRestaurants[0],
            description: 'Enjoy dinner here'
          }
        ];
      }
    } else {
      // Bar hopping (two bars)
      if (filteredBars.length >= 2) {
        newRecommendations = [
          {
            type: 'bar',
            venue: filteredBars[0],
            description: 'First stop for drinks'
          },
          {
            type: 'bar',
            venue: filteredBars[1],
            description: 'Continue the night here'
          }
        ];
      }
    }
    
    // Simulate a delay for the shuffle animation
    setTimeout(() => {
      setRecommendations(newRecommendations);
      setIsShuffling(false);
    }, 800);
  }, [planType, selectedCity, selectedNeighborhood, venues.bars, venues.restaurants]);

  useEffect(() => {
    // When city or neighborhood changes, reset recommendations
    setRecommendations([]);
  }, [selectedCity, selectedNeighborhood, planType]);

  const handleCitySelect = useCallback((city) => {
    setSelectedCity(city);
    setSelectedNeighborhood(null);
    setShowCities(false);
    setShowNeighborhoods(true);
  }, []);

  const handleNeighborhoodSelect = useCallback((neighborhood) => {
    setSelectedNeighborhood(neighborhood);
    setShowNeighborhoods(false);
  }, []);

  const resetFilters = () => {
    setSelectedCity(null);
    setSelectedNeighborhood(null);
    setShowCities(true);
    setShowNeighborhoods(false);
    setRecommendations([]);
  };

  const removeCity = () => {
    setSelectedCity(null);
    setSelectedNeighborhood(null);
    setShowCities(true);
    setShowNeighborhoods(false);
    setRecommendations([]);
  };

  const removeNeighborhood = () => {
    setSelectedNeighborhood(null);
    setShowNeighborhoods(true);
    setRecommendations([]);
  };

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
                e.target.src = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='40' viewBox='0 0 100 40'%3E%3Crect width='100' height='40' fill='%23f472b6'%3E%3C/rect%3E%3Ctext x='50' y='25' font-family='Arial' font-size='16' text-anchor='middle' fill='white'%3Echomp%3C/text%3E%3C/svg%3E";
              }}
            />
          </div>
        </Link>
      </div>
      
      <div className="flex items-center space-x-6 mb-6 overflow-x-auto py-2 scrollbar-hide">
        <Link to="/" className="text-gray-700 hover:text-gray-900 whitespace-nowrap">Home</Link>
        <Link to="/trending" className="text-gray-700 hover:text-gray-900 whitespace-nowrap">Trending</Link>
        <Link to="/nightplanner" className="text-gray-700 hover:text-gray-900 font-medium whitespace-nowrap">Night Planner</Link>
        <Link to="/mylists" className="text-gray-700 hover:text-gray-900 whitespace-nowrap">My Lists</Link>
        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-700 flex-shrink-0">
          <span>U</span>
        </div>
      </div>
      
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Night Planner</h1>
      
      {/* Plan Type Selector */}
      <div className="mb-6">
        <h2 className="text-sm font-medium text-gray-700 mb-2">What's your plan?</h2>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setPlanType('dinner')}
            className={`p-4 rounded-lg border-2 ${
              planType === 'dinner' 
                ? 'border-pink-500 bg-pink-50' 
                :
                'border-gray-200 hover:bg-gray-50'
            } transition-colors`}
          >
            <div className="font-medium">Drinks + Dinner</div>
            <div className="text-sm text-gray-600 mt-1">Pre-dinner cocktails followed by a restaurant</div>
          </button>
          
          <button
            onClick={() => setPlanType('bars')}
            className={`p-4 rounded-lg border-2 ${
              planType === 'bars' 
                ? 'border-pink-500 bg-pink-50' 
                : 'border-gray-200 hover:bg-gray-50'
            } transition-colors`}
          >
            <div className="font-medium">Bar Hopping</div>
            <div className="text-sm text-gray-600 mt-1">Two great bars for a night out</div>
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
          
          {(selectedCity || selectedNeighborhood) && (
            <button 
              onClick={resetFilters}
              className="text-sm text-pink-600 hover:text-pink-800 mb-2"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-gray-100 py-4 px-4 rounded-b-lg mb-6">
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
      </div>
      
      {/* Shuffle and Recommendation Section */}
      <div className="flex flex-col items-center">
        <button
          onClick={generateRecommendations}
          disabled={isShuffling}
          className={`flex items-center px-6 py-3 rounded-full text-white font-medium mb-6 ${
            isShuffling 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-gradient-to-r from-pink-500 to-orange-400 hover:from-pink-600 hover:to-orange-500 shadow-md hover:shadow-lg'
          } transition-all`}
        >
          <Shuffle size={20} className={`mr-2 ${isShuffling ? 'animate-spin' : ''}`} />
          {isShuffling ? 'Shuffling...' : 'Shuffle Recommendations'}
        </button>
        
        {recommendations.length > 0 && (
          <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 w-full ${isShuffling ? 'animate-pulse' : ''}`}>
            {recommendations.map((rec, index) => (
              <RecommendationCard key={index} rec={rec} index={index} isShuffling={isShuffling} />
            ))}
          </div>
        )}
      </div>
      
      {/* Show this when there are no recommendations yet */}
      {recommendations.length === 0 && !isShuffling && (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
          <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Shuffle size={24} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-700 mb-1">No recommendations yet</h3>
          <p className="text-gray-500 mb-4">
            {selectedCity 
              ? "Hit shuffle to get personalized venue suggestions"
              : "Select a city and hit shuffle to get started"}
          </p>
        </div>
      )}
      
      {/* Add style for the shake animation */}
      <style jsx>{`
        @keyframes shake {
          0% { transform: translateX(0); }
          25% { transform: translateX(-2px); }
          50% { transform: translateX(0); }
          75% { transform: translateX(2px); }
          100% { transform: translateX(0); }
        }
        
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      
      <FloatingQuickAdd />
    </div>
  );
};

export default NightPlanner;
