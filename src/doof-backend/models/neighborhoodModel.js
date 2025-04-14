/* src/doof-backend/models/neighborhoodModel.js */
import pool from '../db/index.js';

// --- Helper Functions ---
const formatNeighborhood = (row) => {
    if (!row || typeof row.id !== 'number') return null;
    return {
        id: row.id,
        name: row.name,
        city_id: Number(row.city_id),
        created_at: row.created_at,
        updated_at: row.updated_at,
        zipcode_ranges: Array.isArray(row.zipcode_ranges) ? row.zipcode_ranges.filter(Boolean).map(String) : null,
        city_name: row.city_name ?? undefined, // Use undefined or null consistently
    };
};

const prepareZipcodeRanges = (zipcodesInput) => {
    if (!zipcodesInput) return null;
    const zipcodes = Array.isArray(zipcodesInput)
        ? zipcodesInput
        : String(zipcodesInput).split(',').map(z => z.trim()).filter(Boolean);
    const validZipRegex = /^\d{5}$/;
    const validZipcodes = zipcodes.filter(z => validZipRegex.test(z));
    if (validZipcodes.length === 0) return null;
    return validZipcodes.sort();
};

// --- Model Functions ---
export const getAllNeighborhoods = async (limit = 20, offset = 0, sortBy = 'neighborhoods.name', sortOrder = 'ASC', search, cityId) => {
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
    if (cityId) {
        queryParams.push(cityId);
        countQueryParams.push(cityId);
        whereClauses.push(`neighborhoods.city_id = $${paramIndex}`);
        paramIndex++;
    }

    const whereString = whereClauses.length > 0 ? ' WHERE ' + whereClauses.join(' AND ') : '';
    query += whereString;
    // Adjust count query params indexing
    const countWhereString = whereClauses.length > 0 ? ' WHERE ' + whereClauses.map((clause, i) => clause.replace(`$${i + 1}`, `$${i + 1}`)).join(' AND ') : '';

    const totalResult = await pool.query(countQuery + countWhereString, countQueryParams);
    const total = parseInt(totalResult.rows[0].count, 10);

    query += ` ORDER BY ${safeSortBy} ${safeSortOrder} NULLS LAST`;
    queryParams.push(limit);
    query += ` LIMIT $${paramIndex++}`;
    queryParams.push(offset);
    query += ` OFFSET $${paramIndex++}`;

    const result = await pool.query(query, queryParams);
    const formattedNeighborhoods = (result.rows || [])
        .map(formatNeighborhood)
        .filter((n) => n !== null);

    return { neighborhoods: formattedNeighborhoods, total };
};

export const getNeighborhoodById = async (id) => {
    if (isNaN(id) || id <= 0) {
        console.warn(`[NeighborhoodModel getNeighborhoodById] Invalid ID: ${id}`);
        return null;
    }
    const query = `SELECT neighborhoods.*, cities.name as city_name FROM neighborhoods JOIN cities ON neighborhoods.city_id = cities.id WHERE neighborhoods.id = $1`;
    const result = await pool.query(query, [id]);
    return formatNeighborhood(result.rows[0]);
};

export const createNeighborhood = async (data) => {
    const { name, city_id, zipcode_ranges } = data; // Match param name
    if (!name || !city_id || typeof city_id !== 'number' || city_id <= 0) {
        throw new Error("Neighborhood name and a valid City ID are required.");
    }
    const preparedZipcodes = prepareZipcodeRanges(zipcode_ranges); // Use correct variable
    const query = `INSERT INTO neighborhoods (name, city_id, zipcode_ranges, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW()) RETURNING *`;
    try {
        const result = await pool.query(query, [name, city_id, preparedZipcodes]);
        // Refetch to include city_name consistently
        return getNeighborhoodById(result.rows[0].id);
    } catch (error) {
        if (error.code === '23503') { throw new Error(`Create failed: City with ID ${city_id} does not exist.`); }
        if (error.code === '23505') { throw new Error(`Create failed: A neighborhood named "${name}" likely already exists in this city.`); }
        console.error(`[NeighborhoodModel createNeighborhood] Error:`, error);
        throw error;
    }
};

export const updateNeighborhood = async (id, data) => {
     if (isNaN(id) || id <= 0) {
        console.warn(`[NeighborhoodModel updateNeighborhood] Invalid ID: ${id}`);
        return null;
     }
    const fields = [];
    const values = [];
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
    if ('zipcode_ranges' in data) { // Use correct key
        const preparedZipcodes = prepareZipcodeRanges(data.zipcode_ranges);
        fields.push(`zipcode_ranges = $${paramIndex++}`);
        values.push(preparedZipcodes);
    }

    if (fields.length === 0) {
        // console.log(`[NeighborhoodModel updateNeighborhood] No valid fields provided for update on ID ${id}.`); // Optional
        return getNeighborhoodById(id);
    }

    fields.push(`updated_at = NOW()`);
    const query = `UPDATE neighborhoods SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING id`;
    values.push(id);

    try {
        const result = await pool.query(query, values);
        if (result.rowCount === 0) {
             // console.warn(`[NeighborhoodModel updateNeighborhood] Neighborhood with ID ${id} not found for update.`); // Optional
             return null;
        }
        return getNeighborhoodById(id); // Refetch to include city_name
    } catch (error) {
        if (error.code === '23503') { throw new Error(`Update failed: City with ID ${data.city_id} does not exist.`); }
        if (error.code === '23505') { throw new Error(`Update failed: A neighborhood named "${data.name}" likely already exists in this city.`); }
        console.error(`[NeighborhoodModel updateNeighborhood] Error updating ID ${id}:`, error);
        throw error;
    }
};

export const deleteNeighborhood = async (id) => {
    if (isNaN(id) || id <= 0) {
        console.warn(`[NeighborhoodModel deleteNeighborhood] Invalid ID: ${id}`);
        return false;
    }
    const query = 'DELETE FROM neighborhoods WHERE id = $1';
    try {
        const result = await pool.query(query, [id]);
        return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
        if (error.code === '23503') {
            console.error(`[NeighborhoodModel deleteNeighborhood] Failed for ID ${id} due to foreign key violation.`);
            throw new Error(`Cannot delete neighborhood: It is referenced by other records (e.g., restaurants).`);
        }
        console.error(`[NeighborhoodModel deleteNeighborhood] Error deleting ID ${id}:`, error);
        throw error;
    }
};

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
        WHERE $1::text = ANY(n.zipcode_ranges::text[])
        ORDER BY n.id ASC
        LIMIT 1;
    `;
    try {
        const result = await pool.query(query, [zipcode]);
        if (result.rowCount === 0) {
            // console.log(`[NeighborhoodModel findNeighborhoodByZipcode] No neighborhood found for zipcode ${zipcode}`); // Optional
            return null;
        }
        const neighborhood = formatNeighborhood(result.rows[0]);
        // console.log(`[NeighborhoodModel findNeighborhoodByZipcode] Found neighborhood for zipcode ${zipcode}:`, neighborhood); // Optional
        return neighborhood;
    } catch (error) {
        console.error(`[NeighborhoodModel findNeighborhoodByZipcode] Error searching for zipcode ${zipcode}:`, error);
        throw error;
    }
};

export const getAllCitiesSimple = async () => {
    const result = await pool.query('SELECT id, name FROM cities ORDER BY name');
    return result.rows;
};