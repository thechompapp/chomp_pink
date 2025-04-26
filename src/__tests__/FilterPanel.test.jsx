/* src/__tests__/FilterPanel.test.jsx */
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import FilterPanel from '@/components/FilterPanel';
import filterService from '@/services/filterService';

jest.mock('@/services/filterService');

const queryClient = new QueryClient();

const mockOnFiltersChange = jest.fn();

const defaultProps = {
  cityId: null,
  boroughId: null,
  neighborhoodId: null,
  hashtags: [],
  onFiltersChange: mockOnFiltersChange,
};

const mockCities = [
  { id: 1, name: 'New York' },
  { id: 2, name: 'Los Angeles' },
];

const mockBoroughs = [
  { id: 101, name: 'Manhattan' },
  { id: 102, name: 'Brooklyn' },
];

describe('FilterPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    filterService.getCities.mockResolvedValue(mockCities);
    filterService.getNeighborhoods.mockImplementation((id) => {
      if (id === 1) return Promise.resolve(mockBoroughs);
      return Promise.resolve([]);
    });
  });

  it('renders correctly and shows cities', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <FilterPanel {...defaultProps} />
      </QueryClientProvider>
    );

    expect(screen.getByText('Filter by Location')).toBeInTheDocument();
    expect(await screen.findByText('New York')).toBeInTheDocument();
    expect(screen.getByText('Los Angeles')).toBeInTheDocument();
  });

  it('toggles location section', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <FilterPanel {...defaultProps} />
      </QueryClientProvider>
    );

    const toggleButton = screen.getByText('Filter by Location');
    fireEvent.click(toggleButton);
    expect(screen.queryByText('New York')).not.toBeInTheDocument();
    fireEvent.click(toggleButton);
    expect(await screen.findByText('New York')).toBeInTheDocument();
  });

  it('selects a city and shows boroughs', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <FilterPanel {...defaultProps} />
      </QueryClientProvider>
    );

    const cityButton = await screen.findByText('New York');
    fireEvent.click(cityButton);
    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      cityId: 1,
      boroughId: null,
      neighborhoodId: null,
      hashtags: [],
    });
    expect(await screen.findByText('Manhattan')).toBeInTheDocument();
  });
});