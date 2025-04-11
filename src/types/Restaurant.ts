/* src/types/Restaurant.ts */

// Import Dish type first
import type { Dish } from './Dish'; // Using 'import type' is good practice

// Represents a basic restaurant structure, used in lists/search
export interface Restaurant extends Record<string, any> { // Allow other properties implicitly
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
    created_at?: string | Date;
    updated_at?: string | Date;
    tags?: string[]; // Keep tags as array of strings

    // --- NEW Fields based on design ---
    rating?: number | string | null; // Use string initially if API might return formatted "4.7"
    primary_category?: string | null; // e.g., "Italian" (derived or separate field)
    phone?: string | null; // e.g., (212) 925-3200
    website?: string | null; // e.g., www.piccolacucinagroup.com
    hours?: string | null; // e.g., "12:00 PM - 11:00 PM" (could be more structured)
    instagram_handle?: string | null; // e.g., piccolacucinagroup (without @)
    transit_info?: string | null; // e.g., Take the C/E train to Spring St...
    the_take_review?: string | null; // Text for "The Take" section
    the_take_reviewer_handle?: string | null; // e.g., @marysfoodreviews
    the_take_reviewer_verified?: boolean; // Flag for verified badge
}

// Interface for lists featuring this restaurant
export interface FeaturedList {
    id: number;
    name: string;
    creator_handle?: string | null;
    saved_count?: number; // followers in the image
    // Add any other fields needed by ListCard if reusing it
    item_count?: number;
    is_following?: boolean;
    user_id?: number | null;
    is_public?: boolean;
    type?: 'mixed' | 'restaurant' | 'dish';
    tags?: string[];
}

// Interface for similar places
export interface SimilarPlace {
    id: number;
    name: string;
    distance?: string | null; // e.g., 0.8mi
    // Add any other fields needed by RestaurantCard if reusing it
    city_name?: string | null;
    neighborhood_name?: string | null;
    adds?: number;
    tags?: string[];
}


// Represents the detailed restaurant view, including dishes and new sections
export interface RestaurantDetail extends Restaurant {
    dishes?: Dish[]; // Array of Dish objects (optional if fetched separately)

    // --- NEW Sections Data ---
    featured_on_lists?: FeaturedList[];
    similar_places?: SimilarPlace[];
}