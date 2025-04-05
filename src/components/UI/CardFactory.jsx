// src/components/UI/CardFactory.jsx
import React from 'react';
import DishCard from './DishCard';
import RestaurantCard from './RestaurantCard';
import ListCard from './ListCard';

const CardFactory = ({ type, data, ...props }) => {
  switch (type) {
    case 'dish':
      return <DishCard {...data} {...props} />;
    case 'restaurant':
      return <RestaurantCard {...data} {...props} />;
    case 'list':
      return <ListCard {...data} {...props} />;
    default:
      console.warn(`Unknown card type: ${type}`);
      return null;
  }
};

export default CardFactory;