// src/doof-backend/models/neighborhoodModel.ts
import pool from '../db'; // Assuming db connection pool is exported from here
import { Neighborhood } from '../../types'; // Assuming Neighborhood type exists in shared types

// Type for creation (omit id)
type CreateNeighborhoodData = Omit<Neighborhood, 'id'>;
// Type for update (all optional)
type UpdateNeighborhoodData = Partial<CreateNeighborhoodData>;

/**
 * Get all neighborhoods with optional pagination, sorting, and filtering.
 * Includes city name for context.
 */
export const getAllNeighborhoods = async (
    limit: number = 20,
    offset: number = 0,
    sortBy: string = 'neighborhoods.name', // Default sort column
    sortOrder: 'ASC' | 'DESC' = 'ASC',
    search?: string,
    cityId?: number
): Promise<{ neighborhoods: (Neighborhood & { city_name: string })[], total: number }> => {
    // Validate sort columns to prevent SQL injection
    const validSortColumns = ['neighborhoods.id', 'neighborhoods.name', 'cities.name', 'neighborhoods.created_at']; // Add relevant columns
    const safeSortBy = validSortColumns.includes(sortBy) ? sortBy : 'neighborhoods.name';
    const safeSortOrder = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    let query = `
        SELECT
            neighborhoods.*,
            cities.name as city_name
        FROM neighborhoods
        JOIN cities ON neighborhoods.city_id = cities.id
    `;
    const countQuery = `
        SELECT COUNT(neighborhoods.id)
        FROM neighborhoods
        JOIN cities ON neighborhoods.city_id = cities.id
    `;
    let whereClauses: string[] = [];
    let queryParams: (string | number)[] = [];
    let countQueryParams: (string | number)[] = [];

    if (search) {
        queryParams.push(`%${search}%`);
        countQueryParams.push(`%${search}%`);
        // Search on neighborhood name and city name
        whereClauses.push(`(neighborhoods.name ILIKE $${queryParams.length} OR cities.name ILIKE $${queryParams.length})`);
    }

    if (cityId) {
        queryParams.push(cityId);
        countQueryParams.push(cityId);
        whereClauses.push(`neighborhoods.city_id = $${queryParams.length}`);
    }

    if (whereClauses.length > 0) {
        query += ' WHERE ' + whereClauses.join(' AND ');
    }

    // Get total count matching filters (before pagination)
    const totalResult = await pool.query(countQuery + (whereClauses.length > 0 ? ' WHERE ' + whereClauses.join(' AND ') : ''), countQueryParams);
    const total = parseInt(totalResult.rows[0].count, 10);

    // Add sorting and pagination to main query
    query += ` ORDER BY ${safeSortBy} ${safeSortOrder}`;
    queryParams.push(limit);
    query += ` LIMIT $${queryParams.length}`;
    queryParams.push(offset);
    query += ` OFFSET $${queryParams.length}`;

    const result = await pool.query(query, queryParams);
    return { neighborhoods: result.rows, total };
};

/**
 * Get a single neighborhood by ID.
 * Includes city name for context.
 */
export const getNeighborhoodById = async (id: number): Promise<(Neighborhood & { city_name: string }) | null> => {
    const query = `
        SELECT
            neighborhoods.*,
            cities.name as city_name
        FROM neighborhoods
        JOIN cities ON neighborhoods.city_id = cities.id
        WHERE neighborhoods.id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows.length > 0 ? result.rows[0] : null;
};

/**
 * Create a new neighborhood.
 */
export const createNeighborhood = async (data: CreateNeighborhoodData): Promise<Neighborhood> => {
    const { name, city_id } = data;
    // Add validation as needed (e.g., check if city_id exists)
    const query = `
        INSERT INTO neighborhoods (name, city_id)
        VALUES ($1, $2)
        RETURNING *
    `;
    const result = await pool.query(query, [name, city_id]);
    return result.rows[0];
};

/**
 * Update an existing neighborhood.
 */
export const updateNeighborhood = async (id: number, data: UpdateNeighborhoodData): Promise<Neighborhood | null> => {
    const fields = Object.keys(data).filter(key => (data as any)[key] !== undefined);
    if (fields.length === 0) {
        // If no fields to update, maybe return current data or throw error
        return getNeighborhoodById(id); // Returning current data for simplicity
    }

    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    const queryParams = [id, ...fields.map(field => (data as any)[field])];

    const query = `
        UPDATE neighborhoods
        SET ${setClause}
        WHERE id = $1
        RETURNING *
    `;

    const result = await pool.query(query, queryParams);
    return result.rows.length > 0 ? result.rows[0] : null;
};

/**
 * Delete a neighborhood by ID.
 * Returns true if deleted, false otherwise.
 */
export const deleteNeighborhood = async (id: number): Promise<boolean> => {
    // Consider checking for dependencies (e.g., restaurants linked to this neighborhood) before deleting
    const query = 'DELETE FROM neighborhoods WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rowCount !== null && result.rowCount > 0;
};

/**
 * Get all cities for dropdowns.
 * (Helper function often needed alongside neighborhood management)
 */
export const getAllCitiesSimple = async (): Promise<{ id: number; name: string }[]> => {
    const result = await pool.query('SELECT id, name FROM cities ORDER BY name');
    return result.rows;
};