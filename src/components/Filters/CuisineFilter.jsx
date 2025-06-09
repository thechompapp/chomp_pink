/**
 * CuisineFilter.jsx - Cuisine Filter UI Component
 * 
 * Single Responsibility: Display cuisine filter options
 * - Pure UI component with clear prop interface
 * - Multi-select cuisine filtering
 * - Loading and error state handling
 * - Search functionality for large cuisine lists
 */

import React, { useState } from 'react';
import FilterItem from './FilterItem';
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import { Search, Hash, X } from 'lucide-react';

/**
 * CuisineFilter - Cuisine filtering component
 */
const CuisineFilter = ({
  cuisines = [],
  selectedCuisines = [],
  loading = false,
  error = null,
  onToggleCuisine,
  onClearCuisines,
  searchable = true,
  maxVisible = 10
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter cuisines based on search term
  const filteredCuisines = searchTerm
    ? cuisines.filter(cuisine => 
        cuisine.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : cuisines;

  // Show popular cuisines first, then alphabetical
  const sortedCuisines = [...filteredCuisines].sort((a, b) => {
    // If both are selected or neither are selected, sort alphabetically
    const aSelected = selectedCuisines.includes(a.name);
    const bSelected = selectedCuisines.includes(b.name);
    
    if (aSelected === bSelected) {
      return a.name.localeCompare(b.name);
    }
    
    // Selected items first
    return bSelected ? 1 : -1;
  });

  // Handle loading state
  if (loading && cuisines.length === 0) {
    return (
      <div className="flex justify-center items-center h-16">
        <LoadingSpinner />
        <span className="ml-2 text-gray-600">Loading cuisines...</span>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="text-red-500 text-sm p-3 bg-red-50 border border-red-200 rounded">
        <div className="flex items-center">
          <Hash size={16} className="mr-2" />
          Error loading cuisines: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Search Input */}
      {searchable && cuisines.length > 5 && (
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search cuisines..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          )}
        </div>
      )}

      {/* Selected Cuisines Summary */}
      {selectedCuisines.length > 0 && (
        <div className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded">
          <span className="text-sm text-blue-800">
            {selectedCuisines.length} cuisine{selectedCuisines.length !== 1 ? 's' : ''} selected
          </span>
          <button
            onClick={onClearCuisines}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Cuisine Options */}
      <div className="flex flex-wrap gap-2">
        {sortedCuisines.slice(0, maxVisible).map(cuisine => (
          <FilterItem
            key={cuisine.id || cuisine.name}
            label={cuisine.name}
            isActive={selectedCuisines.includes(cuisine.name)}
            onClick={() => onToggleCuisine(cuisine.name)}
            disabled={loading}
            prefix="#"
            icon={Hash}
          />
        ))}
      </div>

      {/* Show More Button */}
      {!searchTerm && sortedCuisines.length > maxVisible && (
        <button
          onClick={() => setSearchTerm('')} // This will trigger search input to show
          className="text-sm text-blue-600 hover:text-blue-800 underline"
        >
          Show {sortedCuisines.length - maxVisible} more cuisines...
        </button>
      )}

      {/* No Results */}
      {searchTerm && filteredCuisines.length === 0 && (
        <div className="text-gray-500 text-sm text-center py-4">
          No cuisines found for "{searchTerm}"
        </div>
      )}

      {/* Loading indicator for updates */}
      {loading && cuisines.length > 0 && (
        <div className="flex items-center justify-center py-2">
          <LoadingSpinner size="sm" />
          <span className="ml-2 text-sm text-gray-500">Updating cuisines...</span>
        </div>
      )}
    </div>
  );
};

export default React.memo(CuisineFilter); 