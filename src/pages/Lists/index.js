// src/pages/Lists/index.js
export { default as ListCard } from './ListCard';
export { default as ListCardSkeleton } from './ListCardSkeleton';
export { default as CompactListCard } from './CompactListCard';
export { default as ModalListCard } from './ModalListCard';
export { default as SimpleListCard } from './ListCard'; // Re-export SimpleListCard from ListCard

// Component variants for different use cases
export const ListCardVariants = {
  Default: 'ListCard',
  Compact: 'CompactListCard',
  Modal: 'ModalListCard',
  Simple: 'SimpleListCard',
  Skeleton: 'ListCardSkeleton'
};

// Utility function to get the appropriate card component
export const getListCardComponent = (variant = 'Default') => {
  switch (variant) {
    case 'Compact':
      return CompactListCard;
    case 'Modal':
      return ModalListCard;
    case 'Skeleton':
      return ListCardSkeleton;
    case 'Simple':
      return SimpleListCard;
    case 'Default':
    default:
      return ListCard;
  }
}; 