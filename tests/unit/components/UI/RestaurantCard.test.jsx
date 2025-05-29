import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import RestaurantCard from '@/components/UI/RestaurantCard';
import { CARD_SPECS } from '@/models/cardModels';

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

// Mock Next.js router
vi.mock('next/router', () => ({
  useRouter: () => ({
    push: vi.fn(),
    pathname: '/',
  }),
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

// Test wrapper component
const TestWrapper = ({ children }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('RestaurantCard Component', () => {
  const mockProps = {
    id: 1,
    name: 'Test Restaurant',
    neighborhood_name: 'Brooklyn',
    city_name: 'New York',
    tags: ['italian', 'pizza', 'family-friendly'],
    adds: 127,
    onAddToList: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset auth store to authenticated state
    mockAuthStore.isAuthenticated = true;
    mockAuthStore.user = { id: 1, name: 'Test User' };
  });

  describe('TDD: Layout Standardization', () => {
    it('should use standardized card height from CARD_SPECS', () => {
      render(
        <TestWrapper>
          <RestaurantCard {...mockProps} />
        </TestWrapper>
      );

      const cardElement = screen.getByTestId('restaurant-card-1');
      const innerCard = cardElement.querySelector('a > div');
      expect(innerCard).toHaveClass('h-64');
    });

    it('should use standardized card padding', () => {
      render(
        <TestWrapper>
          <RestaurantCard {...mockProps} />
        </TestWrapper>
      );

      const cardElement = screen.getByTestId('restaurant-card-1');
      const innerCard = cardElement.querySelector('a > div');
      expect(innerCard).toHaveClass('p-4');
    });

    it('should use standardized border styling', () => {
      render(
        <TestWrapper>
          <RestaurantCard {...mockProps} />
        </TestWrapper>
      );

      const cardElement = screen.getByTestId('restaurant-card-1');
      const innerCard = cardElement.querySelector('a > div');
      expect(innerCard).toHaveClass('border', 'border-black');
    });

    it('should have consistent background and border radius', () => {
      render(
        <TestWrapper>
          <RestaurantCard {...mockProps} />
        </TestWrapper>
      );

      const cardElement = screen.getByTestId('restaurant-card-1');
      const innerCard = cardElement.querySelector('a > div');
      expect(innerCard).toHaveClass('bg-white', 'rounded-lg');
    });

    it('should maintain overflow hidden for content control', () => {
      render(
        <TestWrapper>
          <RestaurantCard {...mockProps} />
        </TestWrapper>
      );

      const cardElement = screen.getByTestId('restaurant-card-1');
      const innerCard = cardElement.querySelector('a > div');
      expect(innerCard).toHaveClass('overflow-hidden');
    });

    it('should use flex layout for proper content distribution', () => {
      render(
        <TestWrapper>
          <RestaurantCard {...mockProps} />
        </TestWrapper>
      );

      const cardElement = screen.getByTestId('restaurant-card-1');
      const innerCard = cardElement.querySelector('a > div');
      expect(innerCard).toHaveClass('flex', 'flex-col');
    });
  });

  describe('TDD: Core Rendering Requirements', () => {
    it('should render restaurant name correctly', () => {
      render(
        <TestWrapper>
          <RestaurantCard {...mockProps} />
        </TestWrapper>
      );

      expect(screen.getByText('Test Restaurant')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Test Restaurant' })).toBeInTheDocument();
    });

    it('should render location information', () => {
      render(
        <TestWrapper>
          <RestaurantCard {...mockProps} />
        </TestWrapper>
      );

      expect(screen.getByText('Brooklyn, New York')).toBeInTheDocument();
    });

    it('should render restaurant type badge', () => {
      render(
        <TestWrapper>
          <RestaurantCard {...mockProps} />
        </TestWrapper>
      );

      expect(screen.getByText('Restaurant')).toBeInTheDocument();
      expect(screen.getByTestId('restaurant-type-badge')).toBeInTheDocument();
    });

    it('should render adds count', () => {
      render(
        <TestWrapper>
          <RestaurantCard {...mockProps} />
        </TestWrapper>
      );

      expect(screen.getByText('127 adds')).toBeInTheDocument();
    });

    it('should render tags correctly', () => {
      render(
        <TestWrapper>
          <RestaurantCard {...mockProps} />
        </TestWrapper>
      );

      expect(screen.getByText('#italian')).toBeInTheDocument();
      expect(screen.getByText('#pizza')).toBeInTheDocument();
      expect(screen.getByText('#family-friendly')).toBeInTheDocument();
    });
  });

  describe('TDD: AddToList Integration', () => {
    it('should render AddToList button', () => {
      render(
        <TestWrapper>
          <RestaurantCard {...mockProps} />
        </TestWrapper>
      );

      const addButton = screen.getByTestId('add-to-list-button');
      expect(addButton).toBeInTheDocument();
      expect(addButton).toHaveAttribute('title', 'Add Test Restaurant to list');
    });

    it('should call onAddToList when add button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <RestaurantCard {...mockProps} />
        </TestWrapper>
      );

      const addButton = screen.getByTestId('add-to-list-button');
      await user.click(addButton);

      expect(mockProps.onAddToList).toHaveBeenCalledTimes(1);
    });

    it('should prevent event propagation when add button is clicked', async () => {
      const mockCardClick = vi.fn();
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <div onClick={mockCardClick}>
            <RestaurantCard {...mockProps} />
          </div>
        </TestWrapper>
      );

      const addButton = screen.getByTestId('add-to-list-button');
      await user.click(addButton);

      expect(mockProps.onAddToList).toHaveBeenCalledTimes(1);
      expect(mockCardClick).not.toHaveBeenCalled();
    });

    it('should show plus icon in add button', () => {
      render(
        <TestWrapper>
          <RestaurantCard {...mockProps} />
        </TestWrapper>
      );

      const addButton = screen.getByTestId('add-to-list-button');
      expect(addButton.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('TDD: Optional Props and Features', () => {
    it('should render rating when provided', () => {
      render(
        <TestWrapper>
          <RestaurantCard {...mockProps} rating={4.5} />
        </TestWrapper>
      );

      expect(screen.getByText('4.5')).toBeInTheDocument();
      expect(screen.getByTestId('rating-display')).toBeInTheDocument();
    });

    it('should render description when provided', () => {
      render(
        <TestWrapper>
          <RestaurantCard {...mockProps} description="Amazing Italian food" />
        </TestWrapper>
      );

      expect(screen.getByText('Amazing Italian food')).toBeInTheDocument();
    });

    it('should render website link when provided', () => {
      render(
        <TestWrapper>
          <RestaurantCard {...mockProps} website="https://example.com" />
        </TestWrapper>
      );

      const websiteButton = screen.getByTestId('external-link-button');
      expect(websiteButton).toBeInTheDocument();
      expect(websiteButton).toHaveAttribute('title', 'Visit website');
    });

    it('should render phone link when provided', () => {
      render(
        <TestWrapper>
          <RestaurantCard {...mockProps} phone="+1234567890" />
        </TestWrapper>
      );

      const phoneLink = screen.getByTitle('Call +1234567890');
      expect(phoneLink).toBeInTheDocument();
      expect(phoneLink).toHaveAttribute('href', 'tel:+1234567890');
    });

    it('should render image when provided', () => {
      render(
        <TestWrapper>
          <RestaurantCard {...mockProps} image_url="https://example.com/image.jpg" />
        </TestWrapper>
      );

      const image = screen.getByRole('img');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', 'https://example.com/image.jpg');
      expect(image).toHaveAttribute('alt', 'Test Restaurant');
    });

    it('should render trending badge when is_trending is true', () => {
      render(
        <TestWrapper>
          <RestaurantCard {...mockProps} is_trending={true} />
        </TestWrapper>
      );

      expect(screen.getByText('Trending')).toBeInTheDocument();
      expect(screen.getByTestId('trending-badge')).toBeInTheDocument();
    });

    it('should render featured badge when is_featured is true', () => {
      render(
        <TestWrapper>
          <RestaurantCard {...mockProps} is_featured={true} />
        </TestWrapper>
      );

      expect(screen.getByText('Featured')).toBeInTheDocument();
      expect(screen.getByTestId('featured-badge')).toBeInTheDocument();
    });

    it('should render hours information when provided', () => {
      render(
        <TestWrapper>
          <RestaurantCard {...mockProps} hours="Open until 10 PM" />
        </TestWrapper>
      );

      expect(screen.getByText('Open')).toBeInTheDocument();
      expect(screen.getByTestId('open-badge')).toBeInTheDocument();
    });
  });

  describe('TDD: Navigation and Links', () => {
    it('should create correct navigation link', () => {
      render(
        <TestWrapper>
          <RestaurantCard {...mockProps} />
        </TestWrapper>
      );

      const cardLink = screen.getByRole('link');
      expect(cardLink).toHaveAttribute('href', '/restaurant/1');
    });

    it('should handle external website clicks separately', async () => {
      const mockOpen = vi.fn();
      global.open = mockOpen;
      
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <RestaurantCard {...mockProps} website="https://example.com" />
        </TestWrapper>
      );

      const websiteButton = screen.getByTestId('external-link-button');
      await user.click(websiteButton);

      expect(mockOpen).toHaveBeenCalledWith('https://example.com', '_blank', 'noopener,noreferrer');
    });
  });

  describe('TDD: Tag Handling and Display', () => {
    it('should handle empty tags array', () => {
      render(
        <TestWrapper>
          <RestaurantCard {...mockProps} tags={[]} />
        </TestWrapper>
      );

      expect(screen.queryByText(/^#/)).not.toBeInTheDocument();
    });

    it('should handle undefined tags', () => {
      render(
        <TestWrapper>
          <RestaurantCard {...mockProps} tags={undefined} />
        </TestWrapper>
      );

      expect(screen.queryByText(/^#/)).not.toBeInTheDocument();
    });

    it('should limit displayed tags to 3 with overflow indicator', () => {
      const manyTags = ['tag1', 'tag2', 'tag3', 'tag4', 'tag5'];
      render(
        <TestWrapper>
          <RestaurantCard {...mockProps} tags={manyTags} />
        </TestWrapper>
      );

      expect(screen.getByText('#tag1')).toBeInTheDocument();
      expect(screen.getByText('#tag2')).toBeInTheDocument();
      expect(screen.getByText('#tag3')).toBeInTheDocument();
      expect(screen.getByText('+2')).toBeInTheDocument();
      expect(screen.queryByText('#tag4')).not.toBeInTheDocument();
    });

    it('should show tooltip for overflow tags', () => {
      const manyTags = ['tag1', 'tag2', 'tag3', 'tag4', 'tag5'];
      render(
        <TestWrapper>
          <RestaurantCard {...mockProps} tags={manyTags} />
        </TestWrapper>
      );

      const overflowTag = screen.getByText('+2');
      expect(overflowTag).toHaveAttribute('title', '2 more tags: tag4, tag5');
    });
  });

  describe('TDD: Accessibility Requirements', () => {
    it('should have proper ARIA labels', () => {
      render(
        <TestWrapper>
          <RestaurantCard {...mockProps} />
        </TestWrapper>
      );

      const card = screen.getByTestId('restaurant-card-1');
      expect(card).toHaveAttribute('role', 'article');
      
      const addButton = screen.getByTestId('add-to-list-button');
      expect(addButton).toHaveAttribute('aria-label', 'Add Test Restaurant to list');
    });

    it('should have keyboard navigation support', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <RestaurantCard {...mockProps} />
        </TestWrapper>
      );

      const addButton = screen.getByTestId('add-to-list-button');
      
      // Focus directly on the add button (since it's nested in a link, tab order is complex)
      addButton.focus();
      expect(addButton).toHaveFocus();

      // Press Enter
      await user.keyboard('{Enter}');
      expect(mockProps.onAddToList).toHaveBeenCalledTimes(1);
    });

    it('should have proper heading hierarchy', () => {
      render(
        <TestWrapper>
          <RestaurantCard {...mockProps} />
        </TestWrapper>
      );

      const heading = screen.getByRole('heading', { name: 'Test Restaurant' });
      expect(heading.tagName).toBe('H3');
    });

    it('should support screen readers with semantic markup', () => {
      render(
        <TestWrapper>
          <RestaurantCard {...mockProps} rating={4.5} />
        </TestWrapper>
      );

      const ratingElement = screen.getByTestId('rating-display');
      expect(ratingElement).toHaveAttribute('aria-label', 'Rating: 4.5 stars');
    });
  });

  describe('TDD: Error Handling and Edge Cases', () => {
    it('should handle missing required props gracefully', () => {
      const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      render(
        <TestWrapper>
          <RestaurantCard id={null} name="" />
        </TestWrapper>
      );

      // Should still render without crashing
      expect(screen.getByTestId('restaurant-card-null')).toBeInTheDocument();
      
      consoleWarn.mockRestore();
    });

    it('should handle very long restaurant names with text truncation', () => {
      const longName = 'A'.repeat(100);
      render(
        <TestWrapper>
          <RestaurantCard {...mockProps} name={longName} />
        </TestWrapper>
      );

      const nameElement = screen.getByRole('heading', { name: longName });
      expect(nameElement).toHaveClass('line-clamp-2');
    });

    it('should handle missing location information', () => {
      render(
        <TestWrapper>
          <RestaurantCard 
            {...mockProps} 
            neighborhood_name={undefined} 
            city_name={undefined} 
          />
        </TestWrapper>
      );

      expect(screen.queryByText(/,/)).not.toBeInTheDocument();
    });

    it('should handle zero or negative adds count', () => {
      render(
        <TestWrapper>
          <RestaurantCard {...mockProps} adds={0} />
        </TestWrapper>
      );

      expect(screen.getByText('0 adds')).toBeInTheDocument();
    });
  });

  describe('TDD: Performance and Optimization', () => {
    it('should use lazy loading for images', () => {
      render(
        <TestWrapper>
          <RestaurantCard {...mockProps} image_url="https://example.com/image.jpg" />
        </TestWrapper>
      );

      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('loading', 'lazy');
    });

    it('should prevent unnecessary re-renders with React.memo patterns', () => {
      const { rerender } = render(
        <TestWrapper>
          <RestaurantCard {...mockProps} />
        </TestWrapper>
      );

      // Re-render with same props
      rerender(
        <TestWrapper>
          <RestaurantCard {...mockProps} />
        </TestWrapper>
      );

      // Component should handle this efficiently (this is more of a structural test)
      expect(screen.getByTestId('restaurant-card-1')).toBeInTheDocument();
    });
  });

  describe('TDD: Integration with Layout System', () => {
    it('should work within grid layouts', () => {
      render(
        <TestWrapper>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            <RestaurantCard {...mockProps} />
            <RestaurantCard {...mockProps} id={2} name="Restaurant 2" />
          </div>
        </TestWrapper>
      );

      expect(screen.getByTestId('restaurant-card-1')).toBeInTheDocument();
      expect(screen.getByTestId('restaurant-card-2')).toBeInTheDocument();
    });

    it('should maintain aspect ratio in different grid contexts', () => {
      const { container } = render(
        <TestWrapper>
          <div style={{ width: '200px' }}>
            <RestaurantCard {...mockProps} />
          </div>
        </TestWrapper>
      );

      const card = screen.getByTestId('restaurant-card-1');
      const innerCard = card.querySelector('a > div');
      expect(innerCard).toHaveClass('h-64');
      // Height should remain consistent regardless of container width
    });
  });
}); 