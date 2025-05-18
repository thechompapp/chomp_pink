/**
 * Enhanced form handling hook with validation and better error management
 * 
 * @module src/hooks/useFormHandler
 */
import { useState, useCallback, useEffect, useRef } from 'react';

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
  
  // References for debouncing
  const validateTimerRef = useRef(null);
  const previousValuesRef = useRef(initialValues);
  
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
      setIsValid(Object.keys(validationErrors).length === 0);
      return validationErrors;
    } catch (error) {
      console.error('Validation error:', error);
      setIsValid(false);
      return { form: 'Validation failed' };
    }
  }, [validate]);
  
  /**
   * Handle input changes with validation
   * 
   * @param {Event|Object} event - Change event or direct value object
   */
  const handleChange = useCallback((event) => {
    // Handle both event objects and direct value objects
    const isEvent = event && event.target;
    
    if (isEvent) {
      const { name, value, type } = event.target;
      const isCheckbox = type === 'checkbox';
      const checked = isCheckbox ? event.target.checked : undefined;
      
      setFormData((prevData) => ({
        ...prevData,
        [name]: isCheckbox ? checked : value,
      }));
      
      // Mark field as touched
      setTouched(prev => ({ ...prev, [name]: true }));
    } else {
      // If direct object is passed instead of event
      setFormData((prevData) => ({ ...prevData, ...event }));
      
      // Mark fields as touched
      const touchedFields = Object.keys(event).reduce((acc, key) => {
        acc[key] = true;
        return acc;
      }, {});
      
      setTouched(prev => ({ ...prev, ...touchedFields }));
    }

    // Clear submit error when form changes
    if (submitError) {
      setSubmitError(null);
    }
    
    // Validate on change if enabled
    if (validateOnChange && validate) {
      if (validateTimerRef.current) {
        clearTimeout(validateTimerRef.current);
      }
      
      validateTimerRef.current = setTimeout(() => {
        const newData = isEvent 
          ? { 
              ...formData, 
              [event.target.name]: event.target.type === 'checkbox' 
                ? event.target.checked 
                : event.target.value 
            }
          : { ...formData, ...event };
          
        validateForm(newData);
      }, validateDebounce);
    }
  }, [formData, submitError, validateOnChange, validate, validateDebounce, validateForm]);
  
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
    const allTouched = Object.keys(formData).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});
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
  }, [initialValues]);
  
  /**
   * Set a specific field value
   * 
   * @param {string} name - Field name
   * @param {*} value - Field value
   * @param {boolean} [shouldValidate=false] - Whether to validate after setting
   */
  const setFieldValue = useCallback((name, value, shouldValidate = false) => {
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      
      if (shouldValidate && validate) {
        validateForm(newData);
      }
      
      return newData;
    });
    
    setTouched(prev => ({ ...prev, [name]: true }));
  }, [validate, validateForm]);
  
  // Validate when dependencies change
  useEffect(() => {
    if (validate && 
        JSON.stringify(previousValuesRef.current) !== JSON.stringify(formData)) {
      validateForm(formData);
      previousValuesRef.current = formData;
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