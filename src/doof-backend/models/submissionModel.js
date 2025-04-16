/* src/doof-backend/models/submissionModel.js */
import db from '../db/index.js';
// No additional model imports needed as we'll use direct queries with the client

// Helper function to fetch user handle separately
const getUserHandle = async (userId) => {
    if (userId == null || isNaN(Number(userId))) return null;
    // Use the main pool 'db' for this read-only query, no need for transaction client
    try {
        const userResult = await db.query('SELECT username FROM users WHERE id = $1', [userId]);
        return userResult.rows[0]?.username ?? null;
    } catch (err) {
        console.error(`[SubmissionModel getUserHandle] Error fetching username for userId ${userId}:`, err);
        return null;
    }
};


const formatSubmission = (row, userHandle = null) => {
    // (formatter remains the same)
    if (!row || row.id == null) {
        return null;
    }
    try {
        const type = ['restaurant', 'dish'].includes(row.type) ? row.type : null;
        const status = ['pending', 'approved', 'rejected'].includes(row.status) ? row.status : 'pending';
        if (!type) {
            console.warn(`[SubmissionModel Format] Invalid type found: ${row.type}`);
            return null;
        }

        const restaurant_name = row.restaurant_name ?? null;

        return {
            id: Number(row.id),
            user_id: row.user_id ? Number(row.user_id) : null,
            type: type,
            name: row.name,
            location: row.location ?? null,
            city: row.city ?? null,
            neighborhood: row.neighborhood ?? null,
            tags: Array.isArray(row.tags) ? row.tags.filter((t) => typeof t === 'string' && !!t) : null,
            place_id: row.place_id ?? null,
            status: status,
            created_at: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
            reviewed_at: row.reviewed_at instanceof Date ? row.reviewed_at.toISOString() : (row.reviewed_at ?? null),
            reviewed_by: row.reviewed_by ? Number(row.reviewed_by) : null,
            user_handle: userHandle ?? row.user_handle ?? null, // Use passed handle first, then row handle
            restaurant_id: row.restaurant_id ? Number(row.restaurant_id) : null, // Include restaurant_id
            restaurant_name: restaurant_name // Use the value read from the row
        };
    } catch (e) {
        console.error(`[SubmissionModel formatSubmission Error] Failed to format row:`, row, e);
        return null; // Return null on error
    }
};

// --- Functions using formatSubmission (findSubmissionsByStatus, findSubmissionsByUserId, createSubmission, findSubmissionById) remain unchanged from the previous version ---

export const findSubmissionsByStatus = async (status = 'pending') => {
    const query = `
        SELECT
            s.*,
            u.username as user_handle
        FROM Submissions s
        LEFT JOIN users u ON s.user_id = u.id
        WHERE s.status = $1
        ORDER BY s.created_at DESC
    `;
    try {
        const result = await db.query(query, [status]);
        return (result.rows || []).map(row => formatSubmission(row)).filter((s) => s !== null);
    } catch (error) {
        console.error(`[SubmissionModel findSubmissionsByStatus] Error fetching submissions with status ${status}:`, error);
        throw error;
    }
};

export const findSubmissionsByUserId = async (userId) => {
    if (isNaN(userId) || userId <= 0) {
        console.warn(`[SubmissionModel findSubmissionsByUserId] Invalid userId: ${userId}`);
        return [];
    }
    const query = `
        SELECT
            s.*
        FROM Submissions s
        WHERE s.user_id = $1
        ORDER BY s.created_at DESC
    `;
    try {
        const result = await db.query(query, [userId]);
        return (result.rows || []).map(row => formatSubmission(row)).filter(s => s !== null);
    } catch (error) {
        console.error(`[SubmissionModel findSubmissionsByUserId] Error fetching submissions for user ${userId}:`, error);
        throw error;
    }
};

export const createSubmission = async (submissionData, userId) => {
    const { type, name, location, city, neighborhood, tags, place_id, restaurant_id, restaurant_name } = submissionData;
    if (!type || !name) {
        throw new Error("Submission type and name are required.");
    }
    if (type === 'dish' && (restaurant_id == null || isNaN(Number(restaurant_id)))) {
        console.warn(`[SubmissionModel createSubmission] Dish submission for "${name}" lacks a valid numeric restaurant_id.`);
        throw new Error("A valid Restaurant ID is required for dish submissions.");
    }

    const query = `
        INSERT INTO Submissions (user_id, type, name, location, city, neighborhood, tags, place_id, status, created_at, restaurant_id, restaurant_name)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', CURRENT_TIMESTAMP, $9, $10)
        RETURNING *;
    `;
    const cleanTags = Array.isArray(tags) ? tags.map(t => String(t).trim()).filter(Boolean) : null;
    const finalRestaurantId = type === 'dish' ? Number(restaurant_id) : null;
    const finalRestaurantName = type === 'dish' ? (restaurant_name || null) : null;
    const values = [userId, type, name, location || null, city || null, neighborhood || null, cleanTags, place_id || null, finalRestaurantId, finalRestaurantName];

    try {
        const result = await db.query(query, values);
        if (!result.rows[0]) {
            throw new Error("Submission creation failed, no row returned.");
        }

        const userHandle = await getUserHandle(userId);
        return formatSubmission(result.rows[0], userHandle);
    } catch (error) {
        console.error(`[SubmissionModel createSubmission] Error for user ${userId}:`, error);
        if (error.code === '23503' && error.constraint === 'fk_submission_restaurant') {
            throw new Error(`Invalid Restaurant ID (${restaurant_id}) provided for dish submission.`);
        }
        // Handle potential city/neighborhood FK violations if those were added
        throw error;
    }
};

