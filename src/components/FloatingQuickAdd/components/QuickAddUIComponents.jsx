/**
 * QuickAdd UI Components
 * 
 * Single Responsibility: Reusable UI components for QuickAdd
 * - Error display component
 * - Success display component
 * - Loading indicator component
 * - Navigation buttons component
 */

import React from 'react';
import PropTypes from 'prop-types';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import Button from '@/components/UI/Button';

/**
 * Error display component with optional retry functionality
 */
export const ErrorDisplay = ({ error, onRetry = null }) => {
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

ErrorDisplay.propTypes = {
  error: PropTypes.string,
  onRetry: PropTypes.func,
};

/**
 * Success display component
 */
export const SuccessDisplay = ({ message }) => {
  if (!message) return null;
  
  return (
    <div className="flex items-center space-x-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
      <CheckCircle size={16} className="text-green-600 dark:text-green-400" />
      <p className="text-sm text-green-700 dark:text-green-300">{message}</p>
    </div>
  );
};

SuccessDisplay.propTypes = {
  message: PropTypes.string,
};

/**
 * Loading indicator with text
 */
export const LoadingIndicator = ({ text = 'Loading...', size = 'sm' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  return (
    <div className="flex items-center space-x-2">
      <Loader2 className={`animate-spin ${sizeClasses[size]} text-gray-500`} />
      <span className="text-sm text-gray-600 dark:text-gray-400">{text}</span>
    </div>
  );
};

LoadingIndicator.propTypes = {
  text: PropTypes.string,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
};

/**
 * Navigation button group for form views
 */
export const FormNavigation = ({ 
  onBack, 
  onSubmit, 
  submitText = 'Submit', 
  submitLoadingText = 'Submitting...', 
  isSubmitting = false, 
  isSubmitDisabled = false,
  backText = 'Back'
}) => {
  return (
    <div className="flex justify-end space-x-2 mt-4">
      <Button 
        variant="secondary" 
        size="sm" 
        onClick={onBack} 
        disabled={isSubmitting}
      >
        {backText}
      </Button>
      <Button 
        variant="primary" 
        size="sm" 
        onClick={onSubmit} 
        disabled={isSubmitting || isSubmitDisabled}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="animate-spin h-4 w-4 mr-2 inline-block" />
            {submitLoadingText}
          </>
        ) : (
          submitText
        )}
      </Button>
    </div>
  );
};

FormNavigation.propTypes = {
  onBack: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  submitText: PropTypes.string,
  submitLoadingText: PropTypes.string,
  isSubmitting: PropTypes.bool,
  isSubmitDisabled: PropTypes.bool,
  backText: PropTypes.string,
};

/**
 * Floating action button
 */
export const FloatingActionButton = ({ onClick, isOpen }) => {
  return (
    <Button 
      variant="primary" 
      size="icon" 
      className="rounded-full h-12 w-12 flex items-center justify-center shadow-lg" 
      onClick={onClick} 
      aria-label={isOpen ? "Close quick add" : "Open quick add"}
    >
      {/* Plus icon will be provided by parent */}
    </Button>
  );
};

FloatingActionButton.propTypes = {
  onClick: PropTypes.func.isRequired,
  isOpen: PropTypes.bool,
};

/**
 * Form field wrapper with label and error state
 */
export const FormField = ({ 
  label, 
  htmlFor, 
  children, 
  error = null, 
  required = false,
  className = '' 
}) => {
  return (
    <div className={className}>
      <label 
        htmlFor={htmlFor} 
        className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-xs text-red-500 dark:text-red-400 mt-1">
          {error}
        </p>
      )}
    </div>
  );
};

FormField.propTypes = {
  label: PropTypes.string.isRequired,
  htmlFor: PropTypes.string,
  children: PropTypes.node.isRequired,
  error: PropTypes.string,
  required: PropTypes.bool,
  className: PropTypes.string,
};

/**
 * Suggestions dropdown list
 */
export const SuggestionsList = ({ 
  suggestions, 
  onSelect, 
  className = '',
  emptyMessage = 'No suggestions available' 
}) => {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <ul className={`absolute z-10 w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-40 overflow-y-auto mt-1 ${className}`}>
      {suggestions.length > 0 ? (
        suggestions.map((suggestion, index) => (
          <li 
            key={index} 
            className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer" 
            onMouseDown={() => onSelect(suggestion)}
          >
            {suggestion}
          </li>
        ))
      ) : (
        <li className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
          {emptyMessage}
        </li>
      )}
    </ul>
  );
};

SuggestionsList.propTypes = {
  suggestions: PropTypes.arrayOf(PropTypes.string),
  onSelect: PropTypes.func.isRequired,
  className: PropTypes.string,
  emptyMessage: PropTypes.string,
}; 