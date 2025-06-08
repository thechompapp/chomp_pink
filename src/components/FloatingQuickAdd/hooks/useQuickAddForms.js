/**
 * useQuickAddForms Hook
 * 
 * Single Responsibility: Manage all QuickAdd form state and validation
 * - Handle list creation form
 * - Handle restaurant submission form  
 * - Handle dish submission form
 * - Provide form reset and validation utilities
 */

import { useCallback } from 'react';
import useFormHandler from '@/hooks/useFormHandler';
import { logDebug, logError } from '@/utils/logger';

/**
 * Form management for all QuickAdd forms
 * @returns {Object} Form handlers and state for all forms
 */
export const useQuickAddForms = () => {
  // List creation form
  const initialListValues = { name: '', list_type: '' };
  const { 
    formData: listFormData, 
    setFormData: setListFormData, 
    handleChange: handleListChange, 
    handleSubmit: handleListSubmit, 
    isSubmitting: isListFormSubmitting, 
    submitError: listSubmitError, 
    setSubmitError: setListSubmitError, 
    resetForm: resetListForm 
  } = useFormHandler(initialListValues);

  // Restaurant submission form
  const initialRestaurantValues = { 
    name: '', 
    place_id: '', 
    address: '', 
    city: '', 
    neighborhood: '' 
  };
  const { 
    formData: restaurantFormData, 
    setFormData: setRestaurantFormData, 
    handleSubmit: handleRestaurantSubmit, 
    isSubmitting: isRestaurantFormSubmitting, 
    submitError: restaurantSubmitError, 
    setSubmitError: setRestaurantSubmitError, 
    resetForm: resetRestaurantForm 
  } = useFormHandler(initialRestaurantValues);

  // Dish submission form
  const initialDishValues = { 
    name: '', 
    restaurant_id: null, 
    restaurant_name: '' 
  };
  const { 
    formData: dishFormData, 
    setFormData: setDishFormData, 
    handleChange: handleDishChange, 
    handleSubmit: handleDishSubmit, 
    isSubmitting: isDishFormSubmitting, 
    submitError: dishSubmitError, 
    setSubmitError: setDishSubmitError, 
    resetForm: resetDishForm 
  } = useFormHandler(initialDishValues);

  /**
   * Handle list type selection
   * @param {string} type - List type (restaurant/dish)
   */
  const handleListTypeSelect = useCallback((type) => {
    logDebug(`[useQuickAddForms] List type selected: ${type}`);
    setListFormData((prev) => ({ ...prev, list_type: type }));
  }, [setListFormData]);

  /**
   * Handle place selection for restaurant form
   * @param {Object} placeData - Selected place data from autocomplete
   */
  const handlePlaceSelected = useCallback((placeData) => {
    try {
      logDebug('[useQuickAddForms] Place selected:', placeData);

      if (placeData && placeData.place_id) {
        const extractedCity = placeData.city?.trim() || '';
        setRestaurantFormData({
          name: placeData.name || '',
          place_id: placeData.place_id,
          address: placeData.formattedAddress || '',
          city: extractedCity,
          neighborhood: placeData.neighborhood?.trim() || '',
        });

        // Return whether city was successfully extracted
        return { success: true, cityExtracted: !!extractedCity };
      } else {
        setRestaurantFormData(initialRestaurantValues);
        logDebug('[useQuickAddForms] Reset restaurant form (invalid place data)');
        return { success: false, cityExtracted: false };
      }
    } catch (error) {
      logError('[useQuickAddForms] Error handling place selection:', error);
      setRestaurantSubmitError('Error processing place data. Please try again.');
      return { success: false, cityExtracted: false };
    }
  }, [setRestaurantFormData, initialRestaurantValues, setRestaurantSubmitError]);

  /**
   * Handle restaurant selection for dish form
   * @param {Object} restaurant - Selected restaurant data
   */
  const handleRestaurantSelected = useCallback((restaurant) => {
    try {
      if (restaurant && restaurant.id) {
        setDishFormData(prev => ({ 
          ...prev,
          restaurant_id: restaurant.id, 
          restaurant_name: restaurant.name || '' 
        }));
      } else {
        setDishFormData(prev => ({ 
          ...prev, 
          restaurant_id: '', 
          restaurant_name: '' 
        }));
      }
    } catch (error) {
      logError('[useQuickAddForms] Error handling restaurant selection:', error);
      setDishSubmitError('Error processing restaurant data. Please try again.');
    }
  }, [setDishFormData, setDishSubmitError]);

  /**
   * Handle dish suggestion selection
   * @param {string} suggestion - Selected dish name suggestion
   */
  const handleDishSuggestionSelect = useCallback((suggestion) => {
    try {
      if (suggestion && typeof suggestion === 'string') {
        setDishFormData((prev) => ({ ...prev, name: suggestion }));
        return true; // Success
      }
      return false;
    } catch (error) {
      logError('[useQuickAddForms] Error handling dish suggestion selection:', error);
      return false;
    }
  }, [setDishFormData]);

  /**
   * Handle dish form name changes with restaurant reset logic
   * @param {Object} event - Input change event
   */
  const handleDishNameChange = useCallback((event) => {
    const newValue = event.target.value;
    
    // If restaurant is selected and name changes, keep restaurant
    // This is handled by the parent component's logic
    handleDishChange(event);
  }, [handleDishChange]);

  /**
   * Handle dish form restaurant name changes with validation
   * @param {string} value - New restaurant name value
   */
  const handleDishRestaurantNameChange = useCallback((value) => {
    // If user types something different from selected restaurant, clear selection
    if (dishFormData.restaurant_id && value !== dishFormData.restaurant_name) {
      setDishFormData(prev => ({ 
        ...prev, 
        restaurant_name: value, 
        restaurant_id: '' 
      }));
    } else {
      setDishFormData(prev => ({ 
        ...prev, 
        restaurant_name: value 
      }));
    }
  }, [dishFormData.restaurant_id, dishFormData.restaurant_name, setDishFormData]);

  /**
   * Reset all forms to initial state
   */
  const resetAllForms = useCallback(() => {
    try {
      logDebug('[useQuickAddForms] Resetting all forms');
      resetListForm(initialListValues);
      resetRestaurantForm(initialRestaurantValues);
      resetDishForm(initialDishValues);
    } catch (error) {
      logError('[useQuickAddForms] Error during forms reset:', error);
    }
  }, [resetListForm, resetRestaurantForm, resetDishForm, initialListValues, initialRestaurantValues, initialDishValues]);

  /**
   * Clear all form errors
   */
  const clearAllFormErrors = useCallback(() => {
    setListSubmitError(null);
    setRestaurantSubmitError(null);
    setDishSubmitError(null);
  }, [setListSubmitError, setRestaurantSubmitError, setDishSubmitError]);

  /**
   * Check if any form is currently submitting
   */
  const isAnyFormSubmitting = isListFormSubmitting || isRestaurantFormSubmitting || isDishFormSubmitting;

  /**
   * Get combined form errors
   */
  const allFormErrors = {
    list: listSubmitError,
    restaurant: restaurantSubmitError,
    dish: dishSubmitError
  };

  return {
    // List form
    listForm: {
      data: listFormData,
      setData: setListFormData,
      handleChange: handleListChange,
      handleSubmit: handleListSubmit,
      isSubmitting: isListFormSubmitting,
      error: listSubmitError,
      setError: setListSubmitError,
      reset: () => resetListForm(initialListValues)
    },

    // Restaurant form
    restaurantForm: {
      data: restaurantFormData,
      setData: setRestaurantFormData,
      handleSubmit: handleRestaurantSubmit,
      isSubmitting: isRestaurantFormSubmitting,
      error: restaurantSubmitError,
      setError: setRestaurantSubmitError,
      reset: () => resetRestaurantForm(initialRestaurantValues)
    },

    // Dish form
    dishForm: {
      data: dishFormData,
      setData: setDishFormData,
      handleChange: handleDishChange,
      handleSubmit: handleDishSubmit,
      isSubmitting: isDishFormSubmitting,
      error: dishSubmitError,
      setError: setDishSubmitError,
      reset: () => resetDishForm(initialDishValues)
    },

    // Form handlers
    handleListTypeSelect,
    handlePlaceSelected,
    handleRestaurantSelected,
    handleDishSuggestionSelect,
    handleDishNameChange,
    handleDishRestaurantNameChange,

    // Utility functions
    resetAllForms,
    clearAllFormErrors,
    isAnyFormSubmitting,
    allFormErrors
  };
}; 