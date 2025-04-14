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


const ALLOWED_TYPES = ['restaurants', 'dishes', 'lists', 'hashtags', 'users', 'neighborhoods'];
const typeToTable = {
    restaurants: 'restaurants', dishes: 'dishes',
    lists: 'lists', hashtags: 'hashtags', users: 'users', neighborhoods: 'neighborhoods'
};

// Helper function to add tags (no TS needed)
async function addTagsToItem(client, itemType, itemId, tags) {
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
                INSERT INTO ${junctionTable} (${itemIdColumn}, hashtag_id)
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
                 type: createData.list_type, // Use list_type from input
                 tags: createData.tags,
                 city_name: createData.city_name
             };
            return ListModel.createList(listPayload, userId, userHandle);
        case 'hashtags':
             if (!createData.name) throw new Error("Hashtag name is required.");
             console.warn(`[AdminModel] Direct hashtag creation not typically expected via admin update. Implement HashtagModel.createHashtag if needed.`);
             return null; // Or call HashtagModel.createHashtag if implemented
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
                zip_codes: createData.zipcode_ranges // Map field name if needed
            };
             return NeighborhoodModel.createNeighborhood(neighborhoodPayload);
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

    // Ensure numeric ID
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
    if (isNaN(numericId) || numericId <= 0) {
        throw new Error(`Invalid ID provided for update: ${id}`);
    }


    switch (resourceType) {
        case 'restaurants':
            return RestaurantModel.updateRestaurant(numericId, updateData);
        case 'dishes':
            return DishModel.updateDish(numericId, updateData);
        case 'lists':
            delete updateData.user_id; // Prevent changing owner
            delete updateData.creator_handle;
            return ListModel.updateList(numericId, updateData);
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
            if ('zip_codes' in neighborhoodUpdatePayload) {
                neighborhoodUpdatePayload.zipcode_ranges = neighborhoodUpdatePayload.zip_codes;
                delete neighborhoodUpdatePayload.zip_codes;
            }
             return NeighborhoodModel.updateNeighborhood(numericId, neighborhoodUpdatePayload);
        default:
            console.error(`[AdminModel updateResource] Unsupported resource type: ${resourceType}`);
            throw new Error(`Updates not supported for resource type: ${resourceType}`);
    }
};

