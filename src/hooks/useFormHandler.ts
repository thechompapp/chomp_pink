/* src/hooks/useFormHandler.ts */
import { useState, useCallback, ChangeEvent } from 'react';

// Define interface for the hook's return value, using generic type T for formData
interface FormHandler<T> {
  formData: T;
  setFormData: React.Dispatch<React.SetStateAction<T>>; // Expose setter
  handleChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void; // Handle selects too
  handleSubmit: <R = any>(submissionCallback: (data: T) => Promise<R>) => Promise<{ success: boolean; result?: R; error?: string }>; // Generic result type R
  isSubmitting: boolean;
  submitError: string | null;
  setSubmitError: React.Dispatch<React.SetStateAction<string | null>>; // Expose error setter
  resetForm: (newValues?: T) => void;
}

// Use generic type T constrained to an object type
const useFormHandler = <T extends Record<string, any>>(
  initialValues: T
): FormHandler<T> => {
  const [formData, setFormData] = useState<T>(initialValues);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value, type } = event.target;
      // Type assertion for checkbox needed
      const isCheckbox = type === 'checkbox' && event.target instanceof HTMLInputElement;
      const checked = isCheckbox ? event.target.checked : undefined;

      setFormData((prevData) => ({
        ...prevData,
        [name]: isCheckbox ? checked : value,
      }));
      // Clear error when user starts typing again
      if (submitError) {
        setSubmitError(null);
      }
    },
    [submitError] // Dependency on submitError to clear it
  );

  const handleSubmit = useCallback(
    async <R = any>( // Generic result type for the callback
      submissionCallback: (data: T) => Promise<R>
    ): Promise<{ success: boolean; result?: R; error?: string }> => {
      if (isSubmitting) {
         console.warn('Submission already in progress.');
         return { success: false, error: 'Submission already in progress.' };
      }
      setIsSubmitting(true);
      setSubmitError(null);
      try {
        const result = await submissionCallback(formData);
        setIsSubmitting(false);
        // Don't clear form here automatically, let caller decide
        // resetForm(); // Example if reset is desired on success
        return { success: true, result };
      } catch (error: any) {
        console.error('Form submission error:', error);
        const errorMessage = error?.message || 'Submission failed. Please try again.';
        setSubmitError(errorMessage);
        setIsSubmitting(false);
        return { success: false, error: errorMessage };
      }
    },
    [formData, isSubmitting] // Dependencies for handleSubmit
  );

  const resetForm = useCallback(
    (newValues: T = initialValues) => { // Use initialValues as default
      setFormData(newValues);
      setIsSubmitting(false);
      setSubmitError(null);
    },
    [initialValues] // Dependency on initialValues for default reset
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