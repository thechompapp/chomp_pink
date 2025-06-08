/**
 * Restaurant Form View
 * 
 * Single Responsibility: Render restaurant submission form UI
 * - Place autocomplete field
 * - Manual city selection
 * - Form validation display
 * - Navigation controls
 */

import React from 'react';
import PropTypes from 'prop-types';
import PlacesAutocomplete from '@/components/UI/PlacesAutocomplete';
import Select from '@/components/UI/Select';
import { ErrorDisplay, SuccessDisplay, FormNavigation, FormField } from '../components/QuickAddUIComponents';

/**
 * Restaurant submission form view
 */
export const RestaurantFormView = ({ 
  formData, 
  onPlaceSelected, 
  onSubmit, 
  onBack, 
  isSubmitting, 
  error, 
  successMessage,
  showManualCitySelect,
  manualCity,
  onManualCityChange,
  citiesData
}) => {
  
  return (
    <div className="space-y-3">
      <h4 className="text-md font-medium text-gray-700 dark:text-gray-300">
        New Restaurant Submission
      </h4>

      <FormField
        label="Search Place"
        htmlFor="place-autocomplete-qadd"
        required
      >
        <PlacesAutocomplete 
          rowId="qadd-restaurant" 
          initialValue={formData.name} 
          onPlaceSelected={onPlaceSelected} 
          disabled={isSubmitting} 
          enableManualEntry={true} 
          placeholder="Search Google Places..." 
          aria-invalid={!!error}
          aria-describedby={error ? 'restaurant-error' : undefined}
        />
        {!formData.place_id && formData.name && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Select a place from suggestions to auto-fill details.
          </p>
        )}
      </FormField>

      {showManualCitySelect && (
        <FormField
          label="Select City Manually"
          htmlFor="manual-city-select"
          required
        >
          <Select
            id="manual-city-select"
            value={manualCity}
            onChange={(e) => onManualCityChange(e.target.value)}
            disabled={citiesData.isLoading || isSubmitting}
            error={!manualCity && error?.includes('City is required') ? "Please select a city" : ""}
          >
            <option value="" disabled>
              {citiesData.isLoading ? 'Loading cities...' : '-- Select City --'}
            </option>
            {(citiesData.list || []).map((city) => (
              <option key={city.id} value={city.name}>
                {city.name}
              </option>
            ))}
          </Select>
          {citiesData.isLoading && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Loading available cities...
            </p>
          )}
          {citiesData.isError && (
            <p className="text-xs text-red-500 dark:text-red-400 mt-1">
              Could not load cities list. Please try again.
            </p>
          )}
        </FormField>
      )}

      <ErrorDisplay error={error} />
      <SuccessDisplay message={successMessage} />

      <FormNavigation
        onBack={onBack}
        onSubmit={onSubmit}
        submitText="Submit Restaurant"
        submitLoadingText="Submitting..."
        isSubmitting={isSubmitting}
        isSubmitDisabled={false}
      />
    </div>
  );
};

RestaurantFormView.propTypes = {
  formData: PropTypes.shape({
    name: PropTypes.string.isRequired,
    place_id: PropTypes.string.isRequired,
    address: PropTypes.string.isRequired,
    city: PropTypes.string.isRequired,
    neighborhood: PropTypes.string.isRequired,
  }).isRequired,
  onPlaceSelected: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired,
  isSubmitting: PropTypes.bool,
  error: PropTypes.string,
  successMessage: PropTypes.string,
  showManualCitySelect: PropTypes.bool,
  manualCity: PropTypes.string,
  onManualCityChange: PropTypes.func.isRequired,
  citiesData: PropTypes.shape({
    list: PropTypes.array,
    isLoading: PropTypes.bool,
    isError: PropTypes.bool,
  }).isRequired,
}; 