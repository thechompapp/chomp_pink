# Enhanced Card Component Ecosystem

## Overview

The card component ecosystem provides clean, interactive, and visually consistent components for displaying lists, restaurants, and dishes. All cards feature type labels, simplified actions focused on adding to lists, and consistent styling across the application.

## Component Categories

### 1. List Cards
- **ListCard** - Enhanced main component for displaying list information
- **CompactListCard** - Condensed version for dense layouts
- **ListCardSkeleton** - Loading state component

### 2. Restaurant Cards
- **RestaurantCard** - Enhanced main component for displaying restaurant information
- **CompactRestaurantCard** - Condensed version for dense layouts
- **RestaurantCardSkeleton** - Loading state component

### 3. Dish Cards
- **DishCard** - Enhanced main component for displaying dish information
- **CompactDishCard** - Condensed version for dense layouts
- **DishCardSkeleton** - Loading state component

## Universal Design Principles

All card components follow consistent design patterns:

### 🎭 **Smooth Animations**
- Entrance animations using Framer Motion with reduced Y-transform (y: 10 → 0) to prevent border clipping
- Staggered tag animations for enhanced visual appeal
- Subtle hover effects with scale and elevation (y: -2)
- Hardware-accelerated animations for smooth performance

### 🎨 **Consistent Visual Design**
- Black borders (`border-black`) for strong definition and consistency
- Rounded corners (`rounded-lg`) for modern aesthetics
- Fixed height (h-64) for uniform grid layouts
- White backgrounds with consistent padding (p-4)
- Consistent typography hierarchy

### 🏷️ **Type Labels**
- **Restaurant cards**: Orange "Restaurant" badge
- **Dish cards**: Green "Dish" badge  
- **List cards**: Maintain existing "List" label
- Clear visual identification of content type

### 🎯 **Simplified Actions**
- **Single "Add to List" button**: Black circular button with plus icon
- **Appears on hover**: `opacity-0 group-hover:opacity-100` transition
- **Integrates with AddToListModal**: Opens modal for list selection
- **No pricing display**: Removed dollar signs and price-related UI
- **No social actions**: Removed heart/favorite and share buttons

### ♿ **Accessibility & Performance**
- Proper ARIA labels and semantic HTML
- Keyboard navigation support
- React.memo for preventing unnecessary re-renders
- Optimized animations and state management

## 🚀 Complete AddToList Integration

### Step 1: Import Required Components

```jsx
import React, { useState, useCallback } from 'react';
import { 
  RestaurantCard, 
  DishCard, 
  CompactRestaurantCard, 
  CompactDishCard,
  RestaurantCardSkeleton,
  DishCardSkeleton
} from '@/components/UI';
import AddToListModal from '@/components/AddToListModal';
```

### Step 2: Set Up Modal State Management

```jsx
function YourComponent({ restaurants, dishes, isLoading }) {
  // Modal state management
  const [isAddToListModalOpen, setIsAddToListModalOpen] = useState(false);
  const [itemToAdd, setItemToAdd] = useState(null);

  // Handle opening the Add to List modal
  const handleAddToList = useCallback((item) => {
    console.log('Adding item to list:', item);
    setItemToAdd(item);
    setIsAddToListModalOpen(true);
  }, []);

  // Handle closing the modal
  const handleCloseModal = useCallback(() => {
    setIsAddToListModalOpen(false);
    setItemToAdd(null);
  }, []);

  // Handle successful item addition
  const handleItemAdded = useCallback((listId, listItemId) => {
    console.log(`Item added to list ${listId} with ID ${listItemId}`);
    setIsAddToListModalOpen(false);
    setItemToAdd(null);
    // Optional: Show success toast/notification
  }, []);

  // Your component JSX here...
}
```

### Step 3: Restaurant Cards with AddToList

