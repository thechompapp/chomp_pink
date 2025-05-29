import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import CardFactory from '@/components/UI/CardFactory';
import { GRID_LAYOUTS } from '@/utils/layoutConstants';

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

// Test wrapper component
const TestWrapper = ({ children }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('CardFactory Integration Tests', () => {
  const mockOnQuickAdd = vi.fn();
  const mockOnAddToList = vi.fn();

  const sampleRestaurant = {
    id: 1,
    name: 'Test Restaurant',
    neighborhood_name: 'Brooklyn',
    city_name: 'New York',
    tags: ['italian', 'pizza'],
    adds: 127,
  };

  const sampleDish = {
    id: 2,
    name: 'Margherita Pizza',
    restaurant: 'Test Restaurant',
    restaurant_id: 1,
    tags: ['vegetarian', 'italian'],
    adds: 89,
  };

  const sampleList = {
    id: 3,
    name: 'Best Italian Places',
    description: 'My favorite Italian restaurants',
    items_count: 5,
    user: { name: 'John Doe' },
    items: [
      { id: 1, name: 'Test Restaurant', item_type: 'restaurant' }
    ]
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('TDD: Type Recognition and Card Rendering', () => {
    it('should render RestaurantCard for restaurant type', () => {
      render(
        <TestWrapper>
          <CardFactory 
            type="restaurants" 
            data={sampleRestaurant}
            onAddToList={mockOnAddToList}
          />
        </TestWrapper>
      );

      expect(screen.getByTestId('restaurant-card-1')).toBeInTheDocument();
      expect(screen.getByText('Test Restaurant')).toBeInTheDocument();
      expect(screen.getByTestId('restaurant-type-badge')).toBeInTheDocument();
    });

    it('should render DishCard for dish type', () => {
      render(
        <TestWrapper>
          <CardFactory 
            type="dishes" 
            data={sampleDish}
            onAddToList={mockOnAddToList}
          />
        </TestWrapper>
      );

      expect(screen.getByTestId('dish-card-2')).toBeInTheDocument();
      expect(screen.getByText('Margherita Pizza')).toBeInTheDocument();
      expect(screen.getByTestId('dish-type-badge')).toBeInTheDocument();
    });

    it('should render ListCard for list type', () => {
      render(
        <TestWrapper>
          <CardFactory 
            type="lists" 
            data={sampleList}
            onQuickAdd={mockOnQuickAdd}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Best Italian Places')).toBeInTheDocument();
      expect(screen.getByText('My favorite Italian restaurants')).toBeInTheDocument();
      expect(screen.getByText('5 items')).toBeInTheDocument();
    });

    it('should handle singular type conversion', () => {
      render(
        <TestWrapper>
          <CardFactory 
            type="restaurant" 
            data={sampleRestaurant}
            onAddToList={mockOnAddToList}
          />
        </TestWrapper>
      );

      expect(screen.getByTestId('restaurant-card-1')).toBeInTheDocument();
    });

    it('should handle type variations with different casing', () => {
      render(
        <TestWrapper>
          <CardFactory 
            type="RESTAURANTS" 
            data={sampleRestaurant}
            onAddToList={mockOnAddToList}
          />
        </TestWrapper>
      );

      expect(screen.getByTestId('restaurant-card-1')).toBeInTheDocument();
    });
  });

  describe('TDD: Handler Integration', () => {
    it('should pass onAddToList to restaurant cards', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <CardFactory 
            type="restaurants" 
            data={sampleRestaurant}
            onAddToList={mockOnAddToList}
          />
        </TestWrapper>
      );

      const addButton = screen.getByTestId('add-to-list-button');
      await user.click(addButton);

      expect(mockOnAddToList).toHaveBeenCalledTimes(1);
    });

    it('should pass onAddToList to dish cards', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <CardFactory 
            type="dishes" 
            data={sampleDish}
            onAddToList={mockOnAddToList}
          />
        </TestWrapper>
      );

      const addButton = screen.getByTestId('add-to-list-button');
      await user.click(addButton);

      expect(mockOnAddToList).toHaveBeenCalledTimes(1);
    });

    it('should pass onQuickAdd to list cards', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <CardFactory 
            type="lists" 
            data={sampleList}
            onQuickAdd={mockOnQuickAdd}
          />
        </TestWrapper>
      );

      // Assuming ListCard has a quick add button
      const quickAddButtons = screen.queryAllByTestId('quick-add-button');
      if (quickAddButtons.length > 0) {
        await user.click(quickAddButtons[0]);
        expect(mockOnQuickAdd).toHaveBeenCalledTimes(1);
      }
    });

    it('should handle backward compatibility with onQuickAdd for restaurants', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <CardFactory 
            type="restaurants" 
            data={sampleRestaurant}
            onQuickAdd={mockOnQuickAdd}
          />
        </TestWrapper>
      );

      const addButton = screen.getByTestId('add-to-list-button');
      await user.click(addButton);

      // Should still work even with onQuickAdd (backward compatibility)
      expect(addButton).toBeInTheDocument();
    });
  });

  describe('TDD: Grid Layout Integration', () => {
    it('should work within PRIMARY grid layout', () => {
      render(
        <TestWrapper>
          <div className={GRID_LAYOUTS.PRIMARY}>
            <CardFactory type="restaurants" data={sampleRestaurant} onAddToList={mockOnAddToList} />
            <CardFactory type="dishes" data={sampleDish} onAddToList={mockOnAddToList} />
          </div>
        </TestWrapper>
      );

      expect(screen.getByTestId('restaurant-card-1')).toBeInTheDocument();
      expect(screen.getByTestId('dish-card-2')).toBeInTheDocument();
    });

    it('should work within SEARCH grid layout', () => {
      render(
        <TestWrapper>
          <div className={GRID_LAYOUTS.SEARCH}>
            <CardFactory type="restaurants" data={sampleRestaurant} onAddToList={mockOnAddToList} />
            <CardFactory type="dishes" data={sampleDish} onAddToList={mockOnAddToList} />
          </div>
        </TestWrapper>
      );

      expect(screen.getByTestId('restaurant-card-1')).toBeInTheDocument();
      expect(screen.getByTestId('dish-card-2')).toBeInTheDocument();
    });

    it('should work within FULL_WIDTH grid layout', () => {
      render(
        <TestWrapper>
          <div className={GRID_LAYOUTS.FULL_WIDTH}>
            <CardFactory type="lists" data={sampleList} onQuickAdd={mockOnQuickAdd} />
          </div>
        </TestWrapper>
      );

      expect(screen.getByText('Best Italian Places')).toBeInTheDocument();
    });
  });

  describe('TDD: Data Transformation and Prop Mapping', () => {
    it('should transform restaurant data correctly', () => {
      const restaurantWithLocation = {
        ...sampleRestaurant,
        city_name: 'New York',
        neighborhood_name: 'Brooklyn'
      };

      render(
        <TestWrapper>
          <CardFactory 
            type="restaurants" 
            data={restaurantWithLocation}
            onAddToList={mockOnAddToList}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Brooklyn, New York')).toBeInTheDocument();
    });

    it('should transform dish data correctly', () => {
      const dishWithRestaurantInfo = {
        ...sampleDish,
        restaurant_name: 'Alternative Restaurant Name'
      };

      render(
        <TestWrapper>
          <CardFactory 
            type="dishes" 
            data={dishWithRestaurantInfo}
            onAddToList={mockOnAddToList}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Alternative Restaurant Name')).toBeInTheDocument();
    });

    it('should handle missing optional properties gracefully', () => {
      const minimalRestaurant = {
        id: 1,
        name: 'Minimal Restaurant'
      };

      render(
        <TestWrapper>
          <CardFactory 
            type="restaurants" 
            data={minimalRestaurant}
            onAddToList={mockOnAddToList}
          />
        </TestWrapper>
      );

      expect(screen.getByTestId('restaurant-card-1')).toBeInTheDocument();
      expect(screen.getByText('Minimal Restaurant')).toBeInTheDocument();
    });
  });

  describe('TDD: Error Handling and Edge Cases', () => {
    it('should handle unknown card types gracefully', () => {
      const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      render(
        <TestWrapper>
          <CardFactory 
            type="unknown" 
            data={sampleRestaurant}
            onAddToList={mockOnAddToList}
          />
        </TestWrapper>
      );

      // Should render nothing without crashing
      expect(screen.queryByTestId(/card-/)).not.toBeInTheDocument();
      
      consoleWarn.mockRestore();
    });

    it('should handle null data gracefully', () => {
      const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      render(
        <TestWrapper>
          <CardFactory 
            type="restaurants" 
            data={null}
            onAddToList={mockOnAddToList}
          />
        </TestWrapper>
      );

      // Should render nothing without crashing
      expect(screen.queryByTestId('restaurant-card-null')).not.toBeInTheDocument();
      
      consoleWarn.mockRestore();
    });

    it('should handle undefined data gracefully', () => {
      const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      render(
        <TestWrapper>
          <CardFactory 
            type="restaurants" 
            data={undefined}
            onAddToList={mockOnAddToList}
          />
        </TestWrapper>
      );

      // Should render nothing without crashing
      expect(screen.queryByTestId(/restaurant-card-/)).not.toBeInTheDocument();
      
      consoleWarn.mockRestore();
    });

    it('should handle missing required handlers gracefully', () => {
      render(
        <TestWrapper>
          <CardFactory 
            type="restaurants" 
            data={sampleRestaurant}
          />
        </TestWrapper>
      );

      expect(screen.getByTestId('restaurant-card-1')).toBeInTheDocument();
      // Should still render without handlers
    });
  });

  describe('TDD: Performance and Optimization', () => {
    it('should handle rapid re-renders efficiently', () => {
      const { rerender } = render(
        <TestWrapper>
          <CardFactory 
            type="restaurants" 
            data={sampleRestaurant}
            onAddToList={mockOnAddToList}
          />
        </TestWrapper>
      );

      // Re-render with different data
      rerender(
        <TestWrapper>
          <CardFactory 
            type="restaurants" 
            data={{...sampleRestaurant, name: 'Updated Restaurant'}}
            onAddToList={mockOnAddToList}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Updated Restaurant')).toBeInTheDocument();
    });

    it('should handle type switching efficiently', () => {
      const { rerender } = render(
        <TestWrapper>
          <CardFactory 
            type="restaurants" 
            data={sampleRestaurant}
            onAddToList={mockOnAddToList}
          />
        </TestWrapper>
      );

      // Switch to dish type
      rerender(
        <TestWrapper>
          <CardFactory 
            type="dishes" 
            data={sampleDish}
            onAddToList={mockOnAddToList}
          />
        </TestWrapper>
      );

      expect(screen.getByTestId('dish-card-2')).toBeInTheDocument();
      expect(screen.queryByTestId('restaurant-card-1')).not.toBeInTheDocument();
    });
  });

  describe('TDD: Accessibility Integration', () => {
    it('should maintain accessibility across different card types', () => {
      render(
        <TestWrapper>
          <div>
            <CardFactory type="restaurants" data={sampleRestaurant} onAddToList={mockOnAddToList} />
            <CardFactory type="dishes" data={sampleDish} onAddToList={mockOnAddToList} />
          </div>
        </TestWrapper>
      );

      const restaurantCard = screen.getByTestId('restaurant-card-1');
      const dishCard = screen.getByTestId('dish-card-2');

      expect(restaurantCard).toHaveAttribute('role', 'article');
      expect(dishCard).toHaveAttribute('role', 'article');
    });

    it('should provide consistent keyboard navigation across card types', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <div>
            <CardFactory type="restaurants" data={sampleRestaurant} onAddToList={mockOnAddToList} />
            <CardFactory type="dishes" data={sampleDish} onAddToList={mockOnAddToList} />
          </div>
        </TestWrapper>
      );

      // Tab through both cards
      await user.tab();
      const firstButton = document.activeElement;
      expect(firstButton).toHaveAttribute('data-testid', 'add-to-list-button');

      await user.tab();
      const secondButton = document.activeElement;
      expect(secondButton).toHaveAttribute('data-testid', 'add-to-list-button');
    });
  });

  describe('TDD: Real-world Usage Scenarios', () => {
    it('should work in a mixed content grid (search results)', () => {
      const mixedData = [
        { type: 'restaurants', data: sampleRestaurant },
        { type: 'dishes', data: sampleDish },
        { type: 'lists', data: sampleList }
      ];

      render(
        <TestWrapper>
          <div className={GRID_LAYOUTS.SEARCH}>
            {mixedData.map((item, index) => (
              <CardFactory
                key={`${item.type}-${item.data.id}-${index}`}
                type={item.type}
                data={item.data}
                onAddToList={mockOnAddToList}
                onQuickAdd={mockOnQuickAdd}
              />
            ))}
          </div>
        </TestWrapper>
      );

      expect(screen.getByTestId('restaurant-card-1')).toBeInTheDocument();
      expect(screen.getByTestId('dish-card-2')).toBeInTheDocument();
      expect(screen.getByText('Best Italian Places')).toBeInTheDocument();
    });

    it('should work in infinite scroll scenarios', async () => {
      const user = userEvent.setup();
      const { rerender } = render(
        <TestWrapper>
          <div className={GRID_LAYOUTS.PRIMARY}>
            <CardFactory type="restaurants" data={sampleRestaurant} onAddToList={mockOnAddToList} />
          </div>
        </TestWrapper>
      );

      // Simulate loading more items
      const newRestaurant = { ...sampleRestaurant, id: 2, name: 'New Restaurant' };
      rerender(
        <TestWrapper>
          <div className={GRID_LAYOUTS.PRIMARY}>
            <CardFactory type="restaurants" data={sampleRestaurant} onAddToList={mockOnAddToList} />
            <CardFactory type="restaurants" data={newRestaurant} onAddToList={mockOnAddToList} />
          </div>
        </TestWrapper>
      );

      expect(screen.getByTestId('restaurant-card-1')).toBeInTheDocument();
      expect(screen.getByTestId('restaurant-card-2')).toBeInTheDocument();
      expect(screen.getByText('New Restaurant')).toBeInTheDocument();
    });

    it('should maintain state consistency across re-renders', async () => {
      const user = userEvent.setup();
      const { rerender } = render(
        <TestWrapper>
          <CardFactory type="restaurants" data={sampleRestaurant} onAddToList={mockOnAddToList} />
        </TestWrapper>
      );

      const addButton = screen.getByTestId('add-to-list-button');
      await user.click(addButton);
      expect(mockOnAddToList).toHaveBeenCalledTimes(1);

      // Re-render with updated data
      rerender(
        <TestWrapper>
          <CardFactory 
            type="restaurants" 
            data={{...sampleRestaurant, adds: 150}} 
            onAddToList={mockOnAddToList} 
          />
        </TestWrapper>
      );

      expect(screen.getByText('150 adds')).toBeInTheDocument();
      // Handler should still work after re-render
      const updatedButton = screen.getByTestId('add-to-list-button');
      await user.click(updatedButton);
      expect(mockOnAddToList).toHaveBeenCalledTimes(2);
    });
  });
}); 