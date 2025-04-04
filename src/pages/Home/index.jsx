// src/pages/Home/index.jsx
import React, { memo } from "react";
import useUIStateStore from '@/stores/useUIStateStore.js';
// Removed AuthStore import as debug logs are removed
import SearchBar from "@/components/UI/SearchBar";
import FilterSection from "@/pages/Home/FilterSection";
import Results from "@/pages/Home/Results";

const Home = memo(() => {
  const setSearchQuery = useUIStateStore((state) => state.setSearchQuery);

  // Removed console.log for debug and render

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <SearchBar onSearch={setSearchQuery} />
      <FilterSection />
      <Results />
    </div>
  );
});

export default Home;