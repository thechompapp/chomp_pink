import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, X } from 'lucide-react';
import useAppStore from '../../hooks/useAppStore';

const FilterSection = () => {
  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState(null);
  const [selectedHashtags, setSelectedHashtags] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState({
    cities: true,
    neighborhoods: false,
    hashtags: false
  });

  // Get and set filters in the global store
  const setFilter = useAppStore((state) => state.setFilter || (() => {})); // Fallback if not in store
  const clearFilters = useAppStore((state) => state.clearFilters || (() => {})); // Fallback if not in store
  const activeFilters = useAppStore((state) => state.activeFilters || { city: null, neighborhood: null, tags: [] });

  // Sample data - in a real app, this could come from your API or store
  const cities = ["New York", "Los Angeles", "Chicago", "Miami"];
  const neighborhoods = {
    "New York": ["Manhattan", "Brooklyn", "Queens", "Bronx"],
    "Los Angeles": ["Hollywood", "Downtown", "Venice", "Silver Lake"],
    "Chicago": ["Loop", "River North", "Wicker Park", "Logan Square"],
    "Miami": ["South Beach", "Wynwood", "Downtown", "Brickell"]
  };
  const hashtags = ["Pizza", "Burgers", "Tacos", "Sushi", "Coffee", "Cocktails", "Brunch", "Vegan"];

  // Sync component state with store state on mount
  useEffect(() => {
    if (activeFilters) {
      setSelectedCity(activeFilters.city);
      setSelectedNeighborhood(activeFilters.neighborhood);
      setSelectedHashtags(activeFilters.tags || []);
    }
  }, [activeFilters]);

  useEffect(() => {
    // Automatically expand neighborhoods when a city is selected
    if (selectedCity) {
      setExpandedCategories(prev => ({ ...prev, neighborhoods: true }));
    }
    
    // Automatically expand hashtags when a neighborhood is selected
    if (selectedNeighborhood) {
      setExpandedCategories(prev => ({ ...prev, hashtags: true }));
    }
  }, [selectedCity, selectedNeighborhood]);

  // Update store when filters change
  useEffect(() => {
    if (setFilter) {
      setFilter('city', selectedCity);
      setFilter('neighborhood', selectedNeighborhood);
      setFilter('tags', selectedHashtags);
    }
  }, [selectedCity, selectedNeighborhood, selectedHashtags, setFilter]);

  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const handleCitySelect = (city) => {
    // If selecting the same city, deselect it
    if (city === selectedCity) {
      setSelectedCity(null);
      setSelectedNeighborhood(null);
    } else {
      setSelectedCity(city);
      setSelectedNeighborhood(null);
    }
    // Clear hashtags when changing city
    setSelectedHashtags([]);
  };

  const handleNeighborhoodSelect = (neighborhood) => {
    // If selecting the same neighborhood, deselect it
    setSelectedNeighborhood(neighborhood === selectedNeighborhood ? null : neighborhood);
  };

  const handleHashtagToggle = (hashtag) => {
    setSelectedHashtags(prev => 
      prev.includes(hashtag) ? prev.filter(h => h !== hashtag) : [...prev, hashtag]
    );
  };

  const handleClearAll = () => {
    setSelectedCity(null);
    setSelectedNeighborhood(null);
    setSelectedHashtags([]);
    if (clearFilters) clearFilters();
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
      {/* Filter header with active selections */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <h3 className="font-semibold text-gray-800">Filters</h3>
        
        {/* Selected filters */}
        <div className="flex flex-wrap gap-2">
          {(selectedCity || selectedNeighborhood || selectedHashtags.length > 0) && (
            <button 
              onClick={handleClearAll}
              className="px-3 py-1 text-sm rounded-full bg-red-100 text-red-700 hover:bg-red-200 transition-colors flex items-center"
            >
              Clear All <X size={14} className="ml-1" />
            </button>
          )}
        </div>
      </div>
      
      {/* Active filter pills */}
      {(selectedCity || selectedNeighborhood || selectedHashtags.length > 0) && (
        <div className="px-4 py-2 bg-gray-50 flex flex-wrap gap-2">
          {selectedCity && (
            <span className="px-3 py-1 text-sm rounded-full bg-blue-100 text-blue-700 flex items-center">
              {selectedCity}
              <button onClick={() => handleCitySelect(selectedCity)} className="ml-1 text-blue-500 hover:text-blue-700">
                <X size={14} />
              </button>
            </span>
          )}
          
          {selectedNeighborhood && (
            <span className="px-3 py-1 text-sm rounded-full bg-green-100 text-green-700 flex items-center">
              {selectedNeighborhood}
              <button onClick={() => handleNeighborhoodSelect(selectedNeighborhood)} className="ml-1 text-green-500 hover:text-green-700">
                <X size={14} />
              </button>
            </span>
          )}
          
          {selectedHashtags.map(tag => (
            <span key={tag} className="px-3 py-1 text-sm rounded-full bg-purple-100 text-purple-700 flex items-center">
              #{tag}
              <button onClick={() => handleHashtagToggle(tag)} className="ml-1 text-purple-500 hover:text-purple-700">
                <X size={14} />
              </button>
            </span>
          ))}
        </div>
      )}
      
      {/* Hierarchical filter content */}
      <div className="p-4">
        {/* Cities category */}
        <div className="mb-3">
          <button 
            onClick={() => toggleCategory('cities')}
            className="w-full flex items-center justify-between py-2 px-1 font-medium text-gray-700 hover:text-pink-500"
          >
            <span>City</span>
            {expandedCategories.cities ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </button>
          
          {expandedCategories.cities && (
            <div className="mt-2 ml-2 grid grid-cols-2 gap-2">
              {cities.map(city => (
                <button
                  key={city}
                  onClick={() => handleCitySelect(city)}
                  className={`text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    selectedCity === city 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Neighborhoods category - only show if a city is selected */}
        {selectedCity && (
          <div className="mb-3">
            <button 
              onClick={() => toggleCategory('neighborhoods')}
              className="w-full flex items-center justify-between py-2 px-1 font-medium text-gray-700 hover:text-pink-500"
            >
              <span>Neighborhood</span>
              {expandedCategories.neighborhoods ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </button>
            
            {expandedCategories.neighborhoods && (
              <div className="mt-2 ml-2 grid grid-cols-2 gap-2">
                {neighborhoods[selectedCity].map(neighborhood => (
                  <button
                    key={neighborhood}
                    onClick={() => handleNeighborhoodSelect(neighborhood)}
                    className={`text-left px-3 py-2 rounded-md text-sm transition-colors ${
                      selectedNeighborhood === neighborhood 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {neighborhood}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Hashtags category - expand once neighborhood is selected */}
        {selectedNeighborhood && (
          <div className="mb-3">
            <button 
              onClick={() => toggleCategory('hashtags')}
              className="w-full flex items-center justify-between py-2 px-1 font-medium text-gray-700 hover:text-pink-500"
            >
              <span>Tags</span>
              {expandedCategories.hashtags ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </button>
            
            {expandedCategories.hashtags && (
              <div className="mt-2 ml-2 flex flex-wrap gap-2">
                {hashtags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => handleHashtagToggle(tag)}
                    className={`px-3 py-1 rounded-full text-sm ${
                      selectedHashtags.includes(tag)
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FilterSection;