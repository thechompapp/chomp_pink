// src/types/Neighborhood.ts

// Based on the backend model (neighborhoodModel.ts) and DB schema (schema.sql/doof_dump.txt)
export interface Neighborhood {
    id: number;
    name: string;
    city_id: number;
    city_name?: string; // Often included from JOINs
    coordinates?: any; // Use appropriate GeoJSON type if needed e.g., GeoJSON.Point | GeoJSON.Polygon
    zipcode_ranges: string[] | null; // Matches DB schema (TEXT[] which can be NULL)
    created_at?: string | Date;
    updated_at?: string | Date;
  }
  
  // Type for creation might omit id, timestamps, city_name
  export type CreateNeighborhoodData = Omit<Neighborhood, 'id' | 'created_at' | 'updated_at' | 'city_name'>;
  // Type for update allows partial changes, requires id outside typically
  export type UpdateNeighborhoodData = Partial<Omit<Neighborhood, 'id' | 'created_at' | 'updated_at' | 'city_name'>>;