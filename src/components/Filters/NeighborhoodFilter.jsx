/**
 * NeighborhoodFilter.jsx - Location Filter UI Component
 * 
 * Single Responsibility: Display location filter options
 * - Pure UI component with clear prop interface
 * - Hierarchical location selection (City → Borough → Neighborhood)
 * - Loading and error state handling
 * - No business logic or state management
 */

import React from 'react';
import FilterItem from './FilterItem';
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import { MapPin } from 'lucide-react';
import { logDebug } from '@/utils/logger';

/**
 * NeighborhoodFilter - Location filtering component
 */
const NeighborhoodFilter = ({
  cities = [],
  boroughs = [],
  neighborhoods = [],
  selectedCity = null,
  selectedBorough = null,
  selectedNeighborhood = null,
  loading = {},
  errors = {},
  onCityChange,
  onBoroughChange,
  onNeighborhoodChange
}) => {
  logDebug('[NeighborhoodFilter] Props received:', {
    citiesCount: cities.length,
    boroughsCount: boroughs.length,
    neighborhoodsCount: neighborhoods.length,
    selectedCity,
    selectedBorough,
    selectedNeighborhood,
    loading,
    errors
  });

  // Handle loading states
  if (loading.cities) {
    return (
      <div className="flex justify-center items-center h-24">
        <LoadingSpinner />
        <span className="ml-2 text-gray-600">Loading cities...</span>
      </div>
    );
  }

  // Handle error states
  if (errors.cities) {
    return (
      <div className="text-red-500 text-sm p-3 bg-red-50 border border-red-200 rounded">
        <div className="flex items-center">
          <MapPin size={16} className="mr-2" />
          Error loading location data: {errors.cities}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Cities - show when no city is selected */}
      {!selectedCity && (
        <div className="space-y-2">
          <h4 className="font-semibold text-gray-700 flex items-center">
            <MapPin size={16} className="mr-2" />
            City
          </h4>
          <div className="flex flex-wrap gap-2">
            {cities.map(city => (
              <FilterItem
                key={city.id}
                label={city.name}
                isActive={selectedCity === city.id}
                onClick={() => {
                  // Simple toggle: if already selected, deselect, otherwise select
                  if (selectedCity === city.id) {
                    onCityChange(null);
                  } else {
                    onCityChange(city.id);
                  }
                }}
                disabled={loading.cities}
              />
            ))}
          </div>
        </div>
      )}

      {/* Boroughs - show when city is selected but no borough selected */}
      {selectedCity && !selectedBorough && (
        <div className="space-y-2">
          <h4 className="font-semibold text-gray-700 flex items-center">
            <MapPin size={16} className="mr-2" />
            Borough
            {loading.boroughs && <LoadingSpinner size="sm" className="ml-2" />}
          </h4>
          
          {errors.boroughs ? (
            <div className="text-red-500 text-sm">Error loading boroughs: {errors.boroughs}</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {boroughs.map(borough => (
                <FilterItem
                  key={borough.id}
                  label={borough.name}
                  isActive={selectedBorough === borough.id}
                  onClick={() => {
                    // Simple toggle: if already selected, deselect, otherwise select
                    if (selectedBorough === borough.id) {
                      onBoroughChange(null);
                    } else {
                      onBoroughChange(borough.id);
                    }
                  }}
                  disabled={loading.boroughs}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Neighborhoods - show when borough is selected */}
      {selectedBorough && (
        <div className="space-y-2">
          <h4 className="font-semibold text-gray-700 flex items-center">
            <MapPin size={16} className="mr-2" />
            Neighborhood
            {loading.neighborhoods && <LoadingSpinner size="sm" className="ml-2" />}
          </h4>
          
          {errors.neighborhoods ? (
            <div className="text-red-500 text-sm">Error loading neighborhoods: {errors.neighborhoods}</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {neighborhoods.map(neighborhood => (
                <FilterItem
                  key={neighborhood.id}
                  label={neighborhood.name}
                  isActive={selectedNeighborhood === neighborhood.id}
                  onClick={() => {
                    // Simple toggle: if already selected, deselect, otherwise select
                    if (selectedNeighborhood === neighborhood.id) {
                      onNeighborhoodChange(null);
                    } else {
                      onNeighborhoodChange(neighborhood.id);
                    }
                  }}
                  disabled={loading.neighborhoods}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Helper text based on current state */}
      {!selectedCity && (
        <div className="text-sm text-gray-500 italic">
          Select a city to see boroughs
        </div>
      )}
      
      {selectedCity && !selectedBorough && (
        <div className="text-sm text-gray-500 italic">
          Select a borough to see neighborhoods
        </div>
      )}
      
      {/* Breadcrumb showing current selection path */}
      {(selectedCity || selectedBorough || selectedNeighborhood) && (
        <div className="text-sm text-gray-600 bg-gray-100 p-2 rounded flex items-center justify-between">
          <div>
            <span className="font-medium">Selected: </span>
            {selectedNeighborhood && (
              <span>
                {cities.find(c => c.id === selectedCity)?.name} → {boroughs.find(b => b.id === selectedBorough)?.name} → {neighborhoods.find(n => n.id === selectedNeighborhood)?.name}
              </span>
            )}
            {selectedBorough && !selectedNeighborhood && (
              <span>
                {cities.find(c => c.id === selectedCity)?.name} → {boroughs.find(b => b.id === selectedBorough)?.name}
              </span>
            )}
            {selectedCity && !selectedBorough && (
              <span>
                {cities.find(c => c.id === selectedCity)?.name}
              </span>
            )}
          </div>
          <div className="flex space-x-2">
            {selectedNeighborhood && (
              <button
                onClick={() => onNeighborhoodChange(null)}
                className="text-xs text-gray-500 hover:text-gray-700 underline"
              >
                Back to boroughs
              </button>
            )}
            {selectedBorough && !selectedNeighborhood && (
              <button
                onClick={() => onBoroughChange(null)}
                className="text-xs text-gray-500 hover:text-gray-700 underline"
              >
                Back to cities
              </button>
            )}
            {selectedCity && !selectedBorough && (
              <button
                onClick={() => onCityChange(null)}
                className="text-xs text-gray-500 hover:text-gray-700 underline"
              >
                Clear selection
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(NeighborhoodFilter); 