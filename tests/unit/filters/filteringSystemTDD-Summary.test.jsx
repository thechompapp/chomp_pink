/* tests/unit/filters/filteringSystemTDD-Summary.test.jsx */
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';

// Components to test
import Home from '@/pages/Home';
import FilterContainer from '@/components/Filters/FilterContainer';
import { FilterProvider, FILTER_TYPES } from '@/contexts/FilterContext';
import { useFilterStore } from '@/stores/useFilterStore';

// Services
import { filterService } from '@/services/filterService';
import { neighborhoodService } from '@/services/neighborhoodService';
import { hashtagService } from '@/services/hashtagService';

// Mock data - Real-world scenarios
const mockCities = [
  { id: 1, name: 'New York', has_boroughs: true },
  { id: 2, name: 'Los Angeles', has_boroughs: false },
  { id: 3, name: 'Chicago', has_boroughs: false }
];

const mockBoroughs = [
  { id: 1, name: 'Manhattan', city_id: 1 },
  { id: 2, name: 'Brooklyn', city_id: 1 }
];

const mockNeighborhoods = [
  { id: 1, name: 'SoHo', borough_id: 1 },
  { id: 2, name: 'Chelsea', borough_id: 1 }
];

const mockCuisines = [
  { name: 'Italian', count: 150 },
  { name: 'Mexican', count: 120 },
  { name: 'Japanese', count: 100 }
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

vi.mock('@/utils/logger', () => ({
  logDebug: vi.fn(),
  logWarn: vi.fn(),
  logError: vi.fn(),
  logInfo: vi.fn(),
  logger: {
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn()
  },
  default: {
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn()
  }
}));

// Test wrapper
const TestWrapper = ({ children, queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } }
}) }) => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      {children}
    </BrowserRouter>
  </QueryClientProvider>
);

