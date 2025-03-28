import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import useAppStore from '../../hooks/useAppStore';

const FilterSection = () => {
  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState(null);
  const [selectedHashtags, setSelectedHashtags] = useState([]);
  
  // Get and set filters in the global store
  const setFilter = useAppStore((state) => state.setFilter || (() => {}));
  const clearFilters = useAppStore((state) => state.clearFilters || (() => {}));
  const activeFilters = useAppStore((state) => state.activeFilters || { city: null, neighborhood: null, tags: [] });

  // Sample data
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

  // Update store when filters change
  useEffect(() => {
    if (setFilter) {
      setFilter('city', selectedCity);
      setFilter('neighborhood', selectedNeighborhood);
      setFilter('tags', selectedHashtags);
    }
  }, [selectedCity, selectedNeighborhood, selectedHashtags, setFilter]);

  const handleCitySelect = (city) => {
    // If selecting the same city, deselect it
    if (city === selectedCity) {
      setSelectedCity(null);
      setSelectedNeighborhood(null);
      setSelectedHashtags([]);
    } else {
      setSelectedCity(city);
      setSelectedNeighborhood(null);
      setSelectedHashtags([]);
    }
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

  // Show the appropriate filter set based on selection state
  const renderFilterOptions = () => {
    if (selectedNeighborhood) {
      // Show hashtags if neighborhood is selected
      return (
        <div className="flex flex-wrap gap-2 mt-4">
          {hashtags.map(tag => (
            <button
              key={tag}
              onClick={() => handleHashtagToggle(tag)}
              className={`px-3 py-1 rounded-full text-sm border ${
                selectedHashtags.includes(tag)
                  ? 'border-black bg-black text-white'
                  : 'border-gray-300 hover:border-gray-400 text-gray-700'
              } transition-colors`}
            >
              #{tag}
            </button>
          ))}
        </div>
      );
    } else if (selectedCity) {
      // Show neighborhoods if city is selected
      return (
        <div className="flex flex-wrap gap-2 mt-4">
          {neighborhoods[selectedCity].map(neighborhood => (
            <button
              key={neighborhood}
              onClick={() => handleNeighborhoodSelect(neighborhood)}
              className={`px-3 py-1 rounded-full text-sm border ${
                selectedNeighborhood === neighborhood
                  ? 'border-black bg-black text-white'
                  : 'border-gray-300 hover:border-gray-400 text-gray-700'
              } transition-colors`}
            >
              {neighborhood}
            </button>
          ))}
        </div>
      );
    } else {
      // Show cities if nothing is selected
      return (
        <div className="flex flex-wrap gap-2 mt-4">
          {cities.map(city => (
            <button
              key={city}
              onClick={() => handleCitySelect(city)}
              className={`px-3 py-1 rounded-full text-sm border ${
                selectedCity === city
                  ? 'border-black bg-black text-white'
                  : 'border-gray-300 hover:border-gray-400 text-gray-700'
              } transition-colors`}
            >
              {city}
            </button>
          ))}
        </div>
      );
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-8 p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium text-gray-800">Filters</h3>
        
        {/* Only show clear all if any filters are selected */}
        {(selectedCity || selectedNeighborhood || selectedHashtags.length > 0) && (
          <button 
            onClick={handleClearAll}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Clear All
          </button>
        )}
      </div>
      
      {/* Active filter pills */}
      <div className="flex flex-wrap gap-2 mb-4">
        {selectedCity && (
          <span className="px-3 py-1 text-sm rounded-full border border-black bg-black text-white flex items-center">
            {selectedCity}
            <button onClick={() => handleCitySelect(selectedCity)} className="ml-1 text-white hover:text-gray-200">
              <X size={14} />
            </button>
          </span>
        )}
        
        {selectedNeighborhood && (
          <span className="px-3 py-1 text-sm rounded-full border border-black bg-black text-white flex items-center">
            {selectedNeighborhood}
            <button onClick={() => handleNeighborhoodSelect(selectedNeighborhood)} className="ml-1 text-white hover:text-gray-200">
              <X size={14} />
            </button>
          </span>
        )}
        
        {selectedHashtags.map(tag => (
          <span key={tag} className="px-3 py-1 text-sm rounded-full border border-black bg-black text-white flex items-center">
            #{tag}
            <button onClick={() => handleHashtagToggle(tag)} className="ml-1 text-white hover:text-gray-200">
              <X size={14} />
            </button>
          </span>
        ))}
      </div>
      
      {/* Dynamic filter options based on current selection */}
      {renderFilterOptions()}
    </div>
  );
};

export default FilterSection;