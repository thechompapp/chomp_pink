/* src/hooks/useFormHandler.js */
/* REMOVED: All TypeScript syntax (interfaces, generics, types) */
import { useState, useCallback } from 'react';

const useFormHandler = (initialValues) => {
  const [formData, setFormData] = useState(initialValues);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const handleChange = useCallback(
    (event) => {
      const { name, value, type } = event.target;
      const isCheckbox = type === 'checkbox'; // Simpler check for JS
      const checked = isCheckbox ? event.target.checked : undefined;

      setFormData((prevData) => ({
        ...prevData,
        [name]: isCheckbox ? checked : value,
      }));
      if (submitError) {
        setSubmitError(null);
      }
    },
    [submitError]
  );

  const handleSubmit = useCallback(
    async (submissionCallback) => {
      if (isSubmitting) {
         console.warn('Submission already in progress.');
         return { success: false, error: 'Submission already in progress.' };
      }
      setIsSubmitting(true);
      setSubmitError(null);
      try {
        const result = await submissionCallback(formData);
        setIsSubmitting(false);
        return { success: true, result };
      } catch (error/*REMOVED: : any*/) {
        console.error('Form submission error:', error);
        const errorMessage = error?.message || 'Submission failed. Please try again.';
        setSubmitError(errorMessage);
        setIsSubmitting(false);
        return { success: false, error: errorMessage };
      }
    },
    [formData, isSubmitting]
  );

  const resetForm = useCallback(
    (newValues = initialValues) => {
      setFormData(newValues);
      setIsSubmitting(false);
      setSubmitError(null);
    },
    [initialValues]
  );

  return {
    formData,
    setFormData,
    handleChange,
    handleSubmit,
    isSubmitting,
    submitError,
    setSubmitError,
    resetForm,
  };
};

export default useFormHandler;