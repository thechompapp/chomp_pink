/* src/types/Filters.ts */
export interface City {
    id: number;
    name: string;
}

export interface Neighborhood {
    id: number;
    name: string;
    city_id: number; // Changed to required based on schema
    city_name?: string; // *** ADDED: Optional city name for display ***
}

export interface Cuisine { // Essentially a Hashtag with category='cuisine'
    id: number;
    name: string;
    category?: string;
}