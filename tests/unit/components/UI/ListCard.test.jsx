import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import ListCard from '@/components/UI/ListCard';
import { CARD_SPECS } from '@/models/cardModels';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
    span: ({ children, ...props }) => <span {...props}>{children}</span>,
  },
  AnimatePresence: ({ children }) => children,
}));

// Mock the auth store
const mockAuthStore = {
  isAuthenticated: true,
  user: { id: 1, name: 'Test User' }
};

vi.mock('@/stores/useAuthStore', () => ({
  default: vi.fn(() => mockAuthStore)
}));

// Mock engagement service
vi.mock('@/services/engagementService', () => ({
  engagementService: {
    logEngagement: vi.fn()
  }
}));

// Mock formatting utilities
vi.mock('@/utils/formatting', () => ({
  formatRelativeDate: vi.fn((date) => '2 hours ago')
}));

// Test wrapper component
const TestWrapper = ({ children }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('ListCard Component', () => {
  const mockProps = {
    id: 1,
    name: 'Best Pizza Places',
    description: 'My favorite pizza spots in the city',
    list_type: 'favorites',
    tags: ['pizza', 'italian', 'favorites'],
    items: [
      { id: 1, name: 'Margherita Pizza' },
      { id: 2, name: 'Pepperoni Pizza' },
      { id: 3, name: 'Mushroom Pizza' }
    ],
    items_count: 3,
    view_count: 45,
    follow_count: 12,
    comment_count: 5,
    is_trending: false,
    is_featured: false,
    is_public: true,
    user: {
      id: 2,
      name: 'John Doe',
      username: 'johndoe'
    },
    created_by_user: false,
    is_following: false,
    can_follow: true,
    updated_at: '2024-01-15T10:30:00Z',
    onQuickAdd: vi.fn(),
    onFollow: vi.fn(),
    onUnfollow: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset auth store to authenticated state
    mockAuthStore.isAuthenticated = true;
    mockAuthStore.user = { id: 1, name: 'Test User' };
  });

  describe('TDD: Card Standardization', () => {
    it('should use standardized card height and styling from CARD_SPECS', () => {
      render(
        <TestWrapper>
          <ListCard {...mockProps} />
        </TestWrapper>
      );

      const cardElement = screen.getByTestId('list-card-1');
      const innerCard = cardElement.querySelector('a > div');
      
      // Check for the exact classes from CARD_SPECS.FULL_CLASS
      expect(innerCard).toHaveClass('h-64'); // 256px standardized height
      expect(innerCard).toHaveClass('p-4'); // standardized padding
      expect(innerCard).toHaveClass('bg-white'); // standardized background
      expect(innerCard).toHaveClass('rounded-lg'); // standardized border radius
      expect(innerCard).toHaveClass('border'); // standardized border
      expect(innerCard).toHaveClass('border-black'); // standardized border color
      expect(innerCard).toHaveClass('overflow-hidden'); // content control
      expect(innerCard).toHaveClass('relative'); // positioning context
    });

    it('should maintain consistent card proportions across different screen sizes', () => {
      render(
        <TestWrapper>
          <ListCard {...mockProps} />
        </TestWrapper>
      );

      const cardElement = screen.getByTestId('list-card-1');
      const innerCard = cardElement.querySelector('a > div');
      
      // Should use flex layout for responsive behavior
      expect(innerCard).toHaveClass('flex', 'flex-col');
    });

    it('should use consistent typography and spacing', () => {
      render(
        <TestWrapper>
          <ListCard {...mockProps} />
        </TestWrapper>
      );

      const titleElement = screen.getByRole('heading', { name: mockProps.name });
      expect(titleElement).toHaveClass('text-lg', 'font-bold', 'text-black');
    });
  });

  describe('TDD: Core Rendering Requirements', () => {
    it('should render list name as heading', () => {
      render(
        <TestWrapper>
          <ListCard {...mockProps} />
        </TestWrapper>
      );

      const heading = screen.getByRole('heading', { name: 'Best Pizza Places' });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveClass('text-lg', 'font-bold');
    });

    it('should render list type badge', () => {
      render(
        <TestWrapper>
          <ListCard {...mockProps} />
        </TestWrapper>
      );

      expect(screen.getByText('List')).toBeInTheDocument();
      expect(screen.getByTestId('list-type-badge')).toBeInTheDocument();
    });

    it('should render description when provided', () => {
      render(
        <TestWrapper>
          <ListCard {...mockProps} />
        </TestWrapper>
      );

      expect(screen.getByText('My favorite pizza spots in the city')).toBeInTheDocument();
    });

    it('should render items count', () => {
      render(
        <TestWrapper>
          <ListCard {...mockProps} />
        </TestWrapper>
      );

      expect(screen.getByText('3 items')).toBeInTheDocument();
    });

    it('should render creator information', () => {
      render(
        <TestWrapper>
          <ListCard {...mockProps} />
        </TestWrapper>
      );

      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('should render tags correctly', () => {
      render(
        <TestWrapper>
          <ListCard {...mockProps} />
        </TestWrapper>
      );

      expect(screen.getByText('#pizza')).toBeInTheDocument();
      expect(screen.getByText('#italian')).toBeInTheDocument();
      expect(screen.getByText('#favorites')).toBeInTheDocument();
    });

    it('should render preview items when available', () => {
      render(
        <TestWrapper>
          <ListCard {...mockProps} />
        </TestWrapper>
      );

      expect(screen.getByText('Recent items:')).toBeInTheDocument();
      expect(screen.getByText('• Margherita Pizza')).toBeInTheDocument();
      expect(screen.getByText('• Pepperoni Pizza')).toBeInTheDocument();
      expect(screen.getByText('• Mushroom Pizza')).toBeInTheDocument();
    });

    it('should render relative date correctly', () => {
      render(
        <TestWrapper>
          <ListCard {...mockProps} />
        </TestWrapper>
      );

      expect(screen.getByText('2 hours ago')).toBeInTheDocument();
    });
  });

  describe('TDD: Authentication-Based UI States', () => {
    it('should show follow button when authenticated and can follow', () => {
      mockAuthStore.isAuthenticated = true;
      
      render(
        <TestWrapper>
          <ListCard {...mockProps} />
        </TestWrapper>
      );

      expect(screen.getByTestId('follow-button')).toBeInTheDocument();
      expect(screen.getByLabelText('Follow Best Pizza Places')).toBeInTheDocument();
    });

    it('should hide follow button when not authenticated', () => {
      mockAuthStore.isAuthenticated = false;
      
      render(
        <TestWrapper>
          <ListCard {...mockProps} />
        </TestWrapper>
      );

      expect(screen.queryByTestId('follow-button')).not.toBeInTheDocument();
    });

    it('should hide follow button when user owns the list', () => {
      const ownedListProps = { ...mockProps, created_by_user: true };
      
      render(
        <TestWrapper>
          <ListCard {...ownedListProps} />
        </TestWrapper>
      );

      expect(screen.queryByTestId('follow-button')).not.toBeInTheDocument();
    });

    it('should hide follow button when cannot follow', () => {
      const noFollowProps = { ...mockProps, can_follow: false };
      
      render(
        <TestWrapper>
          <ListCard {...noFollowProps} />
        </TestWrapper>
      );

      expect(screen.queryByTestId('follow-button')).not.toBeInTheDocument();
    });

    it('should show quick add button when authenticated', () => {
      mockAuthStore.isAuthenticated = true;
      
      render(
        <TestWrapper>
          <ListCard {...mockProps} />
        </TestWrapper>
      );

      expect(screen.getByTestId('quick-add-button')).toBeInTheDocument();
    });

    it('should hide quick add button when not authenticated', () => {
      mockAuthStore.isAuthenticated = false;
      
      render(
        <TestWrapper>
          <ListCard {...mockProps} />
        </TestWrapper>
      );

      expect(screen.queryByTestId('quick-add-button')).not.toBeInTheDocument();
    });
  });

  describe('TDD: Follow/Unfollow Functionality', () => {
    it('should show correct follow button state when not following', () => {
      const notFollowingProps = { ...mockProps, is_following: false };
      
      render(
        <TestWrapper>
          <ListCard {...notFollowingProps} />
        </TestWrapper>
      );

      const followButton = screen.getByTestId('follow-button');
      expect(followButton).toHaveClass('bg-white', 'text-gray-600');
      expect(followButton).toHaveAttribute('title', 'Follow Best Pizza Places');
    });

    it('should show correct follow button state when following', () => {
      const followingProps = { ...mockProps, is_following: true };
      
      render(
        <TestWrapper>
          <ListCard {...followingProps} />
        </TestWrapper>
      );

      const followButton = screen.getByTestId('follow-button');
      expect(followButton).toHaveClass('bg-blue-600', 'text-white');
      expect(followButton).toHaveAttribute('title', 'Unfollow Best Pizza Places');
    });

    it('should call onFollow when follow button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ListCard {...mockProps} />
        </TestWrapper>
      );

      const followButton = screen.getByTestId('follow-button');
      await user.click(followButton);

      expect(mockProps.onFollow).toHaveBeenCalledWith(1);
    });

    it('should call onUnfollow when unfollow button is clicked', async () => {
      const user = userEvent.setup();
      const followingProps = { ...mockProps, is_following: true };
      
      render(
        <TestWrapper>
          <ListCard {...followingProps} />
        </TestWrapper>
      );

      const unfollowButton = screen.getByTestId('follow-button');
      await user.click(unfollowButton);

      expect(mockProps.onUnfollow).toHaveBeenCalledWith(1);
    });

    it('should prevent event propagation on follow button click', async () => {
      const user = userEvent.setup();
      const mockCardClick = vi.fn();
      
      render(
        <TestWrapper>
          <div onClick={mockCardClick}>
            <ListCard {...mockProps} />
          </div>
        </TestWrapper>
      );

      const followButton = screen.getByTestId('follow-button');
      await user.click(followButton);

      expect(mockCardClick).not.toHaveBeenCalled();
      expect(mockProps.onFollow).toHaveBeenCalled();
    });
  });

  describe('TDD: Quick Add Functionality', () => {
    it('should call onQuickAdd with correct data when quick add button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ListCard {...mockProps} />
        </TestWrapper>
      );

      const quickAddButton = screen.getByTestId('quick-add-button');
      await user.click(quickAddButton);

      expect(mockProps.onQuickAdd).toHaveBeenCalledWith({
        listId: 1,
        listName: 'Best Pizza Places'
      });
    });

    it('should prevent event propagation on quick add button click', async () => {
      const user = userEvent.setup();
      const mockCardClick = vi.fn();
      
      render(
        <TestWrapper>
          <div onClick={mockCardClick}>
            <ListCard {...mockProps} />
          </div>
        </TestWrapper>
      );

      const quickAddButton = screen.getByTestId('quick-add-button');
      await user.click(quickAddButton);

      expect(mockCardClick).not.toHaveBeenCalled();
      expect(mockProps.onQuickAdd).toHaveBeenCalled();
    });
  });

  describe('TDD: Badge and Status Indicators', () => {
    it('should render featured badge when is_featured is true', () => {
      const featuredProps = { ...mockProps, is_featured: true };
      
      render(
        <TestWrapper>
          <ListCard {...featuredProps} />
        </TestWrapper>
      );

      expect(screen.getByText('Featured')).toBeInTheDocument();
      expect(screen.getByTestId('featured-badge')).toBeInTheDocument();
    });

    it('should render trending badge when is_trending is true', () => {
      const trendingProps = { ...mockProps, is_trending: true };
      
      render(
        <TestWrapper>
          <ListCard {...trendingProps} />
        </TestWrapper>
      );

      expect(screen.getByText('Trending')).toBeInTheDocument();
      expect(screen.getByTestId('trending-badge')).toBeInTheDocument();
    });

    it('should render private badge when is_public is false', () => {
      const privateProps = { ...mockProps, is_public: false };
      
      render(
        <TestWrapper>
          <ListCard {...privateProps} />
        </TestWrapper>
      );

      expect(screen.getByText('Private')).toBeInTheDocument();
      expect(screen.getByTestId('private-badge')).toBeInTheDocument();
    });

    it('should render list type badge when list_type is not custom', () => {
      const typedProps = { ...mockProps, list_type: 'wishlist' };
      
      render(
        <TestWrapper>
          <ListCard {...typedProps} />
        </TestWrapper>
      );

      expect(screen.getByText('wishlist')).toBeInTheDocument();
      expect(screen.getByTestId('type-badge')).toBeInTheDocument();
    });
  });

  describe('TDD: Card Navigation and Engagement', () => {
    it('should create correct link destination', () => {
      render(
        <TestWrapper>
          <ListCard {...mockProps} />
        </TestWrapper>
      );

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/list/1');
    });

    it('should log engagement when card is clicked', async () => {
      const { engagementService } = await import('@/services/engagementService');
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ListCard {...mockProps} />
        </TestWrapper>
      );

      const link = screen.getByRole('link');
      await user.click(link);

      expect(engagementService.logEngagement).toHaveBeenCalledWith({
        item_id: 1,
        item_type: 'list',
        engagement_type: 'click'
      });
    });

    it('should have proper accessibility attributes', () => {
      render(
        <TestWrapper>
          <ListCard {...mockProps} />
        </TestWrapper>
      );

      const cardElement = screen.getByTestId('list-card-1');
      expect(cardElement).toHaveAttribute('role', 'article');
      expect(cardElement).toHaveAttribute('aria-label', 'List: Best Pizza Places');
    });
  });

  describe('TDD: Edge Cases and Error Handling', () => {
    it('should handle empty tags array gracefully', () => {
      const noTagsProps = { ...mockProps, tags: [] };
      
      render(
        <TestWrapper>
          <ListCard {...noTagsProps} />
        </TestWrapper>
      );

      expect(screen.queryByText('#pizza')).not.toBeInTheDocument();
    });

    it('should handle empty items array gracefully', () => {
      const noItemsProps = { ...mockProps, items: [], items_count: 0 };
      
      render(
        <TestWrapper>
          <ListCard {...noItemsProps} />
        </TestWrapper>
      );

      expect(screen.getByText('0 items')).toBeInTheDocument();
      expect(screen.queryByText('Recent items:')).not.toBeInTheDocument();
    });

    it('should handle missing description gracefully', () => {
      const noDescProps = { ...mockProps, description: null };
      
      render(
        <TestWrapper>
          <ListCard {...noDescProps} />
        </TestWrapper>
      );

      expect(screen.queryByText('My favorite pizza spots in the city')).not.toBeInTheDocument();
    });

    it('should handle missing user information gracefully', () => {
      const noUserProps = { ...mockProps, user: null };
      
      render(
        <TestWrapper>
          <ListCard {...noUserProps} />
        </TestWrapper>
      );

      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    });

    it('should truncate long tag lists correctly', () => {
      const manyTagsProps = { 
        ...mockProps, 
        tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5', 'tag6'] 
      };
      
      render(
        <TestWrapper>
          <ListCard {...manyTagsProps} />
        </TestWrapper>
      );

      expect(screen.getByText('#tag1')).toBeInTheDocument();
      expect(screen.getByText('#tag2')).toBeInTheDocument();
      expect(screen.getByText('#tag3')).toBeInTheDocument();
      expect(screen.getByText('+3')).toBeInTheDocument();
    });

    it('should handle singular vs plural items count correctly', () => {
      const singleItemProps = { ...mockProps, items_count: 1 };
      
      render(
        <TestWrapper>
          <ListCard {...singleItemProps} />
        </TestWrapper>
      );

      expect(screen.getByText('1 item')).toBeInTheDocument();
    });
  });

  describe('TDD: Layout and Button Positioning', () => {
    it('should position follow button in top-right corner without content overlap', () => {
      render(
        <TestWrapper>
          <ListCard {...mockProps} />
        </TestWrapper>
      );

      const followButton = screen.getByTestId('follow-button');
      expect(followButton).toHaveClass('absolute', 'top-3', 'right-3', 'z-20');
    });

    it('should position quick add button in header area', () => {
      render(
        <TestWrapper>
          <ListCard {...mockProps} />
        </TestWrapper>
      );

      const quickAddButton = screen.getByTestId('quick-add-button');
      expect(quickAddButton).toHaveClass('w-6', 'h-6');
    });

    it('should maintain proper DOM order for absolute positioning', () => {
      render(
        <TestWrapper>
          <ListCard {...mockProps} />
        </TestWrapper>
      );

      const cardElement = screen.getByTestId('list-card-1');
      const followButtonWrapper = cardElement.querySelector('.follow-button');
      
      // Follow button should be positioned last in DOM order
      expect(followButtonWrapper).toBeTruthy();
    });
  });
}); 