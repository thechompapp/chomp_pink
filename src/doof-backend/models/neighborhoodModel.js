/* src/doof-backend/models/neighborhoodModel.js */
import pool from '../db/index.js';

// --- Helper Functions ---
const formatNeighborhood = (row) => {
    if (!row || typeof row.id !== 'number') return null; // Basic check for row validity

    // Corrected zipcode_ranges handling:
    // Assume row.zipcode_ranges is either null, undefined, or an array (parsed by pg driver)
    const zipcodes = (Array.isArray(row.zipcode_ranges)
                      ? row.zipcode_ranges // Use if already an array
                      : []                  // Default to empty array otherwise
                    )
                    .map(String)        // Ensure all elements are strings
                    .filter(Boolean);    // Remove empty strings

    return {
        id: row.id,
        name: row.name,
        city_id: Number(row.city_id),
        created_at: row.created_at,
        updated_at: row.updated_at,
        zipcode_ranges: zipcodes, // Assign the processed array
        city_name: row.city_name ?? undefined, // Use undefined or null consistently
    };
};


// Parses input (string or array) into a sorted array of valid 5-digit zipcodes or null
const prepareZipcodeRanges = (zipcodesInput) => {
    if (zipcodesInput === null || zipcodesInput === undefined) return null;

    const zipcodes = Array.isArray(zipcodesInput)
        ? zipcodesInput.map(String) // Ensure strings if input is array
        : String(zipcodesInput).split(',').map(z => z.trim()).filter(Boolean); // Split string

    const validZipRegex = /^\d{5}$/;
    const validZipcodes = zipcodes.filter(z => validZipRegex.test(z));

    // Return null if no valid zipcodes were found, otherwise return sorted array
    return validZipcodes.length === 0 ? null : validZipcodes.sort();
};

// --- Model Functions ---

// getAllNeighborhoods now uses the corrected formatter
export const getAllNeighborhoods = async (limit = 20, offset = 0, sortBy = 'neighborhoods.name', sortOrder = 'ASC', search, cityId) => {
    // (Validation logic remains the same)
    const validSortColumns = ['neighborhoods.id', 'neighborhoods.name', 'cities.name', 'neighborhoods.created_at', 'neighborhoods.updated_at'];
    const safeSortBy = validSortColumns.includes(sortBy) ? sortBy : 'neighborhoods.name';
    const safeSortOrder = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    let query = `SELECT neighborhoods.*, cities.name as city_name FROM neighborhoods JOIN cities ON neighborhoods.city_id = cities.id`;
    const countQuery = `SELECT COUNT(neighborhoods.id) FROM neighborhoods JOIN cities ON neighborhoods.city_id = cities.id`;
    let whereClauses = [];
    let queryParams = [];
    let countQueryParams = [];
    let paramIndex = 1;

    if (search) {
        queryParams.push(`%${search}%`);
        countQueryParams.push(`%${search}%`);
        whereClauses.push(`(neighborhoods.name ILIKE $${paramIndex} OR cities.name ILIKE $${paramIndex})`);
        paramIndex++;
    }
    if (cityId != null) { // Check for null/undefined
        queryParams.push(cityId);
        countQueryParams.push(cityId);
        whereClauses.push(`neighborhoods.city_id = $${paramIndex}`);
        paramIndex++;
    }

    const whereString = whereClauses.length > 0 ? ' WHERE ' + whereClauses.join(' AND ') : '';
    query += whereString;
    // Corrected: Ensure countQueryParams align with the indices used in countWhereString
    const countWhereString = whereClauses.length > 0 ? ' WHERE ' + whereClauses.map((clause, i) => clause.replace(`$${i + 1}`, `$${i + 1}`)).join(' AND ') : '';


    const totalResult = await pool.query(countQuery + countWhereString, countQueryParams);
    const total = parseInt(totalResult.rows[0]?.count || '0', 10);

    query += ` ORDER BY ${safeSortBy} ${safeSortOrder} NULLS LAST`;
    queryParams.push(limit);
    query += ` LIMIT $${paramIndex++}`; // Use current paramIndex
    queryParams.push(offset);
    query += ` OFFSET $${paramIndex++}`; // Use incremented paramIndex

    const result = await pool.query(query, queryParams);
    // Apply the corrected formatter here
    const formattedNeighborhoods = (result.rows || [])
        .map(formatNeighborhood) // Use corrected formatter
        .filter((n) => n !== null);

    return { neighborhoods: formattedNeighborhoods, total };
};

// getNeighborhoodById uses the corrected formatter and SQL JOIN alias
export const getNeighborhoodById = async (id) => {
    if (isNaN(id) || id <= 0) {
        console.warn(`[NeighborhoodModel getNeighborhoodById] Invalid ID: ${id}`);
        return null;
    }
    // *** FIX: Added alias 'c' to the JOIN clause ***
    const query = `
        SELECT neighborhoods.*, c.name as city_name
        FROM neighborhoods
        JOIN cities c ON neighborhoods.city_id = c.id
        WHERE neighborhoods.id = $1
    `;
    const result = await pool.query(query, [id]);
    return formatNeighborhood(result.rows[0]); // Use corrected formatter
};


