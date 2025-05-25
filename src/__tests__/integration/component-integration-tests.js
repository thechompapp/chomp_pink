/**
 * Component Integration Tests
 * 
 * Tests the integration between React components and hooks,
 * ensuring proper data flow, state management, and user interactions.
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Import components to test
import AddToListModal from '../src/components/AddToListModal.jsx';
import FilterPanel from '../src/components/FilterPanel.jsx';
import FloatingQuickAdd from '../src/components/FloatingQuickAdd.jsx';
import BulkAddProcessor from '../src/components/BulkAdd/BulkAddProcessor.jsx';

// Mock services
jest.mock('../src/services/listService.js');
jest.mock('../src/services/placeService.js');
jest.mock('../src/services/authService.js');

import { listService } from '../src/services/listService.js';
import { placeService } from '../src/services/placeService.js';
import { authService } from '../src/services/authService.js';

// Mock contexts
const MockAuthContext = React.createContext({
  user: { id: 'user-1', email: 'test@example.com' },
  isAuthenticated: true
});

const MockListContext = React.createContext({
  currentList: { id: 'list-1', name: 'Test List' },
  updateList: jest.fn()
});

describe('Component Integration Tests', () => {
  let queryClient;
  let user;

  const TestWrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      <MockAuthContext.Provider value={{
        user: { id: 'user-1', email: 'test@example.com' },
        isAuthenticated: true
      }}>
        <MockListContext.Provider value={{
          currentList: { id: 'list-1', name: 'Test List' },
          updateList: jest.fn()
        }}>
          {children}
        </MockListContext.Provider>
      </MockAuthContext.Provider>
    </QueryClientProvider>
  );

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    user = userEvent.setup();
    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('AddToListModal Integration', () => {
    test('should integrate search functionality with list operations', async () => {
      // Mock search results
      placeService.searchPlaces.mockResolvedValue([
        { id: 'place-1', name: 'Pizza Palace', address: '123 Main St' },
        { id: 'place-2', name: 'Burger Joint', address: '456 Oak Ave' }
      ]);

      // Mock list operations
      listService.getUserLists.mockResolvedValue([
        { id: 'list-1', name: 'Favorites' },
        { id: 'list-2', name: 'Weekend Plans' }
      ]);
      listService.addItemToList.mockResolvedValue({ success: true });

      render(
        <TestWrapper>
          <AddToListModal isOpen={true} onClose={jest.fn()} />
        </TestWrapper>
      );

      // Test search functionality
      const searchInput = screen.getByPlaceholderText(/search/i);
      await user.type(searchInput, 'pizza');

      await waitFor(() => {
        expect(placeService.searchPlaces).toHaveBeenCalledWith('pizza');
      });

      // Verify search results display
      await waitFor(() => {
        expect(screen.getByText('Pizza Palace')).toBeInTheDocument();
        expect(screen.getByText('123 Main St')).toBeInTheDocument();
      });

      // Test adding to list
      const addButton = screen.getByRole('button', { name: /add to list/i });
      await user.click(addButton);

      // Select a list
      const listSelector = screen.getByRole('combobox');
      await user.click(listSelector);
      await user.click(screen.getByText('Favorites'));

      // Confirm addition
      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(listService.addItemToList).toHaveBeenCalledWith('list-1', {
          placeId: 'place-1',
          name: 'Pizza Palace',
          address: '123 Main St'
        });
      });
    });

    test('should handle search errors gracefully', async () => {
      placeService.searchPlaces.mockRejectedValue(new Error('Search failed'));

      render(
        <TestWrapper>
          <AddToListModal isOpen={true} onClose={jest.fn()} />
        </TestWrapper>
      );

      const searchInput = screen.getByPlaceholderText(/search/i);
      await user.type(searchInput, 'pizza');

      await waitFor(() => {
        expect(screen.getByText(/search failed/i)).toBeInTheDocument();
      });

      // Component should still be functional
      expect(searchInput).toBeEnabled();
    });
  });

  describe('FilterPanel Integration', () => {
    test('should coordinate multiple filter types with search results', async () => {
      const mockRestaurants = [
        { id: 'r1', name: 'Pizza Place', cuisine: 'Italian', rating: 4.5, price: '$$' },
        { id: 'r2', name: 'Sushi Bar', cuisine: 'Japanese', rating: 4.8, price: '$$$' },
        { id: 'r3', name: 'Taco Stand', cuisine: 'Mexican', rating: 4.0, price: '$' }
      ];

      placeService.searchPlaces.mockResolvedValue(mockRestaurants);

      const onFiltersChange = jest.fn();

      render(
        <TestWrapper>
          <FilterPanel 
            restaurants={mockRestaurants}
            onFiltersChange={onFiltersChange}
          />
        </TestWrapper>
      );

      // Test cuisine filter
      const cuisineFilter = screen.getByLabelText(/cuisine/i);
      await user.selectOptions(cuisineFilter, 'Italian');

      expect(onFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({
          cuisine: 'Italian'
        })
      );

      // Test rating filter
      const ratingSlider = screen.getByRole('slider', { name: /rating/i });
      fireEvent.change(ratingSlider, { target: { value: '4.5' } });

      expect(onFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({
          minRating: 4.5
        })
      );

      // Test price filter
      const priceFilter = screen.getByLabelText(/price/i);
      await user.click(within(priceFilter).getByText('$$'));

      expect(onFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({
          priceRange: '$$'
        })
      );
    });

    test('should handle filter combinations correctly', async () => {
      const mockRestaurants = [
        { id: 'r1', name: 'Pizza Place', cuisine: 'Italian', rating: 4.5, price: '$$' },
        { id: 'r2', name: 'Pasta House', cuisine: 'Italian', rating: 4.2, price: '$$$' },
        { id: 'r3', name: 'Sushi Bar', cuisine: 'Japanese', rating: 4.8, price: '$$$' }
      ];

      const onFiltersChange = jest.fn();

      render(
        <TestWrapper>
          <FilterPanel 
            restaurants={mockRestaurants}
            onFiltersChange={onFiltersChange}
          />
        </TestWrapper>
      );

      // Apply multiple filters
      const cuisineFilter = screen.getByLabelText(/cuisine/i);
      await user.selectOptions(cuisineFilter, 'Italian');

      const ratingSlider = screen.getByRole('slider', { name: /rating/i });
      fireEvent.change(ratingSlider, { target: { value: '4.3' } });

      // Should filter to only high-rated Italian restaurants
      await waitFor(() => {
        expect(onFiltersChange).toHaveBeenLastCalledWith(
          expect.objectContaining({
            cuisine: 'Italian',
            minRating: 4.3
          })
        );
      });
    });
  });

  describe('FloatingQuickAdd Integration', () => {
    test('should integrate with bulk add processor for quick restaurant addition', async () => {
      placeService.searchPlaces.mockResolvedValue([
        { id: 'place-1', name: 'Quick Pizza', address: '789 Fast St' }
      ]);
      listService.addItemToList.mockResolvedValue({ success: true });

      render(
        <TestWrapper>
          <FloatingQuickAdd />
        </TestWrapper>
      );

      // Test quick add input
      const quickInput = screen.getByPlaceholderText(/quick add/i);
      await user.type(quickInput, 'Quick Pizza, 789 Fast St');

      // Submit quick add
      const addButton = screen.getByRole('button', { name: /add/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(placeService.searchPlaces).toHaveBeenCalledWith('Quick Pizza, 789 Fast St');
      });

      // Should show confirmation UI
      await waitFor(() => {
        expect(screen.getByText(/added successfully/i)).toBeInTheDocument();
      });
    });

    test('should handle ambiguous entries with user selection', async () => {
      // Mock multiple matches
      placeService.searchPlaces.mockResolvedValue([
        { id: 'place-1', name: 'Pizza Palace', address: '123 Main St' },
        { id: 'place-2', name: 'Pizza Paradise', address: '456 Oak Ave' }
      ]);

      render(
        <TestWrapper>
          <FloatingQuickAdd />
        </TestWrapper>
      );

      const quickInput = screen.getByPlaceholderText(/quick add/i);
      await user.type(quickInput, 'Pizza Place');

      const addButton = screen.getByRole('button', { name: /add/i });
      await user.click(addButton);

      // Should show disambiguation UI
      await waitFor(() => {
        expect(screen.getByText(/multiple matches found/i)).toBeInTheDocument();
        expect(screen.getByText('Pizza Palace')).toBeInTheDocument();
        expect(screen.getByText('Pizza Paradise')).toBeInTheDocument();
      });

      // User selects one option
      const selectButton = screen.getAllByRole('button', { name: /select/i })[0];
      await user.click(selectButton);

      await waitFor(() => {
        expect(listService.addItemToList).toHaveBeenCalledWith('list-1', {
          placeId: 'place-1',
          name: 'Pizza Palace',
          address: '123 Main St'
        });
      });
    });
  });

  describe('BulkAddProcessor Integration', () => {
    test('should process multiple restaurants with progress tracking', async () => {
      const restaurantList = [
        'Pizza Palace, 123 Main St',
        'Burger Joint, 456 Oak Ave',
        'Sushi Bar, 789 Pine Rd'
      ];

      // Mock responses for each restaurant
      placeService.searchPlaces
        .mockResolvedValueOnce([{ id: 'place-1', name: 'Pizza Palace' }])
        .mockResolvedValueOnce([{ id: 'place-2', name: 'Burger Joint' }])
        .mockResolvedValueOnce([{ id: 'place-3', name: 'Sushi Bar' }]);

      listService.addItemToList.mockResolvedValue({ success: true });

      render(
        <TestWrapper>
          <BulkAddProcessor restaurantList={restaurantList} listId="list-1" />
        </TestWrapper>
      );

      const processButton = screen.getByRole('button', { name: /process/i });
      await user.click(processButton);

      // Should show progress indicators
      await waitFor(() => {
        expect(screen.getByText(/processing/i)).toBeInTheDocument();
      });

      // Should show progress for each item
      await waitFor(() => {
        expect(screen.getByText('Pizza Palace')).toBeInTheDocument();
        expect(screen.getByText('Burger Joint')).toBeInTheDocument();
        expect(screen.getByText('Sushi Bar')).toBeInTheDocument();
      });

      // Should complete processing
      await waitFor(() => {
        expect(screen.getByText(/completed/i)).toBeInTheDocument();
        expect(screen.getByText(/3 items added/i)).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    test('should handle partial failures in bulk processing', async () => {
      const restaurantList = [
        'Valid Restaurant, 123 Main St',
        'Invalid Entry',
        'Another Valid Place, 789 Pine Rd'
      ];

      placeService.searchPlaces
        .mockResolvedValueOnce([{ id: 'place-1', name: 'Valid Restaurant' }])
        .mockRejectedValueOnce(new Error('Not found'))
        .mockResolvedValueOnce([{ id: 'place-3', name: 'Another Valid Place' }]);

      listService.addItemToList.mockResolvedValue({ success: true });

      render(
        <TestWrapper>
          <BulkAddProcessor restaurantList={restaurantList} listId="list-1" />
        </TestWrapper>
      );

      const processButton = screen.getByRole('button', { name: /process/i });
      await user.click(processButton);

      await waitFor(() => {
        expect(screen.getByText(/2 items added/i)).toBeInTheDocument();
        expect(screen.getByText(/1 error/i)).toBeInTheDocument();
      }, { timeout: 5000 });

      // Should show error details
      expect(screen.getByText('Invalid Entry')).toBeInTheDocument();
      expect(screen.getByText(/not found/i)).toBeInTheDocument();
    });
  });

  describe('Cross-Component State Management', () => {
    test('should coordinate state between multiple components', async () => {
      const MockApp = () => {
        const [selectedList, setSelectedList] = React.useState('list-1');
        const [filters, setFilters] = React.useState({});

        return (
          <div>
            <FilterPanel onFiltersChange={setFilters} />
            <AddToListModal 
              isOpen={true} 
              onClose={jest.fn()} 
              selectedList={selectedList}
              filters={filters}
            />
          </div>
        );
      };

      placeService.searchPlaces.mockResolvedValue([
        { id: 'place-1', name: 'Test Restaurant', cuisine: 'Italian' }
      ]);

      render(
        <TestWrapper>
          <MockApp />
        </TestWrapper>
      );

      // Apply filter in FilterPanel
      const cuisineFilter = screen.getByLabelText(/cuisine/i);
      await user.selectOptions(cuisineFilter, 'Italian');

      // Search in AddToListModal should respect filters
      const searchInput = screen.getByPlaceholderText(/search/i);
      await user.type(searchInput, 'restaurant');

      await waitFor(() => {
        expect(placeService.searchPlaces).toHaveBeenCalledWith(
          'restaurant',
          expect.objectContaining({ cuisine: 'Italian' })
        );
      });
    });
  });
}); 