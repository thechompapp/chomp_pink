/**
 * useFilterValidation.js
 * 
 * Single Responsibility: Filter validation logic
 * - Real-time filter validation
 * - Business rule enforcement
 * - Cross-field validation
 * - Validation state management
 * - Error message generation
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { filterTransformService, FILTER_TYPES } from '@/services/filters';
import { logDebug, logWarn } from '@/utils/logger';

/**
 * Validation rule definitions
 */
const VALIDATION_RULES = {
  city: {
    required: false,
    type: 'number',
    min: 1,
    dependencies: []
  },
  borough: {
    required: false,
    type: 'number',
    min: 1,
    dependencies: ['city']
  },
  neighborhood: {
    required: false,
    type: 'number',
    min: 1,
    dependencies: ['city', 'borough']
  },
  cuisine: {
    required: false,
    type: 'array',
    maxItems: 10,
    dependencies: []
  },
  hashtag: {
    required: false,
    type: 'array',
    maxItems: 5,
    dependencies: []
  }
};

/**
 * Default validation options
 */
const DEFAULT_OPTIONS = {
  validateOnChange: true,
  strictMode: false,
  businessRules: true,
  crossFieldValidation: true,
  debounceMs: 300
};

/**
 * useFilterValidation - Filter validation management hook
 * 
 * @param {Object} filters - Current filter state
 * @param {Object} availableData - Available options for each filter
 * @param {Object} options - Validation configuration
 * @returns {Object} Validation state and functions
 */
