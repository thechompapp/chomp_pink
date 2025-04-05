// src/utils/adapters.js
export const adaptDishForCard = (apiDish) => ({
  id: apiDish.id,
  name: apiDish.name,
  restaurant: apiDish.restaurant_name,
  tags: apiDish.tags || [],
  adds: apiDish.add_count || 0
});