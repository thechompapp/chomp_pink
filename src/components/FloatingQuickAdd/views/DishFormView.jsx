/**
 * Dish Form View
 * 
 * Single Responsibility: Render dish submission form UI
 * - Dish name input with suggestions
 * - Restaurant autocomplete field
 * - Form validation display
 * - Navigation controls
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Loader2 } from 'lucide-react';
import Input from '@/components/UI/Input';
import RestaurantAutocomplete from '@/components/UI/RestaurantAutocomplete';
import { ErrorDisplay, SuccessDisplay, FormNavigation, FormField, SuggestionsList } from '../components/QuickAddUIComponents';

/**
 * Dish submission form view
 */
export const DishFormView = ({ 
  formData, 
  onFormChange, 
  onRestaurantSelected, 
  onRestaurantNameChange,
  onSubmit, 
  onBack, 
  isSubmitting, 
  error, 
  successMessage,
  dishSuggestions,
  onDishSuggestionSelect,
  isDishLoading
}) => {
  
  return (
    <div className="space-y-3">
      <h4 className="text-md font-medium text-gray-700 dark:text-gray-300">
        New Dish Submission
      </h4>

      <FormField
        label="Dish Name"
        htmlFor="dish-name"
        required
      >
        <div className="relative">
          <Input 
            id="dish-name" 
            name="name" 
            value={formData.name} 
            onChange={onFormChange} 
            placeholder="Enter dish name..." 
            className="w-full text-sm" 
            disabled={isSubmitting}
            aria-invalid={!!error}
            aria-describedby={error ? 'dish-error' : undefined}
            autoComplete="off"
          />
          {isDishLoading && formData.name && (
            <Loader2 className="absolute right-2 top-2 h-4 w-4 animate-spin text-gray-400" />
          )}
          <SuggestionsList
            suggestions={dishSuggestions}
            onSelect={onDishSuggestionSelect}
          />
        </div>
      </FormField>

      <FormField
        label="Restaurant"
        htmlFor="restaurant-autocomplete-dish"
        required
      >
        <RestaurantAutocomplete 
          inputId="restaurant-autocomplete-dish" 
          initialValue={formData.restaurant_name} 
          onRestaurantSelected={onRestaurantSelected} 
          onChange={onRestaurantNameChange} 
          disabled={isSubmitting} 
          placeholder="Search for restaurant..." 
          useLocalSearch={true} 
          aria-invalid={!!error}
          aria-describedby={error ? 'dish-error' : undefined}
        />
        {!formData.restaurant_id && formData.restaurant_name && (
          <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
            Select a restaurant from suggestions.
          </p>
        )}
      </FormField>
      
      <ErrorDisplay error={error} />
      <SuccessDisplay message={successMessage} />
      
      <FormNavigation
        onBack={onBack}
        onSubmit={onSubmit}
        submitText="Submit Dish"
        submitLoadingText="Submitting..."
        isSubmitting={isSubmitting}
        isSubmitDisabled={false}
      />
    </div>
  );
};

DishFormView.propTypes = {
  formData: PropTypes.shape({
    name: PropTypes.string.isRequired,
    restaurant_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    restaurant_name: PropTypes.string.isRequired,
  }).isRequired,
  onFormChange: PropTypes.func.isRequired,
  onRestaurantSelected: PropTypes.func.isRequired,
  onRestaurantNameChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired,
  isSubmitting: PropTypes.bool,
  error: PropTypes.string,
  successMessage: PropTypes.string,
  dishSuggestions: PropTypes.arrayOf(PropTypes.string),
  onDishSuggestionSelect: PropTypes.func.isRequired,
  isDishLoading: PropTypes.bool,
}; 