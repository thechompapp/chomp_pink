// src/hooks/useFilteredData.js (Select state individually)
import { useCallback, useMemo } from 'react';
import useAppStore from './useAppStore';
// Removed shallow import

const useFilteredData = (items = []) => {
  // --- Global State ---
  // ** CORRECTED: Select state pieces individually **
  const activeFilters = useAppStore(state => state.activeFilters) || { cityId: null, neighborhoodId: null, tags: [] }; // Provide default
  const cities = useAppStore(state => state.cities);
  const neighborhoods = useAppStore(state => state.neighborhoods);
  const searchQuery = useAppStore(state => state.searchQuery);

  // --- Filtering Logic ---
  // Memoize the actual filtering logic based on individual state pieces/arrays
  const applyFilters = useCallback(() => {
    if (!Array.isArray(items) || items.length === 0) return [];

    const cityId = activeFilters.cityId;
    const neighborhoodId = activeFilters.neighborhoodId;
    const selectedTags = activeFilters.tags || [];

    // Ensure lists are arrays before using .find()
    const selectedCityName = Array.isArray(cities) ? cities.find(c => c.id === cityId)?.name : null;
    const selectedNeighborhoodName = Array.isArray(neighborhoods) ? neighborhoods.find(n => n.id === neighborhoodId)?.name : null;

    // console.log("Applying filters:", { cityId, neighborhoodId, selectedTags, searchQuery, selectedCityName, selectedNeighborhoodName }); // Debug Log

    return items.filter((item) => {
      if (!item) return false;

      const itemCity = item.city || "";
      const itemNeighborhood = item.neighborhood || "";
      const itemTags = Array.isArray(item.tags) ? item.tags : [];
      const itemName = item.name || "";
      const itemRestaurant = item.restaurant || item.restaurant_name || "";

      // City Filter
      if (cityId && (!selectedCityName || itemCity.toLowerCase() !== selectedCityName.toLowerCase())) {
        return false;
      }
      // Neighborhood Filter
      if (cityId && neighborhoodId && (!selectedNeighborhoodName || itemNeighborhood.toLowerCase() !== selectedNeighborhoodName.toLowerCase())) {
        return false;
      }
      // Tags Filter
      if (selectedTags.length > 0) {
        if (!itemTags.some(t => selectedTags.some(ft => String(t).toLowerCase() === String(ft).toLowerCase()))) {
          return false;
        }
      }
      // Search Query Filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!(itemName.toLowerCase().includes(query) || itemCity.toLowerCase().includes(query) || itemNeighborhood.toLowerCase().includes(query) || itemTags.some(t => String(t).toLowerCase().includes(query)) || itemRestaurant.toLowerCase().includes(query))) {
            return false;
        }
      }
      return true;
    });
  // Dependencies: Now depends on the raw items array and the individually selected state pieces/arrays
  }, [items, activeFilters.cityId, activeFilters.neighborhoodId, activeFilters.tags, cities, neighborhoods, searchQuery]);

  // Memoize the filtered result based on the applyFilters function
  // applyFilters should be stable now if its dependencies are stable
  const filteredData = useMemo(() => applyFilters(), [applyFilters]);

  return filteredData;
};

export default useFilteredData;