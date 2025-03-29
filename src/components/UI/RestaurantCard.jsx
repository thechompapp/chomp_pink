import React from 'react';

const RestaurantCard = ({ name, neighborhood, city, tags }) => {
  return (
    <div className="w-72 bg-white rounded-lg border border-[#D1B399]/20 p-4 shadow-sm hover:shadow-md transition-shadow">
      <h3 className="text-lg font-semibold text-gray-900 truncate">{name}</h3>
      <p className="text-sm text-gray-600">{neighborhood}, {city}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {tags && tags.map(tag => (
          <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
            #{tag}
          </span>
        ))}
      </div>
    </div>
  );
};

export default RestaurantCard;