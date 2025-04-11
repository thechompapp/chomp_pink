/* src/doof-backend/models/adminModel.ts */
import db from '../db/index.js';
import type { PoolClient } from 'pg';
import bcrypt from 'bcryptjs';

// Import individual models and their types/formatters
import * as RestaurantModel from './restaurantModel.js';
import * as DishModel from './dishModel.js';
import * as ListModel from './listModel.js';
import * as HashtagModel from './hashtagModel.js';
import * as UserModel from './userModel.js';
import * as NeighborhoodModel from './neighborhoodModel.js'; // Import Neighborhood model

interface BulkAddItem {
    type: 'restaurant' | 'dish';
    name: string;
    city_id?: number | null;
    neighborhood_id?: number | null;
    city?: string | null; // Original field name was city
    neighborhood?: string | null; // Original field name was neighborhood
    location?: string | null; // Original field name was location (used for address)
    place_id?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    restaurant_name?: string | null;
    tags?: string[];
}


interface BulkAddResultDetail {
    input: { name: string; type: string };
    status: 'added' | 'skipped' | 'error';
    reason?: string;
    id?: number;
    type?: string;
}

interface BulkAddResults {
    processedCount: number;
    addedCount: number;
    skippedCount: number;
    details: BulkAddResultDetail[];
    message?: string;
}

// Type definition for allowed update/create payloads (adjust as needed)
type MutatePayload = Partial<RestaurantModel.Restaurant>
                   | Partial<DishModel.Dish>
                   | Partial<ListModel.List>
                   | Partial<HashtagModel.Hashtag>
                   | Partial<NeighborhoodModel.Neighborhood> // Add Neighborhood type
                   | Partial<Omit<UserModel.User, 'password_hash' | 'created_at'>> & { password?: string }; // Allow password for create

type ResourceType = 'restaurants' | 'dishes' | 'lists' | 'hashtags' | 'users' | 'neighborhoods';

const ALLOWED_TYPES = ['restaurants', 'dishes', 'lists', 'hashtags', 'users', 'neighborhoods'];
const typeToTable: Record<string, string> = {
    restaurants: 'restaurants', dishes: 'dishes',
    lists: 'lists', hashtags: 'hashtags', users: 'users', neighborhoods: 'neighborhoods'
};

/**
 * Creates a new resource based on its type.
 * Handles password hashing for user creation.
 */
export const createResource = async (
    resourceType: ResourceType,
    createData: MutatePayload,
    userId?: number | null, // Optional userId, needed for lists
    userHandle?: string | null // Optional handle, needed for lists
): Promise<any | null> => {
    console.log(`[AdminModel createResource] Type: ${resourceType}, Data:`, createData);

    switch (resourceType) {
        case 'restaurants':
            return RestaurantModel.createRestaurant(createData as Partial<RestaurantModel.Restaurant>);
        case 'dishes':
            // Ensure required fields for dish are present before casting
            if (!createData.name || typeof createData.restaurant_id !== 'number') {
                 throw new Error("Dish name and valid restaurant_id are required.");
            }
            return DishModel.createDish(createData as { name: string; restaurant_id: number });
        case 'lists':
            if (!createData.name || !userId || !userHandle) {
                throw new Error("List name, userId, and userHandle are required to create a list.");
            }
            // Cast carefully after validation
            return ListModel.createList(createData as Partial<ListModel.List> & { name: string }, userId, userHandle);
        case 'hashtags':
            // Hashtag creation logic likely resides in a tag assignment flow,
            // but if direct creation is needed:
             if (!createData.name) throw new Error("Hashtag name is required.");
             // return HashtagModel.createHashtag(createData as { name: string; category?: string });
             console.warn(`[AdminModel] Direct hashtag creation not typically expected via admin update. Implement HashtagModel.createHashtag if needed.`);
             return null; // Placeholder
        case 'users':
            if (!createData.username || !createData.email || !createData.password) {
                throw new Error("Username, email, and password are required for user creation.");
            }
            const passwordHash = await bcrypt.hash(createData.password, 10);
            // Ensure required fields exist before calling createUser
             return UserModel.createUser(
                 createData.username,
                 createData.email,
                 passwordHash
                 // Account type defaults to 'user' in model if not provided
             );
        case 'neighborhoods':
             // Ensure required fields are present
            if (!createData.name || typeof createData.city_id !== 'number') {
                throw new Error("Neighborhood name and valid city_id are required.");
            }
            // Use the imported NeighborhoodModel function
             return NeighborhoodModel.createNeighborhood(createData as { name: string; city_id: number });
        default:
            console.error(`[AdminModel createResource] Unsupported resource type: ${resourceType}`);
            throw new Error(`Creation not supported for resource type: ${resourceType}`);
    }
};


