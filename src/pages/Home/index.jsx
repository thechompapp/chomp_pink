// src/pages/Home/index.jsx
// UPDATE: Remove useAppStore, use specific stores if needed
import React, { memo } from "react"; // Removed useEffect as initial fetches are in App.jsx
// Import specific stores if state/actions are needed DIRECTLY in Home
// import useConfigStore from '@/stores/useConfigStore'; // Example: if cities were needed directly
// import useTrendingStore from '@/stores/useTrendingStore'; // Example: if trending data were needed directly
import useUIStateStore from '@/stores/useUIStateStore.js'; // For setSearchQuery action

// Import child components
import SearchBar from "@/components/UI/SearchBar"; // Use '@' alias
import FilterSection from "@/pages/Home/FilterSection"; // Use '@' alias
import Results from "@/pages/Home/Results"; // Use '@' alias

// Removed Button, Loader2, AlertTriangle as App.jsx handles global loading/error states before rendering Home

const Home = memo(() => {
  // Select ONLY the state/actions needed directly by the Home component itself
  // Child components (FilterSection, Results) will select their own state from stores
  const setSearchQuery = useUIStateStore((state) => state.setSearchQuery);

  // Log component render for debugging (optional)
  console.log("[Home Render] Rendering Home component.");

  // Global loading/error states are handled by App.jsx before this component renders,
  // so no need for loading/error checks here.

  return (
    // Use max-width and padding consistent with other pages like MyLists
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* SearchBar component receives the setSearchQuery action */}
      <SearchBar onSearch={setSearchQuery} />

      {/* FilterSection component fetches/selects its required state (cities, selectedCityId) internally */}
      <FilterSection />

      {/* Results component fetches/selects its required state (filtered data) internally using useFilteredData hook */}
      <Results />
    </div>
  );
});

export default Home;