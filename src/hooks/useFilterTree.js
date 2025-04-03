// src/hooks/useFilterTree.js
// UPDATE: Replace useAppStore with useUIStateStore
import { useState } from 'react';
// Import the specific store for UI filter state
import useUIStateStore from '@/stores/useUIStateStore.js';

// Note: This hook's functionality might overlap with FilterSection.jsx.
// Consider consolidating filter logic in FilterSection.jsx if this hook becomes redundant.
const useFilterTree = () => {
  // Local state for controlling UI visibility (might be better managed in FilterSection itself)
  const [showNeighborhoods, setShowNeighborhoods] = useState(false);
  const [showTags, setShowTags] = useState(false); // Assuming tags filter is planned

  // Get filter state and setters from the UI state store
  // Assuming neighborhood and tags filters are managed in useUIStateStore
  // Adjust state names if they differ in your useUIStateStore implementation
  const selectedNeighborhood = useUIStateStore((state) => state.neighborhood); // Example state name
  const selectedTags = useUIStateStore((state) => state.tags || []); // Example state name, default to empty array
  const setNeighborhoodFilter = useUIStateStore((state) => state.setNeighborhood); // Example action name
  const setTagsFilter = useUIStateStore((state) => state.setTags); // Example action name
  const setCityId = useUIStateStore((state) => state.setCityId); // Keep city ID setter if needed for clearAll

  // Actions to modify filters via the store
  const toggleCity = () => {
    // This might just control local UI state or could reset neighborhood/tags
    setShowNeighborhoods(true);
    // Potentially reset neighborhood/tags when city context changes?
    // setNeighborhoodFilter(null);
    // setTagsFilter([]);
  };

  const selectNeighborhood = (neighborhood) => {
    // Toggle or set neighborhood filter in the store
    const newNeighborhood = selectedNeighborhood === neighborhood ? null : neighborhood;
    setNeighborhoodFilter(newNeighborhood);
    // Control UI based on selection
    setShowTags(!!newNeighborhood); // Show tags if a neighborhood is selected
    setShowNeighborhoods(!newNeighborhood); // Hide neighborhoods if one is selected
  };

  const toggleTag = (tag) => {
    // Toggle tag selection in the store
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];
    setTagsFilter(newTags);
  };

  const goBack = () => {
    // Go back from tags/neighborhood view, likely reset neighborhood/tags
    setNeighborhoodFilter(null);
    setTagsFilter([]);
    setShowNeighborhoods(true); // Show neighborhoods again (or cities?)
    setShowTags(false);
  };

  const clearAll = () => {
    // Reset all filters managed by UI store and potentially local UI state
    setCityId(null); // Assuming cityId is also part of filters
    setNeighborhoodFilter(null);
    setTagsFilter([]);
    setShowNeighborhoods(false);
    setShowTags(false);
  };

  // Return state and actions needed by the component using this hook
  return {
    showNeighborhoods,
    showTags,
    selectedNeighborhood, // Pass selected filter state
    selectedTags,         // Pass selected filter state
    toggleCity,           // Action
    selectNeighborhood,   // Action
    toggleTag,            // Action
    goBack,               // Action
    clearAll,             // Action
  };
};

export default useFilterTree;