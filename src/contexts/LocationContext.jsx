import React, { createContext, useContext, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { enhancedAdminService } from '@/services/enhancedAdminService';
import { logError } from '@/utils/logger';

const LocationContext = createContext();

/**
 * Flattens the hierarchical location data into a single lookup object.
 * @param {Array} hierarchy - The hierarchical location data from the API.
 * @returns {Object} A flat object mapping location ID to location name.
 */
const flattenLocations = (hierarchy) => {
  const flatMap = {};
  const recurse = (nodes) => {
    if (!nodes || !Array.isArray(nodes)) return;
    nodes.forEach(node => {
      flatMap[node.id] = node.name;
      if (node.children && node.children.length > 0) {
        recurse(node.children);
      }
    });
  };
  recurse(hierarchy);
  return flatMap;
};

export const LocationProvider = ({ children }) => {
  const { data: neighborhoods, isLoading: neighborhoodsLoading, error } = useQuery({
    queryKey: ['allNeighborhoods'],
    queryFn: () => enhancedAdminService.fetchAllNeighborhoods(),
    staleTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
  });

  if (error) {
    logError('[LocationProvider] Error fetching neighborhoods:', error);
  }

  const flattenedLocations = useMemo(() => {
    if (neighborhoods) {
      return flattenLocations(neighborhoods);
    }
    return {};
  }, [neighborhoods]);

  const value = {
    locations: flattenedLocations,
    isLoading: neighborhoodsLoading,
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocations = () => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocations must be used within a LocationProvider');
  }
  return context;
}; 