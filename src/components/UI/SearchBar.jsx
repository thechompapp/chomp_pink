import React from 'react';

const SearchBar = ({ onSearch }) => {
  return (
    <div className="mb-6 p-2 bg-white shadow-md rounded-lg">
      <input
        type="text"
        placeholder="Search for restaurants, dishes, or lists..."
        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
        onChange={(e) => onSearch(e.target.value)}
      />
    </div>
  );
};

export default SearchBar;