/**
 * Updates an existing resource based on its type and ID.
 * Routes the request to the appropriate specific model's update function.
 */
export const updateResource = async (
    resourceType: ResourceType,
    id: number,
    updateData: MutatePayload,
    userId?: number | null // Optional: might be needed for ownership checks later
): Promise<any | null> => {
    console.log(`[AdminModel updateResource] Type: ${resourceType}, ID: ${id}, Data:`, updateData);

    if (Object.keys(updateData).length === 0) {
        console.warn(`[AdminModel updateResource] No data provided for update.`);
        // Optionally fetch and return the current record if no changes are requested.
        // This requires a generic 'findById' or routing to specific finders.
        return null; // Or fetch current record
    }

    // Delegate to the specific model's update function
    switch (resourceType) {
        case 'restaurants':
            return RestaurantModel.updateRestaurant(id, updateData as Partial<RestaurantModel.Restaurant>);
        case 'dishes':
            return DishModel.updateDish(id, updateData as Partial<DishModel.Dish>);
        case 'lists':
            // Ensure list updates don't try to set user_id or creator_handle directly if not allowed
            delete updateData.user_id;
            delete updateData.creator_handle;
            return ListModel.updateList(id, updateData as Partial<ListModel.List>);
        case 'hashtags':
            // Ensure required fields exist if updating name/category
            return HashtagModel.updateHashtag(id, updateData as Partial<HashtagModel.Hashtag>);
        case 'users':
            // IMPORTANT: Prevent password updates via this generic route.
            // Handle password changes separately in a dedicated, secure endpoint.
            if ('password' in updateData) {
                console.error(`[AdminModel updateResource] Attempted password update via generic route for user ${id}. Denied.`);
                throw new Error("Password updates must use a dedicated route.");
            }
            delete updateData.password_hash; // Ensure hash isn't accidentally passed
            // Ensure required fields exist if updating username/email
            return UserModel.updateUser(id, updateData as Partial<UserModel.User>);
         case 'neighborhoods':
            // Use the imported NeighborhoodModel function
             return NeighborhoodModel.updateNeighborhood(id, updateData as Partial<NeighborhoodModel.Neighborhood>);
        default:
            console.error(`[AdminModel updateResource] Unsupported resource type: ${resourceType}`);
            throw new Error(`Updates not supported for resource type: ${resourceType}`);
    }
};


export const bulkAddItems = async (items: BulkAddItem[]): Promise<BulkAddResults> => {
    const client: PoolClient = await db.getClient();
    const results: BulkAddResults = { processedCount: 0, addedCount: 0, skippedCount: 0, details: [] };

    try {
        await client.query('BEGIN');

        for (const item of items) {
            results.processedCount++;
            let addedItem: any = null;
            let reason: string = '';
            let status: 'added' | 'skipped' | 'error' = 'skipped';
            let itemCityId = item.city_id;
            let itemNeighborhoodId = item.neighborhood_id;

            try {
                // --- Resolve City and Neighborhood IDs if names provided ---
                // Prioritize provided IDs, then lookup by name if names are given but IDs aren't
                if (!itemCityId && item.city) {
                    const cityRes = await client.query<{ id: number }>('SELECT id FROM cities WHERE name ILIKE $1 LIMIT 1', [item.city]);
                    if (cityRes.rowCount > 0) itemCityId = cityRes.rows[0].id;
                    else console.warn(`[BulkAdd] City '${item.city}' not found.`);
                }

                if (itemCityId && !itemNeighborhoodId && item.neighborhood) {
                    const nbRes = await client.query<{ id: number }>('SELECT id FROM neighborhoods WHERE name ILIKE $1 AND city_id = $2 LIMIT 1', [item.neighborhood, itemCityId]);
                    if (nbRes.rowCount > 0) itemNeighborhoodId = nbRes.rows[0].id;
                     else console.warn(`[BulkAdd] Neighborhood '${item.neighborhood}' not found in City ID ${itemCityId}.`);
                }
                // --- End ID Resolution ---

                if (item.type === 'restaurant') {
                    // Use resolved IDs
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
                         // Add tags if provided
                         if (addedItem && Array.isArray(item.tags) && item.tags.length > 0) {
                             await addTagsToItem(client, 'restaurant', addedItem.id, item.tags);
                         }
                    } else {
                        reason = 'Restaurant likely already exists with this name in the specified city.';
                        results.skippedCount++;
                    }
                } else if (item.type === 'dish') {
                    let restaurantId: number | null = null;
                    if (item.restaurant_name) {
                        // Find restaurant by name *and potentially city* for better accuracy
                        const findRestQuery = 'SELECT id FROM restaurants WHERE name ILIKE $1' + (itemCityId ? ' AND city_id = $2' : '') + ' LIMIT 1';
                        const findRestParams = itemCityId ? [item.restaurant_name, itemCityId] : [item.restaurant_name];
                        const restResult = await client.query<{ id: number }>(findRestQuery, findRestParams);

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
                            // Add tags if provided
                             if (addedItem && Array.isArray(item.tags) && item.tags.length > 0) {
                                 await addTagsToItem(client, 'dish', addedItem.id, item.tags);
                             }
                        } else {
                            reason = reason || 'Dish likely already exists for this restaurant.';
                            results.skippedCount++;
                        }
                    } else {
                        results.skippedCount++;
                    }
                }
            } catch (itemError: unknown) {
                let message = 'Unknown error during item processing.';
                 if (itemError instanceof Error) {
                     // Check for specific DB errors if needed (e.g., FK violation)
                     if ((itemError as any).code === '23503') { // Foreign key violation
                         message = `Invalid reference detected (e.g., City ID, Neighborhood ID, Restaurant ID). Details: ${(itemError as any).detail || itemError.message}`;
                     } else {
                         message = itemError.message;
                     }
                 }
                console.warn(`[Bulk Add Item Error] Item: ${JSON.stringify(item)}, Error: ${message}`);
                status = 'error';
                reason = message.substring(0, 200);
                results.skippedCount++;
            }
            results.details.push({
                input: { name: item.name, type: item.type },
                status,
                reason: reason || undefined,
                id: addedItem?.id || undefined,
                type: addedItem ? item.type : undefined,
            });
        }

        await client.query('COMMIT');
        results.message = `Processed ${results.processedCount} items. Added: ${results.addedCount}, Skipped/Existed/Error: ${results.skippedCount}.`;
        return results;
    } catch (err: unknown) {
        await client.query('ROLLBACK').catch(rbErr => console.error("Rollback Error:", rbErr));
        console.error('[AdminModel bulkAddItems] Transaction error:', err);
        throw new Error('Bulk add operation failed during transaction.');
    } finally {
        client.release();
    }
};

// Helper function to add tags to a restaurant or dish within bulk add transaction
async function addTagsToItem(client: PoolClient, itemType: 'restaurant' | 'dish', itemId: number, tags: string[]): Promise<void> {
    if (!tags || tags.length === 0) return;

    const tagPlaceholders = tags.map((_, i) => `$${i + 1}`).join(',');
    const findTagsQuery = `SELECT id, name FROM hashtags WHERE name = ANY($1::text[])`;
    const foundTagsResult = await client.query<{ id: number, name: string }>(findTagsQuery, [tags]);
    const foundTagsMap = new Map(foundTagsResult.rows.map(row => [row.name, row.id]));

    const junctionTable = itemType === 'restaurant' ? 'restauranthashtags' : 'dishhashtags';
    const itemIdColumn = itemType === 'restaurant' ? 'restaurant_id' : 'dish_id';

    const inserts: Promise<any>[] = [];
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

// Delete function remains the same
export const deleteResourceById = async (tableName: string, id: number): Promise<boolean> => {
    // Whitelist allowed table names to prevent SQL injection
    const allowedTables = ['restaurants', 'dishes', 'lists', 'submissions', 'users', 'hashtags', 'neighborhoods']; // Add neighborhoods
    if (!allowedTables.includes(tableName)) {
        throw new Error(`Invalid table name: ${tableName}. Allowed tables: ${allowedTables.join(', ')}`);
    }
    const query = `DELETE FROM ${tableName} WHERE id = $1 RETURNING id`;
    const result = await db.query(query, [id]);
    return (result.rowCount ?? 0) > 0;
};

// Need to define the getAdminNeighborhoods and other related functions if they belong here
// Or confirm they exist in neighborhoodModel.ts and are used correctly in admin.ts route

// Example placeholder if needed (likely should be in neighborhoodModel.ts)
/*
export const getAdminNeighborhoods = async (options: { page: number, limit: number, sortBy: string, sortOrder: string, search?: string, cityId?: number }) => {
    // Implementation using neighborhoodModel.getAllNeighborhoods
    console.warn("[AdminModel] getAdminNeighborhoods called, should likely use neighborhoodModel directly.");
    const { neighborhoods, total } = await NeighborhoodModel.getAllNeighborhoods(
        options.limit,
        (options.page - 1) * options.limit,
        options.sortBy,
        options.sortOrder as 'ASC' | 'DESC',
        options.search,
        options.cityId
    );
    return {
        data: neighborhoods,
        pagination: { total, page: options.page, limit: options.limit, totalPages: Math.ceil(total / options.limit) }
    };
};
*/