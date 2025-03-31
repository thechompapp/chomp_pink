import React, { useState, useCallback } from "react";
import { X } from "lucide-react";
import useAppStore from "@/hooks/useAppStore";

const FilterSection = () => {
  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState(null);
  const [selectedHashtags, setSelectedHashtags] = useState([]);

  const updateFilters = useAppStore((state) => state.updateFilters || (() => {}));
  const clearFilters = useAppStore((state) => state.clearFilters || (() => {}));

  const cities = ["New York", "Los Angeles", "Chicago", "Miami"];
  const neighborhoods = {
    "New York": ["Manhattan", "Brooklyn", "Queens", "Bronx"],
    "Los Angeles": ["Hollywood", "Downtown", "Venice", "Silver Lake"],
    "Chicago": ["Loop", "River North", "Wicker Park", "Logan Square"],
    "Miami": ["South Beach", "Wynwood", "Downtown", "Brickell"],
  };
  const hashtags = ["Pizza", "Burgers", "Tacos", "Sushi", "Coffee", "Cocktails", "Brunch", "Vegan"];

  const handleCitySelect = useCallback((city) => {
    try {
      const newCity = city === selectedCity ? null : city;
      setSelectedCity(newCity);
      setSelectedNeighborhood(null);
      setSelectedHashtags([]);
      updateFilters({ city: newCity, neighborhood: null, tags: [] });
    } catch (error) {
      console.error('Error selecting city:', error);
    }
  }, [selectedCity, updateFilters]);

  const handleNeighborhoodSelect = useCallback((neighborhood) => {
    try {
      const newNeighborhood = neighborhood === selectedNeighborhood ? null : neighborhood;
      setSelectedNeighborhood(newNeighborhood);
      updateFilters({ neighborhood: newNeighborhood });
    } catch (error) {
      console.error('Error selecting neighborhood:', error);
    }
  }, [selectedNeighborhood, updateFilters]);

  const handleHashtagToggle = useCallback((hashtag) => {
    try {
      setSelectedHashtags((prev) => {
        const newHashtags = prev.includes(hashtag)
          ? prev.filter((h) => h !== hashtag)
          : [...prev, hashtag];
        updateFilters({ tags: newHashtags });
        return newHashtags;
      });
    } catch (error) {
      console.error('Error toggling hashtag:', error);
    }
  }, [updateFilters]);

  const handleClearAll = useCallback(() => {
    try {
      setSelectedCity(null);
      setSelectedNeighborhood(null);
      setSelectedHashtags([]);
      clearFilters();
    } catch (error) {
      console.error('Error clearing filters:', error);
    }
  }, [clearFilters]);

  const renderFilterOptions = () => {
    if (selectedNeighborhood) {
      return (
        <div className="flex flex-wrap gap-2 mt-4">
          {hashtags.map((tag) => (
            <button
              key={tag}
              onClick={() => handleHashtagToggle(tag)}
              className={`px-3 py-1 rounded-full text-sm border ${
                selectedHashtags.includes(tag)
                  ? "border-[#D1B399] bg-[#D1B399] text-white"
                  : "border-[#D1B399] hover:bg-[#D1B399] hover:text-white text-gray-700"
              } transition-colors`}
            >
              #{tag}
            </button>
          ))}
        </div>
      );
    } else if (selectedCity) {
      return (
        <div className="flex flex-wrap gap-2 mt-4">
          {neighborhoods[selectedCity].map((neighborhood) => (
            <button
              key={neighborhood}
              onClick={() => handleNeighborhoodSelect(neighborhood)}
              className={`px-3 py-1 rounded-full text-sm border ${
                selectedNeighborhood === neighborhood
                  ? "border-[#D1B399] bg-[#D1B399] text-white"
                  : "border-[#D1B399] hover:bg-[#D1B399] hover:text-white text-gray-700"
              } transition-colors`}
            >
              {neighborhood}
            </button>
          ))}
        </div>
      );
    } else {
      return (
        <div className="flex flex-wrap gap-2 mt-4">
          {cities.map((city) => (
            <button
              key={city}
              onClick={() => handleCitySelect(city)}
              className={`px-3 py-1 rounded-full text-sm border ${
                selectedCity === city
                  ? "border-[#D1B399] bg-[#D1B399] text-white"
                  : "border-[#D1B399] hover:bg-[#D1B399] hover:text-white text-gray-700"
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
    <div className="bg-white rounded-lg border border-[#D1B399] overflow-hidden mb-8 p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium text-gray-800">Filters</h3>
        {(selectedCity || selectedNeighborhood || selectedHashtags.length > 0) && (
          <button
            onClick={handleClearAll}
            className="text-sm text-[#D1B399] hover:text-[#b89e89]"
          >
            Clear All
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        {selectedCity && (
          <span className="px-3 py-1 text-sm rounded-full border border-[#D1B399] bg-[#D1B399] text-white flex items-center">
            {selectedCity}
            <button onClick={() => handleCitySelect(selectedCity)} className="ml-1 text-white hover:text-gray-200">
              <X size={14} />
            </button>
          </span>
        )}
        {selectedNeighborhood && (
          <span className="px-3 py-1 text-sm rounded-full border border-[#D1B399] bg-[#D1B399] text-white flex items-center">
            {selectedNeighborhood}
            <button onClick={() => handleNeighborhoodSelect(selectedNeighborhood)} className="ml-1 text-white hover:text-gray-200">
              <X size={14} />
            </button>
          </span>
        )}
        {selectedHashtags.map((tag) => (
          <span key={tag} className="px-3 py-1 text-sm rounded-full border border-[#D1B399] bg-[#D1B399] text-white flex items-center">
            #{tag}
            <button onClick={() => handleHashtagToggle(tag)} className="ml-1 text-white hover:text-gray-200">
              <X size={14} />
            </button>
          </span>
        ))}
      </div>
      {renderFilterOptions()}
    </div>
  );
};

export default FilterSection;