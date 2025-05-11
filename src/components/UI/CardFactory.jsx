// src/components/UI/CardFactory.jsx
import React from 'react';
import DishCard from './DishCard.jsx';
import RestaurantCard from './RestaurantCard.jsx';
import ListCard from '@/pages/Lists/ListCard.jsx'; // Import the standard ListCard for consistency

const CardFactory = ({ type, data, ...props }) => {
  const cardData = data || {};

  // Normalize type to handle plural variants
  const normalizedType = type?.toLowerCase();
  
  switch (normalizedType) {
    case 'dish':
    case 'dishes':
      return <DishCard {...cardData} {...props} />;
    case 'restaurant':
    case 'restaurants':
      return <RestaurantCard {...cardData} {...props} />;
    case 'list':
    case 'lists':
      // Use the standard ListCard across the entire application for consistency
      return <ListCard list={cardData} {...props} />;
    default:
      console.warn(`[CardFactory] Unknown card type encountered: ${type}`);
      return null; // Render nothing for unknown types
  }
};

export default CardFactory;