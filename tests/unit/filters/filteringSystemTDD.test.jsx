/* tests/unit/filters/filteringSystemTDD.test.jsx */
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';

// Components to test
import FilterContainer from '@/components/Filters/FilterContainer';
import { FilterProvider, useFilter, FILTER_TYPES } from '@/contexts/FilterContext';
import { useFilterStore } from '@/stores/useFilterStore';
import NeighborhoodFilter from '@/components/Filters/NeighborhoodFilter';
import CuisineFilter from '@/components/Filters/CuisineFilter';
import FilterBar from '@/components/Filters/FilterBar';
import FilterItem from '@/components/Filters/FilterItem';
import FilterChip from '@/components/Filters/FilterChip';

// Services
import { filterService } from '@/services/filterService';
import { neighborhoodService } from '@/services/neighborhoodService';
import { hashtagService } from '@/services/hashtagService';

// Mock data
const mockCities = [
  { id: 1, name: 'New York', has_boroughs: true },
  { id: 2, name: 'Los Angeles', has_boroughs: false },
  { id: 3, name: 'Chicago', has_boroughs: false }
];

const mockBoroughs = [
  { id: 1, name: 'Manhattan', city_id: 1 },
  { id: 2, name: 'Brooklyn', city_id: 1 },
  { id: 3, name: 'Queens', city_id: 1 }
];

const mockNeighborhoods = [
  { id: 1, name: 'SoHo', borough_id: 1 },
  { id: 2, name: 'Chelsea', borough_id: 1 },
  { id: 3, name: 'Williamsburg', borough_id: 2 }
];

const mockCuisines = [
  { name: 'Italian', count: 150 },
  { name: 'Mexican', count: 120 },
  { name: 'Japanese', count: 100 },
  { name: 'French', count: 80 }
];

// Mock services
vi.mock('@/services/filterService', () => ({
  filterService: {
    getCities: vi.fn(),
    getCuisines: vi.fn()
  }
}));

vi.mock('@/services/neighborhoodService', () => ({
  neighborhoodService: {
    getBoroughs: vi.fn(),
    getNeighborhoods: vi.fn()
  }
}));

vi.mock('@/services/hashtagService', () => ({
  hashtagService: {
    getTopHashtags: vi.fn()
  }
}));

// Mock logger
vi.mock('@/utils/logger', () => ({
  logDebug: vi.fn(),
  logWarn: vi.fn(),
  logError: vi.fn()
}));

// Test wrapper component
const TestWrapper = ({ children, queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
}) }) => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      {children}
    </BrowserRouter>
  </QueryClientProvider>
);

// Test component that uses filter context
const TestFilterConsumer = ({ onFiltersChange }) => {
  const { filters, transformedFilters, hasActiveFilters, activeFilterCount } = useFilter();
  
  React.useEffect(() => {
    if (onFiltersChange) {
      onFiltersChange(transformedFilters);
    }
  }, [transformedFilters, onFiltersChange]);
  
  return (
    <div data-testid="filter-consumer">
      <div data-testid="has-active-filters">{hasActiveFilters.toString()}</div>
      <div data-testid="active-filter-count">{activeFilterCount}</div>
      <div data-testid="current-filters">{JSON.stringify(filters)}</div>
      <div data-testid="transformed-filters">{JSON.stringify(transformedFilters)}</div>
    </div>
  );
};

