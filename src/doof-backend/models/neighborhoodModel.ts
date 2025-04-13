// src/doof-backend/models/neighborhoodModel.ts
import pool from '../db'; // Assuming db connection pool is exported from here
import type { QueryResultRow, QueryResult } from 'pg';

// Define Neighborhood type matching frontend/shared types if possible, or define locally
// Make sure it includes zipcode_ranges / zip_codes
export interface Neighborhood {
    id: number;
    name: string;
    city_id: number;
    created_at?: Date | string;
    updated_at?: Date | string;
    // Match the column name used in your schema/dump ('zipcode_ranges')
    zipcode_ranges?: string[] | null; // Use 'zipcode_ranges' based on schema.sql/dump
}

// Type for raw DB row results, including joined city_name
interface RawNeighborhoodRow extends Neighborhood, QueryResultRow {
    city_name?: string; // From JOIN
}

// Type for creation (omit id and timestamps)
// Ensure this aligns with your frontend/shared types if possible
type CreateNeighborhoodData = {
    name: string;
    city_id: number;
    zip_codes?: string | string[] | null; // Accept various inputs
};

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
        // Use the actual column name 'zipcode_ranges' from DB
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

    // Select zip_codes as well
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

    const whereString = whereClauses.length > 0 ? ' WHERE ' + whereClauses.join(' AND ') : '';
    query += whereString;
    const countWhereString = whereClauses.length > 0 ? ' WHERE ' + whereClauses.map((_, i) => whereClauses[i].replace(`$${i + 1 + (search ? 1 : 0) + (cityId ? 1 : 0)}`, `$${i + 1}`)).join(' AND ') : '';


    // Get total count matching filters (before pagination)
    const totalResult = await pool.query(countQuery + countWhereString, countQueryParams);
    const total = parseInt(totalResult.rows[0].count, 10);

    // Add sorting and pagination to main query
    query += ` ORDER BY ${safeSortBy} ${safeSortOrder} NULLS LAST`; // Added NULLS LAST
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
    // Select zip_codes
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
 * Handles zip_codes input (expects comma-separated string or array).
 */
export const createNeighborhood = async (data: CreateNeighborhoodData): Promise<Neighborhood | null> => {
    const { name, city_id, zip_codes } = data;

    // Basic validation
    if (!name || !city_id || typeof city_id !== 'number' || city_id <= 0) {
        throw new Error("Neighborhood name and a valid City ID are required.");
    }

    // Prepare zipcode array
    const preparedZipcodes = prepareZipcodeRanges(zip_codes);

    // Insert zip_codes
    const query = `
        INSERT INTO neighborhoods (name, city_id, zipcode_ranges, created_at, updated_at)
        VALUES ($1, $2, $3, NOW(), NOW())
        RETURNING *
    `;
    try {
        const result = await pool.query<RawNeighborhoodRow>(query, [name, city_id, preparedZipcodes]);
        // Refetch to include city_name after insert
        return getNeighborhoodById(result.rows[0].id);
    } catch (error: any) {
        if (error.code === '23503') { // Foreign key violation
            throw new Error(`Create failed: City with ID ${city_id} does not exist.`);
        }
        // Consider unique constraint on name+city_id if needed
         if (error.code === '23505') { // Unique constraint violation
             throw new Error(`Create failed: A neighborhood named "${name}" likely already exists in this city.`);
         }
        console.error(`[NeighborhoodModel createNeighborhood] Error:`, error);
        throw error; // Re-throw other errors
    }
};

/**
 * Update an existing neighborhood.
 * Handles zip_codes input (expects comma-separated string or array).
 */
export const updateNeighborhood = async (id: number, data: UpdateNeighborhoodData): Promise<(Neighborhood & { city_name?: string }) | null> => {
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
         console.log(`[NeighborhoodModel updateNeighborhood] No valid fields provided for update on ID ${id}.`);
        return getNeighborhoodById(id); // No fields to update
    }

    fields.push(`updated_at = NOW()`); // Always update timestamp

    const query = `
        UPDATE neighborhoods
        SET ${fields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING id
    `;
    values.push(id); // Add ID for WHERE clause

    try {
        const result = await pool.query<{id: number}>(query, values);
        if (result.rowCount === 0) {
             console.warn(`[NeighborhoodModel updateNeighborhood] Neighborhood with ID ${id} not found for update.`);
             return null; // Neighborhood not found
        }
        // Refetch to include city_name after update
        return getNeighborhoodById(id);
    } catch (error: any) {
        if (error.code === '23503') { // Foreign key violation
            throw new Error(`Update failed: City with ID ${data.city_id} does not exist.`);
        }
        if (error.code === '23505') { // Unique constraint violation
             throw new Error(`Update failed: A neighborhood named "${data.name}" likely already exists in this city.`);
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
 * Returns the first match found based on DB order (typically ID).
 * Includes city name.
 */
export const findNeighborhoodByZipcode = async (zipcode: string): Promise<(Neighborhood & { city_name?: string }) | null> => {
    // Basic validation
    const validZipRegex = /^\d{5}$/;
    if (!zipcode || !validZipRegex.test(zipcode)) {
        console.warn(`[NeighborhoodModel findNeighborhoodByZipcode] Invalid zipcode provided: ${zipcode}`);
        return null;
    }

    // Query using array containment operator with proper casting
    const query = `
        SELECT
            n.*,
            c.name as city_name
        FROM neighborhoods n
        JOIN cities c ON n.city_id = c.id
        WHERE $1::text = ANY(n.zipcode_ranges::text[])
        ORDER BY n.id ASC
        LIMIT 1;
    `;

    try {
        const result = await pool.query<RawNeighborhoodRow>(query, [zipcode]);
        if (result.rowCount === 0) {
            console.log(`[NeighborhoodModel findNeighborhoodByZipcode] No neighborhood found for zipcode ${zipcode}`);
            return null;
        }
        const neighborhood = formatNeighborhood(result.rows[0]);
        console.log(`[NeighborhoodModel findNeighborhoodByZipcode] Found neighborhood for zipcode ${zipcode}:`, neighborhood);
        return neighborhood;
    } catch (error) {
        console.error(`[NeighborhoodModel findNeighborhoodByZipcode] Error searching for zipcode ${zipcode}:`, error);
        throw error;
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