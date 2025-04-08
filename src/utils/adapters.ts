/* src/utils/adapters.ts */

// Define an interface for the expected structure of the API response for a dish
interface ApiDish {
    id: number | string; // Allow string initially if API isn't consistent
    name?: string | null;
    restaurant_name?: string | null; // Key used in some API responses
    restaurant?: string | null; // Alternative key sometimes used
    tags?: string[] | null;
    adds?: number | null; // Original API might use 'adds'
    add_count?: number | null; // Or sometimes 'add_count'? Clarify API.
    // Add other potential fields from the API if needed
    [key: string]: any; // Allow other properties
  }
  
  // Define an interface for the structure expected by the DishCard component
  interface DishCardProps {
    id: number | string;
    name: string;
    restaurant: string;
    tags: string[];
    adds: number;
  }
  
  // Adapter function with type annotations
  export const adaptDishForCard = (apiDish: ApiDish): DishCardProps => ({
    id: apiDish.id, // Assuming id is always present
    name: apiDish.name || 'Unnamed Dish', // Provide default
    // Prioritize restaurant_name, fallback to restaurant, then default
    restaurant: apiDish.restaurant_name || apiDish.restaurant || 'Unknown Restaurant',
    tags: Array.isArray(apiDish.tags) ? apiDish.tags : [], // Ensure tags is always an array
    // Use nullish coalescing to handle potentially missing or null values for adds/add_count
    adds: apiDish.adds ?? apiDish.add_count ?? 0, // Provide default
  });
  
  // Add other adapters here (e.g., adaptRestaurantForCard) with proper types if needed