/**
 * FilterContainer.test.jsx - Phase 3 Component Tests
 * 
 * Tests for the refactored FilterContainer component
 * - Integration with Phase 2 hooks
 * - Component rendering and props
 * - Filter system coordination
 * - Callback handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import FilterContainer from '@/components/Filters/FilterContainer';

// Mock dependencies
vi.mock('@/hooks/filters', () => ({
  useFilters: vi.fn()
}));

vi.mock('@/components/Filters/FilterBar', () => ({
  default: ({ children }) => <div data-testid="filter-bar">{children}</div>
}));

vi.mock('@/components/Filters/NeighborhoodFilter', () => ({
  default: (props) => <div data-testid="neighborhood-filter" data-props={JSON.stringify(props)} />
}));

vi.mock('@/components/Filters/CuisineFilter', () => ({
  default: (props) => <div data-testid="cuisine-filter" data-props={JSON.stringify(props)} />
}));

vi.mock('@/components/Filters/FilterControls', () => ({
  default: (props) => <div data-testid="filter-controls" data-props={JSON.stringify(props)} />
}));

vi.mock('@/components/Filters/FilterValidationDisplay', () => ({
  default: (props) => <div data-testid="validation-display" data-props={JSON.stringify(props)} />
}));

vi.mock('@/utils/logger', () => ({
  logDebug: vi.fn()
}));

import { useFilters } from '@/hooks/filters';

describe('FilterContainer', () => {
  let mockUseFilters;
  let queryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });

    // Mock useFilters hook
    mockUseFilters = {
      filters: {
        city: null,
        borough: null,
        neighborhood: null,
        cuisine: [],
        hashtag: [],
        price: { min: null, max: null }
      },
      updateFilters: vi.fn(),
      updateFilter: vi.fn(),
      clearAllFilters: vi.fn(),
      resetFilters: vi.fn(),
      hasActiveFilters: false,
      data: {
        cities: [],
        boroughs: [],
        neighborhoods: [],
        cuisines: []
      },
      loading: {
        cities: false,
        boroughs: false,
        neighborhoods: false,
        cuisines: false
      },
      errors: {
        cities: null,
        boroughs: null,
        neighborhoods: null,
        cuisines: null
      },
      isValid: true,
      validationState: {
        isValid: true,
        errors: [],
        warnings: [],
        fieldErrors: {},
        crossFieldErrors: [],
        businessRuleViolations: []
      },
      apiFormat: {},
      getFieldErrorMessage: vi.fn(),
      hasFieldErrors: vi.fn(() => false)
    };

    useFilters.mockReturnValue(mockUseFilters);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const renderWithProviders = (component) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  describe('Rendering', () => {
    it('should render with default props', () => {
      renderWithProviders(<FilterContainer />);
      
      expect(screen.getByTestId('filter-bar')).toBeInTheDocument();
      expect(screen.getByTestId('neighborhood-filter')).toBeInTheDocument();
      expect(screen.getByTestId('cuisine-filter')).toBeInTheDocument();
      expect(screen.getByTestId('filter-controls')).toBeInTheDocument();
      expect(screen.getByTestId('validation-display')).toBeInTheDocument();
    });

    it('should call useFilters with correct options', () => {
      const initialFilters = { city: 1 };
      const customOptions = { 
        state: { debounceMs: 500 } 
      };

      renderWithProviders(
        <FilterContainer 
          initialFilters={initialFilters}
          options={customOptions}
        />
      );

      expect(useFilters).toHaveBeenCalledWith(
        initialFilters,
        expect.objectContaining({
          state: expect.objectContaining({
            validateOnUpdate: true,
            debounceMs: 300,
            onStateChange: expect.any(Function)
          }),
          data: expect.objectContaining({
            enableCaching: true,
            autoFetch: true,
            retryOnError: true
          }),
          ...customOptions
        })
      );
    });

    it('should conditionally render components based on props', () => {
      renderWithProviders(
        <FilterContainer 
          showNeighborhoodFilter={false}
          showCuisineFilter={false}
          showFilterControls={false}
          showValidation={false}
        />
      );

      expect(screen.getByTestId('filter-bar')).toBeInTheDocument();
      expect(screen.queryByTestId('neighborhood-filter')).not.toBeInTheDocument();
      expect(screen.queryByTestId('cuisine-filter')).not.toBeInTheDocument();
      expect(screen.queryByTestId('filter-controls')).not.toBeInTheDocument();
      expect(screen.queryByTestId('validation-display')).not.toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = renderWithProviders(
        <FilterContainer className="custom-class" />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('Component Props', () => {
    it('should pass correct props to NeighborhoodFilter', () => {
      renderWithProviders(<FilterContainer />);
      
      const neighborhoodFilter = screen.getByTestId('neighborhood-filter');
      const props = JSON.parse(neighborhoodFilter.getAttribute('data-props'));
      
      // Check that the essential props are passed (functions won't survive JSON.stringify)
      expect(props).toMatchObject({
        cities: mockUseFilters.data.cities,
        boroughs: mockUseFilters.data.boroughs,
        neighborhoods: mockUseFilters.data.neighborhoods,
        loading: mockUseFilters.loading,
        errors: mockUseFilters.errors
      });
      
      // Check that filterSystem has essential non-function properties
      expect(props.filterSystem).toMatchObject({
        filters: mockUseFilters.filters,
        data: mockUseFilters.data,
        loading: mockUseFilters.loading,
        errors: mockUseFilters.errors,
        isValid: mockUseFilters.isValid,
        validationState: mockUseFilters.validationState,
        hasActiveFilters: mockUseFilters.hasActiveFilters,
        apiFormat: mockUseFilters.apiFormat
      });
    });

    it('should pass correct props to CuisineFilter', () => {
      renderWithProviders(<FilterContainer />);
      
      const cuisineFilter = screen.getByTestId('cuisine-filter');
      const props = JSON.parse(cuisineFilter.getAttribute('data-props'));
      
      // Check that the essential props are passed
      expect(props).toMatchObject({
        cuisines: mockUseFilters.data.cuisines,
        loading: mockUseFilters.loading.cuisines,
        error: mockUseFilters.errors.cuisines
      });
      
      // Check that filterSystem has essential non-function properties
      expect(props.filterSystem).toMatchObject({
        filters: mockUseFilters.filters,
        data: mockUseFilters.data,
        loading: mockUseFilters.loading,
        errors: mockUseFilters.errors,
        isValid: mockUseFilters.isValid,
        validationState: mockUseFilters.validationState,
        hasActiveFilters: mockUseFilters.hasActiveFilters,
        apiFormat: mockUseFilters.apiFormat
      });
    });

    it('should pass correct props to FilterControls', () => {
      renderWithProviders(<FilterContainer />);
      
      const filterControls = screen.getByTestId('filter-controls');
      const props = JSON.parse(filterControls.getAttribute('data-props'));
      
      // Check that the essential props are passed
      expect(props).toMatchObject({
        hasActiveFilters: mockUseFilters.hasActiveFilters
      });
      
      // Check that filterSystem has essential non-function properties
      expect(props.filterSystem).toMatchObject({
        filters: mockUseFilters.filters,
        data: mockUseFilters.data,
        loading: mockUseFilters.loading,
        errors: mockUseFilters.errors,
        isValid: mockUseFilters.isValid,
        validationState: mockUseFilters.validationState,
        hasActiveFilters: mockUseFilters.hasActiveFilters,
        apiFormat: mockUseFilters.apiFormat
      });
    });

    it('should pass correct props to FilterValidationDisplay', () => {
      renderWithProviders(<FilterContainer />);
      
      const validationDisplay = screen.getByTestId('validation-display');
      const props = JSON.parse(validationDisplay.getAttribute('data-props'));
      
      expect(props).toEqual({
        validationState: mockUseFilters.validationState,
        isValid: mockUseFilters.isValid
      });
    });
  });

  describe('State Change Callback', () => {
    it('should call onChange when filters are valid', async () => {
      const mockOnChange = vi.fn();
      const mockApiFormat = { cityId: 1 };
      
      // Mock the filter system with valid state
      mockUseFilters.apiFormat = mockApiFormat;
      useFilters.mockReturnValue(mockUseFilters);

      renderWithProviders(<FilterContainer onChange={mockOnChange} />);

      // Get the onStateChange callback that was passed to useFilters
      const useFiltersCall = useFilters.mock.calls[0];
      const options = useFiltersCall[1];
      const onStateChange = options.state.onStateChange;

      // Simulate a state change with valid filters
      const filters = { city: 1 };
      const validation = { isValid: true };
      
      onStateChange(filters, validation);

      expect(mockOnChange).toHaveBeenCalledWith(mockApiFormat);
    });

    it('should not call onChange when filters are invalid', async () => {
      const mockOnChange = vi.fn();
      
      renderWithProviders(<FilterContainer onChange={mockOnChange} />);

      // Get the onStateChange callback that was passed to useFilters
      const useFiltersCall = useFilters.mock.calls[0];
      const options = useFiltersCall[1];
      const onStateChange = options.state.onStateChange;

      // Simulate a state change with invalid filters
      const filters = { city: 1 };
      const validation = { isValid: false };
      
      onStateChange(filters, validation);

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('should not call onChange when onChange is not provided', async () => {
      renderWithProviders(<FilterContainer />);

      // Get the onStateChange callback that was passed to useFilters
      const useFiltersCall = useFilters.mock.calls[0];
      const options = useFiltersCall[1];
      const onStateChange = options.state.onStateChange;

      // This should not throw an error
      expect(() => {
        onStateChange({ city: 1 }, { isValid: true });
      }).not.toThrow();
    });
  });

  describe('Integration', () => {
    it('should handle data loading states', () => {
      mockUseFilters.loading = {
        cities: true,
        boroughs: false,
        neighborhoods: false,
        cuisines: true
      };
      useFilters.mockReturnValue(mockUseFilters);

      renderWithProviders(<FilterContainer />);
      
      const neighborhoodFilter = screen.getByTestId('neighborhood-filter');
      const neighborhoodProps = JSON.parse(neighborhoodFilter.getAttribute('data-props'));
      
      expect(neighborhoodProps.loading.cities).toBe(true);
      expect(neighborhoodProps.loading.cuisines).toBe(true);
    });

    it('should handle error states', () => {
      mockUseFilters.errors = {
        cities: 'Failed to load cities',
        boroughs: null,
        neighborhoods: null,
        cuisines: 'Failed to load cuisines'
      };
      useFilters.mockReturnValue(mockUseFilters);

      renderWithProviders(<FilterContainer />);
      
      const neighborhoodFilter = screen.getByTestId('neighborhood-filter');
      const neighborhoodProps = JSON.parse(neighborhoodFilter.getAttribute('data-props'));
      
      expect(neighborhoodProps.errors.cities).toBe('Failed to load cities');
      expect(neighborhoodProps.errors.cuisines).toBe('Failed to load cuisines');
    });

    it('should handle validation states', () => {
      mockUseFilters.validationState = {
        isValid: false,
        errors: ['City is required'],
        warnings: ['Borough recommended'],
        fieldErrors: { city: ['Required field'] },
        crossFieldErrors: [],
        businessRuleViolations: []
      };
      mockUseFilters.isValid = false;
      useFilters.mockReturnValue(mockUseFilters);

      renderWithProviders(<FilterContainer />);
      
      const validationDisplay = screen.getByTestId('validation-display');
      const validationProps = JSON.parse(validationDisplay.getAttribute('data-props'));
      
      expect(validationProps.isValid).toBe(false);
      expect(validationProps.validationState.errors).toEqual(['City is required']);
    });
  });
}); 