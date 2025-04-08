/* src/types/Dish.ts */

// Represents a basic dish structure, often used in lists/cards
export interface Dish {
    id: number;
    name: string;
    adds?: number; // Optional: Depending on context where Dish type is used
    created_at?: string; // Or Date
    restaurant_id?: number | null;
    restaurant_name?: string | null; // Denormalized name
    tags: string[];
    // Add other common fields if applicable
    city?: string | null;
    neighborhood?: string | null;
}

// Represents the detailed view of a dish
export interface DishDetail extends Dish {
    // Inherits fields from Dish
    // Add fields specific to the detail view if any
    // Example: Maybe description, full list of votes, etc.
    // For now, assuming it's the same as the base Dish type plus potentially more guaranteed fields
}

// If needed, define types for Dish creation/update payloads
// export interface CreateDishData { ... }
// export interface UpdateDishData { ... }