export function useFilterValidation(filters = {}, availableData = {}, options = {}) {
  const config = { ...DEFAULT_OPTIONS, ...options };
  
  // Validation state
  const [validationState, setValidationState] = useState({
    isValid: true,
    errors: [],
    warnings: [],
    fieldErrors: {},
    crossFieldErrors: [],
    businessRuleViolations: []
  });

  // Individual field validation states
  const [fieldValidation, setFieldValidation] = useState({});

  /**
   * Validate a single field
   */
  const validateField = useCallback((fieldName, value, context = {}) => {
    const rule = VALIDATION_RULES[fieldName];
    if (!rule) {
      logWarn(`[useFilterValidation] No validation rule for field: ${fieldName}`);
      return { isValid: true, errors: [], warnings: [] };
    }

    const errors = [];
    const warnings = [];

    try {
      // Required field validation
      if (rule.required && (value === null || value === undefined || value === '')) {
        errors.push(`${fieldName} is required`);
      }

      // Type validation
      if (value !== null && value !== undefined) {
        switch (rule.type) {
          case 'number':
            if (typeof value !== 'number' || isNaN(value)) {
              errors.push(`${fieldName} must be a valid number`);
            } else {
              if (rule.min !== undefined && value < rule.min) {
                errors.push(`${fieldName} must be at least ${rule.min}`);
              }
              if (rule.max !== undefined && value > rule.max) {
                errors.push(`${fieldName} must be at most ${rule.max}`);
              }
            }
            break;

          case 'array':
            if (!Array.isArray(value)) {
              errors.push(`${fieldName} must be an array`);
            } else {
              if (rule.maxItems !== undefined && value.length > rule.maxItems) {
                errors.push(`${fieldName} can have at most ${rule.maxItems} items`);
              }
              if (rule.minItems !== undefined && value.length < rule.minItems) {
                errors.push(`${fieldName} must have at least ${rule.minItems} items`);
              }
            }
            break;

          case 'object':
            if (typeof value !== 'object' || Array.isArray(value)) {
              errors.push(`${fieldName} must be an object`);
            } else if (rule.properties) {
              // Validate object properties
              Object.entries(rule.properties).forEach(([prop, propRule]) => {
                const propValue = value[prop];
                if (propValue !== null && propValue !== undefined) {
                  if (propRule.type === 'number' && (typeof propValue !== 'number' || isNaN(propValue))) {
                    errors.push(`${fieldName}.${prop} must be a valid number`);
                  }
                  if (propRule.min !== undefined && propValue < propRule.min) {
                    errors.push(`${fieldName}.${prop} must be at least ${propRule.min}`);
                  }
                  if (propRule.max !== undefined && propValue > propRule.max) {
                    errors.push(`${fieldName}.${prop} must be at most ${propRule.max}`);
                  }
                }
              });

              // Price range validation
              if (fieldName === 'price' && value.min !== null && value.max !== null) {
                if (value.min > value.max) {
                  errors.push('Minimum price cannot be greater than maximum price');
                }
              }
            }
            break;
        }
      }

      // Dependency validation
      if (rule.dependencies && rule.dependencies.length > 0) {
        const missingDeps = rule.dependencies.filter(dep => 
          !context[dep] && !filters[dep]
        );
        if (missingDeps.length > 0 && value !== null && value !== undefined) {
          warnings.push(`${fieldName} requires ${missingDeps.join(', ')} to be selected first`);
        }
      }

      // Availability validation (check against available data)
      if (value !== null && value !== undefined && availableData[fieldName]) {
        const available = availableData[fieldName];
        
        if (Array.isArray(value)) {
          // For array fields, check if all values exist in available options
          const unavailable = value.filter(v => 
            !available.some(item => item.id === v || item.name === v)
          );
          if (unavailable.length > 0) {
            warnings.push(`Some ${fieldName} options are no longer available: ${unavailable.join(', ')}`);
          }
        } else {
          // For single values, check if value exists in available options
          const exists = available.some(item => item.id === value || item.name === value);
          if (!exists) {
            warnings.push(`Selected ${fieldName} is no longer available`);
          }
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings
      };
    } catch (error) {
      logWarn(`[useFilterValidation] Error validating field ${fieldName}:`, error);
      return {
        isValid: false,
        errors: [`Validation error for ${fieldName}`],
        warnings: []
      };
    }
  }, [filters, availableData]);

  /**
   * Validate all filters
   */
  const validateAllFilters = useCallback(() => {
    const fieldErrors = {};
    const allErrors = [];
    const allWarnings = [];
    let overallValid = true;

    // Validate each field
    Object.entries(filters).forEach(([fieldName, value]) => {
      const validation = validateField(fieldName, value, filters);
      
      if (!validation.isValid) {
        overallValid = false;
        fieldErrors[fieldName] = validation.errors;
        allErrors.push(...validation.errors);
      }
      
      if (validation.warnings.length > 0) {
        allWarnings.push(...validation.warnings);
      }
    });

    // Cross-field validation
    const crossFieldErrors = [];
    if (config.crossFieldValidation) {
      // Geographic hierarchy validation
      if (filters.neighborhood && !filters.borough) {
        crossFieldErrors.push('Borough must be selected when neighborhood is selected');
        overallValid = false;
      }
      if (filters.borough && !filters.city) {
        crossFieldErrors.push('City must be selected when borough is selected');
        overallValid = false;
      }

      // Business rule validation
      if (config.businessRules) {
        // Example: Cannot have more than 3 cuisines + 2 hashtags combined
        const totalTags = (filters.cuisine?.length || 0) + (filters.hashtag?.length || 0);
        if (totalTags > 5) {
          crossFieldErrors.push('Cannot select more than 5 cuisine/hashtag filters combined');
          overallValid = false;
        }
      }
    }

    // Use transform service for additional validation
    const transformValidation = filterTransformService.validate(filters);
    if (!transformValidation.valid) {
      allErrors.push(...transformValidation.errors);
      allWarnings.push(...transformValidation.warnings);
      overallValid = false;
    }

    const newValidationState = {
      isValid: overallValid,
      errors: allErrors,
      warnings: allWarnings,
      fieldErrors,
      crossFieldErrors,
      businessRuleViolations: config.businessRules ? crossFieldErrors.filter(e => 
        e.includes('Cannot') || e.includes('must not')
      ) : []
    };

    setValidationState(newValidationState);
    
    // Update field-specific validation
    const newFieldValidation = {};
    Object.keys(filters).forEach(fieldName => {
      newFieldValidation[fieldName] = validateField(fieldName, filters[fieldName], filters);
    });
    setFieldValidation(newFieldValidation);

    logDebug('[useFilterValidation] Validation completed:', newValidationState);
    return newValidationState;
  }, [filters, validateField, config, availableData]);

  /**
   * Get validation status for specific field
   */
  const getFieldValidation = useCallback((fieldName) => {
    return fieldValidation[fieldName] || { isValid: true, errors: [], warnings: [] };
  }, [fieldValidation]);

  /**
   * Check if specific field has errors
   */
  const hasFieldErrors = useCallback((fieldName) => {
    const validation = getFieldValidation(fieldName);
    return !validation.isValid;
  }, [getFieldValidation]);

  /**
   * Get error message for specific field
   */
  const getFieldErrorMessage = useCallback((fieldName) => {
    const validation = getFieldValidation(fieldName);
    return validation.errors.join(', ');
  }, [getFieldValidation]);

  /**
   * Get warning message for specific field
   */
  const getFieldWarningMessage = useCallback((fieldName) => {
    const validation = getFieldValidation(fieldName);
    return validation.warnings.join(', ');
  }, [getFieldValidation]);

  /**
   * Reset validation state
   */
  const resetValidation = useCallback(() => {
    setValidationState({
      isValid: true,
      errors: [],
      warnings: [],
      fieldErrors: {},
      crossFieldErrors: [],
      businessRuleViolations: []
    });
    setFieldValidation({});
    logDebug('[useFilterValidation] Validation state reset');
  }, []);

  // Memoized validation summary
  const validationSummary = useMemo(() => {
    const totalErrors = validationState.errors.length + validationState.crossFieldErrors.length;
    const totalWarnings = validationState.warnings.length;
    
    return {
      isValid: validationState.isValid,
      hasErrors: totalErrors > 0,
      hasWarnings: totalWarnings > 0,
      errorCount: totalErrors,
      warningCount: totalWarnings,
      canSubmit: validationState.isValid || !config.strictMode
    };
  }, [validationState, config.strictMode]);

  // Auto-validate when filters change
  useEffect(() => {
    if (!config.validateOnChange) return;
    
    let timeoutId;
    if (config.debounceMs > 0) {
      timeoutId = setTimeout(() => {
        validateAllFilters();
      }, config.debounceMs);
    } else {
      validateAllFilters();
    }
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [filters, config.validateOnChange, config.debounceMs]);

  // Validate when available data changes
  useEffect(() => {
    if (config.validateOnChange) {
      validateAllFilters();
    }
  }, [availableData, config.validateOnChange]);

  return {
    // Validation state
    validationState,
    validationSummary,
    fieldValidation,
    
    // Validation functions
    validateAllFilters,
    validateField,
    resetValidation,
    
    // Field-specific helpers
    getFieldValidation,
    hasFieldErrors,
    getFieldErrorMessage,
    getFieldWarningMessage,
    
    // Convenience properties
    isValid: validationState.isValid,
    hasErrors: validationSummary.hasErrors,
    hasWarnings: validationSummary.hasWarnings,
    canSubmit: validationSummary.canSubmit
  };
} 