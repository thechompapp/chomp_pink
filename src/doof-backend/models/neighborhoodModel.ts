// src/doof-backend/models/neighborhoodModel.ts
import pool from '../db'; // Assuming db connection pool is exported from here
import type { QueryResultRow, QueryResult } from 'pg';

// Define Neighborhood type matching frontend/shared types if possible, or define locally
// Make sure it includes zipcode_ranges
export interface Neighborhood {
    id: number;
    name: string;
    city_id: number;
    created_at?: Date | string;
    updated_at?: Date | string;
    zipcode_ranges?: string[] | null; // Added zipcode_ranges
}

// Type for raw DB row results, including joined city_name
interface RawNeighborhoodRow extends Neighborhood, QueryResultRow {
    city_name?: string; // From JOIN
}

// Type for creation (omit id and timestamps)
type CreateNeighborhoodData = Omit<Neighborhood, 'id' | 'created_at' | 'updated_at'>;
// Type for update (all optional except id)
type UpdateNeighborhoodData = Partial<Omit<Neighborhood, 'id' | 'created_at' | 'updated_at'>>;

// --- Helper Functions ---

// Format DB row to Neighborhood type, including city_name if present
const formatNeighborhood = (row: RawNeighborhoodRow | undefined): (Neighborhood & { city_name?: string }) | null => {
    if (!row || typeof row.id !== 'number') return null;
    return {
        id: row.id,
        name: row.name,
        city_id: Number(row.city_id), // Ensure city_id is number
        created_at: row.created_at,
        updated_at: row.updated_at,
        zipcode_ranges: Array.isArray(row.zipcode_ranges) ? row.zipcode_ranges.filter(Boolean).map(String) : null, // Ensure it's string array or null
        city_name: row.city_name ?? undefined, // Include joined city name
    };
};

// Clean and validate incoming zipcodes (string to array)
const prepareZipcodeRanges = (zipcodesInput: string | string[] | undefined | null): string[] | null => {
    if (!zipcodesInput) {
        return null;
    }
    const zipcodes = Array.isArray(zipcodesInput)
        ? zipcodesInput
        : String(zipcodesInput).split(',').map(z => z.trim()).filter(Boolean);

    // Basic validation (adjust regex as needed for different formats like ZIP+4)
    const validZipRegex = /^\d{5}$/;
    const validZipcodes = zipcodes.filter(z => validZipRegex.test(z));

    if (validZipcodes.length === 0) {
        return null; // Return null if no valid zipcodes found
    }
    // Optional: Add warning if some input zipcodes were invalid?
    // if (validZipcodes.length !== zipcodes.length) {
    //     console.warn(`[NeighborhoodModel] Some invalid zipcodes were filtered out from input:`, zipcodesInput);
    // }
    return validZipcodes.sort(); // Sort for consistency
};

// --- Model Functions ---

/**
 * Get all neighborhoods with optional pagination, sorting, and filtering.
 * Includes city name and zipcodes for context.
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
    const validSortColumns = ['neighborhoods.id', 'neighborhoods.name', 'cities.name', 'neighborhoods.created_at', 'neighborhoods.updated_at']; // Added updated_at
    const safeSortBy = validSortColumns.includes(sortBy) ? sortBy : 'neighborhoods.name';
    const safeSortOrder = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    // Select zipcode_ranges as well
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
    let paramIndex = 1; // Use paramIndex for safety

    if (search) {
        queryParams.push(`%${search}%`);
        countQueryParams.push(`%${search}%`);
        // Search on neighborhood name and city name
        whereClauses.push(`(neighborhoods.name ILIKE $${paramIndex} OR cities.name ILIKE $${paramIndex})`);
        paramIndex++;
    }

    if (cityId) {
        queryParams.push(cityId);
        countQueryParams.push(cityId);
        whereClauses.push(`neighborhoods.city_id = $${paramIndex}`);
        paramIndex++;
    }

    if (whereClauses.length > 0) {
        const whereString = ' WHERE ' + whereClauses.join(' AND ');
        query += whereString;
        // countQuery already includes the JOIN correctly
    }

    // Get total count matching filters (before pagination)
    const totalResult = await pool.query(countQuery + (whereClauses.length > 0 ? ' WHERE ' + whereClauses.join(' AND ') : ''), countQueryParams);
    const total = parseInt(totalResult.rows[0].count, 10);

    // Add sorting and pagination to main query
    query += ` ORDER BY ${safeSortBy} ${safeSortOrder}`;
    queryParams.push(limit);
    query += ` LIMIT $${paramIndex++}`;
    queryParams.push(offset);
    query += ` OFFSET $${paramIndex++}`;

    const result: QueryResult<RawNeighborhoodRow> = await pool.query(query, queryParams);
    const formattedNeighborhoods = (result.rows || [])
        .map(formatNeighborhood)
        .filter((n): n is (Neighborhood & { city_name: string }) => n !== null); // Type guard

    return { neighborhoods: formattedNeighborhoods, total };
};

/**
 * Get a single neighborhood by ID.
 * Includes city name and zipcodes for context.
 */
