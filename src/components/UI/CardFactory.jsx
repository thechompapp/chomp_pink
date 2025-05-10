// src/components/UI/CardFactory.jsx
import React from 'react';
import DishCard from './DishCard.jsx';
import RestaurantCard from './RestaurantCard.jsx';
import ListPreviewCard from './ListPreviewCard.jsx'; // Import the new preview card

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
      // Render the ListPreviewCard, passing the list metadata object as the 'list' prop
      return <ListPreviewCard list={cardData} {...props} />;
    default:
      console.warn(`[CardFactory] Unknown card type encountered: ${type}`);
      return null; // Render nothing for unknown types
  }
};

export default CardFactory;