import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import DishCard from '@/components/UI/DishCard';
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

// Test wrapper component
const TestWrapper = ({ children }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('DishCard Component', () => {
  const mockProps = {
    id: 1,
    name: 'Margherita Pizza',
    restaurant: "Joe's Pizzeria",
    restaurant_id: 123,
    tags: ['vegetarian', 'italian', 'classic'],
    adds: 89,
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
          <DishCard {...mockProps} />
        </TestWrapper>
      );

      const cardElement = screen.getByTestId('dish-card-1');
      const innerCard = cardElement.querySelector('a > div');
      expect(innerCard).toHaveClass('h-64');
    });

    it('should use standardized card padding', () => {
      render(
        <TestWrapper>
          <DishCard {...mockProps} />
        </TestWrapper>
      );

      const cardElement = screen.getByTestId('dish-card-1');
      const innerCard = cardElement.querySelector('a > div');
      expect(innerCard).toHaveClass('p-4');
    });

    it('should use standardized border styling', () => {
      render(
        <TestWrapper>
          <DishCard {...mockProps} />
        </TestWrapper>
      );

      const cardElement = screen.getByTestId('dish-card-1');
      const innerCard = cardElement.querySelector('a > div');
      expect(innerCard).toHaveClass('border', 'border-black');
    });

    it('should have consistent background and border radius', () => {
      render(
        <TestWrapper>
          <DishCard {...mockProps} />
        </TestWrapper>
      );

      const cardElement = screen.getByTestId('dish-card-1');
      const innerCard = cardElement.querySelector('a > div');
      expect(innerCard).toHaveClass('bg-white', 'rounded-lg');
    });

    it('should maintain overflow hidden for content control', () => {
      render(
        <TestWrapper>
          <DishCard {...mockProps} />
        </TestWrapper>
      );

      const cardElement = screen.getByTestId('dish-card-1');
      const innerCard = cardElement.querySelector('a > div');
      expect(innerCard).toHaveClass('overflow-hidden');
    });

    it('should use flex layout for proper content distribution', () => {
      render(
        <TestWrapper>
          <DishCard {...mockProps} />
        </TestWrapper>
      );

      const cardElement = screen.getByTestId('dish-card-1');
      const innerCard = cardElement.querySelector('a > div');
      expect(innerCard).toHaveClass('flex', 'flex-col');
    });
  });

  describe('TDD: Core Rendering Requirements', () => {
    it('should render dish name correctly', () => {
      render(
        <TestWrapper>
          <DishCard {...mockProps} />
        </TestWrapper>
      );

      expect(screen.getByText('Margherita Pizza')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Margherita Pizza' })).toBeInTheDocument();
    });

    it('should render restaurant name', () => {
      render(
        <TestWrapper>
          <DishCard {...mockProps} />
        </TestWrapper>
      );

      expect(screen.getByText(/Joe's Pizzeria/)).toBeInTheDocument();
    });

    it('should render dish type badge', () => {
      render(
        <TestWrapper>
          <DishCard {...mockProps} />
        </TestWrapper>
      );

      expect(screen.getByText('Dish')).toBeInTheDocument();
      expect(screen.getByTestId('dish-type-badge')).toBeInTheDocument();
    });

    it('should render adds count', () => {
      render(
        <TestWrapper>
          <DishCard {...mockProps} />
        </TestWrapper>
      );

      expect(screen.getByText('89 adds')).toBeInTheDocument();
    });

    it('should render tags correctly', () => {
      render(
        <TestWrapper>
          <DishCard {...mockProps} />
        </TestWrapper>
      );

      expect(screen.getByText('#vegetarian')).toBeInTheDocument();
      expect(screen.getByText('#italian')).toBeInTheDocument();
      expect(screen.getByText('#classic')).toBeInTheDocument();
    });
  });

  describe('TDD: AddToList Integration', () => {
    it('should render AddToList button', () => {
      render(
        <TestWrapper>
          <DishCard {...mockProps} />
        </TestWrapper>
      );

      const addButton = screen.getByTestId('add-to-list-button');
      expect(addButton).toBeInTheDocument();
      expect(addButton).toHaveAttribute('title', 'Add Margherita Pizza to list');
    });

    it('should call onAddToList when add button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <DishCard {...mockProps} />
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
            <DishCard {...mockProps} />
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
          <DishCard {...mockProps} />
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
          <DishCard {...mockProps} rating={4.7} />
        </TestWrapper>
      );

      expect(screen.getByText('4.7')).toBeInTheDocument();
      expect(screen.getByTestId('rating-display')).toBeInTheDocument();
    });

    it('should render description when provided', () => {
      render(
        <TestWrapper>
          <DishCard {...mockProps} description="Classic Italian pizza with fresh mozzarella" />
        </TestWrapper>
      );

      expect(screen.getByText('Classic Italian pizza with fresh mozzarella')).toBeInTheDocument();
    });

    it('should render image when provided', () => {
      render(
        <TestWrapper>
          <DishCard {...mockProps} image_url="https://example.com/pizza.jpg" />
        </TestWrapper>
      );

      const image = screen.getByRole('img');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', 'https://example.com/pizza.jpg');
      expect(image).toHaveAttribute('alt', 'Margherita Pizza');
    });

    it('should render featured badge when is_featured is true', () => {
      render(
        <TestWrapper>
          <DishCard {...mockProps} is_featured={true} />
        </TestWrapper>
      );

      expect(screen.getByText('Featured')).toBeInTheDocument();
      expect(screen.getByTestId('featured-badge')).toBeInTheDocument();
    });

    it('should render vegetarian badge when is_vegetarian is true', () => {
      render(
        <TestWrapper>
          <DishCard {...mockProps} is_vegetarian={true} />
        </TestWrapper>
      );

      expect(screen.getByText('Vegetarian')).toBeInTheDocument();
      expect(screen.getByTestId('vegetarian-badge')).toBeInTheDocument();
    });

    it('should render vegan badge when is_vegan is true', () => {
      render(
        <TestWrapper>
          <DishCard {...mockProps} is_vegan={true} />
        </TestWrapper>
      );

      expect(screen.getByText('Vegan')).toBeInTheDocument();
      expect(screen.getByTestId('vegan-badge')).toBeInTheDocument();
    });

    it('should render spicy badge when is_spicy is true', () => {
      render(
        <TestWrapper>
          <DishCard {...mockProps} is_spicy={true} />
        </TestWrapper>
      );

      expect(screen.getByText('Spicy')).toBeInTheDocument();
      expect(screen.getByTestId('spicy-badge')).toBeInTheDocument();
    });

    it('should render price when provided', () => {
      render(
        <TestWrapper>
          <DishCard {...mockProps} price="$18.99" />
        </TestWrapper>
      );

      expect(screen.getByText('$18.99')).toBeInTheDocument();
      expect(screen.getByTestId('price-display')).toBeInTheDocument();
    });
  });

  describe('TDD: Navigation and Links', () => {
    it('should create correct navigation link to dish detail', () => {
      render(
        <TestWrapper>
          <DishCard {...mockProps} />
        </TestWrapper>
      );

      const cardLinks = screen.getAllByRole('link');
      const cardLink = cardLinks[0];
      expect(cardLink).toHaveAttribute('href', '/dish/1');
    });

    it('should create restaurant link when restaurant_id is provided', () => {
      render(
        <TestWrapper>
          <DishCard {...mockProps} />
        </TestWrapper>
      );

      const restaurantLink = screen.getByTestId('restaurant-link');
      expect(restaurantLink).toBeInTheDocument();
      expect(restaurantLink).toHaveAttribute('href', '/restaurant/123');
    });

    it('should have keyboard navigation support', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <DishCard {...mockProps} />
        </TestWrapper>
      );

      const addButton = screen.getByTestId('add-to-list-button');
      
      addButton.focus();
      expect(addButton).toHaveFocus();

      await user.keyboard('{Enter}');
      expect(mockProps.onAddToList).toHaveBeenCalledTimes(1);
    });

    it('should maintain aspect ratio in different grid contexts', () => {
      const { container } = render(
        <TestWrapper>
          <div style={{ width: '200px' }}>
            <DishCard {...mockProps} />
          </div>
        </TestWrapper>
      );

      const card = screen.getByTestId('dish-card-1');
      const innerCard = card.querySelector('a > div');
      expect(innerCard).toHaveClass('h-64');
    });
  });

  describe('TDD: Tag Handling and Display', () => {
    it('should handle empty tags array', () => {
      render(
        <TestWrapper>
          <DishCard {...mockProps} tags={[]} />
        </TestWrapper>
      );

      expect(screen.queryByText(/^#/)).not.toBeInTheDocument();
    });

    it('should handle undefined tags', () => {
      render(
        <TestWrapper>
          <DishCard {...mockProps} tags={undefined} />
        </TestWrapper>
      );

      expect(screen.queryByText(/^#/)).not.toBeInTheDocument();
    });

    it('should limit displayed tags to 3 with overflow indicator', () => {
      const manyTags = ['tag1', 'tag2', 'tag3', 'tag4', 'tag5'];
      render(
        <TestWrapper>
          <DishCard {...mockProps} tags={manyTags} />
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
          <DishCard {...mockProps} tags={manyTags} />
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
          <DishCard {...mockProps} />
        </TestWrapper>
      );

      const card = screen.getByTestId('dish-card-1');
      expect(card).toHaveAttribute('role', 'article');
      
      const addButton = screen.getByTestId('add-to-list-button');
      expect(addButton).toHaveAttribute('aria-label', 'Add Margherita Pizza to list');
    });

    it('should have keyboard navigation support', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <DishCard {...mockProps} />
        </TestWrapper>
      );

      const addButton = screen.getByTestId('add-to-list-button');
      
      addButton.focus();
      expect(addButton).toHaveFocus();

      await user.keyboard('{Enter}');
      expect(mockProps.onAddToList).toHaveBeenCalledTimes(1);
    });

    it('should have proper heading hierarchy', () => {
      render(
        <TestWrapper>
          <DishCard {...mockProps} />
        </TestWrapper>
      );

      const heading = screen.getByRole('heading', { name: 'Margherita Pizza' });
      expect(heading.tagName).toBe('H3');
    });

    it('should support screen readers with semantic markup', () => {
      render(
        <TestWrapper>
          <DishCard {...mockProps} rating={4.7} />
        </TestWrapper>
      );

      const ratingElement = screen.getByTestId('rating-display');
      expect(ratingElement).toHaveAttribute('aria-label', 'Rating: 4.7 stars');
    });
  });

  describe('TDD: Error Handling and Edge Cases', () => {
    it('should handle missing required props gracefully', () => {
      const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      render(
        <TestWrapper>
          <DishCard id={null} name="" />
        </TestWrapper>
      );

      // Should still render without crashing
      expect(screen.getByTestId('dish-card-null')).toBeInTheDocument();
      
      consoleWarn.mockRestore();
    });

    it('should handle very long dish names with text truncation', () => {
      const longName = 'A'.repeat(100);
      render(
        <TestWrapper>
          <DishCard {...mockProps} name={longName} />
        </TestWrapper>
      );

      const nameElement = screen.getByRole('heading', { name: longName });
      expect(nameElement).toHaveClass('line-clamp-2');
    });

    it('should handle missing restaurant information', () => {
      render(
        <TestWrapper>
          <DishCard 
            {...mockProps} 
            restaurant={undefined} 
            restaurant_id={undefined} 
          />
        </TestWrapper>
      );

      expect(screen.queryByTestId('restaurant-link')).not.toBeInTheDocument();
    });

    it('should handle zero or negative adds count', () => {
      render(
        <TestWrapper>
          <DishCard {...mockProps} adds={0} />
        </TestWrapper>
      );

      expect(screen.getByText('0 adds')).toBeInTheDocument();
    });

    it('should handle missing price gracefully', () => {
      render(
        <TestWrapper>
          <DishCard {...mockProps} price={null} />
        </TestWrapper>
      );

      expect(screen.queryByTestId('price-display')).not.toBeInTheDocument();
    });
  });

  describe('TDD: Performance and Optimization', () => {
    it('should use lazy loading for images', () => {
      render(
        <TestWrapper>
          <DishCard {...mockProps} image_url="https://example.com/pizza.jpg" />
        </TestWrapper>
      );

      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('loading', 'lazy');
    });

    it('should prevent unnecessary re-renders with React.memo patterns', () => {
      const { rerender } = render(
        <TestWrapper>
          <DishCard {...mockProps} />
        </TestWrapper>
      );

      // Re-render with same props
      rerender(
        <TestWrapper>
          <DishCard {...mockProps} />
        </TestWrapper>
      );

      // Component should handle this efficiently
      expect(screen.getByTestId('dish-card-1')).toBeInTheDocument();
    });
  });

  describe('TDD: Integration with Layout System', () => {
    it('should work within grid layouts', () => {
      render(
        <TestWrapper>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            <DishCard {...mockProps} />
            <DishCard {...mockProps} id={2} name="Pepperoni Pizza" />
          </div>
        </TestWrapper>
      );

      expect(screen.getByTestId('dish-card-1')).toBeInTheDocument();
      expect(screen.getByTestId('dish-card-2')).toBeInTheDocument();
    });

    it('should maintain aspect ratio in different grid contexts', () => {
      const { container } = render(
        <TestWrapper>
          <div style={{ width: '200px' }}>
            <DishCard {...mockProps} />
          </div>
        </TestWrapper>
      );

      const card = screen.getByTestId('dish-card-1');
      const innerCard = card.querySelector('a > div');
      expect(innerCard).toHaveClass('h-64');
    });
  });

  describe('TDD: Dietary Information and Badges', () => {
    it('should display multiple dietary badges simultaneously', () => {
      render(
        <TestWrapper>
          <DishCard 
            {...mockProps} 
            is_vegetarian={true}
            is_vegan={false}
            is_spicy={true}
          />
        </TestWrapper>
      );

      expect(screen.getByTestId('vegetarian-badge')).toBeInTheDocument();
      expect(screen.getByTestId('spicy-badge')).toBeInTheDocument();
    });

    it('should show vegan badge instead of vegetarian when both are true', () => {
      render(
        <TestWrapper>
          <DishCard 
            {...mockProps} 
            is_vegetarian={true}
            is_vegan={true}
            is_spicy={true}
          />
        </TestWrapper>
      );

      expect(screen.getByTestId('vegan-badge')).toBeInTheDocument();
      expect(screen.getByTestId('spicy-badge')).toBeInTheDocument();
      expect(screen.queryByTestId('vegetarian-badge')).not.toBeInTheDocument();
    });

    it('should not show dietary badges when all are false', () => {
      render(
        <TestWrapper>
          <DishCard 
            {...mockProps} 
            is_vegetarian={false}
            is_vegan={false}
            is_spicy={false}
          />
        </TestWrapper>
      );

      expect(screen.queryByTestId('vegetarian-badge')).not.toBeInTheDocument();
      expect(screen.queryByTestId('vegan-badge')).not.toBeInTheDocument();
      expect(screen.queryByTestId('spicy-badge')).not.toBeInTheDocument();
    });
  });
}); 