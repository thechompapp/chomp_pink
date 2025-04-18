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

// Import zipcode lookup function
import { findNeighborhoodByZipcode } from './neighborhoodModel.js';

const ALLOWED_TYPES = ['submissions', 'restaurants', 'dishes', 'lists', 'hashtags', 'users', 'neighborhoods', 'cities'];
const typeToTable = {
    submissions: 'submissions', restaurants: 'restaurants', dishes: 'dishes',
    lists: 'lists', hashtags: 'hashtags', users: 'users', neighborhoods: 'neighborhoods',
    cities: 'cities'
};

// Helper function to add tags
async function addTagsToItem(client, itemType, itemId, tags) {
   // ... (function body remains the same) ...
    if (!tags || tags.length === 0) return;
    const singularItemType = itemType.endsWith('s') && itemType !== 'dishes' ? itemType.slice(0, -1) : itemType; // Handle plural from generic routes

    const tagPlaceholders = tags.map((_, i) => `$${i + 1}`).join(',');
    const findTagsQuery = `SELECT id, name FROM hashtags WHERE name = ANY($1::text[])`;
    const foundTagsResult = await client.query(findTagsQuery, [tags]);
    const foundTagsMap = new Map(foundTagsResult.rows.map(row => [row.name, row.id]));

    // Use singular type to determine junction table/column
    const junctionTable = singularItemType === 'restaurant' ? 'restauranthashtags' : 'dishhashtags';
    const itemIdColumn = singularItemType === 'restaurant' ? 'restaurant_id' : 'dish_id';


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
    // Previous marker log - can be removed now if desired
    // console.log(`\n\n*** ENTERING createResource - VERSION CHECK (Log added ${new Date().toISOString()}) ***\n\n`);
    console.log(`[AdminModel createResource] Type received: ${resourceType}, Data:`, createData);

    // Explicit check logs - can be removed now if desired
    // const targetCase = 'restaurants';
    // console.log(`[AdminModel createResource] Explicit Check: Comparing resourceType with targetCase...`);
    // console.log(`   > resourceType        (JSON): ${JSON.stringify(resourceType)}`);
    // console.log(`   > targetCase ('restaurants') (JSON): ${JSON.stringify(targetCase)}`);
    // console.log(`   > Strict Equality (===): ${resourceType === targetCase}`);
    // console.log(`   > resourceType.length: ${resourceType?.length}`);
    // console.log(`   > targetCase.length:   ${targetCase.length}`);

    // *** FIXED SWITCH TO HANDLE SINGULAR and PLURAL ***
    switch (resourceType) {
        case 'restaurant': // Handle singular from bulk add
        case 'restaurants': // Handle plural from generic routes
            console.log(`[AdminModel createResource] Routing to RestaurantModel.`);
            return RestaurantModel.createRestaurant(createData);
        case 'dish': // Handle singular from bulk add
        case 'dishes': // Handle plural from generic routes
            console.log(`[AdminModel createResource] Routing to DishModel.`);
            if (!createData.name || typeof createData.restaurant_id !== 'number') {
                 throw new Error("Dish name and valid restaurant_id are required.");
            }
            // Ensure only necessary data is passed for dish creation
            return DishModel.createDish({ name: createData.name, restaurant_id: createData.restaurant_id });
        case 'list': // Assuming 'lists' is always plural from generic routes if supported
        case 'lists':
            console.log(`[AdminModel createResource] Routing to ListModel.`);
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
        case 'hashtag':
        case 'hashtags':
             console.log(`[AdminModel createResource] Routing to Hashtag logic (currently stubbed).`);
             if (!createData.name) throw new Error("Hashtag name is required.");
             console.warn(`[AdminModel] Direct hashtag creation via generic route not implemented.`);
             return null; // Or call HashtagModel.createHashtag(createData); if implemented
        case 'user':
        case 'users':
            console.log(`[AdminModel createResource] Routing to UserModel.`);
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
        case 'neighborhood':
        case 'neighborhoods':
            console.log(`[AdminModel createResource] Routing to NeighborhoodModel.`);
            if (!createData.name || typeof createData.city_id !== 'number') {
                throw new Error("Neighborhood name and valid city_id are required.");
            }
            const neighborhoodPayload = {
                name: createData.name,
                city_id: createData.city_id,
                zipcode_ranges: createData.zipcode_ranges
            };
             return NeighborhoodModel.createNeighborhood(neighborhoodPayload);
        case 'city':
        case 'cities':
            console.log(`[AdminModel createResource] Routing to CityModel.`);
            if (!createData.name) throw new Error("City name is required.");
            return CityModel.createCity(createData);
        default:
            // This should now only be hit for truly unsupported types
            console.error(`[AdminModel createResource] Fallthrough to DEFAULT case. Unsupported resource type: ${resourceType}`);
            throw new Error(`Creation not supported for resource type: ${resourceType}`);
    }
};

