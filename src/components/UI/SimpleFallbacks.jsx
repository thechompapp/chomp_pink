// Simplified version of components in case the original versions have issues

// RestaurantCard - Simplified version
import React from "react";

const SimpleRestaurantCard = ({ name, neighborhood, city, tags }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
      <h3 className="font-bold text-gray-900 text-lg mb-1">{name}</h3>
      <p className="text-gray-600 text-sm mb-2">
        {neighborhood}, {city}
      </p>
      <div className="flex flex-wrap gap-1 mt-3">
        {tags.map((tag) => (
          <span 
            key={tag} 
            className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600"
          >
            #{tag}
          </span>
        ))}
      </div>
      <button
        className="mt-2 w-full py-2 bg-pink-500 text-white rounded-lg flex items-center justify-center"
      >
        + Add to List
      </button>
    </div>
  );
};

// DishCard - Simplified version
import React from 'react';

const SimpleDishCard = ({ name, restaurant, tags }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
      <h3 className="font-bold text-gray-900 text-lg mb-1">{name}</h3>
      <p className="text-gray-600 text-sm mb-2">at {restaurant}</p>
      <div className="flex flex-wrap gap-1 mt-3">
        {tags.map((tag) => (
          <span 
            key={tag} 
            className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600"
          >
            #{tag}
          </span>
        ))}
      </div>
      <button
        className="mt-2 w-full py-2 bg-blue-500 text-white rounded-lg flex items-center justify-center"
      >
        + Add to List
      </button>
    </div>
  );
};

// ListCard - Simplified version
import React from 'react';
import { Link } from 'react-router-dom';

const SimpleListCard = ({ id, name, itemCount = 0, isPublic = true }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
      <h3 className="font-bold text-gray-900 text-lg mb-1">{name}</h3>
      <p className="text-gray-600 text-sm mb-2">
        {itemCount} {itemCount === 1 ? 'item' : 'items'} • {isPublic ? 'Public' : 'Private'}
      </p>
      <div className="flex space-x-2 mt-3">
        <Link
          to={`/lists/${id}`}
          className="flex-1 py-2 px-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-center text-sm font-medium"
        >
          View List
        </Link>
        <button
          className="py-2 px-3 bg-purple-500 text-white rounded-lg"
        >
          + Save
        </button>
      </div>
    </div>
  );
};

// FilterSection - Simplified version
import React, { useState } from 'react';

const SimpleFilterSection = () => {
  const [selectedCity, setSelectedCity] = useState(null);
  
  const cities = ["New York", "Los Angeles", "Chicago", "Miami"];

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <h3 className="font-semibold text-gray-800 mb-3">Filter by City</h3>
      <div className="grid grid-cols-2 gap-2">
        {cities.map(city => (
          <button
            key={city}
            onClick={() => setSelectedCity(city === selectedCity ? null : city)}
            className={`text-left px-3 py-2 rounded-md text-sm ${
              selectedCity === city 
                ? 'bg-pink-100 text-pink-700' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {city}
          </button>
        ))}
      </div>
    </div>
  );
};

export { 
  SimpleRestaurantCard, 
  SimpleDishCard, 
  SimpleListCard, 
  SimpleFilterSection 
};