// src/pages/Home/FilterSection.jsx
import React, { useEffect } from "react";
import useAppStore from "@/hooks/useAppStore";

const FilterSection = () => {
  const cities = useAppStore((state) => state.cities);
  const cuisines = useAppStore((state) => state.cuisines);
  const activeFilters = useAppStore((state) => state.activeFilters);
  const setFilter = useAppStore((state) => state.setFilter);
  const fetchNeighborhoods = useAppStore((state) => state.fetchNeighborhoods);
  const neighborhoods = useAppStore((state) => state.neighborhoods);
  const isInitializing = useAppStore((state) => state.isInitializing);
  const initializationError = useAppStore((state) => state.initializationError);

  // Log the data to debug
  console.log("[FilterSection] cities:", cities);
  console.log("[FilterSection] cuisines:", cuisines);
  console.log("[FilterSection] neighborhoods:", neighborhoods);
  console.log("[FilterSection] activeFilters:", activeFilters);

  useEffect(() => {
    if (activeFilters.cityId) {
      console.log("[FilterSection] Fetching neighborhoods for cityId:", activeFilters.cityId);
      fetchNeighborhoods(activeFilters.cityId);
    }
  }, [activeFilters.cityId, fetchNeighborhoods]);

  // Show loading state while initializing
  if (isInitializing) {
    return <div className="my-6 text-gray-500">Loading filters...</div>;
  }

  // Show error state if initialization failed
  if (initializationError) {
    return <div className="my-6 text-red-500">Error loading filters: {initializationError}</div>;
  }

  return (
    <div className="my-6 flex flex-wrap gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">City</label>
        <select
          value={activeFilters.cityId || ""}
          onChange={(e) => setFilter("cityId", e.target.value ? parseInt(e.target.value) : null)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        >
          <option value="">Select a city</option>
          {cities.length > 0 ? (
            cities.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name}
              </option>
            ))
          ) : (
            <option disabled>No cities available</option>
          )}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Neighborhood</label>
        <select
          value={activeFilters.neighborhoodId || ""}
          onChange={(e) => setFilter("neighborhoodId", e.target.value ? parseInt(e.target.value) : null)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          disabled={!activeFilters.cityId}
        >
          <option value="">Select a neighborhood</option>
          {neighborhoods.length > 0 ? (
            neighborhoods.map((neighborhood) => (
              <option key={neighborhood.id} value={neighborhood.id}>
                {neighborhood.name}
              </option>
            ))
          ) : (
            <option disabled>No neighborhoods available</option>
          )}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Cuisine</label>
        <select
          value={activeFilters.tags[0] || ""}
          onChange={(e) => setFilter("tags", e.target.value ? [e.target.value] : [])}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        >
          <option value="">Select a cuisine</option>
          {cuisines.length > 0 ? (
            cuisines.map((cuisine) => (
              <option key={cuisine.name} value={cuisine.name}>
                {cuisine.name}
              </option>
            ))
          ) : (
            <option disabled>No cuisines available</option>
          )}
        </select>
      </div>
    </div>
  );
};

export default FilterSection;