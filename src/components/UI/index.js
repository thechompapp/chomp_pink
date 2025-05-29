// src/components/UI/index.js

// List Cards
export { default as ListCard } from './ListCard';
export { default as ListCardSkeleton } from './ListCardSkeleton';
export { default as CompactListCard } from './CompactListCard';

// Restaurant Cards
export { default as RestaurantCard } from './RestaurantCard';
export { default as RestaurantCardSkeleton } from './RestaurantCardSkeleton';
export { default as CompactRestaurantCard } from './CompactRestaurantCard';

// Dish Cards
export { default as DishCard } from './DishCard';
export { default as DishCardSkeleton } from './DishCardSkeleton';
export { default as CompactDishCard } from './CompactDishCard';

// Base Components
export { default as BaseCard } from './BaseCard';
export { default as Button } from './Button';
export { default as SkeletonElement } from './SkeletonElement';

// Card variants for different use cases
export const CardVariants = {
  // List Cards
  List: {
    Default: 'ListCard',
    Compact: 'CompactListCard',
    Skeleton: 'ListCardSkeleton'
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
      Skeleton: ListCardSkeleton
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