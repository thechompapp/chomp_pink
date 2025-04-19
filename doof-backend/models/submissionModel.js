/* src/doof-backend/models/submissionModel.js */
import db from '../db/index.js';
import { findNeighborhoodByZipcode } from './neighborhoodModel.js'; // Ensure this import is present

// *** ADD BLATANT LOG 1 ***
console.log('>>> submissionModel.js - FILE LOADED <<< - ', new Date().toISOString());
// *************************

// Helper function to fetch user handle separately
const getUserHandle = async (userId) => {
    // ... (getUserHandle implementation remains the same) ...
     if (userId == null || isNaN(Number(userId))) return null;
    try {
        const userResult = await db.query('SELECT username FROM users WHERE id = $1', [userId]);
        return userResult.rows[0]?.username ?? null;
    } catch (err) {
        console.error(`[SubmissionModel getUserHandle] Error fetching username for userId ${userId}:`, err);
        return null;
    }
};


const formatSubmission = (row, userHandle = null) => {
    // ... (formatSubmission implementation remains the same) ...
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

// --- Functions using formatSubmission (findSubmissionsByStatus, findSubmissionsByUserId, findSubmissionById) remain unchanged ---
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

// --- createSubmission MODIFIED ---
export const createSubmission = async (submissionData, userId) => {
    console.log('[SubmissionModel createSubmission] Received raw data:', submissionData); // Log input
    const { type, name, location, city, neighborhood, tags, place_id, restaurant_id, restaurant_name } = submissionData;

    if (!type || !name) {
        throw new Error("Submission type and name are required.");
    }
    if (type === 'dish' && (restaurant_id == null || isNaN(Number(restaurant_id)))) {
        console.warn(`[SubmissionModel createSubmission] Dish submission for "${name}" lacks a valid numeric restaurant_id.`);
        throw new Error("A valid Restaurant ID is required for dish submissions.");
    }

    let finalCityName = city;
    let finalNeighborhoodName = neighborhood;
    let cityId = null; // Needed for neighborhood lookup verification

    // If it's a restaurant, try to look up and potentially correct the neighborhood based on zipcode
    if (type === 'restaurant') {
        const nycCountyMap = {
            "Kings County": "New York", "New York County": "New York", "Queens County": "New York",
            "Bronx County": "New York", "Richmond County": "New York", "Brooklyn": "New York",
            "Manhattan": "New York", "Queens": "New York", "Bronx": "New York", "Staten Island": "New York"
        };

        const originalCityName = city?.trim();
        const cityNameToLookup = nycCountyMap[originalCityName] || originalCityName;

        // --- City ID Lookup (Required for reliable neighborhood lookup) ---
        if (cityNameToLookup) {
            try {
                 console.log(`[Submission Creation] Looking up City ID for name: "${cityNameToLookup}" (Original: "${originalCityName}")`);
                 const cityLookupResult = await db.query('SELECT id FROM cities WHERE name = $1', [cityNameToLookup]);
                 if (cityLookupResult.rows.length > 0) {
                    cityId = cityLookupResult.rows[0].id;
                    finalCityName = cityNameToLookup; // Use the potentially mapped name for storage
                    console.log(`[Submission Creation] Found City ID: ${cityId}`);
                 } else {
                    console.error(`[Submission Creation] City named "${cityNameToLookup}" not found in database.`);
                    // Fail creation if city doesn't exist - essential for FKs later
                    throw new Error(`Submission failed: City "${cityNameToLookup}" does not exist. Please ensure it's added first.`);
                 }
            } catch(cityLookupError) {
                 console.error(`[Submission Creation] Error looking up city ID for "${cityNameToLookup}":`, cityLookupError);
                 throw new Error(`Submission failed due to city lookup error: ${cityLookupError.message}`);
            }
        } else {
            // Fail if city name is missing for a restaurant submission
            throw new Error("Submission failed: City name is required for restaurant submissions.");
        }

        // --- Neighborhood Lookup by Zipcode (Only if city lookup succeeded) ---
        const zipcodeMatch = typeof location === 'string' ? location.match(/\b(\d{5})\b/) : null;
        const zipcode = zipcodeMatch ? zipcodeMatch[1] : null;

        if (zipcode && cityId) {
            console.log(`[Submission Creation] Zipcode ${zipcode} found. Looking up neighborhood...`);
            try {
                const foundNeighborhood = await findNeighborhoodByZipcode(zipcode);
                if (foundNeighborhood) {
                    // Verify city match before using the result
                    if (Number(foundNeighborhood.city_id) === Number(cityId)) {
                        console.log(`[Submission Creation] Found Neighborhood via zipcode ${zipcode}: ID ${foundNeighborhood.id}, Name: ${foundNeighborhood.name}`);
                        finalNeighborhoodName = foundNeighborhood.name; // ** Override the submitted neighborhood name **
                    } else {
                         console.warn(`[Submission Creation] Zipcode ${zipcode} lookup returned neighborhood ${foundNeighborhood.name} but city ID ${foundNeighborhood.city_id} mismatch (expected ${cityId}). Using original neighborhood name: "${neighborhood}".`);
                         finalNeighborhoodName = neighborhood; // Keep original if city mismatches
                    }
                } else {
                    console.log(`[Submission Creation] No neighborhood found for zipcode ${zipcode}. Using original neighborhood name: "${neighborhood}".`);
                    finalNeighborhoodName = neighborhood; // Keep original if not found
                }
            } catch (zipLookupError) {
                console.error(`[Submission Creation] Error during zipcode neighborhood lookup for ${zipcode}:`, zipLookupError);
                finalNeighborhoodName = neighborhood; // Keep original on error
            }
        } else {
            console.log(`[Submission Creation] No zipcode found or city lookup failed. Using original neighborhood name: "${neighborhood}".`);
            finalNeighborhoodName = neighborhood; // Keep original if no zipcode
        }
    } // End if (type === 'restaurant')

    // --- Prepare and Execute Insert ---
    const query = `
        INSERT INTO Submissions (user_id, type, name, location, city, neighborhood, tags, place_id, status, created_at, restaurant_id, restaurant_name)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', CURRENT_TIMESTAMP, $9, $10)
        RETURNING *;
    `;
    const cleanTags = Array.isArray(tags) ? tags.map(t => String(t).trim()).filter(Boolean) : null;
    const finalRestaurantId = type === 'dish' ? Number(restaurant_id) : null;
    const finalDishRestaurantName = type === 'dish' ? (restaurant_name || null) : null; // Name only relevant for dish type storage

    // Use the potentially corrected city and neighborhood names
    const values = [
        userId, type, name, location || null,
        finalCityName || null, // Use potentially mapped city name
        finalNeighborhoodName || null, // Use name found via zipcode or original
        cleanTags, place_id || null,
        finalRestaurantId, finalDishRestaurantName
    ];

    console.log('[SubmissionModel createSubmission] Final values for INSERT:', values); // Log final values

    try {
        const result = await db.query(query, values);
        if (!result.rows[0]) {
            throw new Error("Submission creation failed, no row returned.");
        }
        const userHandle = await getUserHandle(userId);
        console.log('[SubmissionModel createSubmission] Submission created successfully, ID:', result.rows[0].id);
        return formatSubmission(result.rows[0], userHandle); // Format the result
    } catch (error) {
        console.error(`[SubmissionModel createSubmission] Error executing INSERT for user ${userId}:`, error);
        if (error.code === '23503') { // Handle FK violations generally
            if (error.constraint === 'fk_submission_restaurant') {
                throw new Error(`Invalid Restaurant ID (${restaurant_id}) provided for dish submission.`);
            }
             if (error.constraint === 'submissions_city_id_fkey') { // Assuming you add such a constraint
                 throw new Error(`Invalid City specified: "${finalCityName}".`);
             }
            throw new Error(`Database constraint violation during submission: ${error.message}`);
        }
        throw error; // Re-throw other errors
    }
};
// --- End createSubmission MODIFIED ---


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


// --- Main Update Function (Approval/Rejection) ---
// This function remains largely the same as the previous version,
// as the neighborhood correction now happens during creation.
// We keep the zipcode lookup here as a fallback/double-check, but it
// might not be strictly necessary if creation logic is robust.
export const updateSubmissionStatus = async (id, status, reviewerId) => {
    // *** ADD BLATANT LOG 2 ***
    console.log(`>>> submissionModel.js - updateSubmissionStatus CALLED FOR ID ${id}, STATUS ${status} <<< - `, new Date().toISOString());
    // *************************

    if (!['approved', 'rejected'].includes(status)) {
        throw new Error('Invalid status for update.');
    }
    if (isNaN(id) || id <= 0 || isNaN(reviewerId) || reviewerId <= 0) {
        throw new Error('Invalid ID provided for submission status update.');
    }

    const client = await db.getClient();
    let originalSubmissionData = null;

    const nycCountyMap = {
        "Kings County": "New York", "New York County": "New York", "Queens County": "New York",
        "Bronx County": "New York", "Richmond County": "New York", "Brooklyn": "New York",
        "Manhattan": "New York", "Queens": "New York", "Bronx": "New York", "Staten Island": "New York"
    };

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
                // *** Use the neighborhood name ALREADY STORED in the submission ***
                // *** (which should be corrected by createSubmission now)      ***
                let finalNeighborhoodName = originalSubmissionData.neighborhood;

                // --- City Lookup (Still needed for FK constraint) ---
                const originalCityName = originalSubmissionData.city?.trim();
                // Use the city name stored in the submission
                const cityNameToLookup = originalCityName; // No mapping needed here if creation stored correctly

                if (cityNameToLookup) {
                    console.log(`[Submission Approval] Verifying City ID for name stored in submission: "${cityNameToLookup}"`);
                    const cityLookupQuery = 'SELECT id FROM cities WHERE name = $1';
                    const cityLookupResult = await client.query(cityLookupQuery, [cityNameToLookup]);
                    if (cityLookupResult.rows.length > 0) {
                        cityId = cityLookupResult.rows[0].id;
                        console.log(`[Submission Approval] Verified City ID: ${cityId}`);
                    } else {
                        // This indicates an inconsistency if the city was required during creation
                        console.error(`[Submission Approval] Stored city "${cityNameToLookup}" not found in database. Potential data inconsistency.`);
                        throw new Error(`Cannot approve submission: Stored city "${cityNameToLookup}" is invalid.`);
                    }
                } else {
                    throw new Error(`Cannot approve submission: City name is missing from the submission data.`);
                }

                // --- Neighborhood ID Lookup (based on corrected name stored in submission) ---
                if (finalNeighborhoodName && cityId) {
                    console.log(`[Submission Approval] Verifying Neighborhood ID for name stored in submission: "${finalNeighborhoodName}" in City ID: ${cityId}`);
                    const neighborhoodLookupQuery = 'SELECT id FROM neighborhoods WHERE name = $1 AND city_id = $2';
                    const neighborhoodLookupResult = await client.query(neighborhoodLookupQuery, [finalNeighborhoodName, cityId]);
                    if (neighborhoodLookupResult.rows.length > 0) {
                        neighborhoodId = neighborhoodLookupResult.rows[0].id;
                        console.log(`[Submission Approval] Verified Neighborhood ID: ${neighborhoodId}`);
                    } else {
                        // If the corrected name stored isn't found, something is wrong.
                        // Log a warning but allow proceeding with NULL neighborhood_id if schema allows.
                        console.warn(`[Submission Approval] Stored neighborhood "${finalNeighborhoodName}" not found in City ID ${cityId}. Proceeding with NULL neighborhood_id.`);
                        neighborhoodId = null;
                    }
                } else {
                    neighborhoodId = null; // No neighborhood name was stored
                }

                // --- Insert Restaurant ---
                 console.log(`[Submission Approval] Attempting to insert/find restaurant with: name=${originalSubmissionData.name}, cityId=${cityId}, neighborhoodId=${neighborhoodId ?? 'NULL'}, neighborhoodName=${finalNeighborhoodName ?? 'NULL'}`);
                const restaurantInsertQuery = `
                    INSERT INTO restaurants (name, address, google_place_id, city_id, neighborhood_id, city_name, neighborhood_name, created_at, updated_at)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
                    ON CONFLICT (name, city_id) DO NOTHING
                    RETURNING id`;

                const restaurantInsertValues = [
                    originalSubmissionData.name, originalSubmissionData.location, originalSubmissionData.place_id,
                    cityId, // Use verified city_id
                    neighborhoodId, // Use verified neighborhood_id (or null)
                    cityNameToLookup, // Use verified city name
                    finalNeighborhoodName // Use verified neighborhood name (or null)
                ];

                const createdRestaurant = await client.query(restaurantInsertQuery, restaurantInsertValues);

                if (createdRestaurant.rows.length > 0) {
                    newItemId = createdRestaurant.rows[0].id;
                    console.log(`[Submission Approval] Inserted new restaurant with ID: ${newItemId}`);
                    // TODO: Handle submission tags
                } else {
                    // Conflict logic remains the same
                    console.warn(`[Submission Approval] Restaurant submission ${id} (${originalSubmissionData.name}, City ID: ${cityId}) conflicted. Assuming exists.`);
                     const existingRestaurant = await client.query(
                        'SELECT id FROM restaurants WHERE name = $1 AND city_id = $2',
                        [originalSubmissionData.name, cityId]
                    );
                     if (existingRestaurant.rows.length > 0) {
                        newItemId = existingRestaurant.rows[0].id;
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
                    // TODO: Handle tags
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

        // Update submission status (remains the same)
        const updateQuery = `
            UPDATE Submissions
            SET status = $1, reviewed_at = CURRENT_TIMESTAMP, reviewed_by = $2
            WHERE id = $3 AND status = 'pending'
            RETURNING *;
        `;
        const updateResult = await client.query(updateQuery, [status, reviewerId, id]);

        if (updateResult.rowCount === 0) {
            console.warn(`[Submission Approval] Submission ${id} status update failed (rowCount 0).`);
            throw new Error('Failed to update submission status. It might have been modified or deleted concurrently.');
        }

        await client.query('COMMIT');

        const updatedSubmissionData = updateResult.rows[0];
        const userHandle = await getUserHandle(updatedSubmissionData.user_id);
        console.log(`[Submission Approval] Successfully processed submission ${id} to status ${status}.`);
        return formatSubmission(updatedSubmissionData, userHandle);

    } catch (error) {
        console.error(`[SubmissionModel updateSubmissionStatus] Rolling back transaction for submission ${id} due to error:`, error.message);
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};