/**
 * Main Menu View
 * 
 * Single Responsibility: Render main menu interface
 * - Menu button navigation
 * - Error handling for data loading
 * - Loading states display
 */

import React from 'react';
import PropTypes from 'prop-types';
import Button from '@/components/UI/Button';
import { ErrorDisplay } from '../components/QuickAddUIComponents';

/**
 * Main menu view for QuickAdd component
 */
export const MainMenuView = ({ 
  onCreateList, 
  onCreateRestaurant, 
  onCreateDish, 
  isSubmitting, 
  hasDataErrors, 
  onRetry 
}) => {
  
  return (
    <div className="space-y-2">
      {/* Global error display */}
      {hasDataErrors && (
        <ErrorDisplay
          error="Some data could not be loaded. Please check your connection and try again."
          onRetry={onRetry}
        />
      )}

      <Button 
        variant="primary" 
        size="lg" 
        className="w-full justify-start text-left" 
        onClick={onCreateList}
        disabled={isSubmitting}
      >
        Create a List
      </Button>
      
      <Button 
        variant="primary" 
        size="lg" 
        className="w-full justify-start text-left" 
        onClick={onCreateRestaurant}
        disabled={isSubmitting}
      >
        Submit a Restaurant
      </Button>
      
      <Button 
        variant="primary" 
        size="lg" 
        className="w-full justify-start text-left" 
        onClick={onCreateDish}
        disabled={isSubmitting}
      >
        Submit a Dish
      </Button>
    </div>
  );
};

MainMenuView.propTypes = {
  onCreateList: PropTypes.func.isRequired,
  onCreateRestaurant: PropTypes.func.isRequired,
  onCreateDish: PropTypes.func.isRequired,
  isSubmitting: PropTypes.bool,
  hasDataErrors: PropTypes.bool,
  onRetry: PropTypes.func,
}; 