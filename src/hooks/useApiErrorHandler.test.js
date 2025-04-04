// src/hooks/useApiErrorHandler.test.js
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useApiErrorHandler from './useApiErrorHandler'; // Assumes this file is in the same directory as the hook

describe('useApiErrorHandler Hook', () => {
  it('should initialize with errorMessage as null', () => {
    const { result } = renderHook(() => useApiErrorHandler());
    expect(result.current.errorMessage).toBeNull();
  });

  it('should set errorMessage from an Error object', () => {
    const { result } = renderHook(() => useApiErrorHandler());
    const testError = new Error('This is from Error object');

    act(() => {
      result.current.handleError(testError);
    });

    expect(result.current.errorMessage).toBe('This is from Error object');
  });

  it('should set errorMessage from a string', () => {
    const { result } = renderHook(() => useApiErrorHandler());
    const testErrorString = 'This is a string error';

    act(() => {
      result.current.handleError(testErrorString);
    });

    expect(result.current.errorMessage).toBe(testErrorString);
  });

  it('should set errorMessage from an object with "error" property', () => {
    const { result } = renderHook(() => useApiErrorHandler());
    const testErrorObject = { error: 'Error from object.error' };

    act(() => {
      result.current.handleError(testErrorObject);
    });

    expect(result.current.errorMessage).toBe('Error from object.error');
  });

  it('should set errorMessage from an object with "message" property', () => {
    const { result } = renderHook(() => useApiErrorHandler());
    const testErrorObject = { message: 'Error from object.message' };

    act(() => {
      result.current.handleError(testErrorObject);
    });

    expect(result.current.errorMessage).toBe('Error from object.message');
  });

    it('should set errorMessage from an object with "msg" property', () => {
      const { result } = renderHook(() => useApiErrorHandler());
      const testErrorObject = { msg: 'Error from object.msg' };

      act(() => {
        result.current.handleError(testErrorObject);
      });

      expect(result.current.errorMessage).toBe('Error from object.msg');
    });

  it('should use default message for unknown error types or empty objects', () => {
    const { result } = renderHook(() => useApiErrorHandler());
    const defaultMsg = 'Default error message provided';

    act(() => {
      result.current.handleError({}, defaultMsg); // Empty object
    });
    expect(result.current.errorMessage).toBe(defaultMsg);

    act(() => {
      result.current.handleError(null, defaultMsg); // Null
    });
     expect(result.current.errorMessage).toBe(defaultMsg);

     act(() => {
      result.current.handleError(undefined, defaultMsg); // undefined
    });
     expect(result.current.errorMessage).toBe(defaultMsg);

     act(() => {
      result.current.handleError(123, defaultMsg); // number
    });
     expect(result.current.errorMessage).toBe(defaultMsg);
  });

    it('should use standard default message if no default provided for unknown types', () => {
      const { result } = renderHook(() => useApiErrorHandler());

      act(() => {
        result.current.handleError({}); // Empty object, no default passed
      });
      expect(result.current.errorMessage).toBe('An unexpected error occurred.'); // Check standard default
    });

  it('should clear the error message with clearError', () => {
    const { result } = renderHook(() => useApiErrorHandler());
    const testError = new Error('Initial Error');

    // Set an error first
    act(() => {
      result.current.handleError(testError);
    });
    expect(result.current.errorMessage).toBe('Initial Error');

    // Clear the error
    act(() => {
      result.current.clearError();
    });
    expect(result.current.errorMessage).toBeNull();
  });
});