/* src/types/Filters.ts */
export interface City {
    id: number;
    name: string;
}

export interface Neighborhood {
    id: number;
    name: string;
    city_id?: number; // Optional if not always present
}

export interface Cuisine { // Essentially a Hashtag with category='cuisine'
    id: number;
    name: string;
    category?: string;
}