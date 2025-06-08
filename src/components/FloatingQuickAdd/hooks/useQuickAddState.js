/**
 * useQuickAddState Hook
 * 
 * Single Responsibility: Manage core QuickAdd component state
 * - Handle view navigation and modal state
 * - Manage success/error message state
 * - Coordinate form reset logic
 * - Provide state cleanup utilities
 */

import { useState, useCallback, useEffect } from 'react';
import { logDebug, logError } from '@/utils/logger';

/**
 * Core state management for QuickAdd component
 * @param {boolean} initiallyOpen - Whether component starts open
 * @returns {Object} State management utilities
 */
export const useQuickAddState = (initiallyOpen = false) => {
  // Core UI state
  const [isOpen, setIsOpen] = useState(initiallyOpen);
  const [currentView, setCurrentView] = useState('menu'); // 'menu', 'list', 'restaurant', 'dish'
  const [successMessage, setSuccessMessage] = useState(null);
  const [retryAttempt, setRetryAttempt] = useState(0);

  // Restaurant-specific state
  const [manualCity, setManualCity] = useState('');
  const [showManualCitySelect, setShowManualCitySelect] = useState(false);

  // Dish-specific state
  const [dishSuggestions, setDishSuggestions] = useState([]);

  /**
   * Navigate to a specific view
   * @param {string} view - Target view name
   */
  const showView = useCallback((view) => {
    logDebug(`[useQuickAddState] Navigating to view: ${view}`);
    setCurrentView(view);
  }, []);

  /**
   * Toggle the main modal open/closed state
   */
  const toggleOpen = useCallback(() => {
    logDebug(`[useQuickAddState] Toggling open state: ${!isOpen}`);
    setIsOpen(!isOpen);
  }, [isOpen]);

  /**
   * Reset all component state to initial values
   */
  const resetAllState = useCallback(() => {
    try {
      logDebug('[useQuickAddState] Resetting all state');
      setCurrentView('menu');
      setSuccessMessage(null);
      setDishSuggestions([]);
      setShowManualCitySelect(false);
      setManualCity('');
      setRetryAttempt(0);
    } catch (error) {
      logError('[useQuickAddState] Error during state reset:', error);
    }
  }, []);

  /**
   * Handle successful form submission
   * @param {string} message - Success message to display
   * @param {string} nextView - Optional view to navigate to after delay
   * @param {Function} onComplete - Optional callback after delay
   */
  const handleSuccess = useCallback((message, nextView = 'menu', onComplete = null) => {
    setSuccessMessage(message);
    
    setTimeout(() => {
      setSuccessMessage(null);
      if (nextView) {
        setCurrentView(nextView);
      }
      if (onComplete) {
        onComplete();
      }
    }, 2000);
  }, []);

  /**
   * Increment retry attempt counter
   */
  const incrementRetry = useCallback(() => {
    setRetryAttempt(prev => prev + 1);
  }, []);

  // Auto-clear success messages
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  return {
    // State values
    isOpen,
    currentView,
    successMessage,
    retryAttempt,
    manualCity,
    showManualCitySelect,
    dishSuggestions,

    // State setters (for specific use cases)
    setManualCity,
    setShowManualCitySelect,
    setDishSuggestions,

    // State actions
    showView,
    toggleOpen,
    resetAllState,
    handleSuccess,
    incrementRetry
  };
}; 