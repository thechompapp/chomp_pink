/* src/utils/adapters.js */
/* REMOVED: All TypeScript syntax (interfaces, types) */

// REMOVED: interface ApiDish { ... }
// REMOVED: interface DishCardProps { ... }

// Adapter function without type annotations
export const adaptDishForCard = (apiDish) => {
  // Add defensive checks for JS
  if (!apiDish || apiDish.id == null) {
      console.warn("adaptDishForCard received invalid apiDish:", apiDish);
      return { id: 'unknown', name: 'Error', restaurant: 'Error', tags: [], adds: 0 }; // Return default error structure
  }
  return {
      id: apiDish.id,
      name: apiDish.name || 'Unnamed Dish',
      restaurant: apiDish.restaurant_name || apiDish.restaurant || 'Unknown Restaurant',
      tags: Array.isArray(apiDish.tags) ? apiDish.tags : [],
      adds: apiDish.adds ?? apiDish.add_count ?? 0, // Use nullish coalescing
  };
};

// Add other adapters here (e.g., adaptRestaurantForCard) without types if needed