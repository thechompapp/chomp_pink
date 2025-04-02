// src/pages/Home/FilterSection.jsx
import React, { useEffect } from "react";
import useAppStore from "@/hooks/useAppStore";
import PillButton from "@/components/UI/PillButton";

const FilterSection = () => {
  const cities = useAppStore((state) => state.cities);
  const cuisines = useAppStore((state) => state.cuisines);
  const activeFilters = useAppStore((state) => state.activeFilters);
  const setFilter = useAppStore((state) => state.setFilter);
  const fetchNeighborhoods = useAppStore((state) => state.fetchNeighborhoods);
  const neighborhoods = useAppStore((state) => state.neighborhoods);
  const isInitializing = useAppStore((state) => state.isInitializing);
  const initializationError = useAppStore((state) => state.initializationError);

  useEffect(() => {
    if (activeFilters.cityId) {
      fetchNeighborhoods(activeFilters.cityId);
    } else {
      setFilter("neighborhoodId", null);
      setFilter("tags", []);
    }
  }, [activeFilters.cityId, fetchNeighborhoods, setFilter]);

  useEffect(() => {
    if (!activeFilters.neighborhoodId) {
      setFilter("tags", []);
    }
  }, [activeFilters.neighborhoodId, setFilter]);

  if (isInitializing) return <div className="my-6 text-gray-500">Loading filters...</div>;
  if (initializationError) return <div className="my-6 text-red-500">Error loading filters: {initializationError}</div>;

  return (
    <div className="my-6 flex flex-col gap-4">
      {/* City Filter (Hide after selection) */}
      {!activeFilters.cityId && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
          <div className="flex flex-wrap gap-2">
            {cities.map((city) => (
              <PillButton
                key={city.id}
                label={city.name}
                isActive={activeFilters.cityId === city.id}
                onClick={() => setFilter("cityId", activeFilters.cityId === city.id ? null : city.id)}
                className="px-4 py-1.5 text-base"
              />
            ))}
          </div>
        </div>
      )}

      {/* Neighborhood Filter (Show after city selection, hide after neighborhood selection) */}
      {activeFilters.cityId && !activeFilters.neighborhoodId && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Neighborhood</label>
          <div className="flex flex-wrap gap-2">
            {neighborhoods.length > 0 ? (
              neighborhoods.map((neighborhood) => (
                <PillButton
                  key={neighborhood.id}
                  label={neighborhood.name}
                  isActive={activeFilters.neighborhoodId === neighborhood.id}
                  onClick={() => setFilter("neighborhoodId", activeFilters.neighborhoodId === neighborhood.id ? null : neighborhood.id)}
                  className="px-4 py-1.5 text-base"
                />
              ))
            ) : (
              <span className="text-gray-500 text-sm">No neighborhoods available</span>
            )}
          </div>
        </div>
      )}

      {/* Cuisine Filter (Show after neighborhood selection, hide after cuisine selection) */}
      {activeFilters.neighborhoodId && activeFilters.tags.length === 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cuisine</label>
          <div className="flex flex-wrap gap-2">
            {cuisines.length > 0 ? (
              cuisines.map((cuisine) => (
                <PillButton
                  key={cuisine.name}
                  label={cuisine.name}
                  isActive={activeFilters.tags.includes(cuisine.name)}
                  onClick={() => setFilter("tags", activeFilters.tags.includes(cuisine.name) ? [] : [cuisine.name])}
                  className="px-4 py-1.5 text-base"
                />
              ))
            ) : (
              <span className="text-gray-500 text-sm">No cuisines available</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterSection;