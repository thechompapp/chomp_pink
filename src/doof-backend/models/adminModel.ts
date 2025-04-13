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
import * as SubmissionModel from './submissionModel.js'; // Import Submission model for types/functions

// Re-import types if needed locally, adjust paths as necessary
import type { Restaurant } from '../../types/Restaurant.js';
import type { Dish } from '../../types/Dish.js';
import type { List } from '../../types/List.js';
import type { User } from '../../types/User.js';
import type { Submission } from '../../types/Submission.js';
import type { Hashtag } from './hashtagModel.js'; // Assuming local definition here
import type { Neighborhood } from './neighborhoodModel.js'; // Assuming local definition here

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
// Using imported types now
type MutatePayload = Partial<Restaurant>
                   | Partial<Dish>
                   | Partial<List>
                   | Partial<Hashtag>
                   | Partial<Neighborhood> // Add Neighborhood type
                   | Partial<Omit<User, 'password_hash' | 'created_at'>> & { password?: string }; // Allow password for create

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
             // Use the imported RestaurantModel function
            return RestaurantModel.createRestaurant(createData as Partial<Restaurant>);
        case 'dishes':
            // Ensure required fields for dish are present before casting
            if (!createData.name || typeof (createData as Partial<Dish>).restaurant_id !== 'number') {
                 throw new Error("Dish name and valid restaurant_id are required.");
            }
             // Use the imported DishModel function
            return DishModel.createDish(createData as { name: string; restaurant_id: number });
        case 'lists':
            if (!createData.name || !userId || !userHandle) {
                throw new Error("List name, userId, and userHandle are required to create a list.");
            }
             // Use the imported ListModel function
            return ListModel.createList(createData as Partial<List> & { name: string }, userId, userHandle);
        case 'hashtags':
            // Hashtag creation logic likely resides in a tag assignment flow,
            // but if direct creation is needed:
             if (!createData.name) throw new Error("Hashtag name is required.");
             // Use the imported HashtagModel function
             // return HashtagModel.createHashtag(createData as { name: string; category?: string });
             console.warn(`[AdminModel] Direct hashtag creation not typically expected via admin update. Implement HashtagModel.createHashtag if needed.`);
             return null; // Placeholder
        case 'users':
            if (!(createData as Partial<User>).username || !(createData as Partial<User>).email || !(createData as { password?: string }).password) {
                throw new Error("Username, email, and password are required for user creation.");
            }
            const passwordHash = await bcrypt.hash((createData as { password: string }).password, 10);
             // Use the imported UserModel function
             return UserModel.createUser(
                 (createData as Partial<User>).username!,
                 (createData as Partial<User>).email!,
                 passwordHash,
                  (createData as Partial<User>).account_type // Pass account type if provided
             );
        case 'neighborhoods':
             // Ensure required fields are present
            if (!createData.name || typeof (createData as Partial<Neighborhood>).city_id !== 'number') {
                throw new Error("Neighborhood name and valid city_id are required.");
            }
            // Use the imported NeighborhoodModel function
             return NeighborhoodModel.createNeighborhood(createData as CreateNeighborhoodData); // Use correct type
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
            // Use the imported RestaurantModel function
            return RestaurantModel.updateRestaurant(id, updateData as Partial<Restaurant>);
        case 'dishes':
             // Use the imported DishModel function
            return DishModel.updateDish(id, updateData as Partial<Dish>);
        case 'lists':
             // Use the imported ListModel function
            // Ensure list updates don't try to set user_id or creator_handle directly if not allowed
            delete (updateData as Partial<List>).user_id;
            delete (updateData as Partial<List>).creator_handle;
            return ListModel.updateList(id, updateData as Partial<List>);
        case 'hashtags':
             // Use the imported HashtagModel function
            return HashtagModel.updateHashtag(id, updateData as Partial<Hashtag>);
        case 'users':
            // IMPORTANT: Prevent password updates via this generic route.
            // Handle password changes separately in a dedicated, secure endpoint.
            if ('password' in updateData) {
                console.error(`[AdminModel updateResource] Attempted password update via generic route for user ${id}. Denied.`);
                throw new Error("Password updates must use a dedicated route.");
            }
            delete (updateData as Partial<User>).password_hash; // Ensure hash isn't accidentally passed
             // Use the imported UserModel function
            return UserModel.updateUser(id, updateData as Partial<User>);
         case 'neighborhoods':
            // Use the imported NeighborhoodModel function
             return NeighborhoodModel.updateNeighborhood(id, updateData as UpdateNeighborhoodData); // Use correct type
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

