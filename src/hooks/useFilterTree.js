// src/hooks/useFilterTree.js
import { useState } from 'react';
import useAppStore from './useAppStore';

const useFilterTree = () => {
  const [showNeighborhoods, setShowNeighborhoods] = useState(false);
  const [showTags, setShowTags] = useState(false);
  const activeFilters = useAppStore((state) => state.activeFilters);
  const setFilter = useAppStore((state) => state.setFilter);

  const toggleCity = () => {
    setShowNeighborhoods(true);
  };

  const toggleNeighborhood = (neighborhood) => {
    const newNeighborhood = activeFilters.neighborhood === neighborhood ? null : neighborhood;
    setFilter('neighborhood', newNeighborhood);
    setShowTags(!!newNeighborhood);
    setShowNeighborhoods(!newNeighborhood);
  };

  const toggleTag = (tag) => {
    const newTags = activeFilters.tags.includes(tag)
      ? activeFilters.tags.filter(t => t !== tag)
      : [...activeFilters.tags, tag];
    setFilter('tags', newTags);
  };

  const goBack = () => {
    setFilter('neighborhood', null);
    setFilter('tags', []);
    setShowNeighborhoods(true);
    setShowTags(false);
  };

  const clearAll = () => {
    setFilter('neighborhood', null);
    setFilter('tags', []);
    setShowNeighborhoods(false);
    setShowTags(false);
  };

  return {
    showNeighborhoods,
    showTags,
    toggleCity,
    toggleNeighborhood,
    toggleTag,
    goBack,
    clearAll,
    activeFilters,
  };
};

export default useFilterTree;