```jsx
// Restaurant Grid Component
function RestaurantGrid({ restaurants, isLoading }) {
  const [isAddToListModalOpen, setIsAddToListModalOpen] = useState(false);
  const [itemToAdd, setItemToAdd] = useState(null);

  const handleAddToList = useCallback((item) => {
    setItemToAdd(item);
    setIsAddToListModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsAddToListModalOpen(false);
    setItemToAdd(null);
  }, []);

  const handleItemAdded = useCallback((listId, listItemId) => {
    console.log(`Restaurant added to list ${listId}`);
    setIsAddToListModalOpen(false);
    setItemToAdd(null);
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <RestaurantCardSkeleton key={`restaurant-skeleton-${i}`} />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {restaurants.map(restaurant => (
          <RestaurantCard
            key={restaurant.id}
            id={restaurant.id}
            name={restaurant.name}
            neighborhood_name={restaurant.neighborhood_name}
            city_name={restaurant.city_name}
            tags={restaurant.tags}
            adds={restaurant.adds}
            rating={restaurant.rating}
            website={restaurant.website}
            phone={restaurant.phone}
            is_trending={restaurant.is_trending}
            is_featured={restaurant.is_featured}
            hours={restaurant.hours}
            image_url={restaurant.image_url}
            description={restaurant.description}
            onAddToList={handleAddToList}
          />
        ))}
      </div>
      
      <AddToListModal
        isOpen={isAddToListModalOpen}
        onClose={handleCloseModal}
        itemToAdd={itemToAdd}
        onItemAdded={handleItemAdded}
      />
    </>
  );
}
```

### Step 4: Dish Cards with AddToList

```jsx
// Dish Grid Component
function DishGrid({ dishes, isLoading }) {
  const [isAddToListModalOpen, setIsAddToListModalOpen] = useState(false);
  const [itemToAdd, setItemToAdd] = useState(null);

  const handleAddToList = useCallback((item) => {
    setItemToAdd(item);
    setIsAddToListModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsAddToListModalOpen(false);
    setItemToAdd(null);
  }, []);

  const handleItemAdded = useCallback((listId, listItemId) => {
    console.log(`Dish added to list ${listId}`);
    setIsAddToListModalOpen(false);
    setItemToAdd(null);
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <DishCardSkeleton key={`dish-skeleton-${i}`} />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {dishes.map(dish => (
          <DishCard
            key={dish.id}
            id={dish.id}
            name={dish.name}
            restaurant={dish.restaurant}
            restaurant_id={dish.restaurant_id}
            tags={dish.tags}
            adds={dish.adds}
            rating={dish.rating}
            description={dish.description}
            is_trending={dish.is_trending}
            is_featured={dish.is_featured}
            is_spicy={dish.is_spicy}
            is_vegetarian={dish.is_vegetarian}
            is_vegan={dish.is_vegan}
            prep_time={dish.prep_time}
            image_url={dish.image_url}
            onAddToList={handleAddToList}
          />
        ))}
      </div>
      
      <AddToListModal
        isOpen={isAddToListModalOpen}
        onClose={handleCloseModal}
        itemToAdd={itemToAdd}
        onItemAdded={handleItemAdded}
      />
    </>
  );
}
```

### Step 5: Mixed Content Grid with Shared Modal

```jsx
// Mixed Content Component with Single Modal
function MixedContentGrid({ restaurants, dishes, isLoading }) {
  const [isAddToListModalOpen, setIsAddToListModalOpen] = useState(false);
  const [itemToAdd, setItemToAdd] = useState(null);

  const handleAddToList = useCallback((item) => {
    console.log('Adding to list:', item);
    setItemToAdd(item);
    setIsAddToListModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsAddToListModalOpen(false);
    setItemToAdd(null);
  }, []);

  const handleItemAdded = useCallback((listId, listItemId) => {
    console.log(`Item added to list ${listId} with ID ${listItemId}`);
    setIsAddToListModalOpen(false);
    setItemToAdd(null);
    // Optional: Show success notification
  }, []);

  const allItems = [
    ...restaurants.map(item => ({ ...item, type: 'restaurant' })),
    ...dishes.map(item => ({ ...item, type: 'dish' }))
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <RestaurantCardSkeleton key={`restaurant-skeleton-${i}`} />
        ))}
        {[...Array(3)].map((_, i) => (
          <DishCardSkeleton key={`dish-skeleton-${i}`} />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {allItems.map(item => {
          if (item.type === 'restaurant') {
            return (
              <RestaurantCard
                key={`restaurant-${item.id}`}
                {...item}
                onAddToList={handleAddToList}
              />
            );
          } else {
            return (
              <DishCard
                key={`dish-${item.id}`}
                {...item}
                onAddToList={handleAddToList}
              />
            );
          }
        })}
      </div>
      
      <AddToListModal
        isOpen={isAddToListModalOpen}
        onClose={handleCloseModal}
        itemToAdd={itemToAdd}
        onItemAdded={handleItemAdded}
      />
    </>
  );
}
```

### Step 6: Compact Cards in Sidebar

