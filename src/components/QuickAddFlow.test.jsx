// src/components/QuickAddFlow.test.jsx
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- Context Provider ---
import { QuickAddProvider } from '@/context/QuickAddContext';

// --- Components Involved ---
import QuickAddPopup from '@/components/QuickAddPopup';
import RestaurantCard from '@/components/UI/RestaurantCard';

// --- Mock Stores ---
const mockAddToList = vi.fn();
const mockFetchUserLists = vi.fn();
const mockClearError = vi.fn(); // Mock clearError as well
let mockUserLists = [];
let mockIsLoadingUser = false;
let mockErrorUser = null; // Our controllable error state

// Helper function to return the current mock state
const mockUserListStoreState = () => ({
    userLists: mockUserLists,
    addToList: mockAddToList,
    isLoadingUser: mockIsLoadingUser,
    error: mockErrorUser,
    isAddingToList: false,
    fetchUserLists: mockFetchUserLists,
    clearError: mockClearError,
    // Add any other state properties accessed via selectors if needed
});

vi.mock('@/stores/useUserListStore', () => ({
  // Mock the default export (the hook)
  default: (selector) => selector(mockUserListStoreState()),
  // --- ADDED getState mock ---
  // Mock getState to return the current error state (and potentially others if needed)
  getState: () => ({
      error: mockErrorUser,
      // Include other state properties if getState() is used to access them elsewhere
  })
  // --- End ADDED getState mock ---
}));

let mockIsAuthenticated = true;

vi.mock('@/stores/useAuthStore', () => ({
  default: () => ({
    isAuthenticated: mockIsAuthenticated,
    user: { id: 1, username: 'testuser' },
    isLoading: false,
    error: null,
  }),
}));
// --- End Mock Stores ---

// Test Query Client
const testQueryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
});

// Helper to render with all necessary providers
const renderWithProviders = (ui) => {
    return render(
        <QueryClientProvider client={testQueryClient}>
            <BrowserRouter>
                <QuickAddProvider>
                    <QuickAddPopup />
                    {ui}
                </QuickAddProvider>
            </BrowserRouter>
        </QueryClientProvider>
    );
};

describe('Quick Add Flow Integration Test', () => {

    const sampleRestaurant = {
        id: 101, name: "Testaurant", neighborhood: "Testville",
        city: "Testopolis", tags: ["test", "mock"], type: "restaurant", adds: 5,
    };

    const sampleListsData = [
        { id: 1, name: "My Favourites List", item_count: 5 },
        { id: 2, name: "Want To Try List", item_count: 10 },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        mockIsAuthenticated = true;
        mockUserLists = [...sampleListsData];
        mockIsLoadingUser = false;
        mockErrorUser = null; // Reset mock error state
        mockAddToList.mockReset().mockResolvedValue({ success: true });
        mockFetchUserLists.mockReset().mockResolvedValue([...sampleListsData]);
        mockClearError.mockReset();
        testQueryClient.clear();
    });

    it('should open QuickAddPopup when "+" button is clicked on RestaurantCard', async () => {
        const user = userEvent.setup();
        renderWithProviders(<RestaurantCard {...sampleRestaurant} />);

        const addButton = screen.getByLabelText(`Add restaurant ${sampleRestaurant.name} to list`);
        await user.click(addButton);

        expect(await screen.findByRole('heading', { name: `Add "${sampleRestaurant.name}" to a List` })).toBeInTheDocument();
        expect(await screen.findByText(sampleListsData[0].name)).toBeInTheDocument();
    });

    it('should show login prompt in popup if user is not authenticated', async () => {
        const user = userEvent.setup();
        mockIsAuthenticated = false;
        renderWithProviders(<RestaurantCard {...sampleRestaurant} />);

        await user.click(screen.getByLabelText(`Add restaurant ${sampleRestaurant.name} to list`));

        expect(await screen.findByRole('heading', { name: `Add "${sampleRestaurant.name}" to a List` })).toBeInTheDocument();
        expect(screen.getByText(/please log in to add items to your lists/i)).toBeInTheDocument();
    });

     it('should display "no lists" message if user has no lists', async () => {
        const user = userEvent.setup();
        mockUserLists = [];
        mockFetchUserLists.mockResolvedValue([]);

        renderWithProviders(<RestaurantCard {...sampleRestaurant} />);

        await user.click(screen.getByLabelText(`Add restaurant ${sampleRestaurant.name} to list`));

        expect(await screen.findByRole('heading', { name: `Add "${sampleRestaurant.name}" to a List` })).toBeInTheDocument();
        expect(await screen.findByText(/you haven't created any lists yet/i)).toBeInTheDocument();
     });

      it('should call addToList action with correct params when list selected and submitted', async () => {
          const user = userEvent.setup();
          renderWithProviders(<RestaurantCard {...sampleRestaurant} />);

          await user.click(screen.getByLabelText(`Add restaurant ${sampleRestaurant.name} to list`));
          expect(await screen.findByRole('heading', { name: `Add "${sampleRestaurant.name}" to a List` })).toBeInTheDocument();

          const listButton = await screen.findByRole('button', { name: sampleListsData[1].name });
          await user.click(listButton);

          const submitButton = screen.getByRole('button', { name: /add to list/i });
          await user.click(submitButton);

          expect(mockAddToList).toHaveBeenCalledTimes(1);
          expect(mockAddToList).toHaveBeenCalledWith({
              item: { id: sampleRestaurant.id, type: sampleRestaurant.type },
              listId: sampleListsData[1].id
          });

           await waitFor(() => {
               const updatedListButton = screen.getByRole('button', { name: sampleListsData[1].name });
               expect(updatedListButton.querySelector('svg.text-green-500')).toBeInTheDocument();
           });
      });

       it('should display store error message if addToList action fails', async () => {
          const user = userEvent.setup();
          const errorMessage = "Network Error - Failed to add";
          // Simulate action failure AND set the mock error state for getState()
          mockAddToList.mockRejectedValue(new Error(errorMessage));
          mockErrorUser = errorMessage; // Set the error state for getState().error

          renderWithProviders(<RestaurantCard {...sampleRestaurant} />);

          await user.click(screen.getByLabelText(`Add restaurant ${sampleRestaurant.name} to list`));
          expect(await screen.findByRole('heading', { name: `Add "${sampleRestaurant.name}" to a List` })).toBeInTheDocument();

          const listButton = await screen.findByText(sampleListsData[0].name);
          await user.click(listButton);

          const submitButton = screen.getByRole('button', { name: /add to list/i });
          // Click submit - addToList will reject, error state is set
          await user.click(submitButton);

          // Check if the error message (now read correctly via getState) is displayed
          await waitFor(() => {
              expect(screen.getByText(errorMessage)).toBeInTheDocument();
          });
           expect(mockAddToList).toHaveBeenCalledTimes(1);
       });

});