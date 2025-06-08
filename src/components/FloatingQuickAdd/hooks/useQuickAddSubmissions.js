/**
 * useQuickAddSubmissions Hook
 * 
 * Single Responsibility: Handle form submissions and store integration
 * - Handle list creation submission
 * - Handle restaurant submission
 * - Handle dish submission
 * - Manage store integration and error handling
 */

import { useCallback, useMemo } from 'react';
import useApiErrorHandler from '@/hooks/useApiErrorHandler';
import useUserListStore from '@/stores/useUserListStore';
import useSubmissionStore from '@/stores/useSubmissionStore';
import { logDebug, logError, logInfo } from '@/utils/logger';

/**
 * Form submission handling for QuickAdd component
 * @param {Object} forms - Form handlers from useQuickAddForms
 * @param {Function} onSuccess - Success callback
 * @param {Function} onError - Error callback
 * @returns {Object} Submission handlers and state
 */
export const useQuickAddSubmissions = (forms, onSuccess, onError) => {
  // API error handling
  const { handleError, errorMessage, clearError } = useApiErrorHandler();

  // Store hooks
  const { addToList } = useUserListStore();
  const isAddingToListStore = useUserListStore(state => state.isAddingToList);
  const userListStoreError = useUserListStore(state => state.error);
  const clearUserListStoreError = useUserListStore(state => state.clearError);

  const addPendingSubmission = useSubmissionStore(state => state.addPendingSubmission);
  const isSubmittingViaStore = useSubmissionStore(state => state.isLoading);
  const submissionStoreError = useSubmissionStore(state => state.error);
  const clearSubmissionStoreError = useSubmissionStore(state => state.clearError);

  /**
   * Clear all submission errors
   */
  const clearAllErrors = useCallback(() => {
    clearError();
    clearSubmissionStoreError();
    clearUserListStoreError();
    forms.clearAllFormErrors();
  }, [clearError, clearSubmissionStoreError, clearUserListStoreError, forms]);

  /**
   * Handle list creation submission
   */
  const handleCreateNewList = useCallback(async () => {
    try {
      clearAllErrors();
      
      const result = await forms.listForm.handleSubmit(async (data) => {
        // Client-side validation
        if (!data.name?.trim()) {
          throw new Error('List name is required.');
        }
        if (!data.list_type) {
          throw new Error('Please select a list type.');
        }

        logDebug('[useQuickAddSubmissions] Creating new list:', data);
        await addToList({ 
          createNew: true, 
          listData: { 
            name: data.name.trim(), 
            list_type: data.list_type, 
            is_public: true 
          } 
        });
      });

      if (result.success) {
        logInfo('[useQuickAddSubmissions] List created successfully');
        onSuccess('List created successfully!', 'menu', () => {
          forms.listForm.reset();
        });
      } else {
        const error = result.error || userListStoreError || 'Failed to create list.';
        forms.listForm.setError(error);
        logError('[useQuickAddSubmissions] Failed to create list:', error);
        onError(error);
      }
    } catch (error) {
      const errorMsg = error.message || 'An unexpected error occurred while creating the list.';
      forms.listForm.setError(errorMsg);
      logError('[useQuickAddSubmissions] Exception in handleCreateNewList:', error);
      onError(errorMsg);
    }
  }, [forms, addToList, userListStoreError, onSuccess, onError, clearAllErrors]);

  /**
   * Handle restaurant submission
   */
  const handleCreateRestaurant = useCallback(async (manualCity) => {
    try {
      clearAllErrors();
      const finalCity = (forms.restaurantForm.data.city || manualCity)?.trim();
      
      // Enhanced validation
      if (!forms.restaurantForm.data.name?.trim()) {
        forms.restaurantForm.setError('Restaurant name is required.');
        return;
      }
      if (!forms.restaurantForm.data.place_id) {
        forms.restaurantForm.setError('Please select a place from suggestions to get location details.');
        return;
      }
      if (!finalCity) {
        forms.restaurantForm.setError('City is required. Please select a place or choose a city manually.');
        return { showManualCitySelect: true };
      }

      const result = await forms.restaurantForm.handleSubmit(async (data) => {
        logDebug('[useQuickAddSubmissions] Submitting restaurant data:', { ...data, city: finalCity });
        
        await addPendingSubmission({
          type: 'restaurant',
          name: data.name.trim(),
          place_id: data.place_id,
          location: data.address || null,
          city: finalCity,
          neighborhood: data.neighborhood?.trim() || null
        });
      });

      if (result.success) {
        logInfo('[useQuickAddSubmissions] Restaurant submitted successfully');
        onSuccess('Restaurant submitted successfully!', 'restaurant', () => {
          forms.resetAllForms();
        });
      } else {
        const error = result.error || submissionStoreError || 'Failed to submit restaurant.';
        forms.restaurantForm.setError(error);
        logError('[useQuickAddSubmissions] Failed to submit restaurant:', error);
        onError(error);
      }
    } catch (error) {
      const errorMsg = error.message || 'An unexpected error occurred while submitting the restaurant.';
      forms.restaurantForm.setError(errorMsg);
      logError('[useQuickAddSubmissions] Exception in handleCreateRestaurant:', error);
      onError(errorMsg);
    }
  }, [forms, addPendingSubmission, submissionStoreError, onSuccess, onError, clearAllErrors]);

  /**
   * Handle dish submission
   */
  const handleCreateDish = useCallback(async () => {
    try {
      clearAllErrors();
      
      // Enhanced validation
      if (!forms.dishForm.data.name?.trim()) {
        forms.dishForm.setError('Dish name is required.');
        return;
      }
      if (!forms.dishForm.data.restaurant_id) {
        forms.dishForm.setError('Please select a restaurant from suggestions.');
        return;
      }

      const result = await forms.dishForm.handleSubmit(async (data) => {
        logDebug('[useQuickAddSubmissions] Submitting dish data:', data);
        
        await addPendingSubmission({
          type: 'dish',
          name: data.name.trim(),
          restaurant_id: data.restaurant_id,
          restaurant_name: data.restaurant_name || null
        });
      });

      if (result.success) {
        logInfo('[useQuickAddSubmissions] Dish submitted successfully');
        onSuccess('Dish submitted successfully!', 'menu', () => {
          forms.dishForm.reset();
        });
      } else {
        const error = result.error || submissionStoreError || 'Failed to submit dish.';
        forms.dishForm.setError(error);
        logError('[useQuickAddSubmissions] Failed to submit dish:', error);
        onError(error);
      }
    } catch (error) {
      const errorMsg = error.message || 'An unexpected error occurred while submitting the dish.';
      forms.dishForm.setError(errorMsg);
      logError('[useQuickAddSubmissions] Exception in handleCreateDish:', error);
      onError(errorMsg);
    }
  }, [forms, addPendingSubmission, submissionStoreError, onSuccess, onError, clearAllErrors]);

  // Computed state
  const isSubmittingAny = useMemo(() => {
    return forms.isAnyFormSubmitting || isAddingToListStore || isSubmittingViaStore;
  }, [forms.isAnyFormSubmitting, isAddingToListStore, isSubmittingViaStore]);

  const displayError = useMemo(() => {
    return forms.allFormErrors.list || 
           forms.allFormErrors.restaurant || 
           forms.allFormErrors.dish || 
           userListStoreError || 
           submissionStoreError || 
           errorMessage;
  }, [forms.allFormErrors, userListStoreError, submissionStoreError, errorMessage]);

  return {
    // Submission handlers
    handleCreateNewList,
    handleCreateRestaurant,
    handleCreateDish,

    // State
    isSubmittingAny,
    displayError,

    // Store states
    stores: {
      userList: {
        isLoading: isAddingToListStore,
        error: userListStoreError
      },
      submission: {
        isLoading: isSubmittingViaStore,
        error: submissionStoreError
      }
    },

    // Utilities
    clearAllErrors
  };
}; 