// createNeighborhood uses prepareZipcodeRanges and refetches using getNeighborhoodById (which uses corrected formatter)
export const createNeighborhood = async (data) => {
    const { name, city_id, zipcode_ranges } = data;
    if (!name || !city_id || typeof city_id !== 'number' || city_id <= 0) {
        throw new Error("Neighborhood name and a valid City ID are required.");
    }
    const preparedZipcodes = prepareZipcodeRanges(zipcode_ranges);
    const query = `INSERT INTO neighborhoods (name, city_id, zipcode_ranges, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW()) RETURNING id`; // Only return ID
    try {
        const result = await pool.query(query, [name, city_id, preparedZipcodes]);
        if (result.rows.length === 0 || !result.rows[0].id) {
             throw new Error("Neighborhood creation failed, no ID returned.");
        }
        // Refetch the created neighborhood to get all fields correctly formatted
        return getNeighborhoodById(result.rows[0].id);
    } catch (error) {
        if (error.code === '23503') { throw new Error(`Create failed: City with ID ${city_id} does not exist.`); }
        if (error.code === '23505') { throw new Error(`Create failed: A neighborhood named "${name}" likely already exists in this city.`); }
        console.error(`[NeighborhoodModel createNeighborhood] Error:`, error);
        throw error;
    }
};

// updateNeighborhood uses prepareZipcodeRanges and refetches using getNeighborhoodById (which uses corrected formatter)
export const updateNeighborhood = async (id, data) => {
     if (isNaN(id) || id <= 0) {
        console.warn(`[NeighborhoodModel updateNeighborhood] Invalid ID: ${id}`);
        return null;
     }
    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (data.name !== undefined) { if(String(data.name).trim()) { fields.push(`name = $${paramIndex++}`); values.push(data.name.trim());} else { throw new Error("Neighborhood name cannot be empty.")} }
    if (data.city_id !== undefined) { const cityIdNum = Number(data.city_id); if(!isNaN(cityIdNum) && cityIdNum > 0) {fields.push(`city_id = $${paramIndex++}`); values.push(cityIdNum);} else { throw new Error("Invalid City ID provided.")} }
    // Use correct key 'zipcode_ranges' when checking if it exists in updateData
    if ('zipcode_ranges' in data) {
        const preparedZipcodes = prepareZipcodeRanges(data.zipcode_ranges);
        fields.push(`zipcode_ranges = $${paramIndex++}`);
        values.push(preparedZipcodes); // Pass null or the array
    }

    if (fields.length === 0) { return getNeighborhoodById(id); }

    fields.push(`updated_at = NOW()`);
    const query = `UPDATE neighborhoods SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING id`; // Only return ID
    values.push(id);

    try {
        const result = await pool.query(query, values);
        if (result.rowCount === 0) { return null; }
        // Refetch the updated neighborhood
        return getNeighborhoodById(id);
    } catch (error) {
        if (error.code === '23503') { throw new Error(`Update failed: City with ID ${data.city_id} does not exist.`); }
        if (error.code === '23505') { throw new Error(`Update failed: A neighborhood named "${data.name}" likely already exists in this city.`); }
        console.error(`[NeighborhoodModel updateNeighborhood] Error updating ID ${id}:`, error);
        throw error;
    }
};

// deleteNeighborhood remains the same
export const deleteNeighborhood = async (id) => {
    if (isNaN(id) || id <= 0) {
        console.warn(`[NeighborhoodModel deleteNeighborhood] Invalid ID: ${id}`);
        return false;
    }
    const query = 'DELETE FROM neighborhoods WHERE id = $1 RETURNING id';
    try {
        const result = await pool.query(query, [id]);
        return (result.rowCount ?? 0) > 0;
    } catch (error) {
        console.error(`[NeighborhoodModel deleteNeighborhood] Error deleting ID ${id}:`, error);
        throw error;
    }
};

// findNeighborhoodByZipcode uses the corrected formatter
export const findNeighborhoodByZipcode = async (zipcode) => {
    const validZipRegex = /^\d{5}$/;
    if (!zipcode || !validZipRegex.test(zipcode)) {
        console.warn(`[NeighborhoodModel findNeighborhoodByZipcode] Invalid zipcode provided: ${zipcode}`);
        return null;
    }
    const query = `
        SELECT n.*, c.name as city_name
        FROM neighborhoods n
        JOIN cities c ON n.city_id = c.id
        WHERE $1::text = ANY(n.zipcode_ranges) -- Use direct array check
        ORDER BY n.id ASC
        LIMIT 1;
    `;
    try {
        const result = await pool.query(query, [zipcode]);
        if (result.rowCount === 0) { return null; }
        // Use corrected formatter
        const neighborhood = formatNeighborhood(result.rows[0]);
        return neighborhood;
    } catch (error) {
        console.error(`[NeighborhoodModel findNeighborhoodByZipcode] Error searching for zipcode ${zipcode}:`, error);
        throw error;
    }
};

// getAllCitiesSimple remains the same
export const getAllCitiesSimple = async () => {
    const result = await pool.query('SELECT id, name FROM cities ORDER BY name');
    return (result.rows || []).map(c => ({...c, id: Number(c.id)}));
};