// src/hooks/useFilteredData.js
import { useMemo } from 'react';
import useAppStore from './useAppStore';

/**
 * Custom hook to filter data based on the global filters
 * 
 * @param {Array} data - The data array to be filtered
 * @returns {Array} - The filtered data array
 */
const useFilteredData = (data) => {
  // Get filters and options from the store
  const filters = useAppStore(state => state.filters);
  const cityOptions = useAppStore(state => state.cityOptions);
  const neighborhoodOptions = useAppStore(state => state.neighborhoodOptions);
  
  return useMemo(() => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return [];
    }

    // Create lookup maps for city and neighborhood names by ID
    const cityMap = cityOptions.reduce((acc, city) => {
      acc[city.id] = city.name.toLowerCase();
      return acc;
    }, {});
    
    const neighborhoodMap = neighborhoodOptions.reduce((acc, hood) => {
      acc[hood.id] = hood.name.toLowerCase();
      return acc;
    }, {});
    
    // Filter the data
    return data.filter((item) => {
      // City filter
      if (filters.city && item.city_id !== filters.city) {
        // Check city ID
        return false;
      }
      
      // Neighborhood filter
      if (filters.neighborhood && item.neighborhood_id !== filters.neighborhood) {
        // Check neighborhood ID
        return false;
      }
      
      // Cuisines/tags filter
      if (filters.cuisines && filters.cuisines.length > 0) {
        // If item has no tags, filter it out
        if (!item.tags || !Array.isArray(item.tags) || item.tags.length === 0) {
          return false;
        }
        
        // Convert tags to lowercase for case-insensitive comparison
        const itemTagsLower = item.tags.map(tag => tag.toLowerCase());
        
        // Check if any selected cuisine exists in the item's tags
        const hasMatchingTag = filters.cuisines.some(cuisine => 
          itemTagsLower.includes(cuisine.toLowerCase())
        );
        
        if (!hasMatchingTag) {
          return false;
        }
      }
      
      // If it passed all filters, include it
      return true;
    });
  }, [data, filters, cityOptions, neighborhoodOptions]);
};

export default useFilteredData;