// --- Submission Admin Functions ---
// Assuming functions like getSubmissions, updateSubmissionStatus are in submissionModel.ts
export const getSubmissions = async (params: {
    status?: Submission['status'];
    limit: number;
    offset: number;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
}): Promise<{ submissions: Submission[], total: number }> => {
    // Delegate to SubmissionModel
    return SubmissionModel.getSubmissions(params);
};

export const updateSubmissionStatus = async (
    id: number,
    status: Submission['status'],
    reviewerId: number
): Promise<Submission | null> => {
     // Delegate to SubmissionModel
    return SubmissionModel.updateSubmissionStatus(id, status, reviewerId);
};


// --- User Admin Functions ---
// Assuming functions like getAllUsers, updateUserRole are in userModel.ts
export const getAllUsers = async (limit: number, offset: number): Promise<{ users: User[], total: number }> => {
     // Delegate to UserModel
    return UserModel.getUsers({ limit, offset });
};

export const updateUserRole = async (userId: number, isSuperuser: boolean): Promise<User | null> => {
     // Delegate to UserModel
    return UserModel.updateUserRole(userId, isSuperuser);
};

// --- Restaurant Admin Functions (New) ---

/**
 * Fetches all restaurants for the admin panel with pagination and basic details.
 * Includes neighborhood name via JOIN.
 */
export const getAllRestaurantsForAdmin = async (
    limit: number,
    offset: number
): Promise<{ restaurants: (Restaurant & { neighborhood_name?: string })[], total: number }> => {
    const countQuery = 'SELECT COUNT(*) FROM restaurants';
    const dataQuery = `
        SELECT r.*, n.name as neighborhood_name
        FROM restaurants r
        LEFT JOIN neighborhoods n ON r.neighborhood_id = n.id
        ORDER BY r.name ASC -- Default sort
        LIMIT $1 OFFSET $2
    `;
    try {
        const countResult = await db.query(countQuery);
        const total = parseInt(countResult.rows[0].count, 10);
        const dataResult = await db.query(dataQuery, [limit, offset]);
        // Format response if needed, though basic join is likely okay
        return { restaurants: dataResult.rows || [], total };
    } catch (error) {
        console.error('[AdminModel getAllRestaurantsForAdmin] Error fetching restaurants:', error);
        throw error;
    }
};

/**
 * Fetches a single restaurant by ID for admin editing.
 * Includes neighborhood name via JOIN.
 */
export const getRestaurantByIdForAdmin = async (id: number): Promise<(Restaurant & { neighborhood_name?: string }) | null> => {
  const query = `
    SELECT r.*, n.name as neighborhood_name
    FROM restaurants r
    LEFT JOIN neighborhoods n ON r.neighborhood_id = n.id
    WHERE r.id = $1
  `;
  try {
    const { rows } = await db.query(query, [id]);
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error(`[AdminModel getRestaurantByIdForAdmin] Error fetching restaurant ID ${id}:`, error);
    throw error;
  }
};

/**
 * Updates a restaurant's details based on admin input.
 * Uses the specific RestaurantModel.updateRestaurant function.
 */
export const updateRestaurant = async (id: number, restaurantData: Partial<Restaurant>): Promise<Restaurant | null> => {
    console.log(`[AdminModel updateRestaurant] Updating ID ${id} with data:`, restaurantData);
    try {
         // Delegate directly to the specialized RestaurantModel function
         // This assumes RestaurantModel.updateRestaurant handles allowed fields, etc.
        return await RestaurantModel.updateRestaurant(id, restaurantData);
    } catch (error) {
        console.error(`[AdminModel updateRestaurant] Error updating restaurant ID ${id}:`, error);
        // Handle specific errors (like unique constraints) if needed, or re-throw
        throw error;
    }
};