/**
 * Enhanced form handling hook with validation and better error management
 * 
 * @module src/hooks/useFormHandler
 */
import { useState, useCallback, useEffect, useRef } from 'react';

// Utility function to create a touched fields object from form data or field names
const createTouchedFields = (fields) => {
  if (!fields || typeof fields !== 'object') return {};
  return Object.keys(fields).reduce((acc, key) => {
    acc[key] = true;
    return acc;
  }, {});
};

// Utility function to safely compare objects without excessive stringification
const shallowEqual = (obj1, obj2) => {
  if (obj1 === obj2) return true;
  if (!obj1 || !obj2) return false;
  
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  
  if (keys1.length !== keys2.length) return false;
  
  return keys1.every(key => {
    const val1 = obj1[key];
    const val2 = obj2[key];
    const areObjects = typeof val1 === 'object' && typeof val2 === 'object';
    
    // For simple values, do direct comparison
    // For objects, just check if they're the same reference (avoid deep comparison)
    return areObjects ? val1 === val2 : val1 === val2;
  });
};

/**
 * React hook for managing form state with validation
 * 
 * @param {Object} initialValues - Initial form values
 * @param {Object} [options] - Hook configuration options
 * @param {Function} [options.validate] - Form validation function
 * @param {boolean} [options.validateOnChange=false] - Whether to validate on each change
 * @param {number} [options.validateDebounce=300] - Debounce delay for validation in ms
 * @returns {Object} Form handling utilities
 */
