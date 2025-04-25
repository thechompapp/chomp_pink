/* src/components/FilterSection.jsx */
/* Update active filter display style */
import React, { useEffect, useMemo, useCallback, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, MapPin, Tag, RotateCcw, Search, Loader2 } from 'lucide-react';
import filterService from '@/services/filterService';
import PillButton from '@/components/UI/PillButton';
import Input from '@/components/UI/Input';
import usePrevious from '@/hooks/usePrevious';
import { cn } from "@/lib/utils"; // Ensure this import is present

const FilterSection = ({ onFiltersChange }) => {
  const [selectedCityId, setSelectedCityId] = useState(null);
  const [selectedNeighborhoodId, setSelectedNeighborhoodId] = useState(null);
  const [selectedHashtags, setSelectedHashtags] = useState([]);
  const [hashtagSearch, setHashtagSearch] = useState('');

  const { data: cities = [], isLoading: isLoadingCities, error: errorCities } = useQuery({
    queryKey: ['filterCities'],
    queryFn: filterService.getCities,
    staleTime: Infinity,
    placeholderData: [],
  });

  const { data: cuisines = [], isLoading: isLoadingCuisines, error: errorCuisines } = useQuery({
    queryKey: ['filterCuisines'],
    queryFn: filterService.getCuisines,
    staleTime: Infinity,
    placeholderData: [],
    select: (data) => Array.isArray(data) ? data.map(c => c?.name || c).filter(Boolean) : [],
  });

  const cityIdToFetch = selectedCityId ? parseInt(String(selectedCityId), 10) : null;
  const { data: neighborhoods = [], isLoading: isLoadingNeighborhoods, error: errorNeighborhoods } = useQuery({
    queryKey: ['filterNeighborhoods', cityIdToFetch],
    queryFn: () => filterService.getNeighborhoods(cityIdToFetch),
    enabled: !!cityIdToFetch && cityIdToFetch > 0,
    staleTime: 5 * 60 * 1000,
    placeholderData: [],
  });

  const filteredCuisines = useMemo(() => {
    const searchLower = hashtagSearch.trim().toLowerCase();
    if (!searchLower) return cuisines;
    return (cuisines || []).filter(name => name.toLowerCase().includes(searchLower) && !selectedHashtags.includes(name));
  }, [hashtagSearch, cuisines, selectedHashtags]);

  const selectedCity = useMemo(() => (cities || []).find(c => c.id === selectedCityId), [cities, selectedCityId]);
  const selectedNeighborhood = useMemo(() => (neighborhoods || []).find(n => n.id === selectedNeighborhoodId), [neighborhoods, selectedNeighborhoodId]);
  const hasActiveFilters = useMemo(() => selectedCityId != null || selectedNeighborhoodId != null || selectedHashtags.length > 0, [selectedCityId, selectedNeighborhoodId, selectedHashtags]);

  useEffect(() => {
    onFiltersChange?.({
      cityId: selectedCityId,
      neighborhoodId: selectedNeighborhoodId,
      hashtags: selectedHashtags,
    });
  }, [selectedCityId, selectedNeighborhoodId, selectedHashtags, onFiltersChange]);

  const previousCityId = usePrevious(selectedCityId);

  useEffect(() => {
      if (selectedCityId !== previousCityId) {
          setSelectedNeighborhoodId(null);
      }
  }, [selectedCityId, previousCityId]);

  const handleCityClick = useCallback((id) => {
    const idInt = parseInt(String(id), 10);
    setSelectedCityId(prevId => (prevId === idInt ? null : idInt));
  }, []);

  const handleNeighborhoodClick = useCallback((id) => {
    const idInt = parseInt(String(id), 10);
    setSelectedNeighborhoodId(prevId => (prevId === idInt ? null : idInt));
  }, []);

  const handleHashtagClick = useCallback((hashtagName) => {
    setSelectedHashtags(prev =>
      prev.includes(hashtagName)
        ? prev.filter(h => h !== hashtagName)
        : [...prev, hashtagName]
    );
  }, []);

  const removeCityFilter = useCallback(() => { setSelectedCityId(null); }, []);
  const removeNeighborhoodFilter = useCallback(() => { setSelectedNeighborhoodId(null); }, []);
  const removeHashtagFilter = useCallback((hashtagName) => { setSelectedHashtags(prev => prev.filter(h => h !== hashtagName)); }, []);

  const handleClearAllFilters = useCallback(() => {
    setSelectedCityId(null);
    setSelectedNeighborhoodId(null);
    setSelectedHashtags([]);
    setHashtagSearch('');
  }, []);

  const handleHashtagSearchChange = (e) => { setHashtagSearch(e.target.value); };

  // Define classes for active filter chips for reuse
  const activeFilterChipClasses = "inline-flex items-center bg-card dark:bg-card border border-border dark:border-border rounded-full px-2.5 py-0.5 text-xs font-medium text-card-foreground dark:text-card-foreground";
  const chipIconClasses = "mr-1 text-muted-foreground dark:text-muted-foreground";
  const chipRemoveButtonClasses = "ml-1 text-muted-foreground hover:text-foreground dark:hover:text-foreground focus:outline-none";


  return (
    <div className="space-y-4 mb-6">
      {/* Active Filters Display - Updated Style */}
      {hasActiveFilters && (
         <div className="flex flex-wrap items-center gap-2 p-3 bg-secondary dark:bg-secondary border border-border dark:border-border rounded-lg shadow-sm">
             <span className="text-sm font-medium text-secondary-foreground dark:text-secondary-foreground mr-2">Filters:</span>
             {selectedCity && (
                <span className={activeFilterChipClasses}>
                    <MapPin size={12} className={chipIconClasses}/> {selectedCity.name}
                    <button onClick={removeCityFilter} className={chipRemoveButtonClasses}><X size={12} /></button>
                </span>
             )}
             {selectedNeighborhood && (
                 <span className={activeFilterChipClasses}>
                    <MapPin size={12} className={chipIconClasses}/> {selectedNeighborhood.name}
                    <button onClick={removeNeighborhoodFilter} className={chipRemoveButtonClasses}><X size={12} /></button>
                 </span>
             )}
             {selectedHashtags.map(hashtag => (
                 <span key={hashtag} className={activeFilterChipClasses}>
                    <Tag size={12} className={chipIconClasses}/> {hashtag}
                    <button onClick={() => removeHashtagFilter(hashtag)} className={chipRemoveButtonClasses}><X size={12} /></button>
                 </span>
             ))}
            <button onClick={handleClearAllFilters} className="flex items-center text-xs text-muted-foreground dark:text-muted-foreground hover:text-destructive dark:hover:text-destructive ml-auto px-2 py-1 rounded hover:bg-destructive/10 dark:hover:bg-destructive/10 transition-colors focus:outline-none focus:ring-1 focus:ring-destructive">
                <RotateCcw size={12} className="mr-1" /> Reset All
            </button>
         </div>
      )}

      {/* City/Neighborhood Selection */}
      <div className="flex flex-wrap items-center gap-2 min-h-[36px]">
          {!selectedCityId ? ( // Show Cities
             isLoadingCities ? ( <span className="text-sm text-muted-foreground dark:text-muted-foreground flex items-center"><Loader2 size={14} className="animate-spin mr-1"/> Loading cities...</span> )
             : errorCities ? (<span className="text-sm text-destructive dark:text-destructive-foreground">Error loading cities.</span>)
             : (cities.length > 0) ? ( cities.map(city => ( <PillButton key={`city-${city.id}`} label={city.name} isActive={false} onClick={() => handleCityClick(city.id)}/> )) )
             : ( <span className="text-sm text-muted-foreground dark:text-muted-foreground">No cities available.</span> )
           ) : ( // Show Neighborhoods for selected city
             isLoadingNeighborhoods ? ( <span className="text-sm text-muted-foreground dark:text-muted-foreground flex items-center"><Loader2 size={14} className="animate-spin mr-1"/> Loading neighborhoods...</span> )
             : errorNeighborhoods ? (<span className="text-sm text-destructive dark:text-destructive-foreground">Error loading neighborhoods.</span>)
             : (neighborhoods.length > 0) ? ( neighborhoods.map(neighborhood => ( <PillButton key={`neigh-${neighborhood.id}`} label={neighborhood.name} isActive={selectedNeighborhoodId === neighborhood.id} onClick={() => handleNeighborhoodClick(neighborhood.id)}/> )) )
             : ( <span className="text-sm text-muted-foreground dark:text-muted-foreground italic">No neighborhoods found for {selectedCity?.name}.</span> )
           )}
      </div>

      {/* Hashtag Selection */}
      <div className="flex flex-col gap-3 pt-2">
        <div className="relative max-w-xs">
            <label htmlFor="hashtag-search-input" className="sr-only">Search Cuisines/Tags</label>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search className="h-4 w-4 text-muted-foreground" aria-hidden="true" /></div>
           <Input id="hashtag-search-input" type="search" value={hashtagSearch} onChange={handleHashtagSearchChange} placeholder="Search cuisines/tags..." className="pl-9 pr-3 py-1.5 text-sm" aria-label="Search hashtags" /> {/* Input will use theme colors */}
        </div>
        <div className="flex flex-wrap items-center gap-2 min-h-[36px]">
            {isLoadingCuisines ? ( <span className="text-sm text-muted-foreground dark:text-muted-foreground flex items-center"><Loader2 size={14} className="animate-spin mr-1"/> Loading tags...</span> )
            : errorCuisines ? (<span className="text-sm text-destructive dark:text-destructive-foreground">Error loading tags.</span>)
            : (filteredCuisines.length > 0) ? ( filteredCuisines.map(name => ( <PillButton key={`cuisine-${name}`} label={name} prefix="#" isActive={selectedHashtags.includes(name)} onClick={() => handleHashtagClick(name)}/> )) )
            : (cuisines.length === 0) ? ( <span className="text-sm text-muted-foreground dark:text-muted-foreground">No tags available.</span> )
            : ( hashtagSearch.trim() !== '' && <span className="text-sm text-muted-foreground dark:text-muted-foreground italic">No tags match '{hashtagSearch}'.</span> )
           }
        </div>
      </div>
    </div>
  );
};

export default FilterSection;