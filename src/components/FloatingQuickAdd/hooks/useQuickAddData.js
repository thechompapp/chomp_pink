/**
 * useQuickAddData Hook
 * 
 * Single Responsibility: Manage data fetching for QuickAdd component
 * - Handle dish suggestions via search service
 * - Handle cities list via filter service
 * - Manage loading states and error handling
 * - Provide data utilities and suggestions processing
 */

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchService } from '@/services/searchService';
import { filterService } from '@/services/filterService';
import { logDebug, logError, logWarn } from '@/utils/logger';

/**
 * Data fetching for QuickAdd component
 * @param {Object} params - Data fetching parameters
 * @param {string} params.currentView - Current active view
 * @param {string} params.dishSearchTerm - Dish name for suggestions
 * @param {Function} params.onDishSuggestionsChange - Callback for dish suggestions
 * @returns {Object} Data fetching state and utilities
 */
export const useQuickAddData = ({ 
  currentView, 
  dishSearchTerm, 
  onDishSuggestionsChange 
}) => {
  
  // Dish suggestions query
  const { 
    data: dishSearchResults, 
    isLoading: isDishLoading, 
    isError: isDishError,
    error: dishError
  } = useQuery({
    queryKey: ['dishSuggestions', dishSearchTerm],
    queryFn: async () => {
      try {
        logDebug('[useQuickAddData] Fetching dish suggestions for:', dishSearchTerm);
        const result = await searchService.search({ 
          q: dishSearchTerm, 
          type: 'dish', 
          limit: 5 
        });
        return result || { dishes: [] };
      } catch (error) {
        logError('[useQuickAddData] Error fetching dish suggestions:', error);
        throw error;
      }
    },
    enabled: currentView === 'dish' && !!dishSearchTerm?.trim() && dishSearchTerm.length >= 2,
    placeholderData: { dishes: [] },
    retry: (failureCount, error) => {
      if (failureCount < 2) {
        logWarn(`[useQuickAddData] Retrying dish suggestions (attempt ${failureCount + 1}):`, error);
        return true;
      }
      return false;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 30 * 1000, // 30 seconds
    cacheTime: 5 * 60 * 1000, // 5 minutes
  });

  // Cities list query
  const { 
    data: citiesList, 
    isLoading: isLoadingCities, 
    isError: isCitiesError,
    error: citiesError
  } = useQuery({
    queryKey: ['citiesList'],
    queryFn: async () => {
      try {
        logDebug('[useQuickAddData] Fetching cities list');
        const result = await filterService.getCities();
        return Array.isArray(result) ? result : [];
      } catch (error) {
        logError('[useQuickAddData] Error fetching cities:', error);
        throw error;
      }
    },
    staleTime: Infinity,
    enabled: currentView === 'restaurant',
    placeholderData: [],
    retry: 2,
    onError: (error) => {
      logError('[useQuickAddData] Failed to load cities after retries:', error);
    },
  });

  // Process dish suggestions when data changes
  useEffect(() => {
    if (currentView === 'dish' && dishSearchResults?.dishes) {
      try {
        const suggestions = Array.isArray(dishSearchResults.dishes) 
          ? dishSearchResults.dishes.map(dish => dish?.name).filter(Boolean)
          : [];
        
        logDebug('[useQuickAddData] Processed dish suggestions:', suggestions.length);
        onDishSuggestionsChange(suggestions);
      } catch (error) {
        logError('[useQuickAddData] Error processing dish suggestions:', error);
        onDishSuggestionsChange([]);
      }
    } else {
      onDishSuggestionsChange([]);
    }
  }, [dishSearchResults, currentView, onDishSuggestionsChange]);

  // Data state summary
  const hasDataErrors = isDishError || isCitiesError;
  const isLoadingAnyData = isDishLoading || isLoadingCities;

  return {
    // Dish suggestions
    dish: {
      suggestions: dishSearchResults?.dishes || [],
      isLoading: isDishLoading,
      isError: isDishError,
      error: dishError
    },

    // Cities data
    cities: {
      list: citiesList || [],
      isLoading: isLoadingCities,
      isError: isCitiesError,
      error: citiesError
    },

    // Overall state
    hasDataErrors,
    isLoadingAnyData,

    // Error details for debugging
    errors: {
      dish: dishError,
      cities: citiesError
    }
  };
}; 