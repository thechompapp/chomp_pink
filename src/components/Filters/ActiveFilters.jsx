import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/solid';

const Pill = ({ label, onRemove }) => (
  <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded-full">
    {label}
    <button
      onClick={onRemove}
      className="ml-2 -mr-1 p-0.5 bg-blue-200 rounded-full hover:bg-blue-300 focus:outline-none"
    >
      <XMarkIcon className="h-4 w-4 text-blue-800" />
    </button>
  </span>
);

const ActiveFilters = ({ filters, data, onClearFilter }) => {
  const active = [];

  if (filters.city) {
    const city = data.cities?.find(c => c.id === filters.city);
    if (city) {
      active.push({
        key: 'city',
        label: `City: ${city.name}`,
        onRemove: () => onClearFilter('city', null),
      });
    }
  }

  if (filters.borough) {
    const borough = data.boroughs?.find(b => b.id === filters.borough);
    if (borough) {
      active.push({
        key: 'borough',
        label: `Borough: ${borough.name}`,
        onRemove: () => onClearFilter('borough', null),
      });
    }
  }

  if (filters.neighborhood) {
    const neighborhood = data.neighborhoods?.find(n => n.id === filters.neighborhood);
    if (neighborhood) {
      active.push({
        key: 'neighborhood',
        label: `Neighborhood: ${neighborhood.name}`,
        onRemove: () => onClearFilter('neighborhood', null),
      });
    }
  }

  if (filters.cuisine?.length) {
    filters.cuisine.forEach(cuisineId => {
      const cuisine = data.cuisines?.find(c => c.id === cuisineId);
      if (cuisine) {
        active.push({
          key: `cuisine-${cuisineId}`,
          label: `Cuisine: ${cuisine.name}`,
          onRemove: () => {
            const newCuisines = filters.cuisine.filter(id => id !== cuisineId);
            onClearFilter('cuisine', newCuisines);
          },
        });
      }
    });
  }

  if (active.length === 0) {
    return null;
  }

  return (
    <div className="py-4 border-b border-gray-200">
      <h3 className="text-md font-semibold text-gray-800 mb-2">Active Filters</h3>
      <div className="flex flex-wrap gap-2">
        {active.map(filter => (
          <Pill key={filter.key} label={filter.label} onRemove={filter.onRemove} />
        ))}
      </div>
    </div>
  );
};

export default ActiveFilters; 