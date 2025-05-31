# Enhanced Modal Components

This directory contains enhanced modal components that provide improved user experience for Restaurant, List, and Dish detail views.

## Components

### EnhancedRestaurantModal

An enhanced restaurant detail modal with:
- **Clear Information Hierarchy**: Restaurant name, cuisine type, location prominently displayed
- **The Take Section**: Special section for verified reviewer content with badge
- **Contact & Location**: Phone, website, address with direct action buttons (directions, call)
- **Visual Stats**: Rating, saves, lists with colored icons
- **Enhanced Actions**: Save/unsave, share, add to list, view full details
- **Smooth Animations**: Framer Motion animations for better UX

```jsx
import { EnhancedRestaurantModal } from '@/components/modals';

<EnhancedRestaurantModal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  restaurant={restaurantData}
  onSave={(restaurant, isSaved) => {
    // Handle save state change
    console.log(`Restaurant ${restaurant.id} ${isSaved ? 'saved' : 'unsaved'}`);
  }}
  onShare={(restaurant) => {
    // Handle share action
    console.log(`Shared restaurant ${restaurant.id}`);
  }}
/>
```

### EnhancedListModal

An enhanced list detail modal with:
- **Creator Information**: Shows list creator with "Your List" or "@username"
- **Privacy Controls**: Public/private toggle for list owners
- **List Preview**: Shows first 4 items with option to view all
- **Engagement Stats**: Saves, followers, item count
- **Smart Actions**: Follow/edit/share based on ownership and privacy
- **Item Type Indicators**: Visual distinction between restaurant and dish lists

```jsx
import { EnhancedListModal } from '@/components/modals';

<EnhancedListModal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  list={listData}
  onFollow={(list, isFollowing) => {
    // Handle follow state change
    console.log(`List ${list.id} ${isFollowing ? 'followed' : 'unfollowed'}`);
  }}
  onEdit={(list) => {
    // Handle edit action
    console.log(`Edit list ${list.id}`);
  }}
  onShare={(list) => {
    // Handle share action
    console.log(`Shared list ${list.id}`);
  }}
/>
```

### EnhancedDishModal

An enhanced dish detail modal with:
- **Restaurant Context**: Highlighted restaurant information with view action
- **Dish Details**: Price, dietary info, popularity indicators
- **Visual Hierarchy**: Dish name prominent, restaurant as secondary info
- **Smart Navigation**: Direct links to restaurant page
- **Enhanced Tags**: Clickable tag pills for exploration
- **Multiple Actions**: Save, share, add to list, view restaurant

```jsx
import { EnhancedDishModal } from '@/components/modals';

<EnhancedDishModal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  dish={dishData}
  onSave={(dish, isSaved) => {
    // Handle save state change
    console.log(`Dish ${dish.id} ${isSaved ? 'saved' : 'unsaved'}`);
  }}
  onShare={(dish) => {
    // Handle share action
    console.log(`Shared dish ${dish.id}`);
  }}
/>
```

## Upgrading from Existing Modals

### Option 1: Gradual Migration (Recommended)

Use the enhanced modals through the existing `ItemQuickLookModal` by setting the `useEnhancedModals` prop:

```jsx
import ItemQuickLookModal from '@/components/ItemQuickLookModal';

<ItemQuickLookModal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  item={{ id: restaurantId, type: 'restaurant' }}
  useEnhancedModals={true} // Enable enhanced modals
  onSave={handleSave}
  onShare={handleShare}
/>
```

### Option 2: Direct Replacement

Replace existing modal components directly with the enhanced versions:

```jsx
// Before
import { ItemQuickLookModal } from '@/components';

// After
import { EnhancedRestaurantModal } from '@/components/modals';
```

## Features

### Accessibility
- **Keyboard Navigation**: Full keyboard support with focus management
- **ARIA Attributes**: Proper labeling and roles for screen readers
- **Color Contrast**: Sufficient contrast ratios for text and interactive elements
- **Focus Management**: Automatic focus handling when modals open/close

### Performance
- **Optimized Rendering**: React.memo and useCallback optimizations
- **Efficient Animations**: Hardware-accelerated CSS transforms
- **Lazy Loading**: Components only render when needed
- **Memory Management**: Proper cleanup of event listeners and state

### Responsive Design
- **Mobile Optimized**: Touch-friendly interactions and proper sizing
- **Tablet Support**: Adaptive layouts for medium screens
- **Desktop Enhancement**: Full feature set with hover states

### Visual Design
- **Modern UI**: Rounded corners, shadows, and subtle gradients
- **Consistent Styling**: Uses Tailwind design system
- **Smooth Animations**: Framer Motion for polished interactions
- **Color-Coded Stats**: Intuitive color system for different metrics

## Data Requirements

### Restaurant Data
```javascript
{
  id: number,
  name: string,
  cuisine_type: string,
  neighborhood_name: string,
  city_name: string,
  address: string,
  phone_number: string,
  website: string,
  rating: number,
  saved_count: number,
  list_count: number,
  tags: string[],
  the_take_reviewer_verified: boolean,
  the_take_review: string,
  reviewer_handle: string,
  latitude: number,
  longitude: number,
  hours: string,
  is_saved: boolean
}
```

### List Data
```javascript
{
  id: number,
  name: string,
  description: string,
  list_type: 'restaurant' | 'dish',
  user_id: number,
  creator_handle: string,
  is_public: boolean,
  is_following: boolean,
  item_count: number,
  saved_count: number,
  follower_count: number,
  created_at: string,
  tags: string[],
  items: Array<{
    id: number,
    restaurant_name?: string,
    dish_name?: string,
    city_name?: string,
    neighborhood_name?: string
  }>
}
```

### Dish Data
```javascript
{
  id: number,
  name: string,
  description: string,
  restaurant_id: number,
  restaurant_name: string,
  neighborhood_name: string,
  city_name: string,
  price: string,
  dietary_info: string,
  rating: number,
  saved_count: number,
  list_count: number,
  tags: string[],
  is_common: boolean,
  is_saved: boolean
}
```

## Integration Examples

### In Card Components
```jsx
// In RestaurantCard.jsx
const [isModalOpen, setIsModalOpen] = useState(false);

<EnhancedRestaurantModal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  restaurant={restaurant}
  onSave={handleSave}
  onShare={handleShare}
/>
```

### In List Components
```jsx
// In ListCard.jsx
const handleQuickView = () => {
  setSelectedList(list);
  setIsModalOpen(true);
};
```

### Global Modal State Management
```jsx
// Using Zustand or Context
const useModalStore = create((set) => ({
  isRestaurantModalOpen: false,
  selectedRestaurant: null,
  openRestaurantModal: (restaurant) => set({
    isRestaurantModalOpen: true,
    selectedRestaurant: restaurant
  }),
  closeRestaurantModal: () => set({
    isRestaurantModalOpen: false,
    selectedRestaurant: null
  })
}));
```

## Best Practices

1. **Always handle loading states** when fetching data for modals
2. **Use proper error boundaries** to catch and handle modal errors
3. **Implement proper cleanup** when components unmount
4. **Test keyboard navigation** for accessibility compliance
5. **Optimize images** if displaying media in modals
6. **Handle network errors** gracefully with retry mechanisms 