export const getNeighborhoodById = async (id: number): Promise<(Neighborhood & { city_name?: string }) | null> => {
    if (isNaN(id) || id <= 0) {
        console.warn(`[NeighborhoodModel getNeighborhoodById] Invalid ID: ${id}`);
        return null;
    }
    // Select zipcode_ranges
    const query = `
        SELECT
            neighborhoods.*,
            cities.name as city_name
        FROM neighborhoods
        JOIN cities ON neighborhoods.city_id = cities.id
        WHERE neighborhoods.id = $1
    `;
    const result = await pool.query<RawNeighborhoodRow>(query, [id]);
    return formatNeighborhood(result.rows[0]);
};

/**
 * Create a new neighborhood.
 * Handles zipcode_ranges input (expects comma-separated string or array).
 */
export const createNeighborhood = async (data: CreateNeighborhoodData): Promise<Neighborhood | null> => {
    const { name, city_id, zipcode_ranges } = data;

    // Basic validation
    if (!name || !city_id || typeof city_id !== 'number' || city_id <= 0) {
        throw new Error("Neighborhood name and a valid City ID are required.");
    }

    // Prepare zipcode array
    const preparedZipcodes = prepareZipcodeRanges(zipcode_ranges);

    // Insert zipcode_ranges
    const query = `
        INSERT INTO neighborhoods (name, city_id, zipcode_ranges, created_at, updated_at)
        VALUES ($1, $2, $3, NOW(), NOW())
        RETURNING *
    `;
    try {
        const result = await pool.query<RawNeighborhoodRow>(query, [name, city_id, preparedZipcodes]);
        return formatNeighborhood(result.rows[0]);
    } catch (error: any) {
        if (error.code === '23503') { // Foreign key violation
            throw new Error(`Create failed: City with ID ${city_id} does not exist.`);
        }
        // Consider unique constraint on name+city_id if needed
        console.error(`[NeighborhoodModel createNeighborhood] Error:`, error);
        throw error; // Re-throw other errors
    }
};

/**
 * Update an existing neighborhood.
 * Handles zipcode_ranges input (expects comma-separated string or array).
 */
