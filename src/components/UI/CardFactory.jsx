// src/components/UI/CardFactory.jsx
import React from 'react';
import DishCard from './DishCard.jsx';
import RestaurantCard from './RestaurantCard.jsx';
import ListCard from '@/pages/Lists/ListCard.jsx'; // Import the standard ListCard for consistency

const CardFactory = ({ type, data, onQuickAdd, onAddToList, ...props }) => {
  const cardData = data || {};

  // Create AddToList handler from QuickAdd for backward compatibility
  const handleAddToList = onAddToList || (onQuickAdd && ((item) => {
    // Transform onQuickAdd to work with AddToList modal
    onQuickAdd({
      ...item,
      type: item.type || type.replace(/s$/, '') // Remove plural 's' if present
    });
  }));

  // Normalize type to handle plural variants
  const normalizedType = type?.toLowerCase();
  
  switch (normalizedType) {
    case 'dish':
    case 'dishes':
      return <DishCard 
        {...cardData} 
        {...props} 
        onAddToList={handleAddToList ? () => handleAddToList({ ...cardData, type: 'dish' }) : undefined}
      />;
    case 'restaurant':
    case 'restaurants':
      return <RestaurantCard 
        {...cardData} 
        {...props} 
        onAddToList={handleAddToList ? () => handleAddToList({ ...cardData, type: 'restaurant' }) : undefined}
      />;
    case 'list':
    case 'lists':
      // Use the standard ListCard across the entire application for consistency
      // Lists use onQuickAdd instead of onAddToList
      return <ListCard list={cardData} onQuickAdd={onQuickAdd} {...props} />;
    default:
      console.warn(`[CardFactory] Unknown card type encountered: ${type}`);
      return null; // Render nothing for unknown types
  }
};

export default CardFactory;