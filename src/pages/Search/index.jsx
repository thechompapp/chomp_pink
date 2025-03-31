import React, { useState } from "react";
import SearchBar from "@/components/ui/SearchBar";

const Search = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (query) => {
    setSearchQuery(query);
    console.log("Search query:", query);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Search</h1>
      <SearchBar onSearch={handleSearch} />
      <div className="mt-6">
        {searchQuery ? (
          <p className="text-gray-600">Searching for: <strong>{searchQuery}</strong></p>
        ) : (
          <p className="text-gray-600">Enter a search term to find restaurants, dishes, or lists.</p>
        )}
      </div>
    </div>
  );
};

export default Search;