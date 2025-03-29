import React, { useState, useCallback } from 'react';
import { X } from 'lucide-react';
import useAppStore from '../../hooks/useAppStore';

const FilterSection = () => {
  const activeFilters = useAppStore((state) => state.activeFilters || { city: null, neighborhood: null, tags: [] });
  const [city, setCity] = useState(activeFilters.city || '');
  const [neighborhood, setNeighborhood] = useState(activeFilters.neighborhood || '');
  const [tags, setTags] = useState(activeFilters.tags || []);

  const cities = ['New York', 'Los Angeles', 'Chicago', 'Miami'];
  const neighborhoods = {
    'New York': ['Manhattan', 'Greenwich Village', 'Midtown', 'SoHo'],
    'Los Angeles': ['Hollywood', 'Venice', 'Downtown'],
    'Chicago': ['Loop', 'River North'],
    'Miami': ['South Beach']
  };
  const tagOptions = ['pizza', 'burgers', 'sushi', 'italian', 'fast-food', 'vegetarian'];

  const updateFilters = useAppStore((state) => state.setState);

  const handleCityChange = useCallback((e) => {
    const newCity = e.target.value;
    setCity(newCity);
    setNeighborhood('');
    updateFilters({ activeFilters: { city: newCity, neighborhood: null, tags } });
  }, [tags, updateFilters]);

  const handleNeighborhoodChange = useCallback((e) => {
    const newNeighborhood = e.target.value;
    setNeighborhood(newNeighborhood);
    updateFilters({ activeFilters: { city, neighborhood: newNeighborhood, tags } });
  }, [city, tags, updateFilters]);

  const handleTagToggle = useCallback((tag) => {
    const newTags = tags.includes(tag) ? tags.filter(t => t !== tag) : [...tags, tag];
    setTags(newTags);
    updateFilters({ activeFilters: { city, neighborhood, tags: newTags } });
  }, [city, neighborhood, tags, updateFilters]);

  const clearFilters = useCallback(() => {
    setCity('');
    setNeighborhood('');
    setTags([]);
    updateFilters({ activeFilters: { city: null, neighborhood: null, tags: [] } });
  }, [updateFilters]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#D1B399]/20 p-4 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        <button
          onClick={clearFilters}
          className="text-gray-500 hover:text-[#D1B399] text-sm flex items-center"
        >
          <X size={16} className="mr-1" /> Clear All
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
          <select
            value={city}
            onChange={handleCityChange}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#D1B399] focus:border-[#D1B399] outline-none"
          >
            <option value="">All Cities</option>
            {cities.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Neighborhood</label>
          <select
            value={neighborhood}
            onChange={handleNeighborhoodChange}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#D1B399] focus:border-[#D1B399] outline-none"
            disabled={!city}
          >
            <option value="">All Neighborhoods</option>
            {city && neighborhoods[city]?.map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
          <div className="flex flex-wrap gap-2">
            {tagOptions.map(tag => (
              <button
                key={tag}
                onClick={() => handleTagToggle(tag)}
                className={`px-2 py-1 text-sm rounded-full transition-colors ${
                  tags.includes(tag) ? 'bg-[#D1B399] text-white' : 'bg-gray-100 text-gray-700 hover:bg-[#D1B399]/50'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterSection;