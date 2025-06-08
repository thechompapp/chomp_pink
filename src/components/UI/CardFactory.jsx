// src/components/UI/CardFactory.jsx
import React from 'react';
import PropTypes from 'prop-types';
import DishCard from './DishCard.jsx';
import RestaurantCard from './RestaurantCard.jsx';
import ListCard from './ListCard.jsx'; // Use the UI ListCard
import { normalizeCardData, validateCardData, CardTypes } from '@/models/cardModels';

const CardFactory = ({ 
  type, 
  data, 
  onQuickAdd, 
  onAddToList, 
  onFollow, 
  onUnfollow, 
  onShare, 
  ...props 
}) => {
  // Validate and normalize data
  if (!data || !data.id) {
    console.warn(`[CardFactory] Invalid data provided for type: ${type}`, data);
    return null;
  }

  // Normalize type to handle plural variants
  const normalizedType = type?.toLowerCase();
  let cardType;
  
  switch (normalizedType) {
    case 'dish':
    case 'dishes':
      cardType = CardTypes.DISH;
      break;
    case 'restaurant':
    case 'restaurants':
      cardType = CardTypes.RESTAURANT;
      break;
    case 'list':
    case 'lists':
      cardType = CardTypes.LIST;
      break;
    default:
      console.warn(`[CardFactory] Unknown card type encountered: ${type}`);
      return null;
  }

  // Validate data structure
  const validation = validateCardData[cardType]?.(data);
  if (validation && !validation.isValid) {
    console.warn(`[CardFactory] Invalid ${cardType} data:`, validation.errors);
    // Continue rendering with potentially incomplete data
  }

  // Normalize data for consistent structure
  const normalizedData = normalizeCardData[cardType]?.(data) || data;

  // Create AddToList handler from QuickAdd for backward compatibility
  const handleAddToList = onAddToList || (onQuickAdd && ((item) => {
    // Transform onQuickAdd to work with AddToList modal
    onQuickAdd({
      ...item,
      type: item.type || cardType
    });
  }));

  switch (cardType) {
    case CardTypes.DISH:
      return (
        <DishCard 
          {...normalizedData} 
          {...props} 
          onAddToList={handleAddToList ? () => handleAddToList({ 
            id: normalizedData.id, 
            name: normalizedData.name, 
            type: 'dish' 
          }) : undefined}
        />
      );

    case CardTypes.RESTAURANT:
      return (
        <RestaurantCard 
          {...normalizedData} 
          {...props} 
          onAddToList={handleAddToList ? () => handleAddToList({ 
            id: normalizedData.id, 
            name: normalizedData.name, 
            type: 'restaurant' 
          }) : undefined}
        />
      );

    case CardTypes.LIST:
      return (
        <ListCard 
          {...normalizedData} // Spread the data as individual props for UI ListCard
          {...props} 
          onQuickAdd={onQuickAdd}
          onFollow={onFollow}
          onUnfollow={onUnfollow}
          onShare={onShare}
        />
      );

    default:
      console.warn(`[CardFactory] Unhandled card type: ${cardType}`);
      return null;
  }
};

// Define PropTypes for the CardFactory
CardFactory.propTypes = {
  type: PropTypes.string.isRequired,
  data: PropTypes.object.isRequired,
  onQuickAdd: PropTypes.func,
  onAddToList: PropTypes.func,
  onFollow: PropTypes.func,
  onUnfollow: PropTypes.func,
  onShare: PropTypes.func,
};

export default CardFactory;