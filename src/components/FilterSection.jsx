/* src/components/FilterSection.jsx */
import React, { useEffect, useMemo, useCallback, useState } from 'react';
import { X, MapPin, Tag, RotateCcw, Search, Loader2 } from 'lucide-react';
import { useUIStateStore } from '@/stores/useUIStateStore';
import PillButton from '@/components/UI/PillButton';
import Input from '@/components/UI/Input'; // Import Input component
import Select from '@/components/UI/Select'; // Import Select component

const FilterSection = () => {
  const cities = useUIStateStore(state => state.cities || []);
  const neighborhoods = useUIStateStore(state => state.neighborhoods || []);
  const cuisines = useUIStateStore(state => state.cuisines || []);
  const cityId = useUIStateStore(state => state.cityId);
  const neighborhoodId = useUIStateStore(state => state.neighborhoodId);
  const selectedHashtags = useUIStateStore(state => state.hashtags || []);
  const isLoadingCities = useUIStateStore(state => state.isLoadingCities);
  const isLoadingNeighborhoods = useUIStateStore(state => state.isLoadingNeighborhoods);
  const isLoadingCuisines = useUIStateStore(state => state.isLoadingCuisines);
  const fetchCities = useUIStateStore(state => state.fetchCities);
  const fetchCuisines = useUIStateStore(state => state.fetchCuisines);
  const fetchNeighborhoods = useUIStateStore(state => state.fetchNeighborhoods);
  const setCityId = useUIStateStore(state => state.setCityId);
  const setNeighborhoodId = useUIStateStore(state => state.setNeighborhoodId);
  const setHashtags = useUIStateStore(state => state.setHashtags);
  const clearAllFilters = useUIStateStore(state => state.clearAllFilters);
  const errorCities = useUIStateStore(state => state.errorCities); // Get error state

  const [hashtagSearch, setHashtagSearch] = useState('');
  const [filteredCuisines, setFilteredCuisines] = useState([]);

  // Fetch initial data
  useEffect(() => {
    if (cities.length === 0 && !isLoadingCities) fetchCities();
    if (cuisines.length === 0 && !isLoadingCuisines) fetchCuisines();
  }, [fetchCities, fetchCuisines, cities.length, cuisines.length, isLoadingCities, isLoadingCuisines]);

  // Fetch neighborhoods when city changes
  useEffect(() => {
    const cityIdInt = parseInt(String(cityId), 10);
    if (!isNaN(cityIdInt) && cityIdInt > 0) {
      fetchNeighborhoods(cityIdInt);
    } else {
       if (useUIStateStore.getState().neighborhoods.length > 0) {
          useUIStateStore.setState({ neighborhoods: [], loadedNeighborhoodsForCityId: null, errorNeighborhoods: null });
       }
    }
  }, [cityId, fetchNeighborhoods]);

  // Filter cuisines based on search input
  useEffect(() => {
    const searchLower = hashtagSearch.trim().toLowerCase();
    if (searchLower === '') {
      setFilteredCuisines(cuisines);
    } else {
      setFilteredCuisines(
        (cuisines || []).filter(cuisine =>
          cuisine?.name?.toLowerCase().includes(searchLower)
        )
      );
    }
  }, [hashtagSearch, cuisines]);

  const selectedCity = useMemo(() => { /* ... same logic ... */
    const currentCityId = cityId != null ? parseInt(String(cityId), 10) : null;
    return (cities || []).find(c => c.id === currentCityId);
   }, [cities, cityId]);

  const selectedNeighborhood = useMemo(() => { /* ... same logic ... */
    const currentNeighborhoodId = neighborhoodId != null ? parseInt(String(neighborhoodId), 10) : null;
    return (neighborhoods || []).find(n => n.id === currentNeighborhoodId);
   }, [neighborhoods, neighborhoodId]);

  const hasActiveFilters = useMemo(() => { /* ... same logic ... */
      return cityId != null || neighborhoodId != null || (selectedHashtags && selectedHashtags.length > 0);
   }, [cityId, neighborhoodId, selectedHashtags]);

  const handleCityClick = useCallback((id) => { /* ... same logic ... */
    const idInt = parseInt(String(id), 10);
    const currentCityId = useUIStateStore.getState().cityId;
    const nextCityId = currentCityId === idInt ? null : idInt;
    setCityId(nextCityId);
  }, [setCityId]);
  const handleNeighborhoodClick = useCallback((id) => { /* ... same logic ... */
    const idInt = parseInt(String(id), 10);
    const currentNeighborhoodId = useUIStateStore.getState().neighborhoodId;
    const nextNeighborhoodId = currentNeighborhoodId === idInt ? null : idInt;
    setNeighborhoodId(nextNeighborhoodId);
  }, [setNeighborhoodId]);
  const handleHashtagClick = useCallback((hashtagName) => { /* ... same logic ... */
    const currentHashtags = useUIStateStore.getState().hashtags || [];
    const newSelection = currentHashtags.includes(hashtagName)
      ? currentHashtags.filter(h => h !== hashtagName)
      : [...currentHashtags, hashtagName];
    setHashtags(newSelection);
  }, [setHashtags]);
  const removeCityFilter = useCallback(() => { setCityId(null); }, [setCityId]);
  const removeNeighborhoodFilter = useCallback(() => { setNeighborhoodId(null); }, [setNeighborhoodId]);
  const removeHashtagFilter = useCallback((hashtagName) => { /* ... same logic ... */
    const currentHashtags = useUIStateStore.getState().hashtags || [];
    setHashtags(currentHashtags.filter(h => h !== hashtagName));
   }, [setHashtags]);
  const handleClearAllFilters = useCallback(() => { clearAllFilters(); setHashtagSearch(''); }, [clearAllFilters]);
  const handleHashtagSearchChange = (e) => { setHashtagSearch(e.target.value); };

  return (
    <div className="space-y-4 mb-6"> {/* Removed container/mx-auto, handle in parent */}
      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 p-3 bg-gray-50/80 border border-gray-200 rounded-lg shadow-sm">
          <span className="text-sm font-medium text-gray-700 mr-2">Filters:</span>
          {/* City Chip */}
          {selectedCity && ( <span className="inline-flex items-center bg-white border border-gray-300 rounded-full px-2.5 py-0.5 text-xs font-medium text-gray-700"><MapPin size={12} className="mr-1 text-gray-400"/> {selectedCity.name} <button onClick={removeCityFilter} className="ml-1 text-gray-400 hover:text-gray-600 focus:outline-none"><X size={12} /></button></span> )}
          {/* Neighborhood Chip */}
          {selectedNeighborhood && ( <span className="inline-flex items-center bg-white border border-gray-300 rounded-full px-2.5 py-0.5 text-xs font-medium text-gray-700"><MapPin size={12} className="mr-1 text-gray-400"/> {selectedNeighborhood.name} <button onClick={removeNeighborhoodFilter} className="ml-1 text-gray-400 hover:text-gray-600 focus:outline-none"><X size={12} /></button></span> )}
          {/* Hashtag Chips */}
          {(selectedHashtags || []).map(hashtag => ( <span key={hashtag} className="inline-flex items-center bg-white border border-gray-300 rounded-full px-2.5 py-0.5 text-xs font-medium text-gray-700"><Tag size={12} className="mr-1 text-gray-400"/> {hashtag} <button onClick={() => removeHashtagFilter(hashtag)} className="ml-1 text-gray-400 hover:text-gray-600 focus:outline-none"><X size={12} /></button></span> ))}
          {/* Reset Button */}
          <button onClick={handleClearAllFilters} className="flex items-center text-xs text-gray-500 hover:text-red-600 ml-auto px-2 py-1 rounded hover:bg-red-50 transition-colors focus:outline-none focus:ring-1 focus:ring-red-500">
              <RotateCcw size={12} className="mr-1" /> Reset All
          </button>
        </div>
      )}

      {/* City/Neighborhood Selection */}
      <div className="flex flex-wrap items-center gap-2 min-h-[36px]">
        {!cityId ? ( // Show Cities
          isLoadingCities ? ( <span className="text-sm text-gray-500 flex items-center"><Loader2 size={14} className="animate-spin mr-1"/> Loading cities...</span> )
          : errorCities ? (<span className="text-sm text-red-600">Error loading cities.</span>) // Show error
          : (cities && cities.length > 0) ? ( cities.map(city => ( <PillButton key={`city-${city.id}`} label={city.name} isActive={false} onClick={() => handleCityClick(city.id)}/> )) )
          : ( <span className="text-sm text-gray-500">No cities available.</span> )
        ) : ( // Show Neighborhoods
          isLoadingNeighborhoods ? ( <span className="text-sm text-gray-500 flex items-center"><Loader2 size={14} className="animate-spin mr-1"/> Loading neighborhoods...</span> )
          : (neighborhoods && neighborhoods.length > 0) ? ( neighborhoods.map(neighborhood => ( <PillButton key={`neigh-${neighborhood.id}`} label={neighborhood.name} isActive={neighborhoodId === neighborhood.id} onClick={() => handleNeighborhoodClick(neighborhood.id)}/> )) )
          : ( <span className="text-sm text-gray-500 italic">No neighborhoods listed for {selectedCity?.name}.</span> )
        )}
      </div>

      {/* Hashtag Selection */}
      <div className="flex flex-col gap-3 pt-2">
        {/* Hashtag Search Input */}
        {/* --- Corrected Search Input & Icon --- */}
        <div className="relative max-w-xs">
          <label htmlFor="hashtag-search-input" className="sr-only">Search Cuisines/Tags</label>
           <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
               <Search className="h-4 w-4 text-gray-400" aria-hidden="true" />
           </div>
          <Input
                id="hashtag-search-input"
                type="search"
                value={hashtagSearch}
                onChange={handleHashtagSearchChange}
                placeholder="Search cuisines/tags..."
                className="pl-9 pr-3 py-1.5 text-sm" // Adjusted padding/size
                aria-label="Search hashtags"
            />
        </div>
        {/* --- End Correction --- */}

        {/* Hashtag Pills */}
        <div className="flex flex-wrap items-center gap-2 min-h-[36px]">
          {isLoadingCuisines ? ( <span className="text-sm text-gray-500 flex items-center"><Loader2 size={14} className="animate-spin mr-1"/> Loading tags...</span> )
           : (filteredCuisines && filteredCuisines.length > 0) ? ( filteredCuisines.map(cuisine => ( <PillButton key={`cuisine-${cuisine.name}`} label={cuisine.name} prefix="#" isActive={(selectedHashtags || []).includes(cuisine.name)} onClick={() => handleHashtagClick(cuisine.name)}/> )) )
           : (cuisines && cuisines.length === 0) ? ( <span className="text-sm text-gray-500">No tags available.</span> )
           : ( hashtagSearch.trim() !== '' && <span className="text-sm text-gray-500 italic">No tags match '{hashtagSearch}'.</span> )
          }
        </div>
      </div>
    </div>
  );
};

export default FilterSection;