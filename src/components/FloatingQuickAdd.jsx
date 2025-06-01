/* src/components/FloatingQuickAdd.jsx */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Plus, X, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import PlacesAutocomplete from '@/components/UI/PlacesAutocomplete';
import RestaurantAutocomplete from '@/components/UI/RestaurantAutocomplete';
import Button from '@/components/UI/Button';
import Input from '@/components/UI/Input';
import PillButton from '@/components/UI/PillButton';
import Select from '@/components/UI/Select';
import { useQuickAdd } from '@/contexts/QuickAddContext';
import useFormHandler from '@/hooks/useFormHandler';
import useApiErrorHandler from '@/hooks/useApiErrorHandler';
import useUserListStore from '@/stores/useUserListStore';
import useSubmissionStore from '@/stores/useSubmissionStore';
import { useQuery } from '@tanstack/react-query';
import { searchService } from '@/services/searchService';
import { filterService } from '@/services/filterService';
import * as logger from '@/utils/logger';

/**
 * FloatingQuickAdd Component
 * 
 * A floating action button that provides quick access to create lists,
 * submit restaurants, and submit dishes. Features form validation,
 * error handling, and integration with various stores.
 * 
 * @component
 */
const FloatingQuickAdd = ({ className = '', initiallyOpen = false }) => {
  // State management with better organization
  const [isOpen, setIsOpen] = useState(initiallyOpen);
  const [currentView, setCurrentView] = useState('menu'); // 'menu', 'list', 'restaurant', 'dish'
  const [successMessage, setSuccessMessage] = useState(null);
  const [dishSuggestions, setDishSuggestions] = useState([]);
  const [manualCity, setManualCity] = useState('');
  const [showManualCitySelect, setShowManualCitySelect] = useState(false);
  const [retryAttempt, setRetryAttempt] = useState(0);

  // Context and store hooks with better error handling
  const { openQuickAdd } = useQuickAdd();
  const { handleError, errorMessage, clearError } = useApiErrorHandler();

  const { addToList } = useUserListStore();
  const isAddingToListStore = useUserListStore(state => state.isAddingToList);
  const userListStoreError = useUserListStore(state => state.error);
  const clearUserListStoreError = useUserListStore(state => state.clearError);

  const addPendingSubmission = useSubmissionStore(state => state.addPendingSubmission);
  const isSubmittingViaStore = useSubmissionStore(state => state.isLoading);
  const submissionStoreError = useSubmissionStore(state => state.error);
  const clearSubmissionStoreError = useSubmissionStore(state => state.clearError);

  // Form handlers with validation
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

  const initialRestaurantValues = { name: '', place_id: '', address: '', city: '', neighborhood: '' };
  const { 
    formData: restaurantFormData, 
    setFormData: setRestaurantFormData, 
    handleSubmit: handleRestaurantSubmit, 
    isSubmitting: isRestaurantFormSubmitting, 
    submitError: restaurantSubmitError, 
    setSubmitError: setRestaurantSubmitError, 
    resetForm: resetRestaurantForm 
  } = useFormHandler(initialRestaurantValues);

  const initialDishValues = { name: '', restaurant_id: null, restaurant_name: '' };
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

  // Enhanced data fetching with better error handling
  const { 
    data: dishSearchResults, 
    isLoading: isDishLoading, 
    isError: isDishError,
    error: dishError
  } = useQuery({
    queryKey: ['dishSuggestions', dishFormData.name],
    queryFn: async () => {
      try {
        logger.logDebug('[FloatingQuickAdd] Fetching dish suggestions for:', dishFormData.name);
        const result = await searchService.search({ 
          q: dishFormData.name, 
          type: 'dish', 
          limit: 5 
        });
        return result || { dishes: [] };
      } catch (error) {
        logger.logError('[FloatingQuickAdd] Error fetching dish suggestions:', error);
        throw error;
      }
    },
    enabled: currentView === 'dish' && !!dishFormData.name.trim() && dishFormData.name.length >= 2,
    placeholderData: { dishes: [] },
    retry: (failureCount, error) => {
      if (failureCount < 2) {
        logger.logWarn(`[FloatingQuickAdd] Retrying dish suggestions (attempt ${failureCount + 1}):`, error);
        return true;
      }
      return false;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 30 * 1000, // 30 seconds
    cacheTime: 5 * 60 * 1000, // 5 minutes
  });

  const { 
    data: citiesList, 
    isLoading: isLoadingCities, 
    isError: isCitiesError,
    error: citiesError
  } = useQuery({
    queryKey: ['citiesList'],
    queryFn: async () => {
      try {
        logger.logDebug('[FloatingQuickAdd] Fetching cities list');
        const result = await filterService.getCities();
        return Array.isArray(result) ? result : [];
      } catch (error) {
        logger.logError('[FloatingQuickAdd] Error fetching cities:', error);
        throw error;
      }
    },
    staleTime: Infinity,
    enabled: currentView === 'restaurant',
    placeholderData: [],
    retry: 2,
    onError: (error) => {
      logger.logError('[FloatingQuickAdd] Failed to load cities after retries:', error);
    },
  });

  // Memoized computed values
  const isSubmittingAny = useMemo(() => {
    return isListFormSubmitting || isAddingToListStore || isRestaurantFormSubmitting || 
           isDishFormSubmitting || isSubmittingViaStore;
  }, [isListFormSubmitting, isAddingToListStore, isRestaurantFormSubmitting, isDishFormSubmitting, isSubmittingViaStore]);

  const displayError = useMemo(() => {
    return listSubmitError || userListStoreError || restaurantSubmitError || 
           dishSubmitError || submissionStoreError || errorMessage;
  }, [listSubmitError, userListStoreError, restaurantSubmitError, dishSubmitError, submissionStoreError, errorMessage]);

  const hasDataErrors = useMemo(() => {
    return isDishError || isCitiesError;
  }, [isDishError, isCitiesError]);

  // Enhanced effects with proper cleanup
  useEffect(() => {
    if (currentView === 'dish' && dishSearchResults?.dishes) {
      try {
        const suggestions = Array.isArray(dishSearchResults.dishes) 
          ? dishSearchResults.dishes.map(dish => dish?.name).filter(Boolean)
          : [];
        setDishSuggestions(suggestions);
      } catch (error) {
        logger.logError('[FloatingQuickAdd] Error processing dish suggestions:', error);
        setDishSuggestions([]);
      }
    } else {
      setDishSuggestions([]);
    }
  }, [dishSearchResults, currentView]);

  // Auto-clear success messages
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Cleanup timeout for error messages
  useEffect(() => {
    if (displayError) {
      const timer = setTimeout(() => {
        clearAllErrors();
      }, 10000); // Auto-clear errors after 10 seconds
      return () => clearTimeout(timer);
    }
  }, [displayError]);

  // Enhanced reset function with better cleanup
  const resetAllFormsAndStates = useCallback(() => {
    try {
      setCurrentView('menu');
      setSuccessMessage(null);
      setDishSuggestions([]);
      setShowManualCitySelect(false);
      setManualCity('');
      setRetryAttempt(0);
      clearAllErrors();
      resetListForm(initialListValues);
      resetRestaurantForm(initialRestaurantValues);
      resetDishForm(initialDishValues);
    } catch (error) {
      logger.logError('[FloatingQuickAdd] Error during reset:', error);
    }
  }, [resetListForm, resetRestaurantForm, resetDishForm, initialListValues, initialRestaurantValues, initialDishValues]);

  const clearAllErrors = useCallback(() => {
    clearError();
    clearSubmissionStoreError();
    clearUserListStoreError();
    setListSubmitError(null);
    setRestaurantSubmitError(null);
    setDishSubmitError(null);
  }, [clearError, clearSubmissionStoreError, clearUserListStoreError, setListSubmitError, setRestaurantSubmitError, setDishSubmitError]);

  const toggleOpen = useCallback(() => {
    if (isOpen) {
      resetAllFormsAndStates();
    }
    setIsOpen(!isOpen);
  }, [isOpen, resetAllFormsAndStates]);

  // Enhanced form handlers with better validation and error handling
  const handleCreateNewList = useCallback(async () => {
    try {
      clearAllErrors();
      const result = await handleListSubmit(async (data) => {
        // Client-side validation
        if (!data.name?.trim()) {
          throw new Error('List name is required.');
        }
        if (!data.list_type) {
          throw new Error('Please select a list type.');
        }

        logger.logDebug('[FloatingQuickAdd] Creating new list:', data);
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
        setSuccessMessage('List created successfully!');
        logger.logInfo('[FloatingQuickAdd] List created successfully');
        setTimeout(() => {
          setCurrentView('menu');
          setSuccessMessage(null);
          resetListForm(initialListValues);
        }, 2000);
      } else {
        const error = result.error || userListStoreError || 'Failed to create list.';
        setListSubmitError(error);
        logger.logError('[FloatingQuickAdd] Failed to create list:', error);
      }
    } catch (error) {
      const errorMsg = error.message || 'An unexpected error occurred while creating the list.';
      setListSubmitError(errorMsg);
      logger.logError('[FloatingQuickAdd] Exception in handleCreateNewList:', error);
    }
  }, [handleListSubmit, addToList, userListStoreError, resetListForm, initialListValues, clearAllErrors]);

  const handleCreateRestaurant = useCallback(async () => {
    try {
      clearAllErrors();
      const finalCity = (restaurantFormData.city || manualCity)?.trim();
      
      // Enhanced validation
      if (!restaurantFormData.name?.trim()) {
        setRestaurantSubmitError('Restaurant name is required.');
        return;
      }
      if (!restaurantFormData.place_id) {
        setRestaurantSubmitError('Please select a place from suggestions to get location details.');
        return;
      }
      if (!finalCity) {
        setRestaurantSubmitError('City is required. Please select a place or choose a city manually.');
        setShowManualCitySelect(true);
        return;
      }

      const result = await handleRestaurantSubmit(async (data) => {
        logger.logDebug('[FloatingQuickAdd] Submitting restaurant data:', { ...data, city: finalCity });
        
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
        setSuccessMessage('Restaurant submitted successfully!');
        logger.logInfo('[FloatingQuickAdd] Restaurant submitted successfully');
        setTimeout(() => {
          resetAllFormsAndStates();
          setIsOpen(true);
          setCurrentView('restaurant');
        }, 2000);
      } else {
        const error = result.error || submissionStoreError || 'Failed to submit restaurant.';
        setRestaurantSubmitError(error);
        logger.logError('[FloatingQuickAdd] Failed to submit restaurant:', error);
      }
    } catch (error) {
      const errorMsg = error.message || 'An unexpected error occurred while submitting the restaurant.';
      setRestaurantSubmitError(errorMsg);
      logger.logError('[FloatingQuickAdd] Exception in handleCreateRestaurant:', error);
    }
  }, [restaurantFormData, manualCity, handleRestaurantSubmit, addPendingSubmission, submissionStoreError, resetAllFormsAndStates, clearAllErrors]);

  const handleCreateDish = useCallback(async () => {
    try {
      clearAllErrors();
      
      // Enhanced validation
      if (!dishFormData.name?.trim()) {
        setDishSubmitError('Dish name is required.');
        return;
      }
      if (!dishFormData.restaurant_id) {
        setDishSubmitError('Please select a restaurant from suggestions.');
        return;
      }

      const result = await handleDishSubmit(async (data) => {
        logger.logDebug('[FloatingQuickAdd] Submitting dish data:', data);
        
        await addPendingSubmission({
          type: 'dish',
          name: data.name.trim(),
          restaurant_id: data.restaurant_id,
          restaurant_name: data.restaurant_name || null
        });
      });

      if (result.success) {
        setSuccessMessage('Dish submitted successfully!');
        logger.logInfo('[FloatingQuickAdd] Dish submitted successfully');
        setTimeout(() => {
          setCurrentView('menu');
          setSuccessMessage(null);
          resetDishForm(initialDishValues);
          setDishSuggestions([]);
        }, 2000);
      } else {
        const error = result.error || submissionStoreError || 'Failed to submit dish.';
        setDishSubmitError(error);
        logger.logError('[FloatingQuickAdd] Failed to submit dish:', error);
      }
    } catch (error) {
      const errorMsg = error.message || 'An unexpected error occurred while submitting the dish.';
      setDishSubmitError(errorMsg);
      logger.logError('[FloatingQuickAdd] Exception in handleCreateDish:', error);
    }
  }, [dishFormData, handleDishSubmit, addPendingSubmission, submissionStoreError, resetDishForm, initialDishValues, clearAllErrors]);

  const handleListTypeSelect = useCallback((type) => {
    setListFormData((prev) => ({ ...prev, list_type: type }));
    clearAllErrors();
  }, [setListFormData, clearAllErrors]);

  const handlePlaceSelected = useCallback((placeData) => {
    try {
      logger.logDebug('[FloatingQuickAdd] Place selected:', placeData);
      clearAllErrors();
      setManualCity('');
      setShowManualCitySelect(false);

      if (placeData && placeData.place_id) {
        const extractedCity = placeData.city?.trim() || '';
        setRestaurantFormData({
          name: placeData.name || '',
          place_id: placeData.place_id,
          address: placeData.formattedAddress || '',
          city: extractedCity,
          neighborhood: placeData.neighborhood?.trim() || '',
        });

        if (!extractedCity) {
          logger.logWarn('[FloatingQuickAdd] City not extracted from place data:', placeData);
          setRestaurantSubmitError('Warning: City could not be extracted. Please select manually below.');
          setShowManualCitySelect(true);
        }
      } else {
        setRestaurantFormData(initialRestaurantValues);
        logger.logDebug('[FloatingQuickAdd] Reset restaurant form (invalid place data)');
      }
    } catch (error) {
      logger.logError('[FloatingQuickAdd] Error handling place selection:', error);
      setRestaurantSubmitError('Error processing place data. Please try again.');
    }
  }, [setRestaurantFormData, initialRestaurantValues, clearAllErrors]);

  const handleRestaurantSelected = useCallback((restaurant) => {
    try {
      clearAllErrors();
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
      logger.logError('[FloatingQuickAdd] Error handling restaurant selection:', error);
      setDishSubmitError('Error processing restaurant data. Please try again.');
    }
  }, [setDishFormData, clearAllErrors]);

  const handleDishSuggestionSelect = useCallback((suggestion) => {
    try {
      if (suggestion && typeof suggestion === 'string') {
        setDishFormData((prev) => ({ ...prev, name: suggestion }));
        setDishSuggestions([]);
      }
    } catch (error) {
      logger.logError('[FloatingQuickAdd] Error handling dish suggestion selection:', error);
    }
  }, [setDishFormData]);

  // Navigation helpers
  const showView = useCallback((view) => {
    clearAllErrors();
    setCurrentView(view);
  }, [clearAllErrors]);

  // Error display component
  const ErrorDisplay = ({ error, onRetry = null }) => {
    if (!error) return null;
    
    return (
      <div className="flex items-start space-x-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
        <AlertCircle size={16} className="text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-1 text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 underline"
            >
              Try again
            </button>
          )}
        </div>
      </div>
    );
  };

  // Success display component
  const SuccessDisplay = ({ message }) => {
    if (!message) return null;
    
    return (
      <div className="flex items-center space-x-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
        <CheckCircle size={16} className="text-green-600 dark:text-green-400" />
        <p className="text-sm text-green-700 dark:text-green-300">{message}</p>
      </div>
    );
  };

  return (
    <div className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 ${className}`}>
      {isOpen ? (
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 w-80 sm:w-96 max-h-[80vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              Quick Add
            </h3>
            <Button 
              variant="tertiary" 
              size="icon" 
              onClick={toggleOpen} 
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" 
              aria-label="Close quick add" 
              disabled={isSubmittingAny}
            >
              <X size={20} />
            </Button>
          </div>

          {/* Global error display */}
          {hasDataErrors && (
            <ErrorDisplay
              error="Some data could not be loaded. Please check your connection and try again."
              onRetry={() => setRetryAttempt(prev => prev + 1)}
            />
          )}

          {/* Main menu */}
          {currentView === 'menu' && (
            <div className="space-y-2">
              <Button 
                variant="primary" 
                size="lg" 
                className="w-full justify-start text-left" 
                onClick={() => showView('list')}
                disabled={isSubmittingAny}
              >
                Create a List
              </Button>
              <Button 
                variant="primary" 
                size="lg" 
                className="w-full justify-start text-left" 
                onClick={() => showView('restaurant')}
                disabled={isSubmittingAny}
              >
                Submit a Restaurant
              </Button>
              <Button 
                variant="primary" 
                size="lg" 
                className="w-full justify-start text-left" 
                onClick={() => showView('dish')}
                disabled={isSubmittingAny}
              >
                Submit a Dish
              </Button>
            </div>
          )}

          {/* List creation view */}
          {currentView === 'list' && (
            <div className="space-y-3">
              <h4 className="text-md font-medium text-gray-700 dark:text-gray-300">New List</h4>
              <div>
                <label htmlFor="list-name" className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  List Name
                </label>
                <Input 
                  id="list-name" 
                  name="name" 
                  value={listFormData.name} 
                  onChange={handleListChange} 
                  placeholder="Enter list name..." 
                  className="w-full text-sm" 
                  disabled={isSubmittingAny}
                  aria-invalid={!!(listSubmitError || userListStoreError)}
                  aria-describedby={(listSubmitError || userListStoreError) ? 'list-error' : undefined}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  List Type
                </label>
                <div className="flex space-x-2">
                  <PillButton 
                    label="Restaurant" 
                    isActive={listFormData.list_type === 'restaurant'} 
                    onClick={() => handleListTypeSelect('restaurant')} 
                    disabled={isSubmittingAny}
                  />
                  <PillButton 
                    label="Dish" 
                    isActive={listFormData.list_type === 'dish'} 
                    onClick={() => handleListTypeSelect('dish')} 
                    disabled={isSubmittingAny}
                  />
                </div>
              </div>
              
              <ErrorDisplay error={displayError && currentView === 'list' ? displayError : null} />
              <SuccessDisplay message={successMessage} />
              
              <div className="flex justify-end space-x-2 mt-4">
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => setCurrentView('menu')} 
                  disabled={isSubmittingAny}
                >
                  Back
                </Button>
                <Button 
                  variant="primary" 
                  size="sm" 
                  onClick={handleCreateNewList} 
                  disabled={isSubmittingAny || !listFormData.name.trim() || !listFormData.list_type}
                >
                  {isSubmittingAny ? (
                    <>
                      <Loader2 className="animate-spin h-4 w-4 mr-2 inline-block" />
                      Creating...
                    </>
                  ) : (
                    'Create List'
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Restaurant submission view */}
          {currentView === 'restaurant' && (
            <div className="space-y-3">
              <h4 className="text-md font-medium text-gray-700 dark:text-gray-300">New Restaurant Submission</h4>
              <div>
                <label htmlFor="place-autocomplete-qadd" className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Search Place
                </label>
                <PlacesAutocomplete 
                  rowId="qadd-restaurant" 
                  initialValue={restaurantFormData.name} 
                  onPlaceSelected={handlePlaceSelected} 
                  disabled={isSubmittingAny} 
                  enableManualEntry={true} 
                  placeholder="Search Google Places..." 
                  aria-invalid={!!(restaurantSubmitError || submissionStoreError)}
                  aria-describedby={(restaurantSubmitError || submissionStoreError) ? 'restaurant-error' : undefined}
                />
                {!restaurantFormData.place_id && restaurantFormData.name && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Select a place from suggestions to auto-fill details.
                  </p>
                )}
              </div>

              {showManualCitySelect && (
                <div>
                  <Select
                    label="Select City Manually"
                    id="manual-city-select"
                    value={manualCity}
                    onChange={(e) => {
                      setManualCity(e.target.value);
                      if (restaurantSubmitError?.includes('City is required')) {
                        setRestaurantSubmitError(null);
                      }
                    }}
                    disabled={isLoadingCities || isSubmittingAny}
                    error={!manualCity && restaurantSubmitError?.includes('City is required') ? "Please select a city" : ""}
                  >
                    <option value="" disabled>
                      {isLoadingCities ? 'Loading cities...' : '-- Select City --'}
                    </option>
                    {(citiesList || []).map((city) => (
                      <option key={city.id} value={city.name}>
                        {city.name}
                      </option>
                    ))}
                  </Select>
                  {isLoadingCities && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Loading available cities...</p>
                  )}
                  {isCitiesError && (
                    <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                      Could not load cities list. Please try again.
                    </p>
                  )}
                </div>
              )}

              <ErrorDisplay error={displayError && currentView === 'restaurant' ? displayError : null} />
              <SuccessDisplay message={successMessage} />

              <div className="flex justify-end space-x-2 mt-4">
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => setCurrentView('menu')} 
                  disabled={isSubmittingAny}
                >
                  Back
                </Button>
                <Button 
                  variant="primary" 
                  size="sm" 
                  onClick={handleCreateRestaurant} 
                  disabled={isSubmittingAny}
                >
                  {isSubmittingAny ? (
                    <>
                      <Loader2 className="animate-spin h-4 w-4 mr-2 inline-block" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Restaurant'
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Dish submission view */}
          {currentView === 'dish' && (
            <div className="space-y-3">
              <h4 className="text-md font-medium text-gray-700 dark:text-gray-300">New Dish Submission</h4>
              <div className="relative">
                <label htmlFor="dish-name" className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Dish Name
                </label>
                <Input 
                  id="dish-name" 
                  name="name" 
                  value={dishFormData.name} 
                  onChange={handleDishChange} 
                  placeholder="Enter dish name..." 
                  className="w-full text-sm" 
                  disabled={isSubmittingAny}
                  aria-invalid={!!(dishSubmitError || submissionStoreError)}
                  aria-describedby={(dishSubmitError || submissionStoreError) ? 'dish-error' : undefined}
                  autoComplete="off"
                />
                {isDishLoading && dishFormData.name && (
                  <Loader2 className="absolute right-2 top-9 h-4 w-4 animate-spin text-gray-400" />
                )}
                {dishSuggestions.length > 0 && (
                  <ul className="absolute z-10 w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-40 overflow-y-auto mt-1">
                    {dishSuggestions.map((suggestion, index) => (
                      <li 
                        key={index} 
                        className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer" 
                        onMouseDown={() => handleDishSuggestionSelect(suggestion)}
                      >
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <label htmlFor="restaurant-autocomplete-dish" className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Restaurant
                </label>
                <RestaurantAutocomplete 
                  inputId="restaurant-autocomplete-dish" 
                  initialValue={dishFormData.restaurant_name} 
                  onRestaurantSelected={handleRestaurantSelected} 
                  onChange={(value) => {
                    if (dishFormData.restaurant_id && value !== dishFormData.restaurant_name) {
                      setDishFormData(prev => ({ ...prev, restaurant_name: value, restaurant_id: '' }));
                    } else {
                      setDishFormData(prev => ({ ...prev, restaurant_name: value }));
                    }
                  }} 
                  disabled={isSubmittingAny} 
                  placeholder="Search for restaurant..." 
                  useLocalSearch={true} 
                  aria-invalid={!!(dishSubmitError || submissionStoreError)}
                  aria-describedby={(dishSubmitError || submissionStoreError) ? 'dish-error' : undefined}
                />
                {!dishFormData.restaurant_id && dishFormData.restaurant_name && (
                  <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                    Select a restaurant from suggestions.
                  </p>
                )}
              </div>
              
              <ErrorDisplay error={displayError && currentView === 'dish' ? displayError : null} />
              <SuccessDisplay message={successMessage} />
              
              <div className="flex justify-end space-x-2 mt-4">
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => setCurrentView('menu')} 
                  disabled={isSubmittingAny}
                >
                  Back
                </Button>
                <Button 
                  variant="primary" 
                  size="sm" 
                  onClick={handleCreateDish} 
                  disabled={isSubmittingAny}
                >
                  {isSubmittingAny ? (
                    <>
                      <Loader2 className="animate-spin h-4 w-4 mr-2 inline-block" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Dish'
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <Button 
          variant="primary" 
          size="icon" 
          className="rounded-full h-12 w-12 flex items-center justify-center shadow-lg" 
          onClick={toggleOpen} 
          aria-label="Open quick add"
        >
          <Plus size={24} />
        </Button>
      )}
    </div>
  );
};

// PropTypes validation
FloatingQuickAdd.propTypes = {
  /** Additional CSS classes to apply to the container */
  className: PropTypes.string,
  /** Whether the component should be initially open */
  initiallyOpen: PropTypes.bool,
};

FloatingQuickAdd.defaultProps = {
  className: '',
  initiallyOpen: false,
};

export default FloatingQuickAdd;