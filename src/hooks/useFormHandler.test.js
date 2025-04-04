// src/hooks/useFormHandler.test.js
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useFormHandler from './useFormHandler'; // Adjust path if needed

describe('useFormHandler Hook', () => {
  const initialValues = { name: 'Test', email: '', subscribe: false };

  it('should initialize with initial values', () => {
    const { result } = renderHook(() => useFormHandler(initialValues));
    expect(result.current.formData).toEqual(initialValues);
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.submitError).toBeNull();
  });

  it('should update formData on handleChange for text input', () => {
    const { result } = renderHook(() => useFormHandler(initialValues));
    const mockEvent = { target: { name: 'name', value: 'New Name', type: 'text' } };

    act(() => {
      result.current.handleChange(mockEvent);
    });

    expect(result.current.formData.name).toBe('New Name');
  });

  it('should update formData on handleChange for checkbox', () => {
    const { result } = renderHook(() => useFormHandler(initialValues));
    const mockEvent = { target: { name: 'subscribe', checked: true, type: 'checkbox' } };

    act(() => {
      result.current.handleChange(mockEvent);
    });

    expect(result.current.formData.subscribe).toBe(true);
  });

   it('should clear submitError on handleChange', () => {
     const { result } = renderHook(() => useFormHandler(initialValues));

     act(() => {
       result.current.setSubmitError('Previous error');
     });
     expect(result.current.submitError).toBe('Previous error');

     const mockEvent = { target: { name: 'name', value: 'Typing', type: 'text' } };
     act(() => {
       result.current.handleChange(mockEvent);
     });

     expect(result.current.submitError).toBeNull();
   });

  it('should handle successful submission with handleSubmit', async () => {
    const { result } = renderHook(() => useFormHandler(initialValues));
    const mockSubmitCallback = vi.fn().mockResolvedValue('Success Data');

    let submitResult;
    // Ensure async operations within act are awaited directly inside
    await act(async () => {
      submitResult = await result.current.handleSubmit(mockSubmitCallback);
    });

    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.submitError).toBeNull();
    expect(mockSubmitCallback).toHaveBeenCalledWith(initialValues);
    expect(submitResult).toEqual({ success: true, result: 'Success Data' });
  });

  it('should handle failed submission with handleSubmit', async () => {
    const { result } = renderHook(() => useFormHandler(initialValues));
    const errorMessage = 'Submission failed!';
    const mockSubmitCallback = vi.fn().mockRejectedValue(new Error(errorMessage));

    let submitResult;
    // Ensure async operations within act are awaited directly inside
    await act(async () => {
      submitResult = await result.current.handleSubmit(mockSubmitCallback);
    });

    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.submitError).toBe(errorMessage);
    expect(mockSubmitCallback).toHaveBeenCalledWith(initialValues);
    expect(submitResult).toEqual({ success: false, error: errorMessage });
  });

   it('should reset form to initial values', () => {
     const { result } = renderHook(() => useFormHandler(initialValues));

     act(() => {
       result.current.setFormData({ name: 'Changed', email: 'test@test.com', subscribe: true });
     });
     expect(result.current.formData).not.toEqual(initialValues);

     act(() => {
       result.current.resetForm();
     });

     expect(result.current.formData).toEqual(initialValues);
     expect(result.current.isSubmitting).toBe(false);
     expect(result.current.submitError).toBeNull();
   });

    it('should reset form to specific values', () => {
      const { result } = renderHook(() => useFormHandler(initialValues));
      const specificValues = { name: '', email: '', subscribe: true };

      act(() => {
        result.current.resetForm(specificValues);
      });

      expect(result.current.formData).toEqual(specificValues);
    });

});