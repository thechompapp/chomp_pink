// src/components/UI/index.js

// Main Card Components (Standardized)
export { default as RestaurantCard } from './RestaurantCard';
export { default as DishCard } from './DishCard';
export { default as ListCard } from './ListCard';
export { default as CardFactory } from './CardFactory';

// List Cards
// export { default as ListCardSkeleton } from './ListCardSkeleton';
export { default as CompactListCard } from '../../pages/Lists/CompactListCard';

// Restaurant Cards
export { default as RestaurantCardSkeleton } from './RestaurantCardSkeleton';
export { default as CompactRestaurantCard } from './CompactRestaurantCard';

// Dish Cards
export { default as DishCardSkeleton } from './DishCardSkeleton';
export { default as CompactDishCard } from './CompactDishCard';

// Base Components
export { default as BaseCard } from './BaseCard';
export { default as Button } from './Button';
export { default as SkeletonElement } from './SkeletonElement';

// Import components for the utility function
import ListCard from './ListCard';
import RestaurantCard from './RestaurantCard';
import DishCard from './DishCard';
import CompactListCard from '../../pages/Lists/CompactListCard';
import RestaurantCardSkeleton from './RestaurantCardSkeleton';
import CompactRestaurantCard from './CompactRestaurantCard';
import DishCardSkeleton from './DishCardSkeleton';
import CompactDishCard from './CompactDishCard';

// Card variants for different use cases
export const CardVariants = {
  // List Cards
  List: {
    Default: 'ListCard',
    Compact: 'CompactListCard',
    // Skeleton: 'ListCardSkeleton'
  },
  // Restaurant Cards
  Restaurant: {
    Default: 'RestaurantCard',
    Compact: 'CompactRestaurantCard',
    Skeleton: 'RestaurantCardSkeleton'
  },
  // Dish Cards
  Dish: {
    Default: 'DishCard',
    Compact: 'CompactDishCard',
    Skeleton: 'DishCardSkeleton'
  }
};

// Utility function to get the appropriate card component
export const getCardComponent = (type = 'List', variant = 'Default') => {
  const components = {
    List: {
      Default: ListCard,
      Compact: CompactListCard,
      // Skeleton: ListCardSkeleton
    },
    Restaurant: {
      Default: RestaurantCard,
      Compact: CompactRestaurantCard,
      Skeleton: RestaurantCardSkeleton
    },
    Dish: {
      Default: DishCard,
      Compact: CompactDishCard,
      Skeleton: DishCardSkeleton
    }
  };

  return components[type]?.[variant] || components.List.Default;
}; 