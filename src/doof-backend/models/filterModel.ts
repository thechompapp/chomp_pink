/* src/doof-backend/models/filterModel.ts */
import db from '../db/index.js';

export interface City {
    id: number;
    name: string;
}

export interface Neighborhood {
    id: number;
    name: string;
    city_id?: number;
}

export interface Cuisine {
    id: number;
    name: string;
    category?: string;
}

export const getCities = async (): Promise<City[]> => {
    const query = `SELECT id, name FROM Cities ORDER BY name`;
    const result = await db.query<City>(query);
    return (result.rows || []).map(city => ({
        ...city,
        id: typeof city.id === 'string' ? parseInt(city.id, 10) : city.id
    }));
};

export const getCuisines = async (): Promise<Cuisine[]> => {
    const query = `SELECT id, name, category FROM Hashtags WHERE category = 'cuisine' ORDER BY name`;
    const result = await db.query<Cuisine>(query);
    return result.rows || [];
};

export const getNeighborhoodsByCity = async (cityId: number): Promise<Neighborhood[]> => {
    if (typeof cityId !== 'number' || isNaN(cityId) || cityId <= 0) {
        console.warn(`[FilterModel] Invalid cityId provided: ${cityId}`);
        return [];
    }

    const query = `SELECT id, name, city_id FROM Neighborhoods WHERE city_id = $1 ORDER BY name`;
    const result = await db.query<Neighborhood>(query, [cityId]);
    return result.rows || [];
};