const useFormHandler = (initialValues, options = {}) => {
  const {
    validate,
    validateOnChange = false,
    validateDebounce = 300
  } = options;
  
  // Form state
  const [formData, setFormData] = useState(initialValues);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});
  const [isValid, setIsValid] = useState(true);
  
  // References for debouncing and memoization
  const validateTimerRef = useRef(null);
  const previousValuesRef = useRef(initialValues);
  const isFirstRenderRef = useRef(true);
  
  /**
   * Validate form data and update errors state
   * 
   * @param {Object} data - Form data to validate
   * @returns {Object} Validation errors
   */
  const validateForm = useCallback((data) => {
    if (!validate) return {};
    
    try {
      const validationErrors = validate(data) || {};
      setErrors(validationErrors);
      
      const hasErrors = Object.keys(validationErrors).length > 0;
      setIsValid(!hasErrors);
      
      return validationErrors;
    } catch (error) {
      console.error('Validation error:', error);
      setIsValid(false);
      
      const errorObj = { form: 'Validation failed' };
      setErrors(errorObj);
      return errorObj;
    }
  }, [validate]);
  
  /**
   * Process form data changes and prepare for validation
   * 
   * @param {Object} newData - New form data
   * @param {string|null} touchedField - Field that was touched, or null for multiple fields
   * @param {boolean} shouldValidate - Whether to validate the form
   */
  const processFormChange = useCallback((newData, touchedField = null, shouldValidate = false) => {
    // Update form data
    setFormData(newData);
    
    // Update touched state
    if (touchedField) {
      setTouched(prev => ({ ...prev, [touchedField]: true }));
    }
    
    // Clear submit error when form changes
    if (submitError) {
      setSubmitError(null);
    }
    
    // Validate if requested
    if (shouldValidate && validate) {
      if (validateTimerRef.current) {
        clearTimeout(validateTimerRef.current);
      }
      
      validateTimerRef.current = setTimeout(() => {
        validateForm(newData);
      }, validateDebounce);
    }
  }, [submitError, validate, validateDebounce, validateForm]);
  
  /**
   * Handle input changes with validation
   * 
   * @param {Event|Object} event - Change event or direct value object
   */
  const handleChange = useCallback((event) => {
    // Handle both event objects and direct value objects
    const isEvent = event && event.target;
    
    let newData;
    let touchedField = null;
    
    if (isEvent) {
      const { name, value, type } = event.target;
      const isCheckbox = type === 'checkbox';
      const fieldValue = isCheckbox ? event.target.checked : value;
      
      newData = { ...formData, [name]: fieldValue };
      touchedField = name;
    } else {
      // If direct object is passed instead of event
      newData = { ...formData, ...event };
      // Multiple fields updated, touchedField remains null
      
      // Mark all changed fields as touched
      const touchedFields = createTouchedFields(event);
      setTouched(prev => ({ ...prev, ...touchedFields }));
    }

    processFormChange(newData, touchedField, validateOnChange);
  }, [formData, processFormChange, validateOnChange]);
  
  /**
   * Handle form blur events
   * 
   * @param {Event} event - Blur event
   */
  const handleBlur = useCallback((event) => {
    const { name } = event.target;
    
    // Mark field as touched
    setTouched(prev => ({ ...prev, [name]: true }));
    
    // Validate the field on blur
    if (validate) {
      validateForm(formData);
    }
  }, [formData, validate, validateForm]);
  
  /**
   * Handle form submission
   * 
   * @param {Function} submissionCallback - Function to call with form data
   * @param {Object} [options] - Submission options
   * @param {boolean} [options.validateBeforeSubmit=true] - Whether to validate before submitting
   * @returns {Promise<Object>} Submission result
   */
  const handleSubmit = useCallback(async (submissionCallback, options = {}) => {
    const { validateBeforeSubmit = true } = options;
    
    // Prevent double submission
    if (isSubmitting) {
      return { success: false, error: 'Submission already in progress.' };
    }
    
    // Mark all fields as touched
    const allTouched = createTouchedFields(formData);
    setTouched(allTouched);
    
    // Validate before submission if requested
    if (validateBeforeSubmit && validate) {
      const validationErrors = validateForm(formData);
      if (Object.keys(validationErrors).length > 0) {
        return { 
          success: false, 
          error: 'Please fix form errors before submitting.', 
          validationErrors 
        };
      }
    }
    
    // Start submission
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      const result = await submissionCallback(formData);
      setIsSubmitting(false);
      return { success: true, result };
    } catch (error) {
      const errorMessage = error?.message || 'Submission failed. Please try again.';
      setSubmitError(errorMessage);
      setIsSubmitting(false);
      return { success: false, error: errorMessage };
    }
  }, [formData, isSubmitting, validate, validateForm]);
  
  /**
   * Reset the form to initial or new values
   * 
   * @param {Object} [newValues=initialValues] - New values to reset to
   */
  const resetForm = useCallback((newValues = initialValues) => {
    setFormData(newValues);
    setIsSubmitting(false);
    setSubmitError(null);
    setTouched({});
    setErrors({});
    setIsValid(true);
    
    if (validateTimerRef.current) {
      clearTimeout(validateTimerRef.current);
    }
    
    previousValuesRef.current = newValues;
  }, [initialValues]);
  
  /**
   * Set a specific field value
   * 
   * @param {string} name - Field name
   * @param {*} value - Field value
   * @param {boolean} [shouldValidate=false] - Whether to validate after setting
   */
  const setFieldValue = useCallback((name, value, shouldValidate = false) => {
    const newData = { ...formData, [name]: value };
    processFormChange(newData, name, shouldValidate);
  }, [formData, processFormChange]);
  
  // Validate when dependencies change, but avoid on first render
  useEffect(() => {
    // Skip validation on first render
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }
    
    if (validate && !shallowEqual(previousValuesRef.current, formData)) {
      validateForm(formData);
      previousValuesRef.current = { ...formData };
    }
  }, [validate, formData, validateForm]);
  
  // Cleanup validation timer on unmount
  useEffect(() => {
    return () => {
      if (validateTimerRef.current) {
        clearTimeout(validateTimerRef.current);
      }
    };
  }, []);
  
  return {
    // Form state
    formData,
    errors,
    touched,
    isValid,
    isSubmitting,
    submitError,
    
    // Form actions
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
    setFormData,
    setFieldValue,
    setErrors,
    setTouched,
    setSubmitError,
    validateForm
  };
};

export default useFormHandler;