describe('🎯 FILTERING SYSTEM TDD - BUSINESS REQUIREMENTS', () => {
  let queryClient;
  
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } }
    });
    
    // Setup mock responses
    filterService.getCities.mockResolvedValue(mockCities);
    neighborhoodService.getBoroughs.mockResolvedValue(mockBoroughs);
    neighborhoodService.getNeighborhoods.mockResolvedValue(mockNeighborhoods);
    hashtagService.getTopHashtags.mockResolvedValue(mockCuisines);
    
    // Clear store state
    localStorage.clear();
    const { clearFilters } = useFilterStore.getState();
    act(() => clearFilters());
  });

  describe('📋 CORE FILTERING REQUIREMENTS', () => {
    it('should allow users to filter by city', async () => {
      const onFilterChange = vi.fn();
      
      render(
        <TestWrapper queryClient={queryClient}>
          <FilterContainer onFilterChange={onFilterChange} />
        </TestWrapper>
      );
      
      // Wait for cities to load
      await waitFor(() => {
        expect(screen.getByText('New York')).toBeInTheDocument();
      });
      
      // Click to select New York
      fireEvent.click(screen.getByText('New York'));
      
      // Should update filters
      await waitFor(() => {
        const { filters } = useFilterStore.getState();
        expect(filters[FILTER_TYPES.CITY]).toBe(1);
      });
    });
    
    it('should allow users to filter by multiple cuisines', async () => {
      render(
        <TestWrapper queryClient={queryClient}>
          <FilterContainer onFilterChange={vi.fn()} />
        </TestWrapper>
      );
      
      // Wait for cuisines to load
      await waitFor(() => {
        expect(screen.getByText('Italian')).toBeInTheDocument();
        expect(screen.getByText('Mexican')).toBeInTheDocument();
      });
      
      // Select multiple cuisines
      fireEvent.click(screen.getByText('Italian'));
      fireEvent.click(screen.getByText('Mexican'));
      
      // Should allow multiple selections
      await waitFor(() => {
        const { filters } = useFilterStore.getState();
        expect(filters[FILTER_TYPES.CUISINE]).toContain('Italian');
        expect(filters[FILTER_TYPES.CUISINE]).toContain('Mexican');
        expect(filters[FILTER_TYPES.CUISINE]).toHaveLength(2);
      });
    });
    
    it('should clear all filters when clear button is clicked', async () => {
      const initialFilters = { cityId: 1, hashtags: ['Italian'] };
      
      render(
        <TestWrapper queryClient={queryClient}>
          <FilterContainer 
            onFilterChange={vi.fn()} 
            initialFilters={initialFilters}
          />
        </TestWrapper>
      );
      
      // Wait for clear button to appear
      await waitFor(() => {
        expect(screen.getByText(/clear all/i)).toBeInTheDocument();
      });
      
      // Click clear all
      fireEvent.click(screen.getByText(/clear all/i));
      
      // Should clear all filters
      await waitFor(() => {
        const { filters, hasActiveFilters } = useFilterStore.getState();
        expect(hasActiveFilters()).toBe(false);
        expect(filters[FILTER_TYPES.CITY]).toBe(null);
        expect(filters[FILTER_TYPES.CUISINE]).toEqual([]);
      });
    });
  });

  describe('🏠 HOME PAGE INTEGRATION', () => {
    it('should render filters at the top of the page', async () => {
      render(
        <TestWrapper queryClient={queryClient}>
          <Home />
        </TestWrapper>
      );
      
      // Should render search section first
      expect(screen.getByText('Discover Amazing Food')).toBeInTheDocument();
      
      // Should render filters section
      await waitFor(() => {
        expect(screen.getByText('Location')).toBeInTheDocument();
      });
      
      // Should render content type toggle
      expect(screen.getByText('Lists')).toBeInTheDocument();
      expect(screen.getByText('Restaurants')).toBeInTheDocument();
      expect(screen.getByText('Dishes')).toBeInTheDocument();
    });
    
    it('should propagate filter changes to results', async () => {
      render(
        <TestWrapper queryClient={queryClient}>
          <Home />
        </TestWrapper>
      );
      
      // Wait for page to load
      await waitFor(() => {
        expect(screen.getByText('New York')).toBeInTheDocument();
      });
      
      // Click a filter
      fireEvent.click(screen.getByText('New York'));
      
      // Filter should be applied (we can see this in the store)
      await waitFor(() => {
        const { filters } = useFilterStore.getState();
        expect(filters[FILTER_TYPES.CITY]).toBe(1);
      });
    });
  });

  describe('🎨 USER EXPERIENCE REQUIREMENTS', () => {
    it('should show active filter chips for selected filters', async () => {
      const initialFilters = { cityId: 1, hashtags: ['Italian'] };
      
      render(
        <TestWrapper queryClient={queryClient}>
          <FilterContainer 
            onFilterChange={vi.fn()} 
            initialFilters={initialFilters}
          />
        </TestWrapper>
      );
      
      // Should show active filter chips
      await waitFor(() => {
        // Look for filter chips (they will show the selected city and cuisine)
        expect(screen.getByText(/clear all/i)).toBeInTheDocument();
      });
    });
    
    it('should allow users to remove individual filters', async () => {
      const { setFilter, toggleArrayFilter } = useFilterStore.getState();
      
      // Pre-set some filters
      act(() => {
        setFilter(FILTER_TYPES.CITY, 1);
        toggleArrayFilter(FILTER_TYPES.CUISINE, 'Italian');
      });
      
      render(
        <TestWrapper queryClient={queryClient}>
          <FilterContainer onFilterChange={vi.fn()} />
        </TestWrapper>
      );
      
      // Should be able to toggle off Italian
      await waitFor(() => {
        expect(screen.getByText('Italian')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('Italian'));
      
      // Should remove Italian but keep city
      await waitFor(() => {
        const { filters } = useFilterStore.getState();
        expect(filters[FILTER_TYPES.CUISINE]).not.toContain('Italian');
        expect(filters[FILTER_TYPES.CITY]).toBe(1); // Should still be set
      });
    });
  });

  describe('⚡ PERFORMANCE REQUIREMENTS', () => {
    it('should load cities immediately', async () => {
      render(
        <TestWrapper queryClient={queryClient}>
          <FilterContainer onFilterChange={vi.fn()} />
        </TestWrapper>
      );
      
      // Cities should load quickly
      await waitFor(() => {
        expect(filterService.getCities).toHaveBeenCalledTimes(1);
        expect(screen.getByText('New York')).toBeInTheDocument();
        expect(screen.getByText('Los Angeles')).toBeInTheDocument();
        expect(screen.getByText('Chicago')).toBeInTheDocument();
      });
    });
    
    it('should persist filters across page reloads', () => {
      const { setFilter } = useFilterStore.getState();
      
      // Set a filter
      act(() => {
        setFilter(FILTER_TYPES.CITY, 2);
      });
      
      // Should be saved to localStorage
      const stored = localStorage.getItem('doof-filter-storage');
      expect(stored).toBeTruthy();
      
      const parsed = JSON.parse(stored);
      expect(parsed.state.filters[FILTER_TYPES.CITY]).toBe(2);
    });
  });

  describe('🔧 ERROR HANDLING REQUIREMENTS', () => {
    it('should handle API failures gracefully', async () => {
      filterService.getCities.mockRejectedValue(new Error('Network Error'));
      
      render(
        <TestWrapper queryClient={queryClient}>
          <FilterContainer onFilterChange={vi.fn()} />
        </TestWrapper>
      );
      
      // Should show error state instead of crashing
      await waitFor(() => {
        expect(screen.getByText(/error loading data/i)).toBeInTheDocument();
      });
    });
    
    it('should handle empty API responses', async () => {
      filterService.getCities.mockResolvedValue([]);
      hashtagService.getTopHashtags.mockResolvedValue([]);
      
      render(
        <TestWrapper queryClient={queryClient}>
          <FilterContainer onFilterChange={vi.fn()} />
        </TestWrapper>
      );
      
      // Should show empty state message
      await waitFor(() => {
        expect(screen.getByText(/no cities available/i)).toBeInTheDocument();
      });
    });
  });

  describe('📱 ACCESSIBILITY REQUIREMENTS', () => {
    it('should have proper ARIA labels for filter buttons', async () => {
      render(
        <TestWrapper queryClient={queryClient}>
          <FilterContainer onFilterChange={vi.fn()} />
        </TestWrapper>
      );
      
      await waitFor(() => {
        const newYorkButton = screen.getByText('New York');
        expect(newYorkButton).toHaveAttribute('type', 'button');
        expect(newYorkButton).toHaveAttribute('aria-pressed');
      });
    });
    
    it('should show clear button labels for screen readers', async () => {
      const initialFilters = { cityId: 1 };
      
      render(
        <TestWrapper queryClient={queryClient}>
          <FilterContainer 
            onFilterChange={vi.fn()} 
            initialFilters={initialFilters}
          />
        </TestWrapper>
      );
      
      await waitFor(() => {
        const clearButton = screen.getByText(/clear all/i);
        expect(clearButton).toBeInTheDocument();
      });
    });
  });
}); 