// ... (rest of the file remains the same - updateResource, deleteResourceById, bulkAddItems, etc.) ...

export const updateResource = async (resourceType, id, updateData, userId) => {
    // ... (implementation remains the same) ...
     console.log(`[AdminModel updateResource] Type: ${resourceType}, ID: ${id}, Data:`, updateData);

    if (Object.keys(updateData).length === 0) {
        console.warn(`[AdminModel updateResource] No data provided for update.`);
        return null; // Or fetch and return current resource?
    }
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
    if (isNaN(numericId) || numericId <= 0) {
        throw new Error(`Invalid ID provided for update: ${id}`);
    }

    // Update switch might only need plural, as type comes from URL param typically
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
        case 'cities':
            return CityModel.updateCity(numericId, updateData); // Delegate to CityModel
        default:
            console.error(`[AdminModel updateResource] Unsupported resource type: ${resourceType}`);
            throw new Error(`Updates not supported for resource type: ${resourceType}`);
    }
};

export const deleteResourceById = async (tableName, id) => {
    // ... (implementation remains the same) ...
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

// --- Submission Admin Functions ---
export const getSubmissions = SubmissionModel.findSubmissionsByStatus;
export const updateSubmissionStatus = SubmissionModel.updateSubmissionStatus;

// --- Bulk Add Function ---
export const bulkAddItems = async (items) => {
    const client = await db.getClient();
    const results = { processedCount: 0, addedCount: 0, skippedCount: 0, errorCount: 0, details: [] };

    try {
        await client.query('BEGIN');

        for (const item of items) {
            results.processedCount++;
            let addedItem = null;
            let reason = '';
            let status = 'skipped';
            let itemCityId = item.city_id;
            let itemNeighborhoodId = item.neighborhood_id;
            let finalNeighborhoodName = item.neighborhood; // Start with provided name

            try {
                // --- Location Lookups (Restaurant ONLY) ---
                if (item.type === 'restaurant') {
                    if (!itemCityId || isNaN(Number(itemCityId)) || Number(itemCityId) <= 0) {
                         throw new Error(`Invalid or missing city_id for restaurant '${item.name}'.`);
                    }
                    const cityCheckRes = await client.query('SELECT id FROM cities WHERE id = $1', [itemCityId]);
                    if (cityCheckRes.rowCount === 0) {
                         throw new Error(`Provided City ID ${itemCityId} does not exist. Cannot add restaurant '${item.name}'.`);
                    }
                    if (item.neighborhood_id && !isNaN(Number(item.neighborhood_id)) && Number(item.neighborhood_id) > 0) {
                         itemNeighborhoodId = Number(item.neighborhood_id);
                         const nbCheck = await client.query('SELECT name FROM neighborhoods WHERE id = $1 AND city_id = $2', [itemNeighborhoodId, itemCityId]);
                         if (nbCheck.rowCount === 0) {
                              console.warn(`[BulkAdd] Provided Neighborhood ID ${itemNeighborhoodId} not found or doesn't belong to City ID ${itemCityId}. Setting to NULL.`);
                              itemNeighborhoodId = null;
                              finalNeighborhoodName = null;
                         } else {
                              finalNeighborhoodName = nbCheck.rows[0].name;
                         }
                    } else {
                         itemNeighborhoodId = null;
                         finalNeighborhoodName = null;
                    }
                }
                // --- End Location Lookups ---

                // --- Resource Creation Payload Preparation ---
                const createPayload = { ...item };
                if (item.type === 'restaurant') {
                    createPayload.city_id = itemCityId;
                    createPayload.neighborhood_id = itemNeighborhoodId;
                    createPayload.city_name = item.city_name; // Pass original name if needed by model
                    createPayload.neighborhood_name = finalNeighborhoodName;
                    // Clean up fields not directly used by createRestaurant
                    delete createPayload.city;
                    delete createPayload.neighborhood;
                    delete createPayload.location;
                    delete createPayload.restaurant_id;
                    delete createPayload.restaurant_name;
                } else if (item.type === 'dish') {
                    if (!item.restaurant_id || isNaN(Number(item.restaurant_id)) || Number(item.restaurant_id) <= 0) {
                         throw new Error(`Invalid or missing restaurant_id for dish '${item.name}'.`);
                    }
                    createPayload.restaurant_id = Number(item.restaurant_id);
                     const fieldsToRemove = ['address', 'google_place_id', 'latitude', 'longitude', 'phone_number', 'website', 'instagram_handle', 'photo_url', 'city_id', 'city_name', 'neighborhood_id', 'neighborhood_name', 'zipcode', 'city', 'neighborhood', 'location', 'place_id'];
                     fieldsToRemove.forEach(f => delete createPayload[f]);
                }
                // Note: We pass item.type (singular) directly to createResource now
                addedItem = await createResource(item.type, createPayload);

                if (addedItem) {
                    status = 'added';
                    results.addedCount++;
                    if (Array.isArray(item.tags) && item.tags.length > 0 && (item.type === 'restaurant' || item.type === 'dish')) {
                        // Use singular type for addTagsToItem logic if needed
                         await addTagsToItem(client, item.type, addedItem.id, item.tags);
                    }
                } else {
                    status = 'skipped';
                    reason = `${item.type.charAt(0).toUpperCase() + item.type.slice(1)} likely already exists.`;
                    results.skippedCount++;
                }

            } catch (itemError) {
                // Enhanced Logging
                 console.error(`[Bulk Add Item Error] Failed processing item: ${JSON.stringify(item)}`);
                 console.error(`  > Error Message: ${itemError.message}`);
                 console.error(`  > Error Code: ${itemError.code}`);
                 console.error(`  > Error Constraint: ${itemError.constraint}`);
                 console.error(`  > Error Detail: ${itemError.detail}`);
                 console.error(`  > Error Stack: ${itemError.stack}`);

                 let message = 'Unknown error during item processing.';
                 if (itemError instanceof Error) {
                     message = itemError.message;
                 }
                 status = 'error';
                 reason = message.substring(0, 200);
                 results.errorCount++;
                 results.skippedCount++;
            }

            results.details.push({
                input: { name: item.name, type: item.type },
                status,
                reason: reason || undefined,
                id: addedItem?.id || undefined,
                type: addedItem ? item.type : undefined,
            });
        } // End loop

        await client.query('COMMIT');
        results.message = `Processed ${results.processedCount} items. Added: ${results.addedCount}, Skipped/Existed: ${results.skippedCount}, Errors: ${results.errorCount}.`;
        return results;
    } catch (err) { // Transaction level error
        await client.query('ROLLBACK').catch(rbErr => console.error("Rollback Error:", rbErr));
        console.error('[AdminModel bulkAddItems] Transaction error:', err);
        throw new Error(`Bulk add operation failed during transaction. Error: ${err.message || 'Unknown DB error'}`);
    } finally {
        client.release();
    }
};

// Get Lookup Table
export const getLookupTable = async (tableName) => {
    const allowedLookupTables = ['cities', 'neighborhoods', 'hashtags'];
    if (!allowedLookupTables.includes(tableName)) {
        throw new Error(`Lookup not allowed for table: ${tableName}`);
    }
    const query = `SELECT id, name FROM ${tableName} ORDER BY name ASC`;
    try {
        const result = await db.query(query);
        return result.rows;
    } catch (error) {
        console.error(`[AdminModel getLookupTable] Error fetching lookup for ${tableName}:`, error);
        throw error;
    }
};