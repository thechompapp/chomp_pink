import { useState, useCallback } from 'react';

const useFormHandler = (initialValues = {}) => {
  const [formData, setFormData] = useState(initialValues);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const handleChange = useCallback((event) => {
    const { name, value, type, checked } = event.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (submitError) {
      setSubmitError(null);
    }
  }, [submitError]);

  const handleSubmit = useCallback(
    async (submissionCallback) => {
      if (isSubmitting) return;
      setIsSubmitting(true);
      setSubmitError(null);
      try {
        const result = await submissionCallback(formData);
        setIsSubmitting(false);
        return { success: true, result };
      } catch (error) {
        console.error('Form submission error:', error);
        setSubmitError(error.message || 'Submission failed. Please try again.');
        setIsSubmitting(false);
        return { success: false, error: error.message };
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