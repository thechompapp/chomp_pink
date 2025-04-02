// src/hooks/useFilteredData.js
import { useMemo } from "react";
import useAppStore from "./useAppStore";

const useFilteredData = (data, type) => {
  const searchQuery = useAppStore((state) => state.searchQuery);
  const { cityId, neighborhoodId, tags } = useAppStore((state) => state.activeFilters);
  const cities = useAppStore((state) => state.cities || []);
  const neighborhoods = useAppStore((state) => state.neighborhoods || []);

  return useMemo(() => {
    if (!Array.isArray(data)) return [];

    let filteredData = [...data];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredData = filteredData.filter((item) => {
        const nameMatch = item.name?.toLowerCase().includes(query);
        const tagsMatch = Array.isArray(item.tags) && item.tags.some((tag) => tag.toLowerCase().includes(query));
        const restaurantMatch = item.restaurant_name?.toLowerCase().includes(query);
        return nameMatch || tagsMatch || restaurantMatch;
      });
    }

    if (cityId) {
      filteredData = filteredData.filter((item) => {
        const cityName = item.city || item.city_name;
        const itemCityId = item.city_id || (typeof cityName === 'string' ? cities.find(c => c.name === cityName)?.id : null);
        return itemCityId === cityId;
      });
    }

    if (neighborhoodId && type !== 'list') {
      filteredData = filteredData.filter((item) => {
        const neighborhoodName = item.neighborhood || item.neighborhood_name;
        const itemNeighborhoodId = item.neighborhood_id || (typeof neighborhoodName === 'string' ? neighborhoods.find(n => n.name === neighborhoodName)?.id : null);
        return itemNeighborhoodId === neighborhoodId;
      });
    }

    if (tags && tags.length > 0) {
      filteredData = filteredData.filter((item) => {
        if (!Array.isArray(item.tags)) return false;
        const normalizedItemTags = item.tags.map((tag) => tag.toLowerCase().replace('#', ''));
        return tags.some((tag) => normalizedItemTags.includes(tag.toLowerCase()));
      });
    }

    return filteredData;
  }, [data, type, searchQuery, cityId, neighborhoodId, tags, cities, neighborhoods]);
};

export default useFilteredData;