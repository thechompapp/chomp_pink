import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import RestaurantCard from '@/components/UI/RestaurantCard';
import DishCard from '@/components/UI/DishCard';
import ListCard from '@/components/UI/ListCard';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
    a: ({ children, ...props }) => <a {...props}>{children}</a>,
    span: ({ children, ...props }) => <span {...props}>{children}</span>,
  },
  AnimatePresence: ({ children }) => children,
}));

// Mock engagement service
vi.mock('@/services/engagementService', () => ({
  engagementService: {
    logEngagement: vi.fn()
  }
}));

// Create realistic auth store mock
const createAuthStoreMock = (state) => ({
  isAuthenticated: false,
  user: null,
  token: null,
  isSuperuser: false,
  superuserStatusReady: true,
  isLoading: false,
  error: null,
  ...state
});

let mockAuthStore = createAuthStoreMock();

vi.mock('@/stores/useAuthStore', () => ({
  default: vi.fn(() => mockAuthStore)
}));

// Test wrapper component
const TestWrapper = ({ children }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('Authentication & Card Component Integration Tests', () => {
  const mockRestaurantProps = {
    id: 1,
    name: 'Test Restaurant',
    neighborhood_name: 'Brooklyn',
    city_name: 'New York',
    tags: ['italian', 'pizza'],
    adds: 127,
    onAddToList: vi.fn(),
  };

  const mockDishProps = {
    id: 2,
    name: 'Margherita Pizza',
    restaurant: 'Test Restaurant',
    restaurant_id: 1,
    tags: ['vegetarian', 'italian'],
    adds: 89,
    onAddToList: vi.fn(),
  };

  const mockListProps = {
    id: 3,
    name: 'Best Pizza Places',
    creator_name: 'John Doe',
    creator_id: 5,
    item_count: 12,
    follower_count: 45,
    tags: ['pizza', 'nyc'],
    description: 'My favorite pizza spots in NYC',
    is_public: true,
    can_follow: true,
    onFollow: vi.fn(),
    onUnfollow: vi.fn(),
    onQuickAdd: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset to unauthenticated state
    mockAuthStore = createAuthStoreMock({
      isAuthenticated: false,
      user: null,
      isSuperuser: false
    });
  });

  describe('TDD: RestaurantCard Authentication Integration', () => {
    it('should hide Add to List button when user is not authenticated', () => {
      render(
        <TestWrapper>
          <RestaurantCard {...mockRestaurantProps} />
        </TestWrapper>
      );

      expect(screen.queryByTestId('add-to-list-button')).not.toBeInTheDocument();
    });

    it('should show Add to List button when user is authenticated', () => {
      mockAuthStore = createAuthStoreMock({
        isAuthenticated: true,
        user: { id: 1, username: 'testuser' }
      });

      render(
        <TestWrapper>
          <RestaurantCard {...mockRestaurantProps} />
        </TestWrapper>
      );

      expect(screen.getByTestId('add-to-list-button')).toBeInTheDocument();
    });

    it('should call onAddToList when authenticated user clicks Add button', async () => {
      mockAuthStore = createAuthStoreMock({
        isAuthenticated: true,
        user: { id: 1, username: 'testuser' }
      });

      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <RestaurantCard {...mockRestaurantProps} />
        </TestWrapper>
      );

      const addButton = screen.getByTestId('add-to-list-button');
      await user.click(addButton);

      expect(mockRestaurantProps.onAddToList).toHaveBeenCalledWith({
        id: 1,
        name: 'Test Restaurant',
        type: 'restaurant'
      });
    });

    it('should not show Add to List button without onAddToList handler', () => {
      mockAuthStore = createAuthStoreMock({
        isAuthenticated: true,
        user: { id: 1, username: 'testuser' }
      });

      const propsWithoutHandler = { ...mockRestaurantProps, onAddToList: null };
      
      render(
        <TestWrapper>
          <RestaurantCard {...propsWithoutHandler} />
        </TestWrapper>
      );

      expect(screen.queryByTestId('add-to-list-button')).not.toBeInTheDocument();
    });
  });

  describe('TDD: DishCard Authentication Integration', () => {
    it('should hide Add to List button when user is not authenticated', () => {
      render(
        <TestWrapper>
          <DishCard {...mockDishProps} />
        </TestWrapper>
      );

      expect(screen.queryByTestId('add-to-list-button')).not.toBeInTheDocument();
    });

    it('should show Add to List button when user is authenticated', () => {
      mockAuthStore = createAuthStoreMock({
        isAuthenticated: true,
        user: { id: 1, username: 'testuser' }
      });

      render(
        <TestWrapper>
          <DishCard {...mockDishProps} />
        </TestWrapper>
      );

      expect(screen.getByTestId('add-to-list-button')).toBeInTheDocument();
    });

    it('should call onAddToList when authenticated user clicks Add button', async () => {
      mockAuthStore = createAuthStoreMock({
        isAuthenticated: true,
        user: { id: 1, username: 'testuser' }
      });

      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DishCard {...mockDishProps} />
        </TestWrapper>
      );

      const addButton = screen.getByTestId('add-to-list-button');
      await user.click(addButton);

      expect(mockDishProps.onAddToList).toHaveBeenCalledWith({
        id: 2,
        name: 'Margherita Pizza',
        type: 'dish'
      });
    });

    it('should handle dish-specific authentication requirements', () => {
      mockAuthStore = createAuthStoreMock({
        isAuthenticated: true,
        user: { id: 1, username: 'testuser' }
      });

      render(
        <TestWrapper>
          <DishCard {...mockDishProps} />
        </TestWrapper>
      );

      // Should show dish type badge
      expect(screen.getByTestId('dish-type-badge')).toBeInTheDocument();
      expect(screen.getByText('Dish')).toBeInTheDocument();
      
      // Should show restaurant link when authenticated
      expect(screen.getByTestId('restaurant-link')).toBeInTheDocument();
    });
  });

  describe('TDD: ListCard Authentication Integration', () => {
    it('should hide Follow button when user is not authenticated', () => {
      render(
        <TestWrapper>
          <ListCard {...mockListProps} />
        </TestWrapper>
      );

      expect(screen.queryByTestId('follow-button')).not.toBeInTheDocument();
      expect(screen.queryByTestId('unfollow-button')).not.toBeInTheDocument();
    });

    it('should show Follow button when user is authenticated and can follow', () => {
      mockAuthStore = createAuthStoreMock({
        isAuthenticated: true,
        user: { id: 1, username: 'testuser' }
      });

      render(
        <TestWrapper>
          <ListCard {...mockListProps} />
        </TestWrapper>
      );

      expect(screen.getByTestId('follow-button')).toBeInTheDocument();
    });

    it('should call onFollow when authenticated user clicks Follow button', async () => {
      mockAuthStore = createAuthStoreMock({
        isAuthenticated: true,
        user: { id: 1, username: 'testuser' }
      });

      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ListCard {...mockListProps} />
        </TestWrapper>
      );

      const followButton = screen.getByTestId('follow-button');
      await user.click(followButton);

      expect(mockListProps.onFollow).toHaveBeenCalledWith(3);
    });

    it('should show Unfollow button when user is following the list', () => {
      mockAuthStore = createAuthStoreMock({
        isAuthenticated: true,
        user: { id: 1, username: 'testuser' }
      });

      const followingProps = { ...mockListProps, is_following: true };
      
      render(
        <TestWrapper>
          <ListCard {...followingProps} />
        </TestWrapper>
      );

      // The ListCard shows a follow button with different styling when following
      // It's still the same button element but with "Unfollow" functionality
      const followButton = screen.getByTestId('follow-button');
      expect(followButton).toBeInTheDocument();
      expect(followButton).toHaveAttribute('title', 'Unfollow Best Pizza Places');
      expect(followButton).toHaveAttribute('aria-label', 'Unfollow Best Pizza Places');
    });

    it('should hide follow functionality for own lists', () => {
      mockAuthStore = createAuthStoreMock({
        isAuthenticated: true,
        user: { id: 5, username: 'testuser' } // Same as creator_id
      });

      const ownListProps = { ...mockListProps, created_by_user: true };
      
      render(
        <TestWrapper>
          <ListCard {...ownListProps} />
        </TestWrapper>
      );

      expect(screen.queryByTestId('follow-button')).not.toBeInTheDocument();
      expect(screen.queryByTestId('unfollow-button')).not.toBeInTheDocument();
    });

    it('should hide Quick Add button when user is not authenticated', () => {
      render(
        <TestWrapper>
          <ListCard {...mockListProps} />
        </TestWrapper>
      );

      expect(screen.queryByTestId('quick-add-button')).not.toBeInTheDocument();
    });

    it('should show Quick Add button when user is authenticated', () => {
      mockAuthStore = createAuthStoreMock({
        isAuthenticated: true,
        user: { id: 1, username: 'testuser' }
      });

      render(
        <TestWrapper>
          <ListCard {...mockListProps} />
        </TestWrapper>
      );

      expect(screen.getByTestId('quick-add-button')).toBeInTheDocument();
    });
  });

  describe('TDD: Cross-Component Authentication Consistency', () => {
    it('should apply consistent authentication behavior across all card types', () => {
      mockAuthStore = createAuthStoreMock({
        isAuthenticated: true,
        user: { id: 1, username: 'testuser' }
      });

      const { container } = render(
        <TestWrapper>
          <div>
            <RestaurantCard {...mockRestaurantProps} />
            <DishCard {...mockDishProps} />
            <ListCard {...mockListProps} />
          </div>
        </TestWrapper>
      );

      // All cards should show their respective authenticated features
      expect(screen.getAllByTestId('add-to-list-button')).toHaveLength(2); // RestaurantCard + DishCard
      expect(screen.getByTestId('follow-button')).toBeInTheDocument(); // From ListCard
      expect(screen.getByTestId('quick-add-button')).toBeInTheDocument(); // From ListCard
    });

    it('should hide all authentication-dependent features when not authenticated', () => {
      // Explicitly unauthenticated
      mockAuthStore = createAuthStoreMock({
        isAuthenticated: false,
        user: null
      });

      render(
        <TestWrapper>
          <div>
            <RestaurantCard {...mockRestaurantProps} />
            <DishCard {...mockDishProps} />
            <ListCard {...mockListProps} />
          </div>
        </TestWrapper>
      );

      // No authentication-dependent features should be visible
      expect(screen.queryByTestId('add-to-list-button')).not.toBeInTheDocument();
      expect(screen.queryByTestId('follow-button')).not.toBeInTheDocument();
      expect(screen.queryByTestId('unfollow-button')).not.toBeInTheDocument();
      expect(screen.queryByTestId('quick-add-button')).not.toBeInTheDocument();
    });

    it('should handle authentication state changes across all components', () => {
      // Start with unauthenticated state
      const { rerender } = render(
        <TestWrapper>
          <div>
            <RestaurantCard {...mockRestaurantProps} />
            <DishCard {...mockDishProps} />
            <ListCard {...mockListProps} />
          </div>
        </TestWrapper>
      );

      // Initially unauthenticated - no interactive elements
      expect(screen.queryByTestId('add-to-list-button')).not.toBeInTheDocument();
      expect(screen.queryByTestId('follow-button')).not.toBeInTheDocument();

      // Update the mock store state and re-render with new props that will trigger the useAuthStore hook
      mockAuthStore = createAuthStoreMock({
        isAuthenticated: true,
        user: { id: 1, username: 'testuser' }
      });

      // Force a fresh render by changing a prop to trigger re-evaluation
      const authenticatedRestaurantProps = { ...mockRestaurantProps, className: 'authenticated' };
      const authenticatedDishProps = { ...mockDishProps, className: 'authenticated' };  
      const authenticatedListProps = { ...mockListProps, className: 'authenticated' };

      rerender(
        <TestWrapper>
          <div>
            <RestaurantCard {...authenticatedRestaurantProps} />
            <DishCard {...authenticatedDishProps} />
            <ListCard {...authenticatedListProps} />
          </div>
        </TestWrapper>
      );

      // Now all interactive elements should be visible
      expect(screen.getAllByTestId('add-to-list-button')).toHaveLength(2);
      expect(screen.getByTestId('follow-button')).toBeInTheDocument();
      expect(screen.getByTestId('quick-add-button')).toBeInTheDocument();
    });
  });

  describe('TDD: Authentication Error Scenarios', () => {
    it('should handle authentication loading state gracefully', () => {
      mockAuthStore = createAuthStoreMock({
        isAuthenticated: false,
        isLoading: true,
        user: null
      });

      render(
        <TestWrapper>
          <div>
            <RestaurantCard {...mockRestaurantProps} />
            <DishCard {...mockDishProps} />
            <ListCard {...mockListProps} />
          </div>
        </TestWrapper>
      );

      // Should not show interactive elements during loading
      expect(screen.queryByTestId('add-to-list-button')).not.toBeInTheDocument();
      expect(screen.queryByTestId('follow-button')).not.toBeInTheDocument();
    });

    it('should handle authentication errors without breaking UI', () => {
      mockAuthStore = createAuthStoreMock({
        isAuthenticated: false,
        error: 'Authentication failed',
        user: null
      });

      render(
        <TestWrapper>
          <div>
            <RestaurantCard {...mockRestaurantProps} />
            <DishCard {...mockDishProps} />
            <ListCard {...mockListProps} />
          </div>
        </TestWrapper>
      );

      // Cards should still render properly despite auth error
      expect(screen.getByText('Test Restaurant')).toBeInTheDocument();
      expect(screen.getByText('Margherita Pizza')).toBeInTheDocument();
      expect(screen.getByText('Best Pizza Places')).toBeInTheDocument();
      
      // But no interactive elements should be shown
      expect(screen.queryByTestId('add-to-list-button')).not.toBeInTheDocument();
      expect(screen.queryByTestId('follow-button')).not.toBeInTheDocument();
    });

    it('should handle inconsistent authentication state', () => {
      mockAuthStore = createAuthStoreMock({
        isAuthenticated: true,
        user: null, // Inconsistent: authenticated but no user
        token: 'some-token'
      });

      render(
        <TestWrapper>
          <div>
            <RestaurantCard {...mockRestaurantProps} />
            <DishCard {...mockDishProps} />
            <ListCard {...mockListProps} />
          </div>
        </TestWrapper>
      );

      // Should still show interactive elements if isAuthenticated is true
      expect(screen.getAllByTestId('add-to-list-button')).toHaveLength(2);
      expect(screen.getByTestId('follow-button')).toBeInTheDocument();
    });
  });

  describe('TDD: Permission-Based Feature Access', () => {
    it('should show standard features for regular authenticated users', () => {
      mockAuthStore = createAuthStoreMock({
        isAuthenticated: true,
        user: { id: 1, username: 'regularuser' },
        isSuperuser: false
      });

      render(
        <TestWrapper>
          <div>
            <RestaurantCard {...mockRestaurantProps} />
            <DishCard {...mockDishProps} />
            <ListCard {...mockListProps} />
          </div>
        </TestWrapper>
      );

      // Regular users should have access to basic features
      expect(screen.getAllByTestId('add-to-list-button')).toHaveLength(2);
      expect(screen.getByTestId('follow-button')).toBeInTheDocument();
      expect(screen.getByTestId('quick-add-button')).toBeInTheDocument();
    });

    it('should show all features for superuser accounts', () => {
      mockAuthStore = createAuthStoreMock({
        isAuthenticated: true,
        user: { 
          id: 1, 
          username: 'admin',
          account_type: 'superuser'
        },
        isSuperuser: true
      });

      render(
        <TestWrapper>
          <div>
            <RestaurantCard {...mockRestaurantProps} />
            <DishCard {...mockDishProps} />
            <ListCard {...mockListProps} />
          </div>
        </TestWrapper>
      );

      // Superusers should have access to all features
      expect(screen.getAllByTestId('add-to-list-button')).toHaveLength(2);
      expect(screen.getByTestId('follow-button')).toBeInTheDocument();
      expect(screen.getByTestId('quick-add-button')).toBeInTheDocument();
      // Note: Bulk add and admin features would be tested in admin-specific routes
    });
  });

  describe('TDD: Event Handling with Authentication', () => {
    it('should prevent event bubbling on authenticated actions', async () => {
      mockAuthStore = createAuthStoreMock({
        isAuthenticated: true,
        user: { id: 1, username: 'testuser' }
      });

      const mockCardClick = vi.fn();
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <div onClick={mockCardClick}>
            <RestaurantCard {...mockRestaurantProps} />
          </div>
        </TestWrapper>
      );

      const addButton = screen.getByTestId('add-to-list-button');
      await user.click(addButton);

      // Add button should have been called
      expect(mockRestaurantProps.onAddToList).toHaveBeenCalledTimes(1);
      
      // Card click should not have been triggered (event propagation stopped)
      expect(mockCardClick).not.toHaveBeenCalled();
    });

    it('should handle rapid clicks on authentication-protected elements', async () => {
      mockAuthStore = createAuthStoreMock({
        isAuthenticated: true,
        user: { id: 1, username: 'testuser' }
      });

      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <RestaurantCard {...mockRestaurantProps} />
        </TestWrapper>
      );

      const addButton = screen.getByTestId('add-to-list-button');
      
      // Rapid clicks
      await user.click(addButton);
      await user.click(addButton);
      await user.click(addButton);

      // Should be called multiple times if no rate limiting
      expect(mockRestaurantProps.onAddToList).toHaveBeenCalledTimes(3);
    });
  });
}); 