// src/pages/Home/FilterSection.jsx
import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import useAppStore from '../../hooks/useAppStore';

const FilterSection = () => {
  // Use individual selectors from the store
  const filters = useAppStore(state => state.filters);
  const setCity = useAppStore(state => state.setCity);
  const setNeighborhood = useAppStore(state => state.setNeighborhood);
  const setCuisines = useAppStore(state => state.setCuisines);
  const resetFilters = useAppStore(state => state.resetFilters);
  const fetchNeighborhoods = useAppStore(state => state.fetchNeighborhoods);
  const cityOptions = useAppStore(state => state.cityOptions);
  const neighborhoodOptions = useAppStore(state => state.neighborhoodOptions);
  const cuisineOptions = useAppStore(state => state.cuisineOptions);

  // When city changes, fetch neighborhoods
  useEffect(() => {
    if (filters.city) {
      fetchNeighborhoods(filters.city);
    }
  }, [filters.city, fetchNeighborhoods]);

  const handleCityChange = (e) => {
    const cityId = e.target.value === "" ? null : parseInt(e.target.value);
    setCity(cityId);
  };

  const handleNeighborhoodChange = (e) => {
    const neighborhoodId = e.target.value === "" ? null : parseInt(e.target.value);
    setNeighborhood(neighborhoodId);
  };

  const handleCuisineChange = (e) => {
    const options = e.target.options;
    const selectedCuisines = [];
    
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selectedCuisines.push(options[i].value);
      }
    }
    
    setCuisines(selectedCuisines);
  };

  // Get the city name from selected ID
  const selectedCityName = filters.city 
    ? cityOptions.find(city => city.id === filters.city)?.name 
    : null;

  // Get the neighborhood name from selected ID
  const selectedNeighborhoodName = filters.neighborhood 
    ? neighborhoodOptions.find(hood => hood.id === filters.neighborhood)?.name 
    : null;

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6">
      <div className="mb-4">
        <h2 className="text-xl font-bold mb-2">Filter Options</h2>
        
        {/* Selected Filters Display */}
        <div className="flex flex-wrap gap-2 mb-4">
          {selectedCityName && (
            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center">
              <span className="mr-1">{selectedCityName}</span>
              <button 
                onClick={() => setCity(null)} 
                className="text-blue-500 hover:text-blue-700"
              >
                <X size={16} />
              </button>
            </div>
          )}
          
          {selectedNeighborhoodName && (
            <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full flex items-center">
              <span className="mr-1">{selectedNeighborhoodName}</span>
              <button 
                onClick={() => setNeighborhood(null)} 
                className="text-green-500 hover:text-green-700"
              >
                <X size={16} />
              </button>
            </div>
          )}
          
          {filters.cuisines.map(cuisine => (
            <div 
              key={cuisine} 
              className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full flex items-center"
            >
              <span className="mr-1">{cuisine}</span>
              <button 
                onClick={() => setCuisines(filters.cuisines.filter(c => c !== cuisine))} 
                className="text-purple-500 hover:text-purple-700"
              >
                <X size={16} />
              </button>
            </div>
          ))}
          
          {(selectedCityName || selectedNeighborhoodName || filters.cuisines.length > 0) && (
            <button 
              onClick={resetFilters}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Clear All
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* City Dropdown */}
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
              City
            </label>
            <select
              id="city"
              className="w-full p-2 border border-gray-300 rounded-md"
              value={filters.city || ""}
              onChange={handleCityChange}
            >
              <option value="">All Cities</option>
              {cityOptions.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* Neighborhood Dropdown */}
          <div>
            <label htmlFor="neighborhood" className="block text-sm font-medium text-gray-700 mb-1">
              Neighborhood
            </label>
            <select
              id="neighborhood"
              className="w-full p-2 border border-gray-300 rounded-md"
              value={filters.neighborhood || ""}
              onChange={handleNeighborhoodChange}
              disabled={!filters.city || neighborhoodOptions.length === 0}
            >
              <option value="">All Neighborhoods</option>
              {neighborhoodOptions.map((hood) => (
                <option key={hood.id} value={hood.id}>
                  {hood.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* Cuisines Multi-Select */}
          <div>
            <label htmlFor="cuisines" className="block text-sm font-medium text-gray-700 mb-1">
              Cuisines
            </label>
            <select
              id="cuisines"
              multiple
              className="w-full p-2 border border-gray-300 rounded-md h-32"
              value={filters.cuisines}
              onChange={handleCuisineChange}
            >
              {cuisineOptions.map((cuisine) => (
                <option key={cuisine.id} value={cuisine.name}>
                  {cuisine.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Hold Ctrl/Cmd to select multiple
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterSection;