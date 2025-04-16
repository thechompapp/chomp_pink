/* src/doof-backend/models/adminModel.js */
import db from '../db/index.js';
import bcrypt from 'bcryptjs';

// Import individual models and their formatters (using .js)
import * as RestaurantModel from './restaurantModel.js';
import * as DishModel from './dishModel.js';
import * as ListModel from './listModel.js';
import * as HashtagModel from './hashtagModel.js';
import * as UserModel from './userModel.js';
import * as NeighborhoodModel from './neighborhoodModel.js';
import * as SubmissionModel from './submissionModel.js';
import * as CityModel from './cityModel.js'; // Import CityModel

// *** VERIFY THIS ARRAY ***
const ALLOWED_TYPES = ['submissions', 'restaurants', 'dishes', 'lists', 'hashtags', 'users', 'neighborhoods', 'cities'];
const typeToTable = {
    submissions: 'submissions', restaurants: 'restaurants', dishes: 'dishes',
    lists: 'lists', hashtags: 'hashtags', users: 'users', neighborhoods: 'neighborhoods',
    cities: 'cities' // *** VERIFY THIS MAPPING ***
};

// Helper function to add tags (no TS needed)
async function addTagsToItem(client, itemType, itemId, tags) {
   // ... (function body remains the same) ...
    if (!tags || tags.length === 0) return;

    const tagPlaceholders = tags.map((_, i) => `$${i + 1}`).join(',');
    const findTagsQuery = `SELECT id, name FROM hashtags WHERE name = ANY($1::text[])`;
    const foundTagsResult = await client.query(findTagsQuery, [tags]);
    const foundTagsMap = new Map(foundTagsResult.rows.map(row => [row.name, row.id]));

    const junctionTable = itemType === 'restaurant' ? 'restauranthashtags' : 'dishhashtags';
    const itemIdColumn = itemType === 'restaurant' ? 'restaurant_id' : 'dish_id';

    const inserts = [];
    for (const tagName of tags) {
        const tagId = foundTagsMap.get(tagName);
        if (tagId) {
            const insertQuery = `
                INSERT INTO <span class="math-inline">\{junctionTable\} \(</span>{itemIdColumn}, hashtag_id)
                VALUES ($1, $2)
                ON CONFLICT DO NOTHING;
            `;
            inserts.push(client.query(insertQuery, [itemId, tagId]));
        } else {
            console.warn(`[BulkAdd addTags] Tag '${tagName}' not found in hashtags table. Skipping linkage for item ${itemId}.`);
        }
    }
    await Promise.all(inserts);
}


export const createResource = async (resourceType, createData, userId, userHandle) => {
    console.log(`[AdminModel createResource] Type: ${resourceType}, Data:`, createData);

    // *** VERIFY 'cities' CASE IN SWITCH ***
    switch (resourceType) {
        case 'restaurants':
            // Assume createRestaurant handles partial data validation
            return RestaurantModel.createRestaurant(createData);
        case 'dishes':
            if (!createData.name || typeof createData.restaurant_id !== 'number') {
                 throw new Error("Dish name and valid restaurant_id are required.");
            }
            // Assume createDish validates internally or expects specific fields
            return DishModel.createDish({ name: createData.name, restaurant_id: createData.restaurant_id });
        case 'lists':
            if (!createData.name || !userId || !userHandle) {
                throw new Error("List name, userId, and userHandle are required to create a list.");
            }
            if (!createData.list_type || !['restaurant', 'dish'].includes(createData.list_type)) {
                 throw new Error("A valid list_type ('restaurant' or 'dish') is required to create a list.");
             }
             const listPayload = {
                 name: createData.name,
                 description: createData.description,
                 is_public: createData.is_public,
                 list_type: createData.list_type,
                 tags: createData.tags,
                 city_name: createData.city_name
             };
            return ListModel.createList(listPayload, userId, userHandle);
        case 'hashtags':
             if (!createData.name) throw new Error("Hashtag name is required.");
             // Assuming HashtagModel.createHashtag exists if needed
             // return HashtagModel.createHashtag(createData);
             console.warn(`[AdminModel] Direct hashtag creation via generic route not implemented. Use specific HashtagModel function if available.`);
             return null;
        case 'users':
            if (!createData.username || !createData.email || !createData.password) {
                throw new Error("Username, email, and password are required for user creation.");
            }
            const passwordHash = await bcrypt.hash(createData.password, 10);
             return UserModel.createUser(
                 createData.username,
                 createData.email,
                 passwordHash,
                 createData.account_type // Pass account type if provided
             );
        case 'neighborhoods':
            if (!createData.name || typeof createData.city_id !== 'number') {
                throw new Error("Neighborhood name and valid city_id are required.");
            }
            const neighborhoodPayload = {
                name: createData.name,
                city_id: createData.city_id,
                zipcode_ranges: createData.zipcode_ranges
            };
             return NeighborhoodModel.createNeighborhood(neighborhoodPayload);
        case 'cities': // *** ENSURE THIS CASE EXISTS ***
            if (!createData.name) throw new Error("City name is required.");
            return CityModel.createCity(createData); // Delegate to CityModel
        default:
            console.error(`[AdminModel createResource] Unsupported resource type: ${resourceType}`);
            throw new Error(`Creation not supported for resource type: ${resourceType}`);
    }
};

export const updateResource = async (resourceType, id, updateData, userId) => {
    console.log(`[AdminModel updateResource] Type: ${resourceType}, ID: ${id}, Data:`, updateData);

    if (Object.keys(updateData).length === 0) {
        console.warn(`[AdminModel updateResource] No data provided for update.`);
        return null; // Or fetch and return current resource?
    }
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
    if (isNaN(numericId) || numericId <= 0) {
        throw new Error(`Invalid ID provided for update: ${id}`);
    }

    // *** VERIFY 'cities' CASE IN SWITCH ***
    switch (resourceType) {
        case 'restaurants':
            return RestaurantModel.updateRestaurant(numericId, updateData);
        case 'dishes':
            return DishModel.updateDish(numericId, updateData);
        case 'lists':
            delete updateData.user_id; // Prevent changing owner
            delete updateData.creator_handle;
            const listUpdatePayload = { ...updateData };
            if (updateData.list_type) {
                 listUpdatePayload.list_type = updateData.list_type;
                 delete listUpdatePayload.type;
            }
            return ListModel.updateList(numericId, listUpdatePayload);
        case 'hashtags':
            return HashtagModel.updateHashtag(numericId, updateData);
        case 'users':
            if ('password' in updateData || 'password_hash' in updateData) {
                console.error(`[AdminModel updateResource] Attempted password update via generic route for user ${id}. Denied.`);
                throw new Error("Password updates must use a dedicated route.");
            }
            return UserModel.updateUser(numericId, updateData);
         case 'neighborhoods':
            const neighborhoodUpdatePayload = { ...updateData };
            if ('zipcode_ranges' in neighborhoodUpdatePayload) {
                 neighborhoodUpdatePayload.zipcode_ranges = neighborhoodUpdatePayload.zipcode_ranges;
            }
             return NeighborhoodModel.updateNeighborhood(numericId, neighborhoodUpdatePayload);
        case 'cities': // *** ENSURE THIS CASE EXISTS ***
            return CityModel.updateCity(numericId, updateData); // Delegate to CityModel
        default:
            console.error(`[AdminModel updateResource] Unsupported resource type: ${resourceType}`);
            throw new Error(`Updates not supported for resource type: ${resourceType}`);
    }
};

// *** VERIFY 'cities' IS IN allowedTables ***
export const deleteResourceById = async (tableName, id) => {
    const allowedTables = ['restaurants', 'dishes', 'lists', 'submissions', 'users', 'hashtags', 'neighborhoods', 'cities'];
    if (!allowedTables.includes(tableName)) {
        throw new Error(`Invalid table name: ${tableName}. Allowed tables: ${allowedTables.join(', ')}`);
    }
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
    if (isNaN(numericId) || numericId <= 0) {
        throw new Error(`Invalid ID provided for deletion: ${id}`);
    }

    const query = `DELETE FROM ${tableName} WHERE id = $1 RETURNING id`;
    const result = await db.query(query, [numericId]);
    return (result.rowCount ?? 0) > 0;
};

// --- Submission Admin Functions --- (Keep as before - rely on specific submission model)
export const getSubmissions = SubmissionModel.findSubmissionsByStatus;
export const updateSubmissionStatus = SubmissionModel.updateSubmissionStatus;

// --- Bulk Add Function --- (Keep as before)
export const bulkAddItems = async (items) => {
   // ... (bulk add implementation) ...
    const client = await db.getClient();
    const results = { processedCount: 0, addedCount: 0, skippedCount: 0, errorCount: 0, details: [] }; // Added errorCount

    try {
        await client.query('BEGIN');

        for (const item of items) {
            results.processedCount++;
            let addedItem = null;
            let reason = '';
            let status = 'skipped';
            let itemCityId = item.city_id;
            let itemNeighborhoodId = item.neighborhood_id;

            try {
                // --- Location Lookups (Restaurant/Neighborhood ONLY) ---
                if (item.type === 'restaurant') {
                    if (!itemCityId && item.city) {
                        const cityRes = await client.query('SELECT id FROM cities WHERE name ILIKE $1 LIMIT 1', [item.city]);
                        if (cityRes.rowCount > 0) itemCityId = cityRes.rows[0].id;
                        else console.warn(`[BulkAdd] City '${item.city}' not found.`);
                    }
                    if (itemCityId && !itemNeighborhoodId && item.neighborhood) {
                        const nbRes = await client.query('SELECT id FROM neighborhoods WHERE name ILIKE $1 AND city_id = $2 LIMIT 1', [item.neighborhood, itemCityId]);
                        if (nbRes.rowCount > 0) itemNeighborhoodId = nbRes.rows[0].id;
                         else console.warn(`[BulkAdd] Neighborhood '${item.neighborhood}' not found in City ID ${itemCityId}.`);
                    }
                }
                // --- End Location Lookups ---

                // --- Resource Creation ---
                const createPayload = {
                    ...item, // Spread original item data
                    city_id: itemCityId, // Use potentially looked-up ID
                    neighborhood_id: itemNeighborhoodId, // Use potentially looked-up ID
                };
                // Remove potentially conflicting fields before calling createResource
                delete createPayload.city;
                delete createPayload.neighborhood;
                // If type is 'dish', remove restaurant location fields
                 if (item.type === 'dish') {
                     delete createPayload.location;
                     delete createPayload.place_id;
                     delete createPayload.latitude;
                     delete createPayload.longitude;
                 }

                // Call the appropriate create function via createResource (which uses models)
                // This handles the actual INSERT logic and conflict checking
                addedItem = await createResource(item.type, createPayload); // Pass looked-up IDs

                if (addedItem) {
                    status = 'added';
                    results.addedCount++;
                    // Add tags if provided and item was added successfully
                    if (Array.isArray(item.tags) && item.tags.length > 0 && (item.type === 'restaurant' || item.type === 'dish')) {
                        await addTagsToItem(client, item.type, addedItem.id, item.tags);
                    }
                } else {
                    status = 'skipped'; // Assume skipped if createResource returns null (e.g., conflict)
                    reason = `${item.type.charAt(0).toUpperCase() + item.type.slice(1)} likely already exists.`;
                    results.skippedCount++;
                }
                 // --- End Resource Creation ---

            } catch (itemError) {
                 let message = 'Unknown error during item processing.';
                 if (itemError instanceof Error) {
                     message = itemError.message;
                 }
                 console.warn(`[Bulk Add Item Error] Item: ${JSON.stringify(item)}, Error: ${message}`);
                 status = 'error';
                 reason = message.substring(0, 200); // Truncate long messages
                 results.errorCount++; // Increment error count
                 results.skippedCount++; // Also count errors as skipped from adding
            }

            // Record detail for this item
            results.details.push({
                input: { name: item.name, type: item.type },
                status,
                reason: reason || undefined, // Only include reason if there is one
                id: addedItem?.id || undefined,
                type: addedItem ? item.type : undefined,
            });
        } // End loop through items

        await client.query('COMMIT');
        results.message = `Processed ${results.processedCount} items. Added: ${results.addedCount}, Skipped/Existed: ${results.skippedCount}, Errors: ${results.errorCount}.`; // Updated message
        return results;
    } catch (err) { // Transaction level error
        await client.query('ROLLBACK').catch(rbErr => console.error("Rollback Error:", rbErr));
        console.error('[AdminModel bulkAddItems] Transaction error:', err);
        throw new Error('Bulk add operation failed during transaction.');
    } finally {
        client.release();
    }
};