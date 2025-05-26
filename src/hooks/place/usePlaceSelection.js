/**
 * usePlaceSelection Hook
 * 
 * Custom hook for managing place selection when multiple places are found.
 * Extracted from usePlaceResolver.js to improve separation of concerns.
 */
import { useState, useCallback } from 'react';
import { logDebug } from '@/utils/logger';

/**
 * Custom hook for managing place selection
 * @param {Function} onSelectionComplete - Callback when selection is complete
 * @returns {Object} Place selection state and functions
 */
const usePlaceSelection = (onSelectionComplete) => {
  const [placeSelections, setPlaceSelections] = useState([]);
  const [awaitingSelection, setAwaitingSelection] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  
  /**
   * Open place selection dialog for an item
   * @param {Object} item - Item being processed
   * @param {Array} places - Places found for the item
   */
  const openPlaceSelection = useCallback((item, places) => {
    logDebug(`[usePlaceSelection] Opening selection dialog for ${item.name} with ${places.length} options`);
    setPlaceSelections(places);
    setCurrentItem(item);
    setAwaitingSelection(true);
  }, []);
  
  /**
   * Handle place selection
   * @param {Object} place - Selected place
   */
  const selectPlace = useCallback((place) => {
    if (!currentItem || !awaitingSelection) return;
    
    logDebug(`[usePlaceSelection] Place selected for ${currentItem.name}: ${place.name}`);
    
    // Reset selection state
    setAwaitingSelection(false);
    
    // Call the selection complete callback if provided
    if (onSelectionComplete && typeof onSelectionComplete === 'function') {
      onSelectionComplete(currentItem, place);
    }
    
    // Clear selection state
    setPlaceSelections([]);
    setCurrentItem(null);
  }, [currentItem, awaitingSelection, onSelectionComplete]);
  
  /**
   * Cancel place selection
   */
  const cancelPlaceSelection = useCallback(() => {
    logDebug('[usePlaceSelection] Place selection cancelled');
    
    // Reset selection state
    setAwaitingSelection(false);
    setPlaceSelections([]);
    setCurrentItem(null);
    
    // Call the selection complete callback with null place if provided
    if (onSelectionComplete && typeof onSelectionComplete === 'function') {
      onSelectionComplete(currentItem, null);
    }
  }, [currentItem, onSelectionComplete]);
  
  /**
   * Reset place selection state
   */
  const resetSelection = useCallback(() => {
    setAwaitingSelection(false);
    setPlaceSelections([]);
    setCurrentItem(null);
  }, []);
  
  return {
    placeSelections,
    awaitingSelection,
    currentItem,
    openPlaceSelection,
    selectPlace,
    cancelPlaceSelection,
    resetSelection
  };
};

export default usePlaceSelection;