export const findSubmissionById = async (id) => {
    if (isNaN(id) || id <= 0) return undefined;
    try {
        const query = `
            SELECT
                s.*,
                u.username as user_handle
            FROM Submissions s
            LEFT JOIN users u ON s.user_id = u.id
            WHERE s.id = $1
        `;
        const result = await db.query(query, [id]);
        return formatSubmission(result.rows[0]) ?? undefined;
    } catch (error) {
        console.error(`[SubmissionModel findSubmissionById] Error fetching submission ${id}:`, error);
        throw error;
    }
};


// --- Main Update Function ---
export const updateSubmissionStatus = async (id, status, reviewerId) => {
    if (!['approved', 'rejected'].includes(status)) {
        throw new Error('Invalid status for update.');
    }
    if (isNaN(id) || id <= 0 || isNaN(reviewerId) || reviewerId <= 0) {
        throw new Error('Invalid ID provided for submission status update.');
    }

    const client = await db.getClient();
    let originalSubmissionData = null;

    // *** ADDED: NYC County to City Mapping ***
    const nycCountyMap = {
        "Kings County": "New York",
        "New York County": "New York",
        "Queens County": "New York",
        "Bronx County": "New York",
        "Richmond County": "New York",
        // Add mappings for common borough names if Places API returns those
        "Brooklyn": "New York",
        "Manhattan": "New York",
        "Queens": "New York",
        "Bronx": "New York",
        "Staten Island": "New York"
    };
    // *** END ADDED ***

    try {
        await client.query('BEGIN');

        const submissionQuery = `SELECT * FROM Submissions WHERE id = $1 FOR UPDATE;`;
        const submissionResult = await client.query(submissionQuery, [id]);

        if (!submissionResult.rows[0]) {
            throw new Error('Submission not found.');
        }
        originalSubmissionData = submissionResult.rows[0];

        if (originalSubmissionData.status !== 'pending') {
            throw new Error(`Submission is already ${originalSubmissionData.status}.`);
        }

        let newItemId = null;
        if (status === 'approved') {
            if (originalSubmissionData.type === 'restaurant') {
                let cityId = null;
                let neighborhoodId = null;

                // *** MODIFIED: Apply mapping before lookup ***
                const originalCityName = originalSubmissionData.city?.trim();
                const cityNameToLookup = nycCountyMap[originalCityName] || originalCityName; // Map or use original

                if (cityNameToLookup) {
                    console.log(`[Submission Approval] Looking up City ID for name: "${cityNameToLookup}" (Original: "${originalCityName}")`);
                    const cityLookupQuery = 'SELECT id FROM cities WHERE name = $1';
                    const cityLookupResult = await client.query(cityLookupQuery, [cityNameToLookup]); // Use mapped name
                    if (cityLookupResult.rows.length > 0) {
                        cityId = cityLookupResult.rows[0].id;
                        console.log(`[Submission Approval] Found City ID: ${cityId}`);
                    } else {
                        // City not found - throw error to prevent approval
                        console.error(`[Submission Approval] City named "${cityNameToLookup}" not found in database.`);
                        throw new Error(`Cannot approve submission: City "${cityNameToLookup}" does not exist. Please create it first.`);
                    }
                } else {
                    // City name was null/empty in submission - this shouldn't happen if validation is correct
                    throw new Error(`Cannot approve submission: City name is missing from the submission data.`);
                }
                // *** END MODIFIED ***

                // *** Neighborhood Lookup (remains the same, uses found cityId) ***
                if (originalSubmissionData.neighborhood && cityId) {
                    const neighborhoodName = originalSubmissionData.neighborhood.trim();
                     console.log(`[Submission Approval] Looking up Neighborhood ID for name: "${neighborhoodName}" in City ID: ${cityId}`);
                    const neighborhoodLookupQuery = 'SELECT id FROM neighborhoods WHERE name = $1 AND city_id = $2';
                    const neighborhoodLookupResult = await client.query(neighborhoodLookupQuery, [neighborhoodName, cityId]);
                    if (neighborhoodLookupResult.rows.length > 0) {
                        neighborhoodId = neighborhoodLookupResult.rows[0].id;
                         console.log(`[Submission Approval] Found Neighborhood ID: ${neighborhoodId}`);
                    } else {
                         console.warn(`[Submission Approval] Neighborhood named "${neighborhoodName}" not found in City ID ${cityId}. Proceeding with NULL neighborhood_id.`);
                         neighborhoodId = null; // Explicitly set to null
                    }
                } else {
                    neighborhoodId = null; // No neighborhood name provided or cityId was missing
                }

                // --- Insert Restaurant using looked-up IDs ---
                const restaurantInsertQuery = `
                    INSERT INTO restaurants (name, address, google_place_id, city_id, neighborhood_id, city_name, neighborhood_name, created_at, updated_at)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
                    ON CONFLICT (name, city_id) -- Constraint uses city_id
                    DO NOTHING
                    RETURNING id`;

                const restaurantInsertValues = [
                    originalSubmissionData.name,
                    originalSubmissionData.location, // address
                    originalSubmissionData.place_id,
                    cityId, // Use the looked-up city_id
                    neighborhoodId, // Use the looked-up neighborhood_id
                    // Use the mapped name for city_name if different, else original
                    cityNameToLookup || originalCityName,
                    originalSubmissionData.neighborhood // Keep original neighborhood name for display
                ];

                const createdRestaurant = await client.query(restaurantInsertQuery, restaurantInsertValues);

                if (createdRestaurant.rows.length > 0) {
                    newItemId = createdRestaurant.rows[0].id;
                    console.log(`[Submission Approval] Inserted new restaurant with ID: ${newItemId}`);
                    // TODO: Handle submission tags by adding them to RestaurantHashtags
                } else {
                    console.warn(`[Submission Approval] Restaurant submission ${id} (${originalSubmissionData.name}, City ID: ${cityId}) conflicted. Assuming exists.`);
                    const existingRestaurant = await client.query(
                        'SELECT id FROM restaurants WHERE name = $1 AND city_id = $2',
                        [originalSubmissionData.name, cityId] // Lookup using city_id
                    );
                    if (existingRestaurant.rows.length > 0) {
                        newItemId = existingRestaurant.rows[0].id; // Use existing ID
                        console.log(`[Submission Approval] Using existing restaurant ID: ${newItemId}`);
                    } else {
                        console.error(`[Submission Approval] ON CONFLICT occurred but could not find existing restaurant for ${originalSubmissionData.name}, City ID: ${cityId}`);
                        throw new Error(`Database inconsistency: Restaurant conflict occurred but could not retrieve existing record.`);
                    }
                }

            } else if (originalSubmissionData.type === 'dish') {
                // Dish logic remains the same
                if (!originalSubmissionData.restaurant_id) {
                    throw new Error(`Cannot approve dish submission: Associated Restaurant ID is missing.`);
                }
                const createdDish = await client.query(
                    `INSERT INTO dishes (name, restaurant_id, created_at, updated_at)
                     VALUES ($1, $2, NOW(), NOW())
                     ON CONFLICT (name, restaurant_id) DO NOTHING
                     RETURNING id`,
                    [originalSubmissionData.name, originalSubmissionData.restaurant_id]
                );
                if (createdDish.rows.length > 0) {
                    newItemId = createdDish.rows[0].id;
                    console.log(`[Submission Approval] Inserted new dish with ID: ${newItemId}`);
                    // TODO: Handle tags if submission had them (DishHashtags)
                } else {
                    console.warn(`[Submission Approval] Dish submission ${id} (${originalSubmissionData.name}) conflicted. Assuming exists.`);
                    const existingDish = await client.query(
                        'SELECT id FROM dishes WHERE name = $1 AND restaurant_id = $2',
                        [originalSubmissionData.name, originalSubmissionData.restaurant_id]
                    );
                    if (existingDish.rows.length > 0) {
                        newItemId = existingDish.rows[0].id;
                        console.log(`[Submission Approval] Using existing dish ID: ${newItemId}`);
                    } else {
                        console.error(`[Submission Approval] ON CONFLICT occurred but could not find existing dish for ${originalSubmissionData.name}, Restaurant ID: ${originalSubmissionData.restaurant_id}`);
                        throw new Error(`Database inconsistency: Dish conflict occurred but could not retrieve existing record.`);
                    }
                }
            }
        } // End of approval logic

        // 3. Update the submission status
        const updateQuery = `
            UPDATE Submissions
            SET status = $1, reviewed_at = CURRENT_TIMESTAMP, reviewed_by = $2
            WHERE id = $3 AND status = 'pending'
            RETURNING *;
        `;
        const updateResult = await client.query(updateQuery, [status, reviewerId, id]);

        if (updateResult.rowCount === 0) {
            console.warn(`[Submission Approval] Submission ${id} status update failed (rowCount 0). It might have been processed concurrently.`);
            throw new Error('Failed to update submission status. It might have been modified or deleted concurrently.');
        }

        await client.query('COMMIT'); // Commit transaction

        const updatedSubmissionData = updateResult.rows[0];
        const userHandle = await getUserHandle(updatedSubmissionData.user_id); // Fetch handle after commit
        console.log(`[Submission Approval] Successfully processed submission ${id} to status ${status}.`);
        return formatSubmission(updatedSubmissionData, userHandle); // Return updated data

    } catch (error) {
        console.error(`[SubmissionModel updateSubmissionStatus] Rolling back transaction for submission ${id} due to error:`, error.message);
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};