```jsx
// Sidebar with Compact Cards
function Sidebar({ recentRestaurants, featuredDishes, onAddToList }) {
  return (
    <div className="space-y-4">
      <section>
        <h3 className="font-semibold mb-2">Recent Restaurants</h3>
        <div className="space-y-2">
          {recentRestaurants.map(restaurant => (
            <CompactRestaurantCard
              key={restaurant.id}
              {...restaurant}
              onAddToList={onAddToList}
              showActions={true}
              showMetadata={true}
              className="w-full"
            />
          ))}
        </div>
      </section>
      
      <section>
        <h3 className="font-semibold mb-2">Featured Dishes</h3>
        <div className="space-y-2">
          {featuredDishes.map(dish => (
            <CompactDishCard
              key={dish.id}
              {...dish}
              onAddToList={onAddToList}
              showActions={true}
              showMetadata={true}
              className="w-full"
            />
          ))}
        </div>
      </section>
    </div>
  );
}
```

### Step 7: Complete Page Integration

```jsx
// Complete Page Component
import React, { useState, useCallback, useEffect } from 'react';
import { 
  RestaurantCard, 
  DishCard, 
  CompactRestaurantCard, 
  CompactDishCard,
  RestaurantCardSkeleton,
  DishCardSkeleton
} from '@/components/UI';
import AddToListModal from '@/components/AddToListModal';

function ExplorePage() {
  const [restaurants, setRestaurants] = useState([]);
  const [dishes, setDishes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // AddToList modal state
  const [isAddToListModalOpen, setIsAddToListModalOpen] = useState(false);
  const [itemToAdd, setItemToAdd] = useState(null);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        // Your data loading logic here
        // const [restaurantData, dishData] = await Promise.all([
        //   fetchRestaurants(),
        //   fetchDishes()
        // ]);
        // setRestaurants(restaurantData);
        // setDishes(dishData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // AddToList handlers
  const handleAddToList = useCallback((item) => {
    console.log('Opening AddToList modal for:', item);
    setItemToAdd({
      id: item.id,
      name: item.name,
      type: item.type
    });
    setIsAddToListModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsAddToListModalOpen(false);
    setItemToAdd(null);
  }, []);

  const handleItemAdded = useCallback((listId, listItemId) => {
    console.log(`Successfully added item to list ${listId} with ID ${listItemId}`);
    setIsAddToListModalOpen(false);
    setItemToAdd(null);
    
    // Optional: Show success notification
    // showSuccessToast('Item added to list successfully!');
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Restaurants Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Featured Restaurants</h2>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <RestaurantCardSkeleton key={`restaurant-skeleton-${i}`} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {restaurants.map(restaurant => (
              <RestaurantCard
                key={restaurant.id}
                {...restaurant}
                onAddToList={handleAddToList}
              />
            ))}
          </div>
        )}
      </section>

      {/* Dishes Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Popular Dishes</h2>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <DishCardSkeleton key={`dish-skeleton-${i}`} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dishes.map(dish => (
              <DishCard
                key={dish.id}
                {...dish}
                onAddToList={handleAddToList}
              />
            ))}
          </div>
        )}
      </section>

      {/* AddToList Modal */}
      <AddToListModal
        isOpen={isAddToListModalOpen}
        onClose={handleCloseModal}
        itemToAdd={itemToAdd}
        onItemAdded={handleItemAdded}
      />
    </div>
  );
}

export default ExplorePage;
```

## 🎯 Best Practices for AddToList Integration

### 1. **State Management**
- Use `useState` for modal state management
- Use `useCallback` to prevent unnecessary re-renders
- Always clean up state when modal closes

### 2. **Error Handling**
```jsx
const handleItemAdded = useCallback((listId, listItemId) => {
  try {
    console.log(`Item added successfully to list ${listId}`);
    setIsAddToListModalOpen(false);
    setItemToAdd(null);
    // Show success feedback
  } catch (error) {
    console.error('Error in item added callback:', error);
    // Handle error gracefully
  }
}, []);
```

### 3. **User Feedback**
```jsx
const handleAddToList = useCallback((item) => {
  // Optional: Show loading state
  setItemToAdd(item);
  setIsAddToListModalOpen(true);
  
  // Optional: Analytics tracking
  analytics.track('add_to_list_opened', {
    item_type: item.type,
    item_id: item.id
  });
}, []);
```

### 4. **Performance Optimization**
```jsx
// Memoize heavy computations
const processedItems = useMemo(() => {
  return items.map(item => ({
    ...item,
    type: item.restaurant_id ? 'dish' : 'restaurant'
  }));
}, [items]);

// Use React.memo for card components (already implemented)
const MemoizedRestaurantCard = React.memo(RestaurantCard);
```

### 5. **Accessibility**
- Modal automatically handles focus management
- Card buttons have proper ARIA labels
- Keyboard navigation is supported