export const bulkAddItems = async (items) => {
    const client = await db.getClient();
    const results = { processedCount: 0, addedCount: 0, skippedCount: 0, details: [] };

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
                // Attempt to find City ID if name provided and ID missing
                if (!itemCityId && item.city) {
                    const cityRes = await client.query('SELECT id FROM cities WHERE name ILIKE $1 LIMIT 1', [item.city]);
                    if (cityRes.rowCount > 0) itemCityId = cityRes.rows[0].id;
                    else console.warn(`[BulkAdd] City '${item.city}' not found.`);
                }

                // Attempt to find Neighborhood ID if name/CityID provided and ID missing
                if (itemCityId && !itemNeighborhoodId && item.neighborhood) {
                    const nbRes = await client.query('SELECT id FROM neighborhoods WHERE name ILIKE $1 AND city_id = $2 LIMIT 1', [item.neighborhood, itemCityId]);
                    if (nbRes.rowCount > 0) itemNeighborhoodId = nbRes.rows[0].id;
                     else console.warn(`[BulkAdd] Neighborhood '${item.neighborhood}' not found in City ID ${itemCityId}.`);
                }

                // Process Restaurant or Dish
                if (item.type === 'restaurant') {
                    const query = `
                        INSERT INTO restaurants (name, city_id, neighborhood_id, city_name, neighborhood_name, address, google_place_id, latitude, longitude, adds)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 0)
                        ON CONFLICT (name, city_id) DO NOTHING
                        RETURNING *
                    `;
                    const result = await client.query(query, [
                        item.name, itemCityId ?? null, itemNeighborhoodId ?? null, item.city || null,
                        item.neighborhood || null, item.location || null, item.place_id || null,
                        item.latitude || null, item.longitude || null
                    ]);
                    if (result.rows.length > 0) {
                        addedItem = result.rows[0];
                        status = 'added';
                        results.addedCount++;
                         if (addedItem && Array.isArray(item.tags) && item.tags.length > 0) {
                             await addTagsToItem(client, 'restaurant', addedItem.id, item.tags);
                         }
                    } else {
                        reason = 'Restaurant likely already exists with this name in the specified city.';
                        results.skippedCount++;
                    }
                } else if (item.type === 'dish') {
                    let restaurantId = null;
                    if (item.restaurant_name) {
                        // Find restaurant preferentially by name + city ID if available
                        const findRestQuery = 'SELECT id FROM restaurants WHERE name ILIKE $1' + (itemCityId ? ' AND city_id = $2' : '') + ' LIMIT 1';
                        const findRestParams = itemCityId ? [item.restaurant_name, itemCityId] : [item.restaurant_name];
                        const restResult = await client.query(findRestQuery, findRestParams);

                        if (restResult.rows.length > 0) {
                            restaurantId = restResult.rows[0].id;
                        } else {
                            reason = `Restaurant '${item.restaurant_name}' ${itemCityId ? `in City ID ${itemCityId}` : ''} not found. Dish skipped.`;
                        }
                    } else {
                        reason = 'Restaurant name missing for dish.';
                    }

                    if (restaurantId) {
                        const query = `
                            INSERT INTO dishes (name, restaurant_id, adds)
                            VALUES ($1, $2, 0)
                            ON CONFLICT (name, restaurant_id) DO NOTHING
                            RETURNING *
                        `;
                        const result = await client.query(query, [item.name, restaurantId]);
                        if (result.rows.length > 0) {
                            addedItem = result.rows[0];
                            status = 'added';
                            results.addedCount++;
                             if (addedItem && Array.isArray(item.tags) && item.tags.length > 0) {
                                 await addTagsToItem(client, 'dish', addedItem.id, item.tags);
                             }
                        } else {
                            reason = reason || 'Dish likely already exists for this restaurant.';
                            results.skippedCount++;
                        }
                    } else {
                        results.skippedCount++; // Restaurant not found or name missing
                    }
                }
            } catch (itemError) {
                let message = 'Unknown error during item processing.';
                 if (itemError instanceof Error) {
                     // Check for specific DB error codes
                     if (itemError.code === '23503') { // Foreign key violation
                         message = `Invalid reference detected (e.g., City ID, Neighborhood ID, Restaurant ID). Details: ${itemError.detail || itemError.message}`;
                     } else {
                         message = itemError.message;
                     }
                 }
                console.warn(`[Bulk Add Item Error] Item: ${JSON.stringify(item)}, Error: ${message}`);
                status = 'error';
                reason = message.substring(0, 200); // Limit reason length
                results.skippedCount++;
            }
            // Record result detail
            results.details.push({
                input: { name: item.name, type: item.type },
                status,
                reason: reason || undefined, // Only include reason if there is one
                id: addedItem?.id || undefined,
                type: addedItem ? item.type : undefined,
            });
        }

        await client.query('COMMIT');
        results.message = `Processed ${results.processedCount} items. Added: ${results.addedCount}, Skipped/Existed/Error: ${results.skippedCount}.`;
        return results;
    } catch (err) {
        await client.query('ROLLBACK').catch(rbErr => console.error("Rollback Error:", rbErr));
        console.error('[AdminModel bulkAddItems] Transaction error:', err);
        throw new Error('Bulk add operation failed during transaction.');
    } finally {
        client.release();
    }
};

export const deleteResourceById = async (tableName, id) => {
    const allowedTables = ['restaurants', 'dishes', 'lists', 'submissions', 'users', 'hashtags', 'neighborhoods'];
    if (!allowedTables.includes(tableName)) {
        throw new Error(`Invalid table name: ${tableName}. Allowed tables: ${allowedTables.join(', ')}`);
    }
    // Ensure numeric ID
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
    if (isNaN(numericId) || numericId <= 0) {
        throw new Error(`Invalid ID provided for deletion: ${id}`);
    }

    const query = `DELETE FROM ${tableName} WHERE id = $1 RETURNING id`;
    const result = await db.query(query, [numericId]);
    return (result.rowCount ?? 0) > 0;
};

// --- Submission Admin Functions ---
export const getSubmissions = async (params) => {
     console.warn("[AdminModel getSubmissions] Deprecated: Use adminService/getAdminData('submissions', params) instead.");
     return SubmissionModel.findSubmissionsByStatus(params?.status || 'pending');
};

export const updateSubmissionStatus = async (id, status, reviewerId) => {
     // Delegate to SubmissionModel
     return SubmissionModel.updateSubmissionStatus(id, status, reviewerId);
};