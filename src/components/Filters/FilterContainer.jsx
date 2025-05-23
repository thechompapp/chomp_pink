import React, { useState, useEffect } from 'react';
import { FilterProvider } from '@/contexts/FilterContext';
import FilterBar from './FilterBar';
import NeighborhoodFilter from './NeighborhoodFilter';
import CuisineFilter from './CuisineFilter';
import { useQuery } from '@tanstack/react-query';
import { filterService } from '@/services/filterService';
import { neighborhoodService } from '@/services/neighborhoodService';
import { logDebug } from '@/utils/logger';

/**
 * FilterContainer component - combines all filter components with data management
 * 
 * @param {Object} props - Component props
 * @param {Function} props.onChange - Callback when filters change
 * @param {Object} props.initialFilters - Initial filter values
 * @param {boolean} props.showNeighborhoodFilter - Whether to show the neighborhood filter
 * @param {boolean} props.showCuisineFilter - Whether to show the cuisine filter
 * @param {string} props.className - Additional CSS classes
 */
const FilterContainer = ({ 
  onChange,
  initialFilters = {},
  showNeighborhoodFilter = true,
  showCuisineFilter = true,
  className = ""
}) => {
  // State to track loaded data for display labels
  const [lookupData, setLookupData] = useState({
    cities: [],
    boroughs: [],
    neighborhoods: []
  });
  
  // Fetch cities for label lookup
  const { data: cities = [] } = useQuery({
    queryKey: ['filterCities'],
    queryFn: () => filterService.getCities(),
    staleTime: Infinity,
  });
  
  // Update lookupData when cities change
  useEffect(() => {
    if (cities.length > 0) {
      setLookupData(prev => ({ ...prev, cities }));
    }
  }, [cities]);
  
  // Fetch boroughs and neighborhoods for the selected location
  useEffect(() => {
    const cityId = initialFilters.cityId;
    const boroughId = initialFilters.boroughId;
    
    if (cityId) {
      // Fetch boroughs for the city
      neighborhoodService.getBoroughs(cityId)
        .then(boroughs => {
          setLookupData(prev => ({ ...prev, boroughs }));
          
          // If we have a borough ID, fetch neighborhoods
          if (boroughId) {
            return neighborhoodService.getNeighborhoods(boroughId);
          }
          return [];
        })
        .then(neighborhoods => {
          if (neighborhoods.length > 0) {
            setLookupData(prev => ({ ...prev, neighborhoods }));
          }
        })
        .catch(err => {
          logDebug('[FilterContainer] Error fetching location data:', err);
        });
    }
  }, [initialFilters.cityId, initialFilters.boroughId]);
  
  return (
    <div className={`bg-white border border-black rounded-lg p-4 ${className}`}>
      <FilterProvider onChange={onChange} initialFilters={initialFilters}>
        <FilterBar lookupData={lookupData}>
          {showNeighborhoodFilter && <NeighborhoodFilter />}
          {showCuisineFilter && <CuisineFilter />}
        </FilterBar>
      </FilterProvider>
    </div>
  );
};

export default FilterContainer; 