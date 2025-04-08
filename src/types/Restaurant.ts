/* src/types/Restaurant.ts */

// Import Dish type first
import type { Dish } from './Dish'; // Using 'import type' is good practice

// Represents a basic restaurant structure, used in lists/search
export interface Restaurant {
    id: number;
    name: string;
    city_id?: number | null;
    city_name?: string | null;
    neighborhood_id?: number | null;
    neighborhood_name?: string | null;
    address?: string | null;
    google_place_id?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    adds?: number;
    created_at?: string; // Or Date
    updated_at?: string; // Or Date
    tags: string[];
    // Add other fields if necessary
}

// Represents the detailed restaurant view, including dishes
export interface RestaurantDetail extends Restaurant {
    // Assuming 'dishes' is an array of Dish objects
    dishes: Dish[]; // Reference Dish type from its own file
}

// Note: If errors persist in this file, double-check:
// 1. The definition and export of the `Dish` type in `src/types/Dish.ts`.
// 2. Your `tsconfig.json` settings for module resolution and type checking.
// 3. Any potential subtle syntax errors missed.