export const updateNeighborhood = async (id: number, data: UpdateNeighborhoodData): Promise<Neighborhood | null> => {
     if (isNaN(id) || id <= 0) {
        console.warn(`[NeighborhoodModel updateNeighborhood] Invalid ID: ${id}`);
        return null;
     }

    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
        if (!data.name.trim()) throw new Error("Neighborhood name cannot be empty.");
        fields.push(`name = $${paramIndex++}`);
        values.push(data.name.trim());
    }
    if (data.city_id !== undefined) {
        if (typeof data.city_id !== 'number' || data.city_id <= 0) throw new Error("Invalid City ID.");
        fields.push(`city_id = $${paramIndex++}`);
        values.push(data.city_id);
    }
    if (data.zipcode_ranges !== undefined) { // Handle null to clear zipcodes
        const preparedZipcodes = prepareZipcodeRanges(data.zipcode_ranges);
        fields.push(`zipcode_ranges = $${paramIndex++}`);
        values.push(preparedZipcodes); // Pass null if input was empty/invalid
    }

    if (fields.length === 0) {
        return getNeighborhoodById(id); // No fields to update
    }

    fields.push(`updated_at = NOW()`); // Always update timestamp

    const query = `
        UPDATE neighborhoods
        SET ${fields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
    `;
    values.push(id); // Add ID for WHERE clause

    try {
        const result = await pool.query<RawNeighborhoodRow>(query, values);
        if (result.rowCount === 0) return null; // Neighborhood not found
        // Refetch to include city_name after update
        return getNeighborhoodById(id);
    } catch (error: any) {
        if (error.code === '23503') { // Foreign key violation
            throw new Error(`Update failed: City with ID ${data.city_id} does not exist.`);
        }
        console.error(`[NeighborhoodModel updateNeighborhood] Error updating ID ${id}:`, error);
        throw error;
    }
};

/**
 * Delete a neighborhood by ID.
 * Returns true if deleted, false otherwise.
 */
export const deleteNeighborhood = async (id: number): Promise<boolean> => {
    if (isNaN(id) || id <= 0) {
        console.warn(`[NeighborhoodModel deleteNeighborhood] Invalid ID: ${id}`);
        return false;
    }
    const query = 'DELETE FROM neighborhoods WHERE id = $1';
    try {
        const result = await pool.query(query, [id]);
        return result.rowCount !== null && result.rowCount > 0;
    } catch (error: any) {
        if (error.code === '23503') { // Foreign key constraint (e.g., restaurants still exist)
            console.error(`[NeighborhoodModel deleteNeighborhood] Failed for ID ${id} due to foreign key violation.`);
            throw new Error(`Cannot delete neighborhood: It is referenced by other records (e.g., restaurants).`);
        }
        console.error(`[NeighborhoodModel deleteNeighborhood] Error deleting ID ${id}:`, error);
        throw error;
    }
};

/**
 * Find a single neighborhood by a zipcode.
 * Returns the first match found, prioritizing neighborhoods with fewer zipcodes for more specific matches.
 */
export const findNeighborhoodByZipcode = async (zipcode: string): Promise<(Neighborhood & { city_name?: string }) | null> => {
    // Basic validation
    const validZipRegex = /^\d{5}$/;
    if (!zipcode || !validZipRegex.test(zipcode)) {
        console.warn(`[NeighborhoodModel findNeighborhoodByZipcode] Invalid zipcode provided: ${zipcode}`);
        return null;
    }

    // Query using array containment operator, prioritize by number of zipcodes
    const query = `
        SELECT
            n.*,
            c.name as city_name,
            array_length(n.zipcode_ranges, 1) as zipcode_count
        FROM neighborhoods n
        JOIN cities c ON n.city_id = c.id
        WHERE $1 = ANY(n.zipcode_ranges)
        ORDER BY array_length(n.zipcode_ranges, 1) ASC, n.id ASC
        LIMIT 1;
    `;

    try {
        const result = await pool.query<RawNeighborhoodRow & { zipcode_count: number }>(query, [zipcode]);
        if (result.rowCount === 0) {
            return null; // No neighborhood found for this zipcode
        }
        return formatNeighborhood(result.rows[0]);
    } catch (error) {
        console.error(`[NeighborhoodModel findNeighborhoodByZipcode] Error searching for zipcode ${zipcode}:`, error);
        throw error; // Re-throw error
    }
};

/**
 * Get all cities for dropdowns.
 * (Helper function often needed alongside neighborhood management)
 */
export const getAllCitiesSimple = async (): Promise<{ id: number; name: string }[]> => {
    const result = await pool.query('SELECT id, name FROM cities ORDER BY name');
    return result.rows;
};