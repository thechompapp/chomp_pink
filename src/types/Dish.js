/* src/types/Dish.js */
/* REMOVED: All TypeScript interfaces (Dish, DishDetail) */
// This file defines data structures previously used as TypeScript types.
// In JavaScript, these are effectively comments describing expected object shapes.
// You can keep them for documentation or remove the file if types are managed elsewhere.

/*
Represents a basic dish structure, often used in lists/cards
Expected shape:
{
    id: number;
    name: string;
    adds?: number; // Optional
    created_at?: string; // Or Date
    restaurant_id?: number | null;
    restaurant_name?: string | null;
    tags: string[];
    city?: string | null;
    neighborhood?: string | null;
}

Represents the detailed view of a dish
Expected shape (inherits from basic Dish):
{
    // Inherits fields from Dish
    // Add fields specific to the detail view if any
}
*/

// Example of exporting a validation function (optional)
/*
export function validateDish(data) {
    return data && typeof data.id === 'number' && typeof data.name === 'string' && Array.isArray(data.tags);
}
*/

// If nothing else is needed, you can leave this file empty or remove it.
// If exporting helper/validation functions, keep the export statements.