describe('🔍 FILTERING SYSTEM TDD', () => {
  let queryClient;
  
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Create fresh query client for each test
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    
    // Setup default mock responses
    filterService.getCities.mockResolvedValue(mockCities);
    neighborhoodService.getBoroughs.mockResolvedValue(mockBoroughs);
    neighborhoodService.getNeighborhoods.mockResolvedValue(mockNeighborhoods);
    hashtagService.getTopHashtags.mockResolvedValue(mockCuisines);
  });
  
  afterEach(() => {
    queryClient.clear();
  });

  describe('📦 FILTER STORE TESTS', () => {
    it('should initialize with empty filters', () => {
      // Clear any persisted state first
      localStorage.clear();
      useFilterStore.persist.clearStorage();
      
      const { filters, hasActiveFilters, getActiveFilterCount } = useFilterStore.getState();
      
      expect(filters[FILTER_TYPES.CITY]).toBe(null);
      expect(filters[FILTER_TYPES.BOROUGH]).toBe(null);
      expect(filters[FILTER_TYPES.NEIGHBORHOOD]).toBe(null);
      expect(filters[FILTER_TYPES.CUISINE]).toEqual([]);
      expect(hasActiveFilters()).toBe(false);
      expect(getActiveFilterCount()).toBe(0);
    });
    
    it('should set single-value filters correctly', () => {
      const { setFilter, clearFilters } = useFilterStore.getState();
      
      // Clear first
      act(() => {
        clearFilters();
      });
      
      act(() => {
        setFilter(FILTER_TYPES.CITY, 1);
      });
      
      const { filters, hasActiveFilters, getActiveFilterCount } = useFilterStore.getState();
      expect(filters[FILTER_TYPES.CITY]).toBe(1);
      expect(hasActiveFilters()).toBe(true);
      expect(getActiveFilterCount()).toBe(1);
    });
    
    it('should toggle array filters correctly', () => {
      const { toggleArrayFilter, clearFilters } = useFilterStore.getState();
      
      // Clear first
      act(() => {
        clearFilters();
      });
      
      act(() => {
        toggleArrayFilter(FILTER_TYPES.CUISINE, 'Italian');
        toggleArrayFilter(FILTER_TYPES.CUISINE, 'Mexican');
      });
      
      const { filters } = useFilterStore.getState();
      expect(filters[FILTER_TYPES.CUISINE]).toContain('Italian');
      expect(filters[FILTER_TYPES.CUISINE]).toContain('Mexican');
      expect(filters[FILTER_TYPES.CUISINE]).toHaveLength(2);
    });
    
    it('should remove from array filters when toggled again', () => {
      const { toggleArrayFilter, clearFilters } = useFilterStore.getState();
      
      // Clear first
      act(() => {
        clearFilters();
      });
      
      act(() => {
        toggleArrayFilter(FILTER_TYPES.CUISINE, 'Italian');
        toggleArrayFilter(FILTER_TYPES.CUISINE, 'Italian'); // Toggle off
      });
      
      const { filters } = useFilterStore.getState();
      expect(filters[FILTER_TYPES.CUISINE]).not.toContain('Italian');
      expect(filters[FILTER_TYPES.CUISINE]).toHaveLength(0);
    });
    
    it('should clear all filters', () => {
      const { setFilter, toggleArrayFilter, clearFilters } = useFilterStore.getState();
      
      act(() => {
        setFilter(FILTER_TYPES.CITY, 1);
        toggleArrayFilter(FILTER_TYPES.CUISINE, 'Italian');
        clearFilters();
      });
      
      const { filters, hasActiveFilters } = useFilterStore.getState();
      expect(filters[FILTER_TYPES.CITY]).toBe(null);
      expect(filters[FILTER_TYPES.CUISINE]).toEqual([]);
      expect(hasActiveFilters()).toBe(false);
    });
    
    it('should clear specific filter type', () => {
      const { setFilter, toggleArrayFilter, clearFilters } = useFilterStore.getState();
      
      act(() => {
        clearFilters(); // Clear first
        setFilter(FILTER_TYPES.CITY, 1);
        toggleArrayFilter(FILTER_TYPES.CUISINE, 'Italian');
        clearFilters(FILTER_TYPES.CITY);
      });
      
      const { filters } = useFilterStore.getState();
      expect(filters[FILTER_TYPES.CITY]).toBe(null);
      expect(filters[FILTER_TYPES.CUISINE]).toContain('Italian'); // Should remain
    });
  });

  describe('🌐 FILTER CONTEXT TESTS', () => {
    beforeEach(() => {
      // Clear store state before each context test
      const { clearFilters } = useFilterStore.getState();
      act(() => {
        clearFilters();
      });
    });
    
    it('should provide filter context to children', async () => {
      const onFiltersChange = vi.fn();
      
      render(
        <TestWrapper>
          <FilterProvider onChange={onFiltersChange}>
            <TestFilterConsumer onFiltersChange={onFiltersChange} />
          </FilterProvider>
        </TestWrapper>
      );
      
      expect(screen.getByTestId('has-active-filters')).toHaveTextContent('false');
      expect(screen.getByTestId('active-filter-count')).toHaveTextContent('0');
    });
    
    it('should initialize with provided initial filters', async () => {
      const initialFilters = {
        cityId: 1,
        hashtags: ['Italian', 'Mexican']
      };
      const onFiltersChange = vi.fn();
      
      render(
        <TestWrapper>
          <FilterProvider initialFilters={initialFilters} onChange={onFiltersChange}>
            <TestFilterConsumer onFiltersChange={onFiltersChange} />
          </FilterProvider>
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByTestId('has-active-filters')).toHaveTextContent('true');
      });
    });
    
    it('should transform filters for API consumption', async () => {
      const initialFilters = {
        cityId: 1,
        boroughId: 2,
        neighborhoodId: 3,
        hashtags: ['Italian', 'Mexican']
      };
      const onFiltersChange = vi.fn();
      
      render(
        <TestWrapper>
          <FilterProvider initialFilters={initialFilters} onChange={onFiltersChange}>
            <TestFilterConsumer onFiltersChange={onFiltersChange} />
          </FilterProvider>
        </TestWrapper>
      );
      
      await waitFor(() => {
        const transformedFilters = JSON.parse(
          screen.getByTestId('transformed-filters').textContent
        );
        
        expect(transformedFilters).toEqual({
          cityId: 1,
          boroughId: 2,
          neighborhoodId: 3,
          hashtags: 'Italian,Mexican' // Should be comma-separated for API
        });
      });
    });
    
    it('should debounce filter changes', async () => {
      const onFiltersChange = vi.fn();
      
      render(
        <TestWrapper>
          <FilterProvider onChange={onFiltersChange} debounceMs={50}>
            <TestFilterConsumer />
          </FilterProvider>
        </TestWrapper>
      );
      
      // Should call after debounce period with empty filters (since no initial filters)
      await waitFor(() => {
        expect(onFiltersChange).toHaveBeenCalledWith({});
      }, { timeout: 150 });
    });
  });

  describe('🏗️ FILTER COMPONENTS TESTS', () => {
    describe('FilterChip', () => {
      it('should render filter chip with label and remove button', () => {
        const onRemove = vi.fn();
        
        render(
          <FilterChip
            label="Italian"
            onRemove={onRemove}
          />
        );
        
        expect(screen.getByText('Italian')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /remove italian filter/i })).toBeInTheDocument();
      });
      
      it('should call onRemove when remove button is clicked', () => {
        const onRemove = vi.fn();
        
        render(
          <FilterChip
            label="Italian"
            onRemove={onRemove}
          />
        );
        
        fireEvent.click(screen.getByRole('button', { name: /remove italian filter/i }));
        expect(onRemove).toHaveBeenCalledTimes(1);
      });
      
      it('should render without remove button when onRemove is not provided', () => {
        render(
          <FilterChip
            label="Italian"
          />
        );
        
        expect(screen.getByText('Italian')).toBeInTheDocument();
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
      });
    });

    describe('FilterItem', () => {
      const TestFilterItemWrapper = ({ children }) => (
        <TestWrapper>
          <FilterProvider>
            {children}
          </FilterProvider>
        </TestWrapper>
      );
      
      it('should render filter item as inactive by default', () => {
        render(
          <TestFilterItemWrapper>
            <FilterItem
              type={FILTER_TYPES.CITY}
              value={1}
              label="New York"
            />
          </TestFilterItemWrapper>
        );
        
        const button = screen.getByText('New York');
        expect(button).toBeInTheDocument();
        // Should not have active styles initially
      });
      
      it('should toggle single-value filter on click', async () => {
        render(
          <TestFilterItemWrapper>
            <FilterItem
              type={FILTER_TYPES.CITY}
              value={1}
              label="New York"
            />
          </TestFilterItemWrapper>
        );
        
        const button = screen.getByText('New York');
        fireEvent.click(button);
        
        // Filter should now be active
        await waitFor(() => {
          const { filters } = useFilterStore.getState();
          expect(filters[FILTER_TYPES.CITY]).toBe(1);
        });
      });
      
      it('should toggle array filter on click', async () => {
        render(
          <TestFilterItemWrapper>
            <FilterItem
              type={FILTER_TYPES.CUISINE}
              value="Italian"
              label="Italian"
            />
          </TestFilterItemWrapper>
        );
        
        const button = screen.getByText('Italian');
        fireEvent.click(button);
        
        await waitFor(() => {
          const { filters } = useFilterStore.getState();
          expect(filters[FILTER_TYPES.CUISINE]).toContain('Italian');
        });
      });
      
      it('should not respond to clicks when disabled', () => {
        render(
          <TestFilterItemWrapper>
            <FilterItem
              type={FILTER_TYPES.CITY}
              value={1}
              label="New York"
              disabled={true}
            />
          </TestFilterItemWrapper>
        );
        
        const button = screen.getByText('New York');
        fireEvent.click(button);
        
        const { filters } = useFilterStore.getState();
        expect(filters[FILTER_TYPES.CITY]).toBe(null);
      });
    });

    describe('FilterBar', () => {
      const TestFilterBarWrapper = ({ children, initialFilters = {} }) => (
        <TestWrapper>
          <FilterProvider initialFilters={initialFilters}>
            <FilterBar>
              {children}
            </FilterBar>
          </FilterProvider>
        </TestWrapper>
      );
      
      beforeEach(() => {
        // Clear store state before each filter bar test
        const { clearFilters } = useFilterStore.getState();
        act(() => {
          clearFilters();
        });
      });
      
      it('should not show clear button when no filters are active', async () => {
        render(
          <TestFilterBarWrapper>
            <div>Filter components here</div>
          </TestFilterBarWrapper>
        );
        
        // Wait a moment for any async setup to complete
        await waitFor(() => {
          expect(screen.queryByText(/clear all/i)).not.toBeInTheDocument();
        });
      });
      
      it('should show clear button when filters are active', async () => {
        const initialFilters = { cityId: 1 };
        
        render(
          <TestFilterBarWrapper initialFilters={initialFilters}>
            <div>Filter components here</div>
          </TestFilterBarWrapper>
        );
        
        await waitFor(() => {
          expect(screen.getByText(/clear all/i)).toBeInTheDocument();
        });
      });
      
      it('should clear all filters when clear button is clicked', async () => {
        const initialFilters = { cityId: 1, hashtags: ['Italian'] };
        
        render(
          <TestFilterBarWrapper initialFilters={initialFilters}>
            <div>Filter components here</div>
          </TestFilterBarWrapper>
        );
        
        await waitFor(() => {
          expect(screen.getByText(/clear all/i)).toBeInTheDocument();
        });
        
        fireEvent.click(screen.getByText(/clear all/i));
        
        await waitFor(() => {
          const { filters, hasActiveFilters } = useFilterStore.getState();
          expect(hasActiveFilters()).toBe(false);
        });
      });
    });
  });

  describe('🌍 NEIGHBORHOOD FILTER TESTS', () => {
    const TestNeighborhoodWrapper = ({ initialFilters = {} }) => (
      <TestWrapper queryClient={queryClient}>
        <FilterProvider initialFilters={initialFilters}>
          <NeighborhoodFilter />
        </FilterProvider>
      </TestWrapper>
    );
    
    it('should load and display cities', async () => {
      render(<TestNeighborhoodWrapper />);
      
      await waitFor(() => {
        expect(screen.getByText('New York')).toBeInTheDocument();
        expect(screen.getByText('Los Angeles')).toBeInTheDocument();
        expect(screen.getByText('Chicago')).toBeInTheDocument();
      });
      
      expect(filterService.getCities).toHaveBeenCalledTimes(1);
    });
    
    it('should load boroughs when city with boroughs is selected', async () => {
      render(<TestNeighborhoodWrapper />);
      
      // Wait for cities to load and click New York (has boroughs)
      await waitFor(() => {
        expect(screen.getByText('New York')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('New York'));
      
      // Should load boroughs for New York
      await waitFor(() => {
        expect(neighborhoodService.getBoroughs).toHaveBeenCalledWith(1);
        expect(screen.getByText('Manhattan')).toBeInTheDocument();
        expect(screen.getByText('Brooklyn')).toBeInTheDocument();
      });
    });
    
    it('should not load boroughs for cities without boroughs', async () => {
      render(<TestNeighborhoodWrapper />);
      
      await waitFor(() => {
        expect(screen.getByText('Los Angeles')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('Los Angeles'));
      
      // Should not call getBoroughs for LA (has_boroughs: false)
      await waitFor(() => {
        expect(neighborhoodService.getBoroughs).not.toHaveBeenCalled();
      });
    });
    
    it('should load neighborhoods when borough is selected', async () => {
      render(<TestNeighborhoodWrapper />);
      
      // Select New York first
      await waitFor(() => {
        expect(screen.getByText('New York')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('New York'));
      
      // Wait for boroughs and select Manhattan
      await waitFor(() => {
        expect(screen.getByText('Manhattan')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Manhattan'));
      
      // Should load neighborhoods for Manhattan
      await waitFor(() => {
        expect(neighborhoodService.getNeighborhoods).toHaveBeenCalledWith(1);
        expect(screen.getByText('SoHo')).toBeInTheDocument();
        expect(screen.getByText('Chelsea')).toBeInTheDocument();
      });
    });
    
    it('should clear dependent filters when parent filter changes', async () => {
      const initialFilters = { cityId: 1, boroughId: 1, neighborhoodId: 1 };
      
      render(<TestNeighborhoodWrapper initialFilters={initialFilters} />);
      
      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('New York')).toBeInTheDocument();
      });
      
      // Click a different city
      fireEvent.click(screen.getByText('Los Angeles'));
      
      // Borough and neighborhood should be cleared
      await waitFor(() => {
        const { filters } = useFilterStore.getState();
        expect(filters[FILTER_TYPES.CITY]).toBe(2); // LA
        expect(filters[FILTER_TYPES.BOROUGH]).toBe(null);
        expect(filters[FILTER_TYPES.NEIGHBORHOOD]).toBe(null);
      });
    });
  });

  describe('🍽️ CUISINE FILTER TESTS', () => {
    const TestCuisineWrapper = () => (
      <TestWrapper queryClient={queryClient}>
        <FilterProvider>
          <CuisineFilter />
        </FilterProvider>
      </TestWrapper>
    );
    
    it('should load and display cuisines', async () => {
      render(<TestCuisineWrapper />);
      
      await waitFor(() => {
        expect(screen.getByText('Italian')).toBeInTheDocument();
        expect(screen.getByText('Mexican')).toBeInTheDocument();
        expect(screen.getByText('Japanese')).toBeInTheDocument();
        expect(screen.getByText('French')).toBeInTheDocument();
      });
      
      expect(hashtagService.getTopHashtags).toHaveBeenCalledWith({
        limit: 15,
        category: 'cuisine'
      });
    });
    
    it('should filter cuisines based on search query', async () => {
      render(<TestCuisineWrapper />);
      
      // Wait for cuisines to load
      await waitFor(() => {
        expect(screen.getByText('Italian')).toBeInTheDocument();
      });
      
      // Search for "ital"
      const searchInput = screen.getByPlaceholderText(/search cuisines/i);
      fireEvent.change(searchInput, { target: { value: 'ital' } });
      
      // Should show only Italian
      await waitFor(() => {
        expect(screen.getByText('Italian')).toBeInTheDocument();
        expect(screen.queryByText('Mexican')).not.toBeInTheDocument();
        expect(screen.queryByText('Japanese')).not.toBeInTheDocument();
      });
    });
    
    it('should toggle cuisine selection', async () => {
      render(<TestCuisineWrapper />);
      
      await waitFor(() => {
        expect(screen.getByText('Italian')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('Italian'));
      
      await waitFor(() => {
        const { filters } = useFilterStore.getState();
        expect(filters[FILTER_TYPES.CUISINE]).toContain('Italian');
      });
    });
  });

  describe('📦 FILTER CONTAINER INTEGRATION TESTS', () => {
    beforeEach(() => {
      // Clear store state before each integration test
      const { clearFilters } = useFilterStore.getState();
      act(() => {
        clearFilters();
      });
    });
    
    it('should render complete filter system', async () => {
      const onFilterChange = vi.fn();
      
      render(
        <TestWrapper queryClient={queryClient}>
          <FilterContainer onFilterChange={onFilterChange} />
        </TestWrapper>
      );
      
      // Should render location section
      await waitFor(() => {
        expect(screen.getByText('Location')).toBeInTheDocument();
        expect(screen.getByText('New York')).toBeInTheDocument();
      });
      
      // Should render cuisine section - use getAllByText since there might be multiple "Italian" elements
      await waitFor(() => {
        const italianElements = screen.getAllByText('Italian');
        expect(italianElements.length).toBeGreaterThan(0);
      });
    });
    
    it('should propagate filter changes to parent', async () => {
      const onFilterChange = vi.fn();
      
      render(
        <TestWrapper queryClient={queryClient}>
          <FilterContainer onFilterChange={onFilterChange} />
        </TestWrapper>
      );
      
      // Wait for load and click a filter
      await waitFor(() => {
        expect(screen.getByText('New York')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('New York'));
      
      // Should call onFilterChange with transformed filters - give more time for debouncing
      await waitFor(() => {
        expect(onFilterChange).toHaveBeenCalledWith(
          expect.objectContaining({
            cityId: 1
          })
        );
      }, { timeout: 500 });
    });
    
    it('should handle API errors gracefully', async () => {
      // Mock API failure
      filterService.getCities.mockRejectedValue(new Error('API Error'));
      
      render(
        <TestWrapper queryClient={queryClient}>
          <FilterContainer onFilterChange={vi.fn()} />
        </TestWrapper>
      );
      
      // Should show error message instead of crashing
      await waitFor(() => {
        expect(screen.getByText(/error loading data/i)).toBeInTheDocument();
      });
    });
  });

  describe('🔄 FILTER PERSISTENCE TESTS', () => {
    beforeEach(() => {
      // Clear localStorage and store state
      localStorage.clear();
      const { clearFilters } = useFilterStore.getState();
      act(() => {
        clearFilters();
      });
    });
    
    it('should persist filters in localStorage', async () => {
      // Clear any existing storage
      localStorage.clear();
      
      const { setFilter } = useFilterStore.getState();
      
      act(() => {
        setFilter(FILTER_TYPES.CITY, 1);
      });
      
      // Should save to localStorage
      const stored = localStorage.getItem('doof-filter-storage');
      expect(stored).toBeTruthy();
      
      const parsed = JSON.parse(stored);
      expect(parsed.state.filters[FILTER_TYPES.CITY]).toBe(1);
    });
    
    it('should restore filters from localStorage', () => {
      // Set up localStorage with filters
      const filterState = {
        state: {
          filters: {
            [FILTER_TYPES.CITY]: 2,
            [FILTER_TYPES.CUISINE]: ['Italian']
          }
        },
        version: 0
      };
      
      localStorage.setItem('doof-filter-storage', JSON.stringify(filterState));
      
      // Force store to hydrate from localStorage
      useFilterStore.persist.rehydrate();
      
      // Check the restored state
      const { filters } = useFilterStore.getState();
      
      expect(filters[FILTER_TYPES.CITY]).toBe(2);
      expect(filters[FILTER_TYPES.CUISINE]).toContain('Italian');
    });
  });

  describe('🎯 PERFORMANCE TESTS', () => {
    beforeEach(() => {
      // Clear store state before each performance test
      const { clearFilters } = useFilterStore.getState();
      act(() => {
        clearFilters();
      });
    });
    
    it('should not re-render unnecessarily', async () => {
      const renderSpy = vi.fn();
      
      const TestComponent = () => {
        renderSpy();
        const { filters } = useFilter();
        return <div>{JSON.stringify(filters)}</div>;
      };
      
      render(
        <TestWrapper>
          <FilterProvider>
            <TestComponent />
          </FilterProvider>
        </TestWrapper>
      );
      
      // Wait for initial setup
      await waitFor(() => {
        expect(renderSpy).toHaveBeenCalled();
      });
      
      const initialCallCount = renderSpy.mock.calls.length;
      
      // Setting the same filter value should not cause re-render
      const { setFilter } = useFilterStore.getState();
      
      act(() => {
        setFilter(FILTER_TYPES.CITY, null); // Already null
      });
      
      // Should not have additional renders (allow for async effects to settle)
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(renderSpy).toHaveBeenCalledTimes(initialCallCount);
    });
    
    it('should debounce rapid filter changes', async () => {
      const onFiltersChange = vi.fn();
      
      render(
        <TestWrapper>
          <FilterProvider onChange={onFiltersChange} debounceMs={50}>
            <TestFilterConsumer />
          </FilterProvider>
        </TestWrapper>
      );
      
      // Wait for initial call
      await waitFor(() => {
        expect(onFiltersChange).toHaveBeenCalled();
      });
      
      // Reset the mock
      onFiltersChange.mockClear();
      
      const { setFilter } = useFilterStore.getState();
      
      // Rapidly change filters
      act(() => {
        setFilter(FILTER_TYPES.CITY, 1);
        setFilter(FILTER_TYPES.CITY, 2);
        setFilter(FILTER_TYPES.CITY, 3);
      });
      
      // Should only call onChange once after debounce
      await waitFor(() => {
        expect(onFiltersChange).toHaveBeenCalledTimes(1);
        expect(onFiltersChange).toHaveBeenLastCalledWith(
          expect.objectContaining({ cityId: 3 })
        );
      }, { timeout: 200 });
    });
  });
}); 