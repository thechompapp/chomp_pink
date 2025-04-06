// src/components/FilterSection.jsx
import React, { useEffect, useMemo, useCallback, useState } from 'react';
import { X, MapPin, Tag, RotateCcw, Search } from 'lucide-react';
import useUIStateStore from '@/stores/useUIStateStore';
import PillButton from '@/components/UI/PillButton';
import apiClient from '@/services/apiClient';

const FilterSection = () => {
  const cities = useUIStateStore(state => state.cities || []);
  const cuisines = useUIStateStore(state => state.cuisines || []);
  const cityId = useUIStateStore(state => state.cityId);
  const neighborhoodId = useUIStateStore(state => state.neighborhoodId);
  const selectedHashtags = useUIStateStore(state => state.hashtags || []);
  const fetchCities = useUIStateStore(state => state.fetchCities);
  const fetchCuisines = useUIStateStore(state => state.fetchCuisines);
  const setCityId = useUIStateStore(state => state.setCityId);
  const setNeighborhoodId = useUIStateStore(state => state.setNeighborhoodId);
  const setHashtags = useUIStateStore(state => state.setHashtags);
  const clearAllFilters = useUIStateStore(state => state.clearAllFilters);

  const [neighborhoods, setNeighborhoods] = useState([]);
  const [isLoadingNeighborhoods, setIsLoadingNeighborhoods] = useState(false);
  const [hashtagSearch, setHashtagSearch] = useState('');
  const [filteredCuisines, setFilteredCuisines] = useState(cuisines);

  useEffect(() => {
    console.log('[FilterSection] Initial fetch - cities:', cities.length, 'cuisines:', cuisines.length);
    if (cities.length === 0) fetchCities();
    if (cuisines.length === 0) fetchCuisines();
  }, [fetchCities, fetchCuisines, cities.length, cuisines.length]);

  useEffect(() => {
    console.log(`[FilterSection] cityId changed to: ${cityId} (type: ${typeof cityId})`);
    const fetchNeighborhoods = async () => {
      if (!cityId) {
        console.log('[FilterSection] No cityId, clearing neighborhoods');
        setNeighborhoods([]);
        setIsLoadingNeighborhoods(false);
        return;
      }
      setIsLoadingNeighborhoods(true);
      try {
        const cityIdInt = parseInt(cityId, 10);
        if (isNaN(cityIdInt)) {
          throw new Error('cityId is not a valid integer');
        }
        console.log(`[FilterSection] Fetching neighborhoods for cityId: ${cityIdInt}`);
        const data = await apiClient(`/api/filters/neighborhoods?cityId=${cityIdInt}`, 'FilterSection Fetch Neighborhoods');
        console.log(`[FilterSection] Neighborhoods fetched:`, data);
        setNeighborhoods(data || []);
      } catch (err) {
        console.error('[FilterSection] Error fetching neighborhoods:', err);
        console.error('[FilterSection] Error details:', err.response?.data || err.message);
        setNeighborhoods([]);
      } finally {
        setIsLoadingNeighborhoods(false);
        console.log('[FilterSection] Finished fetching neighborhoods, isLoadingNeighborhoods:', false);
      }
    };
    fetchNeighborhoods();
  }, [cityId]);

  useEffect(() => {
    setFilteredCuisines(
      hashtagSearch.trim() === ''
        ? cuisines
        : cuisines.filter(cuisine => cuisine.name.toLowerCase().includes(hashtagSearch.toLowerCase()))
    );
  }, [hashtagSearch, cuisines]);

  const selectedCity = useMemo(() => {
    const city = cities.find(c => c.id === cityId);
    console.log('[FilterSection] Selected city:', city);
    return city;
  }, [cities, cityId]);

  const selectedNeighborhood = useMemo(() => {
    const neighborhood = neighborhoods.find(n => n.id === neighborhoodId);
    console.log('[FilterSection] Selected neighborhood:', neighborhood);
    return neighborhood;
  }, [neighborhoods, neighborhoodId]);

  const hasActiveFilters = !!selectedCity || !!selectedNeighborhood || selectedHashtags.length > 0;

  const handleCityClick = useCallback((id) => {
    const idInt = parseInt(id, 10);
    console.log(`[FilterSection] City clicked, setting cityId to: ${idInt} (type: ${typeof idInt})`);
    setCityId(cityId === idInt ? null : idInt);
    if (cityId === idInt) {
      // Clear neighborhoodId when deselecting the city
      setNeighborhoodId(null);
    }
  }, [cityId, setCityId, setNeighborhoodId]);

  const handleNeighborhoodClick = useCallback((id) => {
    const idInt = parseInt(id, 10);
    console.log(`[FilterSection] Neighborhood clicked, setting neighborhoodId to: ${idInt}`);
    setNeighborhoodId(neighborhoodId === idInt ? null : idInt);
  }, [neighborhoodId, setNeighborhoodId]);

  const handleHashtagClick = useCallback(
    (hashtagName) => {
      const newSelection = selectedHashtags.includes(hashtagName)
        ? selectedHashtags.filter(h => h !== hashtagName)
        : [...selectedHashtags, hashtagName];
      setHashtags(newSelection);
    },
    [selectedHashtags, setHashtags]
  );

  const removeCityFilter = useCallback(() => {
    console.log('[FilterSection] Removing city filter');
    setCityId(null);
    setNeighborhoodId(null);
  }, [setCityId, setNeighborhoodId]);

  const removeNeighborhoodFilter = useCallback(() => {
    console.log('[FilterSection] Removing neighborhood filter');
    setNeighborhoodId(null);
  }, [setNeighborhoodId]);

  const removeHashtagFilter = useCallback(
    (hashtagName) => setHashtags(selectedHashtags.filter(h => h !== hashtagName)),
    [selectedHashtags, setHashtags]
  );

  const handleHashtagSearchChange = (e) => setHashtagSearch(e.target.value);

  console.log('[FilterSection] Rendering - cityId:', cityId, 'neighborhoodId:', neighborhoodId, 'selectedCity:', selectedCity, 'selectedNeighborhood:', selectedNeighborhood, 'isLoadingNeighborhoods:', isLoadingNeighborhoods, 'neighborhoods:', neighborhoods);

  return (
    <div className="space-y-3 mb-6 max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 p-2 bg-gray-100 border border-gray-200 rounded-lg">
          <span className="text-sm font-medium text-gray-600 mr-1">Filters:</span>
          {selectedCity && (
            <span className="inline-flex items-center pl-2 pr-1 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
              <MapPin size={13} className="mr-1 text-blue-600" />
              {selectedCity.name}
              <button
                type="button"
                onClick={removeCityFilter}
                className="ml-1 p-0.5 text-blue-500 hover:text-blue-700 hover:bg-blue-200 rounded-full focus:outline-none focus:bg-blue-200"
                aria-label={`Remove city filter ${selectedCity.name}`}
              >
                <X size={14} />
              </button>
            </span>
          )}
          {selectedNeighborhood && (
            <span className="inline-flex items-center pl-2 pr-1 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
              <MapPin size={13} className="mr-1 text-blue-600" />
              {selectedNeighborhood.name}
              <button
                type="button"
                onClick={removeNeighborhoodFilter}
                className="ml-1 p-0.5 text-blue-500 hover:text-blue-700 hover:bg-blue-200 rounded-full focus:outline-none focus:bg-blue-200"
                aria-label={`Remove neighborhood filter ${selectedNeighborhood.name}`}
              >
                <X size={14} />
              </button>
            </span>
          )}
          {selectedHashtags.map(hashtag => (
            <span
              key={hashtag}
              className="inline-flex items-center pl-2 pr-1 py-0.5 rounded-full text-sm font-medium bg-teal-100 text-teal-800 border border-teal-200"
            >
              <Tag size={13} className="mr-1 text-teal-600" />
              {hashtag}
              <button
                type="button"
                onClick={() => removeHashtagFilter(hashtag)}
                className="ml-1 p-0.5 text-teal-500 hover:text-teal-700 hover:bg-teal-200 rounded-full focus:outline-none focus:bg-teal-200"
                aria-label={`Remove hashtag filter ${hashtag}`}
              >
                <X size={14} />
              </button>
            </span>
          ))}
          <button
            onClick={clearAllFilters}
            className="ml-auto text-xs text-gray-500 hover:text-red-600 hover:underline font-medium px-2 py-1 flex items-center gap-1"
          >
            <RotateCcw size={12} />
            Reset All
          </button>
        </div>
      )}

      {!cityId ? (
        <div className="flex flex-wrap items-center gap-2">
          {cities.map(city => (
            <PillButton
              key={city.id}
              label={city.name}
              isActive={cityId === city.id}
              onClick={() => handleCityClick(city.id)}
            />
          ))}
          {cities.length === 0 && <span className="text-sm text-gray-400">Loading cities...</span>}
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          {isLoadingNeighborhoods ? (
            <span className="text-sm text-gray-400">Loading neighborhoods...</span>
          ) : neighborhoods.length > 0 ? (
            neighborhoods.map(neighborhood => (
              <PillButton
                key={neighborhood.id}
                label={neighborhood.name}
                isActive={neighborhoodId === neighborhood.id}
                onClick={() => handleNeighborhoodClick(neighborhood.id)}
              />
            ))
          ) : (
            <span className="text-sm text-gray-400">No neighborhoods available for {selectedCity?.name || 'selected city'}. Please check the database.</span>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <div className="relative">
          <input
            type="text"
            value={hashtagSearch}
            onChange={handleHashtagSearchChange}
            placeholder="Search hashtags..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D1B399] text-sm"
          />
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {filteredCuisines.map(cuisine => (
            <PillButton
              key={cuisine.id}
              label={cuisine.name}
              prefix="#"
              isActive={selectedHashtags.includes(cuisine.name)}
              onClick={() => handleHashtagClick(cuisine.name)}
            />
          ))}
          {filteredCuisines.length === 0 && cuisines.length > 0 && (
            <span className="text-sm text-gray-400">No hashtags match your search.</span>
          )}
          {cuisines.length === 0 && <span className="text-sm text-gray-400">Loading filters...</span>}
        </div>
      </div>
    </div>
  );
};

export default FilterSection;