## Component Documentation

### RestaurantCard

Clean restaurant card focused on essential information and list management.

#### Key Features
- **Type Identification**: "Restaurant" label for clear categorization
- **Image Support**: Display restaurant photos with hover effects
- **Essential Metadata**: Rating, location, phone number, popularity
- **Add to List**: Single action button for adding to user lists
- **Smart Badges**: Featured, trending, open status indicators
- **Consistent Styling**: Black borders, fixed height, consistent spacing

#### Props
```jsx
RestaurantCard.propTypes = {
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  name: PropTypes.string.isRequired,
  neighborhood_name: PropTypes.string,
  city_name: PropTypes.string,
  tags: PropTypes.array,
  adds: PropTypes.number,
  onAddToList: PropTypes.func, // Callback for Add to List modal
  website: PropTypes.string,
  phone: PropTypes.string,
  rating: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  is_trending: PropTypes.bool,
  is_featured: PropTypes.bool,
  hours: PropTypes.string,
  image_url: PropTypes.string,
  description: PropTypes.string,
  className: PropTypes.string,
};
```

### DishCard

Clean dish card focused on essential information and list management.

#### Key Features
- **Type Identification**: "Dish" label for clear categorization
- **Image Support**: Display dish photos with hover effects
- **Restaurant Linking**: Clickable restaurant names with navigation
- **Diet Indicators**: Vegan, vegetarian, spicy badges
- **Add to List**: Single action button for adding to user lists
- **Consistent Styling**: Black borders, fixed height, consistent spacing

#### Props
```jsx
DishCard.propTypes = {
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  name: PropTypes.string.isRequired,
  restaurant: PropTypes.string,
  restaurant_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  tags: PropTypes.array,
  adds: PropTypes.number,
  onAddToList: PropTypes.func, // Callback for Add to List modal
  rating: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  description: PropTypes.string,
  is_trending: PropTypes.bool,
  is_featured: PropTypes.bool,
  is_spicy: PropTypes.bool,
  is_vegetarian: PropTypes.bool,
  is_vegan: PropTypes.bool,
  prep_time: PropTypes.string,
  image_url: PropTypes.string,
  className: PropTypes.string,
};
```

### Compact Variants

Both `CompactRestaurantCard` and `CompactDishCard` provide space-efficient versions with:
- Type labels for clear identification
- Single Add to List action button
- Configurable metadata display
- Consistent styling with main cards
- Optimized for sidebars and dense layouts

### Skeleton Components

Enhanced skeleton components that match the simplified card layouts:
- Fixed height (h-64) matching actual cards
- Black border styling for consistency
- Type label placeholders
- Single action button placeholder
- Staggered animations for better UX

## Design System

### CSS Classes
- **Borders**: `border-black` for all card borders
- **Backgrounds**: `bg-white` for card backgrounds
- **Borders**: `rounded-lg` for card corners
- **Heights**: `h-64` for fixed card heights
- **Padding**: `p-4` for consistent internal spacing
- **Tags**: `bg-white border border-black rounded-full` for tag styling
- **Type Labels**: Small badges with appropriate colors (orange for restaurants, green for dishes)

### Animation Specifications
- **Entrance**: `y: 10 → 0` (reduced from y: 20 to prevent border clipping)
- **Hover**: `y: -2` (subtle lift effect)
- **Scale**: `1.02 → 1.05` for different interaction levels
- **Transitions**: `duration: 0.2s` for smooth interactions

### Color Palette
- **Restaurant badges**: Orange (`bg-orange-100 text-orange-700`)
- **Dish badges**: Green (`bg-green-100 text-green-700`)
- **Action buttons**: Black (`bg-black text-white`)
- **Borders**: Black (`border-black`)
- **Text**: Standard gray scale (`text-gray-600`, `text-black`)

## Migration Notes

### Breaking Changes
- **Removed props**: `price`, `price_range`, `onFavorite`, `onQuickAdd`, `isFavorited`
- **New props**: `onAddToList` for modal integration
- **Styling changes**: Black borders replace gray borders, fixed heights

### Migration Guide
```jsx
// Old usage
<RestaurantCard 
  {...restaurant}
  price_range={restaurant.price_range}
  onFavorite={handleFavorite}
  onQuickAdd={handleQuickAdd}
  isFavorited={favoriteStatus}
/>

// New usage
<RestaurantCard 
  {...restaurant}
  onAddToList={handleAddToList}
/>
```

The simplified card system focuses on essential functionality while maintaining visual consistency and providing a streamlined user experience centered around list management. 