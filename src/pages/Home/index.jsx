// src/pages/Home/index.jsx
import React, { memo } from "react";
import useUIStateStore from '@/stores/useUIStateStore.js';
import useAuthStore from '@/stores/useAuthStore.js'; // *** ADDED IMPORT ***
import SearchBar from "@/components/UI/SearchBar";
import FilterSection from "@/pages/Home/FilterSection";
import Results from "@/pages/Home/Results";

const Home = memo(() => {
  const setSearchQuery = useUIStateStore((state) => state.setSearchQuery);

  // *** ADDED: Subscribe to auth state for debugging ***
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);
  console.log('[Home Debug] isLoading:', isLoading, 'error:', error);
  // *** END ADDED ***

  console.log("[Home Render] Rendering Home component.");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <SearchBar onSearch={setSearchQuery} />
      <FilterSection />
      <Results />
    </div>
  );
});

export default Home;