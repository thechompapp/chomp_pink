/**
 * List Form View
 * 
 * Single Responsibility: Render list creation form UI
 * - List name input field
 * - List type selection (restaurant/dish)
 * - Form validation display
 * - Navigation controls
 */

import React from 'react';
import PropTypes from 'prop-types';
import Input from '@/components/UI/Input';
import PillButton from '@/components/UI/PillButton';
import { ErrorDisplay, SuccessDisplay, FormNavigation, FormField } from '../components/QuickAddUIComponents';

/**
 * List creation form view
 */
export const ListFormView = ({ 
  formData, 
  onFormChange, 
  onListTypeSelect, 
  onSubmit, 
  onBack, 
  isSubmitting, 
  error, 
  successMessage 
}) => {
  
  const isSubmitDisabled = !formData.name?.trim() || !formData.list_type;

  return (
    <div className="space-y-3">
      <h4 className="text-md font-medium text-gray-700 dark:text-gray-300">
        New List
      </h4>

      <FormField
        label="List Name"
        htmlFor="list-name"
        required
        error={error && error.includes('name') ? error : null}
      >
        <Input 
          id="list-name" 
          name="name" 
          value={formData.name} 
          onChange={onFormChange} 
          placeholder="Enter list name..." 
          className="w-full text-sm" 
          disabled={isSubmitting}
          aria-invalid={!!error}
          aria-describedby={error ? 'list-error' : undefined}
        />
      </FormField>

      <FormField
        label="List Type"
        required
        error={error && error.includes('type') ? error : null}
      >
        <div className="flex space-x-2">
          <PillButton 
            label="Restaurant" 
            isActive={formData.list_type === 'restaurant'} 
            onClick={() => onListTypeSelect('restaurant')} 
            disabled={isSubmitting}
          />
          <PillButton 
            label="Dish" 
            isActive={formData.list_type === 'dish'} 
            onClick={() => onListTypeSelect('dish')} 
            disabled={isSubmitting}
          />
        </div>
      </FormField>
      
      <ErrorDisplay error={error} />
      <SuccessDisplay message={successMessage} />
      
      <FormNavigation
        onBack={onBack}
        onSubmit={onSubmit}
        submitText="Create List"
        submitLoadingText="Creating..."
        isSubmitting={isSubmitting}
        isSubmitDisabled={isSubmitDisabled}
      />
    </div>
  );
};

ListFormView.propTypes = {
  formData: PropTypes.shape({
    name: PropTypes.string.isRequired,
    list_type: PropTypes.string.isRequired,
  }).isRequired,
  onFormChange: PropTypes.func.isRequired,
  onListTypeSelect: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired,
  isSubmitting: PropTypes.bool,
  error: PropTypes.string,
  successMessage: PropTypes.string,
}; 