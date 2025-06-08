/**
 * useFilterValidation.js - Simplified Filter Validation
 * 
 * Single Responsibility: Essential filter validation only
 * - Basic field validation
 * - Simple error state management
 * - No over-engineered business rules
 */

import { useState, useCallback, useMemo } from 'react';
import { logDebug } from '@/utils/logger';

/**
 * Simple validation rules
 */
const VALIDATION_RULES = {
  city: { type: 'number', min: 1 },
  borough: { type: 'number', min: 1, dependsOn: 'city' },
  neighborhood: { type: 'number', min: 1, dependsOn: 'borough' },
  cuisine: { type: 'array', maxItems: 10 },
  hashtag: { type: 'array', maxItems: 5 }
};

/**
 * useFilterValidation - Simplified validation hook
 */
export function useFilterValidation(filters = {}) {
  const [fieldErrors, setFieldErrors] = useState({});

  /**
   * Validate a single field
   */
  const validateField = useCallback((fieldName, value) => {
    const rule = VALIDATION_RULES[fieldName];
    if (!rule) return { isValid: true, error: null };

    try {
      // Type validation
      if (value !== null && value !== undefined) {
        if (rule.type === 'number') {
          if (typeof value !== 'number' || value < rule.min) {
            return { isValid: false, error: `Invalid ${fieldName}` };
          }
        }
        
        if (rule.type === 'array') {
          if (!Array.isArray(value) || value.length > rule.maxItems) {
            return { isValid: false, error: `Too many ${fieldName} selected` };
          }
        }
      }

      // Dependency validation
      if (rule.dependsOn && value && !filters[rule.dependsOn]) {
        return { isValid: false, error: `Please select ${rule.dependsOn} first` };
      }

      return { isValid: true, error: null };
    } catch (error) {
      return { isValid: false, error: 'Validation error' };
    }
  }, [filters]);

  /**
   * Validate all filters
   */
  const validateAllFilters = useCallback(() => {
    const errors = {};
    let hasErrors = false;

    Object.entries(filters).forEach(([fieldName, value]) => {
      const validation = validateField(fieldName, value);
      if (!validation.isValid) {
        errors[fieldName] = validation.error;
        hasErrors = true;
      }
    });

    setFieldErrors(errors);
    return !hasErrors;
  }, [filters, validateField]);

  /**
   * Get validation state
   */
  const validationState = useMemo(() => {
    const isValid = Object.keys(fieldErrors).length === 0;
    return {
      isValid,
      fieldErrors,
      hasErrors: !isValid
    };
  }, [fieldErrors]);

  /**
   * Clear field error
   */
  const clearFieldError = useCallback((fieldName) => {
    setFieldErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  }, []);

  /**
   * Check if field has error
   */
  const hasFieldError = useCallback((fieldName) => {
    return Boolean(fieldErrors[fieldName]);
  }, [fieldErrors]);

  /**
   * Get field error message
   */
  const getFieldErrorMessage = useCallback((fieldName) => {
    return fieldErrors[fieldName] || null;
  }, [fieldErrors]);

  logDebug('[useFilterValidation] Validation state:', validationState);

  return {
    validationState,
    validateField,
    validateAllFilters,
    clearFieldError,
    hasFieldError,
    getFieldErrorMessage,
    isValid: validationState.isValid
  };
} 