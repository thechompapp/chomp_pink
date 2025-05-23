import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Loader2 } from 'lucide-react';
import { logDebug } from '@/utils/logger';
import { filterService } from '@/services/filterService';
import { neighborhoodService } from '@/services/neighborhoodService';
import { useFilter, FILTER_TYPES } from '@/contexts/FilterContext';
import FilterGroup from './FilterGroup';
import FilterItem from './FilterItem';

/**
 * NeighborhoodFilter component - displays city, borough, and neighborhood filters
 */
const NeighborhoodFilter = () => {
  const { filters, setFilter } = useFilter();
  const selectedCityId = filters[FILTER_TYPES.CITY];
  const selectedBoroughId = filters[FILTER_TYPES.BOROUGH];
  
  // Fetch cities
  const { 
    data: cities = [], 
    isLoading: isLoadingCities, 
    error: errorCities 
  } = useQuery({
    queryKey: ['filterCities'],
    queryFn: () => filterService.getCities(),
    staleTime: Infinity,
  });
  
  // Get selected city
  const selectedCity = useMemo(() => {
    return cities.find(city => city.id === selectedCityId);
  }, [cities, selectedCityId]);
  
  // Determine if city has boroughs
  const cityHasBoroughs = useMemo(() => {
    return selectedCity?.has_boroughs || false;
  }, [selectedCity]);
  
  // Fetch boroughs for selected city
  const {
    data: boroughs = [],
    isLoading: isLoadingBoroughs,
    error: errorBoroughs
  } = useQuery({
    queryKey: ['filterBoroughs', selectedCityId],
    queryFn: () => neighborhoodService.getBoroughs(selectedCityId),
    enabled: !!selectedCityId && cityHasBoroughs,
    staleTime: 5 * 60 * 1000,
  });
  
  // Fetch neighborhoods for selected borough
  const {
    data: neighborhoods = [],
    isLoading: isLoadingNeighborhoods,
    error: errorNeighborhoods
  } = useQuery({
    queryKey: ['filterNeighborhoods', selectedBoroughId],
    queryFn: () => neighborhoodService.getNeighborhoods(selectedBoroughId),
    enabled: !!selectedBoroughId,
    staleTime: 5 * 60 * 1000,
  });
  
  // Clear dependent filters when parent filter changes
  React.useEffect(() => {
    if (!selectedCityId) {
      setFilter(FILTER_TYPES.BOROUGH, null);
      setFilter(FILTER_TYPES.NEIGHBORHOOD, null);
    }
  }, [selectedCityId, setFilter]);
  
  React.useEffect(() => {
    if (!selectedBoroughId) {
      setFilter(FILTER_TYPES.NEIGHBORHOOD, null);
    }
  }, [selectedBoroughId, setFilter]);
  
  // Helper to render items with loading and error states
  const renderItems = (items, isLoading, error, type, emptyMessage) => {
    if (isLoading) {
      return <Loader2 size={16} className="animate-spin text-muted-foreground" />;
    }
    
    if (error) {
      return <p className="text-sm text-destructive">Error loading data</p>;
    }
    
    if (!items || items.length === 0) {
      return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
    }
    
    return items.map(item => (
      <FilterItem
        key={`${type}-${item.id}`}
        type={type}
        value={item.id}
        label={item.name}
      />
    ));
  };
  
  return (
    <FilterGroup
      title="Location"
      icon={<MapPin size={16} />}
      defaultExpanded={true}
    >
      <div className="space-y-3">
        {/* Cities */}
        <div className="flex flex-wrap gap-2">
          {renderItems(
            cities,
            isLoadingCities,
            errorCities,
            FILTER_TYPES.CITY,
            'No cities available'
          )}
        </div>
        
        {/* Boroughs (if city has boroughs) */}
        {selectedCityId && cityHasBoroughs && (
          <div className="flex flex-wrap gap-2 border-l-2 border-gray-200 dark:border-gray-600 pl-3">
            {renderItems(
              boroughs,
              isLoadingBoroughs,
              errorBoroughs,
              FILTER_TYPES.BOROUGH,
              'No boroughs found'
            )}
          </div>
        )}
        
        {/* Neighborhoods */}
        {selectedBoroughId && (
          <div className="flex flex-wrap gap-2 border-l-2 border-gray-200 dark:border-gray-600 pl-3 ml-3">
            {renderItems(
              neighborhoods,
              isLoadingNeighborhoods,
              errorNeighborhoods,
              FILTER_TYPES.NEIGHBORHOOD,
              'No neighborhoods found'
            )}
          </div>
        )}
      </div>
    </FilterGroup>
  );
};

export default NeighborhoodFilter; 