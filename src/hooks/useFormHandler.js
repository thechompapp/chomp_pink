// src/hooks/useFormHandler.js
import { useState, useCallback } from 'react';

/**
 * Custom hook to manage form state, input changes, and submission status.
 * @param {object} initialValues - An object containing the initial values for form fields.
 * @returns {object} An object containing form state, handlers, and submission status.
 */
const useFormHandler = (initialValues = {}) => {
  // State for form input values
  const [formData, setFormData] = useState(initialValues);

  // State for submission status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Handler for input changes
  // Updates the corresponding field in formData
  const handleChange = useCallback((event) => {
    const { name, value, type, checked } = event.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // Clear previous submission errors when user starts typing again
    if (submitError) {
      setSubmitError(null);
    }
  }, [submitError]); // Dependency includes submitError to clear it

  // Handler for form submission
  // Takes the actual async submission function as an argument
  const handleSubmit = useCallback(async (submissionCallback) => {
    if (isSubmitting) return; // Prevent double submission

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Call the provided async function (e.g., API call) with current form data
      const result = await submissionCallback(formData);
      setIsSubmitting(false);
      // Optionally return result from the callback
      return { success: true, result };
    } catch (error) {
      console.error('Form submission error:', error);
      setSubmitError(error.message || 'Submission failed. Please try again.');
      setIsSubmitting(false);
      return { success: false, error: error.message };
    }
  }, [formData, isSubmitting]); // Dependencies: current form data and submitting state

  // Function to reset the form to initial values or specific values
  const resetForm = useCallback((newValues = initialValues) => {
    setFormData(newValues);
    setIsSubmitting(false);
    setSubmitError(null);
  }, [initialValues]); // Depends on the initial values reference

  return {
    formData,       // Current form values { fieldName: value, ... }
    setFormData,    // Function to directly set form data (use with caution)
    handleChange,   // onChange handler for standard inputs
    handleSubmit,   // onSubmit handler wrapper
    isSubmitting,   // Boolean indicating submission in progress
    submitError,    // String containing submission error message, or null
    setSubmitError, // Function to manually set/clear submission error
    resetForm,      // Function to reset form fields
  };
};

export default useFormHandler;