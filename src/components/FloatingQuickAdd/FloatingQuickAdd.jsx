/**
 * FloatingQuickAdd Component - Refactored with Modular Architecture
 * 
 * Single Responsibility: Component coordination and UI orchestration
 * - Coordinate modular hooks and views
 * - Maintain backward compatibility
 * - Provide clean separation of concerns
 * - Handle context integration
 */

import React, { useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Plus, X } from 'lucide-react';
import Button from '@/components/UI/Button';
import { useQuickAdd } from '@/contexts/QuickAddContext';

// Import modular hooks
import { useQuickAddState } from './hooks/useQuickAddState';
import { useQuickAddForms } from './hooks/useQuickAddForms';
import { useQuickAddData } from './hooks/useQuickAddData';
import { useQuickAddSubmissions } from './hooks/useQuickAddSubmissions';

// Import view components
import { MainMenuView } from './views/MainMenuView';
import { ListFormView } from './views/ListFormView';
import { RestaurantFormView } from './views/RestaurantFormView';
import { DishFormView } from './views/DishFormView';

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
  // Context integration
  const { openQuickAdd } = useQuickAdd();

  // Core state management
  const state = useQuickAddState(initiallyOpen);

  // Form management
  const forms = useQuickAddForms();

  // Data fetching
  const data = useQuickAddData({
    currentView: state.currentView,
    dishSearchTerm: forms.dishForm.data.name,
    onDishSuggestionsChange: state.setDishSuggestions
  });

  // Submission handling
  const submissions = useQuickAddSubmissions(
    forms,
    state.handleSuccess,
    (error) => {
      // Error callback - errors are handled by individual form hooks
      console.error('[FloatingQuickAdd] Submission error:', error);
    }
  );

  // Navigation handlers
  const handleShowView = useCallback((view) => {
    submissions.clearAllErrors();
    state.showView(view);
  }, [submissions, state]);

  const handleBackToMenu = useCallback(() => {
    handleShowView('menu');
  }, [handleShowView]);

  // Toggle handler with cleanup
  const handleToggleOpen = useCallback(() => {
    if (state.isOpen) {
      state.resetAllState();
      forms.resetAllForms();
      submissions.clearAllErrors();
    }
    state.toggleOpen();
  }, [state, forms, submissions]);

  // Restaurant form specific handlers
  const handlePlaceSelected = useCallback((placeData) => {
    submissions.clearAllErrors();
    state.setManualCity('');
    state.setShowManualCitySelect(false);

    const result = forms.handlePlaceSelected(placeData);
    if (!result.cityExtracted) {
      forms.restaurantForm.setError('Warning: City could not be extracted. Please select manually below.');
      state.setShowManualCitySelect(true);
    }
  }, [submissions, state, forms]);

  const handleManualCityChange = useCallback((city) => {
    state.setManualCity(city);
    if (forms.restaurantForm.error?.includes('City is required')) {
      forms.restaurantForm.setError(null);
    }
  }, [state, forms]);

  const handleRestaurantSubmit = useCallback(async () => {
    const result = await submissions.handleCreateRestaurant(state.manualCity);
    if (result?.showManualCitySelect) {
      state.setShowManualCitySelect(true);
    }
  }, [submissions, state]);

  // Dish form specific handlers
  const handleDishSuggestionSelect = useCallback((suggestion) => {
    const success = forms.handleDishSuggestionSelect(suggestion);
    if (success) {
      state.setDishSuggestions([]);
    }
  }, [forms, state]);

  // Auto-clear errors with cleanup
  useEffect(() => {
    if (submissions.displayError) {
      const timer = setTimeout(() => {
        submissions.clearAllErrors();
      }, 10000); // Auto-clear errors after 10 seconds
      return () => clearTimeout(timer);
    }
  }, [submissions]);

  // Get current view error
  const getCurrentViewError = useCallback(() => {
    switch (state.currentView) {
      case 'list':
        return forms.listForm.error || submissions.stores.userList.error;
      case 'restaurant':
        return forms.restaurantForm.error || submissions.stores.submission.error;
      case 'dish':
        return forms.dishForm.error || submissions.stores.submission.error;
      default:
        return null;
    }
  }, [state.currentView, forms, submissions]);

  return (
    <div className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 ${className}`}>
      {state.isOpen ? (
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 w-80 sm:w-96 max-h-[80vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              Quick Add
            </h3>
            <Button 
              variant="tertiary" 
              size="icon" 
              onClick={handleToggleOpen} 
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" 
              aria-label="Close quick add" 
              disabled={submissions.isSubmittingAny}
            >
              <X size={20} />
            </Button>
          </div>

          {/* View Content */}
          {state.currentView === 'menu' && (
            <MainMenuView
              onCreateList={() => handleShowView('list')}
              onCreateRestaurant={() => handleShowView('restaurant')}
              onCreateDish={() => handleShowView('dish')}
              isSubmitting={submissions.isSubmittingAny}
              hasDataErrors={data.hasDataErrors}
              onRetry={state.incrementRetry}
            />
          )}

          {state.currentView === 'list' && (
            <ListFormView
              formData={forms.listForm.data}
              onFormChange={forms.listForm.handleChange}
              onListTypeSelect={forms.handleListTypeSelect}
              onSubmit={submissions.handleCreateNewList}
              onBack={handleBackToMenu}
              isSubmitting={submissions.isSubmittingAny}
              error={getCurrentViewError()}
              successMessage={state.successMessage}
            />
          )}

          {state.currentView === 'restaurant' && (
            <RestaurantFormView
              formData={forms.restaurantForm.data}
              onPlaceSelected={handlePlaceSelected}
              onSubmit={handleRestaurantSubmit}
              onBack={handleBackToMenu}
              isSubmitting={submissions.isSubmittingAny}
              error={getCurrentViewError()}
              successMessage={state.successMessage}
              showManualCitySelect={state.showManualCitySelect}
              manualCity={state.manualCity}
              onManualCityChange={handleManualCityChange}
              citiesData={data.cities}
            />
          )}

          {state.currentView === 'dish' && (
            <DishFormView
              formData={forms.dishForm.data}
              onFormChange={forms.handleDishNameChange}
              onRestaurantSelected={forms.handleRestaurantSelected}
              onRestaurantNameChange={forms.handleDishRestaurantNameChange}
              onSubmit={submissions.handleCreateDish}
              onBack={handleBackToMenu}
              isSubmitting={submissions.isSubmittingAny}
              error={getCurrentViewError()}
              successMessage={state.successMessage}
              dishSuggestions={state.dishSuggestions}
              onDishSuggestionSelect={handleDishSuggestionSelect}
              isDishLoading={data.dish.isLoading}
            />
          )}
        </div>
      ) : (
        <Button 
          variant="primary" 
          size="icon" 
          className="rounded-full h-12 w-12 flex items-center justify-center shadow-lg" 
          onClick={handleToggleOpen} 
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