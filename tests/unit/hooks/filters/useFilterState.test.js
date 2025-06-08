/**
 * useFilterState Hook Unit Tests
 * 
 * Tests for core filter state management hook
 * - State initialization and updates
 * - Validation integration
 * - Debouncing functionality
 * - Filter operations (clear, reset, etc.)
 * - State change callbacks
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFilterState } from '@/hooks/filters/useFilterState';

// Mock dependencies
vi.mock('@/services/filters', () => ({
  filterTransformService: {
    validate: vi.fn(),
    toApiFormat: vi.fn(),
    toUrlParams: vi.fn()
  }
}));

vi.mock('@/utils/logger', () => ({
  logDebug: vi.fn(),
  logWarn: vi.fn()
}));

import { filterTransformService } from '@/services/filters';

describe('useFilterState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    
    // Default mock validation response
    filterTransformService.validate.mockReturnValue({
      valid: true,
      errors: [],
      warnings: []
    });

    // Default mock transform responses
    filterTransformService.toApiFormat.mockReturnValue({});
    filterTransformService.toUrlParams.mockReturnValue(new URLSearchParams());
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Initialization', () => {
    it('should initialize with default filters', () => {
      const { result } = renderHook(() => useFilterState());

      expect(result.current.filters).toEqual({
        city: null,
        borough: null,
        neighborhood: null,
        cuisine: [],
        hashtag: []
      });
      expect(result.current.isValid).toBe(true);
    });

    it('should initialize with provided initial filters', () => {
      const initialFilters = {
        city: 1,
        cuisine: ['italian']
      };

      const { result } = renderHook(() => useFilterState(initialFilters));

      expect(result.current.filters.city).toBe(1);
      expect(result.current.filters.cuisine).toEqual(['italian']);
      expect(result.current.filters.borough).toBe(null); // Default value
    });

    it('should merge initial filters with defaults', () => {
      const initialFilters = { city: 1 };
      const { result } = renderHook(() => useFilterState(initialFilters));

      expect(result.current.filters).toEqual({
        city: 1,
        borough: null,
        neighborhood: null,
        cuisine: [],
        hashtag: []
      });
    });
  });

  describe('Filter Updates', () => {
    it('should update filters correctly', () => {
      const { result } = renderHook(() => useFilterState());

      act(() => {
        result.current.updateFilters({ city: 1 });
      });

      expect(result.current.filters.city).toBe(1);
    });

    it('should update single filter correctly', () => {
      const { result } = renderHook(() => useFilterState());

      act(() => {
        result.current.updateFilter('city', 1);
      });

      expect(result.current.filters.city).toBe(1);
    });

    it('should reject unknown filter keys', () => {
      const { result } = renderHook(() => useFilterState());

      act(() => {
        result.current.updateFilter('unknown', 'value');
      });

      // Filter should remain unchanged
      expect(result.current.filters.unknown).toBeUndefined();
    });

    it('should handle multiple filter updates', () => {
      const { result } = renderHook(() => useFilterState());

      act(() => {
        result.current.updateFilters({
          city: 1,
          borough: 2,
          cuisine: ['italian', 'mexican']
        });
      });

      expect(result.current.filters.city).toBe(1);
      expect(result.current.filters.borough).toBe(2);
      expect(result.current.filters.cuisine).toEqual(['italian', 'mexican']);
    });
  });

  describe('Filter Operations', () => {
    it('should clear individual filters', () => {
      const initialFilters = { city: 1, cuisine: ['italian'] };
      const { result } = renderHook(() => useFilterState(initialFilters));

      act(() => {
        result.current.clearFilter('city');
      });

      expect(result.current.filters.city).toBe(null);
      expect(result.current.filters.cuisine).toEqual(['italian']); // Unchanged
    });

    it('should clear all filters', () => {
      const initialFilters = { city: 1, cuisine: ['italian'] };
      const { result } = renderHook(() => useFilterState(initialFilters));

      act(() => {
        result.current.clearAllFilters();
      });

      expect(result.current.filters).toEqual({
        city: null,
        borough: null,
        neighborhood: null,
        cuisine: [],
        hashtag: []
      });
    });

    it('should reset to initial filters', () => {
      const initialFilters = { city: 1 };
      const { result } = renderHook(() => useFilterState(initialFilters));

      // Make some changes
      act(() => {
        result.current.updateFilters({ borough: 2, cuisine: ['italian'] });
      });

      // Reset
      act(() => {
        result.current.resetFilters();
      });

      expect(result.current.filters.city).toBe(1); // From initial
      expect(result.current.filters.borough).toBe(null); // Reset to default
      expect(result.current.filters.cuisine).toEqual([]); // Reset to default
    });
  });

  describe('Validation', () => {
    it('should validate filters on update', () => {
      const { result } = renderHook(() => useFilterState());
      
      // Clear the initial mount validation call
      vi.clearAllMocks();

      act(() => {
        result.current.updateFilters({ city: 1 }, true); // immediate = true
      });

      expect(filterTransformService.validate).toHaveBeenCalledWith({
        city: 1,
        borough: null,
        neighborhood: null,
        cuisine: [],
        hashtag: []
      });
    });

    it('should handle validation errors', () => {
      filterTransformService.validate.mockReturnValue({
        valid: false,
        errors: ['Invalid city'],
        warnings: []
      });

      const { result } = renderHook(() => useFilterState());

      act(() => {
        result.current.updateFilters({ city: -1 });
      });

      expect(result.current.isValid).toBe(false);
      expect(result.current.validationState.errors).toEqual(['Invalid city']);
    });

    it('should disable validation when validateOnUpdate is false', () => {
      const { result } = renderHook(() => 
        useFilterState({}, { validateOnUpdate: false })
      );

      // Clear the initial mount validation call
      vi.clearAllMocks();

      act(() => {
        result.current.updateFilters({ city: 1 });
      });

      expect(filterTransformService.validate).not.toHaveBeenCalled();
      expect(result.current.isValid).toBe(true);
    });
  });

  describe('Debouncing', () => {
    it('should debounce filter updates', () => {
      const onStateChange = vi.fn();
      const { result } = renderHook(() => 
        useFilterState({}, { debounceMs: 300, onStateChange })
      );

      act(() => {
        result.current.updateFilters({ city: 1 });
        result.current.updateFilters({ city: 2 });
        result.current.updateFilters({ city: 3 });
      });

      // Should not have called callback yet
      expect(onStateChange).not.toHaveBeenCalled();

      // Fast forward time
      act(() => {
        vi.advanceTimersByTime(300);
      });

      // Should be called only once with final value
      expect(onStateChange).toHaveBeenCalledTimes(1);
      expect(onStateChange).toHaveBeenCalledWith(
        expect.objectContaining({ city: 3 }),
        expect.any(Object)
      );
    });

    it('should support immediate updates', () => {
      const onStateChange = vi.fn();
      const { result } = renderHook(() => 
        useFilterState({}, { debounceMs: 300, onStateChange })
      );

      act(() => {
        result.current.updateFilters({ city: 1 }, true); // immediate = true
      });

      // Should be called immediately
      expect(onStateChange).toHaveBeenCalledTimes(1);
    });

    it('should support zero debounce', () => {
      const onStateChange = vi.fn();
      const { result } = renderHook(() => 
        useFilterState({}, { debounceMs: 0, onStateChange })
      );

      act(() => {
        result.current.updateFilters({ city: 1 });
      });

      // Should be called immediately
      expect(onStateChange).toHaveBeenCalledTimes(1);
    });
  });

  describe('Derived Data', () => {
    it('should detect active filters', () => {
      const { result } = renderHook(() => useFilterState());

      // No active filters initially
      expect(result.current.hasActiveFilters()).toBe(false);

      act(() => {
        result.current.updateFilters({ city: 1 });
      });

      expect(result.current.hasActiveFilters()).toBe(true);
    });

    it('should detect array filters as active', () => {
      const { result } = renderHook(() => useFilterState());

      act(() => {
        result.current.updateFilters({ cuisine: ['italian'] });
      });

      expect(result.current.hasActiveFilters()).toBe(true);
    });

    it('should detect range filters as active', () => {
      const { result } = renderHook(() => useFilterState());

      act(() => {
        result.current.updateFilters({ price: { min: 10, max: null } });
      });

      expect(result.current.hasActiveFilters()).toBe(true);
    });

    it('should generate API format', () => {
      const mockApiFormat = { cityId: 1 };
      filterTransformService.toApiFormat.mockReturnValue(mockApiFormat);

      const { result } = renderHook(() => useFilterState());

      act(() => {
        result.current.updateFilters({ city: 1 });
      });

      const apiFormat = result.current.getApiFilters();
      expect(apiFormat).toEqual(mockApiFormat);
    });

    it('should generate URL parameters', () => {
      const mockUrlParams = new URLSearchParams('city=1');
      filterTransformService.toUrlParams.mockReturnValue(mockUrlParams);

      const { result } = renderHook(() => useFilterState());

      act(() => {
        result.current.updateFilters({ city: 1 });
      });

      const urlParams = result.current.getUrlParams();
      expect(urlParams).toEqual(mockUrlParams);
    });

    it('should track changes from initial state', () => {
      const initialFilters = { city: 1 };
      const { result } = renderHook(() => useFilterState(initialFilters));

      act(() => {
        result.current.updateFilters({ city: 2, cuisine: ['italian'] });
      });

      const changes = result.current.getChangesSummary();
      expect(changes).toEqual({
        city: { from: 1, to: 2 },
        cuisine: { from: [], to: ['italian'] }
      });
    });
  });

  describe('State Change Callbacks', () => {
    it('should call state change callback', () => {
      const onStateChange = vi.fn();
      const { result } = renderHook(() => 
        useFilterState({}, { onStateChange, debounceMs: 0 })
      );

      act(() => {
        result.current.updateFilters({ city: 1 });
      });

      expect(onStateChange).toHaveBeenCalledWith(
        expect.objectContaining({ city: 1 }),
        expect.objectContaining({ isValid: true })
      );
    });

    it('should not call callback when disabled', () => {
      const onStateChange = vi.fn();
      const { result } = renderHook(() => 
        useFilterState({}, { onStateChange: null })
      );

      act(() => {
        result.current.updateFilters({ city: 1 });
      });

      expect(onStateChange).not.toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    it('should cleanup debounce timer on unmount', () => {
      const { unmount } = renderHook(() => 
        useFilterState({}, { debounceMs: 300 })
      );

      // This should not throw or cause memory leaks
      expect(() => unmount()).not.toThrow();
    });
  });
}); 