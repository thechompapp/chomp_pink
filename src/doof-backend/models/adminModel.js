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

// *** ADDED: Import zipcode lookup function ***
import { findNeighborhoodByZipcode } from './neighborhoodModel.js';

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
            // Corrected template literal syntax
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
    // ... (createResource implementation remains the same) ...
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
    // ... (updateResource implementation remains the same) ...
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
    // ... (deleteResourceById implementation remains the same) ...
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
                    // 1. City Lookup (by name if ID not provided)
                    if (!itemCityId && item.city) {
                        const cityRes = await client.query('SELECT id FROM cities WHERE name ILIKE $1 LIMIT 1', [item.city]);
                        if (cityRes.rowCount > 0) {
                            itemCityId = cityRes.rows[0].id;
                            console.log(`[BulkAdd] Looked up City ID ${itemCityId} for "${item.city}"`);
                        } else {
                             console.warn(`[BulkAdd] City '${item.city}' not found.`);
                             // Decide how to handle: skip item or proceed without city?
                             // Throwing an error is safer to ensure data integrity if city is required
                             throw new Error(`City '${item.city}' not found. Cannot add restaurant '${item.name}'.`);
                        }
                    } else if (itemCityId) {
                        // Verify provided city_id exists
                         const cityCheckRes = await client.query('SELECT id FROM cities WHERE id = $1', [itemCityId]);
                         if (cityCheckRes.rowCount === 0) {
                             throw new Error(`Provided City ID ${itemCityId} does not exist. Cannot add restaurant '${item.name}'.`);
                         }
                    } else if (!itemCityId && !item.city) {
                         // City is mandatory for restaurants (due to unique constraint usually)
                         throw new Error(`City name or ID is required for restaurant '${item.name}'.`);
                    }

                    // 2. Neighborhood Lookup (Prioritize Zipcode if possible)
                    const address = item.address || item.location; // Use address or location field
                    const zipcodeMatch = typeof address === 'string' ? address.match(/\b(\d{5})\b/) : null;
                    const zipcode = zipcodeMatch ? zipcodeMatch[1] : null;
                    let foundNeighborhoodByZip = null;

                    if (zipcode && itemCityId) {
                         console.log(`[BulkAdd] Zipcode ${zipcode} found for "${item.name}". Looking up neighborhood...`);
                         try {
                            foundNeighborhoodByZip = await findNeighborhoodByZipcode(zipcode); // Use the imported function
                            if (foundNeighborhoodByZip) {
                                if (Number(foundNeighborhoodByZip.city_id) === Number(itemCityId)) {
                                    console.log(`[BulkAdd] Found Neighborhood via zipcode ${zipcode}: ID ${foundNeighborhoodByZip.id}, Name: ${foundNeighborhoodByZip.name}`);
                                    itemNeighborhoodId = foundNeighborhoodByZip.id;
                                    finalNeighborhoodName = foundNeighborhoodByZip.name; // Override name from input
                                } else {
                                    console.warn(`[BulkAdd] Zipcode ${zipcode} lookup returned neighborhood ${foundNeighborhoodByZip.name} but city ID ${foundNeighborhoodByZip.city_id} mismatch (expected ${itemCityId}). Ignoring.`);
                                    foundNeighborhoodByZip = null; // Discard mismatch
                                }
                            } else {
                                console.log(`[BulkAdd] No neighborhood found for zipcode ${zipcode}.`);
                            }
                         } catch (zipError) {
                             console.error(`[BulkAdd] Zipcode lookup error for ${zipcode}:`, zipError);
                             // Continue, fallback to name lookup
                         }
                    }

                    // 3. Fallback: Neighborhood Lookup (by name, only if not found by zip and name provided)
                    if (!foundNeighborhoodByZip && !itemNeighborhoodId && item.neighborhood && itemCityId) {
                        const nbRes = await client.query('SELECT id FROM neighborhoods WHERE name ILIKE $1 AND city_id = $2 LIMIT 1', [item.neighborhood, itemCityId]);
                        if (nbRes.rowCount > 0) {
                            itemNeighborhoodId = nbRes.rows[0].id;
                            finalNeighborhoodName = item.neighborhood; // Keep original name if found this way
                            console.log(`[BulkAdd] (Fallback) Found Neighborhood ID ${itemNeighborhoodId} by name "${item.neighborhood}"`);
                        } else {
                             console.warn(`[BulkAdd] (Fallback) Neighborhood '${item.neighborhood}' not found in City ID ${itemCityId}. Setting neighborhood to NULL.`);
                             itemNeighborhoodId = null;
                             finalNeighborhoodName = null;
                        }
                    } else if (!foundNeighborhoodByZip) {
                        // If no zip lookup and no name provided, or ID already set, ensure name matches ID or is null
                        if (itemNeighborhoodId) {
                            const nbCheck = await client.query('SELECT name FROM neighborhoods WHERE id = $1', [itemNeighborhoodId]);
                            finalNeighborhoodName = nbCheck.rows[0]?.name || null;
                        } else {
                            finalNeighborhoodName = null; // Ensure null if ID is null
                        }
                    }
                }
                // --- End Location Lookups ---

                // --- Resource Creation ---
                const createPayload = {
                    ...item, // Spread original item data
                    city_id: itemCityId, // Use potentially looked-up/verified ID
                    neighborhood_id: itemNeighborhoodId, // Use potentially looked-up/verified ID
                    city_name: item.city, // Pass original city name for restaurants table column
                    neighborhood_name: finalNeighborhoodName, // Pass final determined name for restaurants table column
                    // Ensure address/location are passed correctly
                    address: item.address || item.location,
                };

                // Clean up fields not directly used by createResource or specific models
                delete createPayload.city; // Already handled by city_id/city_name
                delete createPayload.neighborhood; // Already handled by neighborhood_id/neighborhood_name
                delete createPayload.location; // Use 'address' field

                // If type is 'dish', ensure only relevant fields are passed
                if (item.type === 'dish') {
                    // Verify restaurant_id exists for dishes
                    if (!item.restaurant_id && item.restaurant_name) {
                        // Attempt to lookup restaurant ID by name (assuming unique name per city or handle appropriately)
                        console.warn(`[BulkAdd] Dish "${item.name}" missing restaurant_id. Attempting lookup by name "${item.restaurant_name}". This might be ambiguous.`);
                        // Add lookup logic here if necessary, otherwise throw error if ID is mandatory
                        throw new Error(`Restaurant ID is required for dish "${item.name}" in bulk add.`);
                    } else if (!item.restaurant_id && !item.restaurant_name) {
                         throw new Error(`Restaurant ID or Name is required for dish "${item.name}" in bulk add.`);
                    }
                    createPayload.restaurant_id = Number(item.restaurant_id); // Ensure number
                    // Remove restaurant-specific fields not needed for dish creation
                    delete createPayload.address;
                    delete createPayload.google_place_id;
                    delete createPayload.latitude;
                    delete createPayload.longitude;
                    delete createPayload.phone_number;
                    delete createPayload.website;
                    delete createPayload.instagram_handle;
                    delete createPayload.photo_url;
                    delete createPayload.city_id;
                    delete createPayload.city_name;
                    delete createPayload.neighborhood_id;
                    delete createPayload.neighborhood_name;
                }

                // Call createResource which handles DB insertion and conflict checking
                addedItem = await createResource(item.type, createPayload);

                if (addedItem) {
                    status = 'added';
                    results.addedCount++;
                    // Add tags if provided and item was added successfully
                    if (Array.isArray(item.tags) && item.tags.length > 0 && (item.type === 'restaurant' || item.type === 'dish')) {
                        await addTagsToItem(client, item.type, addedItem.id, item.tags);
                    }
                } else {
                    status = 'skipped';
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