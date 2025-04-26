// src/components/UI/CardFactory.jsx
import React from 'react';
import DishCard from './DishCard.jsx';
import RestaurantCard from './RestaurantCard.jsx';
import ListPreviewCard from './ListPreviewCard.jsx'; // Import the new preview card

const CardFactory = ({ type, data, ...props }) => {
  const cardData = data || {};

  switch (type) {
    case 'dish':
      return <DishCard {...cardData} {...props} />;
    case 'restaurant':
      return <RestaurantCard {...cardData} {...props} />;
    case 'lists': // Matches the contentType for lists
      // Render the ListPreviewCard, passing the list metadata object as the 'list' prop
      return <ListPreviewCard list={cardData} {...props} />;
    default:
      console.warn(`[CardFactory] Unknown card type encountered: ${type}`);
      return null; // Render nothing for unknown types
  }
};

export default CardFactory;