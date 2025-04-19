/* src/doof-backend/models/adminModel.js */
// Patch: Integrate restaurant chains, enhance bulkAddItems with lookup/suggestions

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
import * as CityModel from './cityModel.js';

// Import zipcode lookup function remains (if needed elsewhere, bulk add relies on frontend lookup now)
// import { findNeighborhoodByZipcode } from './neighborhoodModel.js';

// Patch: Add 'restaurant_chains' to allowed types
const ALLOWED_TYPES = ['submissions', 'restaurants', 'dishes', 'lists', 'hashtags', 'users', 'neighborhoods', 'cities', 'restaurant_chains'];
const typeToTable = {
    submissions: 'submissions', restaurants: 'restaurants', dishes: 'dishes',
    lists: 'lists', hashtags: 'hashtags', users: 'users', neighborhoods: 'neighborhoods',
    cities: 'cities', restaurant_chains: 'restaurant_chains' // Patch: Added mapping
};

// Helper function to add tags (ensure it uses lowercase table/column names)
async function addTagsToItem(client, itemType, itemId, tags) {
    if (!tags || tags.length === 0) return;
    // Ensure tags are lowercase and unique before processing
    const uniqueLowercaseTags = [...new Set(tags.map(t => String(t).toLowerCase().trim()).filter(Boolean))];
    if (uniqueLowercaseTags.length === 0) return;

    // Determine singular type correctly
    let singularItemType = itemType;
    if (itemType === 'restaurants') singularItemType = 'restaurant';
    else if (itemType === 'dishes') singularItemType = 'dish';
    // Add other plural->singular mappings if needed

    console.log(`[addTagsToItem] Processing tags for ${singularItemType} ID ${itemId}:`, uniqueLowercaseTags);

    // 1. Find existing tags or create new ones
    const foundTagsMap = new Map();
    const tagsToCreate = [];

    // Use lowercase table name 'hashtags'
    const findTagsQuery = `SELECT id, name FROM hashtags WHERE name = ANY($1::text[])`;
    const findTagsParams = [uniqueLowercaseTags];
     console.log(`[addTagsToItem] Finding existing tags: QUERY=${findTagsQuery} PARAMS=${JSON.stringify(findTagsParams)}`);
    const foundTagsResult = await client.query(findTagsQuery, findTagsParams);
    foundTagsResult.rows.forEach(row => foundTagsMap.set(row.name, row.id));
    console.log(`[addTagsToItem] Found existing tags:`, foundTagsMap);

    for (const tagName of uniqueLowercaseTags) {
        if (!foundTagsMap.has(tagName)) {
            tagsToCreate.push(tagName);
        }
    }

    // Create missing tags if any
    if (tagsToCreate.length > 0) {
        console.log(`[addTagsToItem] Creating new tags: ${tagsToCreate.join(', ')}`);
        const createTagsPlaceholders = tagsToCreate.map((_, i) => `($${i + 1})`).join(',');
        // Use lowercase table name 'hashtags'
        const createTagsQuery = `
            INSERT INTO hashtags (name) VALUES ${createTagsPlaceholders}
            ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name -- Handle race condition potential
            RETURNING id, name;
        `;
         console.log(`[addTagsToItem] Creating tags: QUERY=${createTagsQuery} PARAMS=${JSON.stringify(tagsToCreate)}`);
        const createdTagsResult = await client.query(createTagsQuery, tagsToCreate);
        createdTagsResult.rows.forEach(row => foundTagsMap.set(row.name, row.id));
         console.log(`[addTagsToItem] Created tags result:`, createdTagsResult.rows);
         console.log(`[addTagsToItem] Updated foundTagsMap:`, foundTagsMap);
    }


    // 2. Link item to tags
    // Use lowercase table/column names based on schema dump
    let junctionTable = '';
    let itemIdColumn = '';
     if (singularItemType === 'restaurant') {
         junctionTable = 'restauranthashtags'; itemIdColumn = 'restaurant_id'; // Use column name from schema dump
     } else if (singularItemType === 'dish') {
         junctionTable = 'dishhashtags'; itemIdColumn = 'dish_id'; // Use column name from schema dump
     } else {
          console.warn(`[addTagsToItem] Tagging not supported for item type: ${singularItemType}`);
          return;
     }


    const inserts = [];
    const insertQueryBase = `INSERT INTO ${junctionTable} (${itemIdColumn}, hashtag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING;`;
    console.log(`[addTagsToItem] Linking tags to ${singularItemType} ${itemId}:`);
    for (const tagName of uniqueLowercaseTags) {
        const tagId = foundTagsMap.get(tagName);
        if (tagId) {
            console.log(`  - Linking tag '${tagName}' (ID: ${tagId})`);
            inserts.push(client.query(insertQueryBase, [itemId, tagId]));
        } else {
            // This case should ideally not happen now with the create logic above
            console.warn(`[addTagsToItem] Tag '${tagName}' could not be found or created. Skipping linkage for item ${itemId}.`);
        }
    }
    await Promise.all(inserts);
    console.log(`[addTagsToItem] Completed tag linking for ${singularItemType} ${itemId}.`);
}


// Patch: Handle restaurant_chains create
export const createResource = async (resourceType, createData, userId, userHandle) => {
    console.log(`[AdminModel createResource] Type received: ${resourceType}, Data:`, createData);

    // Normalize type to lowercase singular/plural convention if needed
    const typeLower = resourceType?.toLowerCase();

    switch (typeLower) {
        case 'restaurant':
        case 'restaurants':
            console.log(`[AdminModel createResource] Routing to RestaurantModel.`);
            return RestaurantModel.createRestaurant(createData); // createRestaurant now handles chain_id if present
        case 'dish':
        case 'dishes':
            console.log(`[AdminModel createResource] Routing to DishModel.`);
            if (!createData.name || typeof createData.restaurant_id !== 'number') {
                 throw new Error("Dish name and valid restaurant_id are required.");
            }
            return DishModel.createDish({ name: createData.name, restaurant_id: createData.restaurant_id });
        case 'list':
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
            console.log(`[AdminModel createResource] Routing to HashtagModel.`);
             if (!createData.name) throw new Error("Hashtag name is required.");
             // Allow creation via bulk add/admin panel
             return HashtagModel.createHashtag({ name: createData.name, category: createData.category });
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
        // *** NEW: Add case for restaurant_chains ***
        case 'restaurant_chain':
        case 'restaurant_chains':
             console.log(`[AdminModel createResource] Routing to create restaurant chain.`);
             if (!createData.name) throw new Error("Chain name is required.");
             // Add a dedicated function in this model or RestaurantModel if more logic is needed
             // Use lowercase table name
             const chainQuery = `
                 INSERT INTO restaurant_chains (name, website, description)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (name) DO NOTHING
                 RETURNING *;
             `;
             const chainResult = await db.query(chainQuery, [createData.name, createData.website, createData.description]);
             if (chainResult.rowCount === 0) {
                 console.warn(`[AdminModel createResource] Restaurant chain "${createData.name}" likely already exists.`);
                 // Fetch existing if needed for response consistency
                 const existingChain = await db.query('SELECT * FROM restaurant_chains WHERE name = $1', [createData.name]);
                 return existingChain.rows[0] || null;
             }
             return chainResult.rows[0];
        default:
            console.error(`[AdminModel createResource] Fallthrough to DEFAULT case. Unsupported resource type: ${typeLower}`);
            throw new Error(`Creation not supported for resource type: ${resourceType}`);
    }
};

// Patch: Handle restaurant_chains update
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

    // Normalize type from URL param if needed
    const typeLower = resourceType?.toLowerCase();

    switch (typeLower) {
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
                  // Ensure format is array of strings if needed by model
                  neighborhoodUpdatePayload.zipcode_ranges = neighborhoodUpdatePayload.zipcode_ranges;
             }
              return NeighborhoodModel.updateNeighborhood(numericId, neighborhoodUpdatePayload);
        case 'cities':
            return CityModel.updateCity(numericId, updateData); // Delegate to CityModel
        // *** NEW: Add case for restaurant_chains ***
        case 'restaurant_chains':
            console.log(`[AdminModel updateResource] Routing to update restaurant chain.`);
            const allowedChainFields = ['name', 'website', 'description'];
            const chainFieldsToSet = [];
            const chainValues = [];
            let chainParamIndex = 1;

            allowedChainFields.forEach(field => {
                if (updateData[field] !== undefined) {
                     chainFieldsToSet.push(`"${field}" = $${chainParamIndex++}`);
                     chainValues.push(updateData[field] === '' ? null : updateData[field]);
                }
            });

             if (chainFieldsToSet.length === 0) {
                 console.warn(`[AdminModel updateResource] No valid fields to update for chain ${numericId}.`);
                 // Fetch current if needed
                 const currentChain = await db.query('SELECT * FROM restaurant_chains WHERE id = $1', [numericId]);
                 return currentChain.rows[0] || null;
             }

             chainFieldsToSet.push(`"updated_at" = NOW()`);
             const chainSetClause = chainFieldsToSet.join(', ');
             // Use lowercase table name
             const chainUpdateQuery = `UPDATE restaurant_chains SET ${chainSetClause} WHERE id = $${chainParamIndex} RETURNING *;`;
             chainValues.push(numericId);

             try {
                 const chainUpdateResult = await db.query(chainUpdateQuery, chainValues);
                 if (chainUpdateResult.rowCount === 0) {
                     console.warn(`[AdminModel updateResource] Chain with ID ${numericId} not found or no rows updated.`);
                      const exists = await db.query('SELECT * FROM restaurant_chains WHERE id = $1', [numericId]);
                      return exists.rows[0] ?? null;
                 }
                 return chainUpdateResult.rows[0];
             } catch(chainError) {
                 console.error(`[AdminModel updateResource] Error updating chain ${numericId}:`, chainError);
                 if (chainError.code === '23505') { // Unique constraint (name)
                      throw new Error(`Update failed: Chain name conflicts with an existing chain.`);
                  }
                 throw chainError;
             }
        default:
            console.error(`[AdminModel updateResource] Unsupported resource type: ${typeLower}`);
            throw new Error(`Updates not supported for resource type: ${resourceType}`);
    }
};

// Patch: Handle restaurant_chains delete
export const deleteResourceById = async (tableName, id) => {
    // Patch: Add restaurant_chains to allowed tables (use lowercase)
    const allowedTables = ['restaurants', 'dishes', 'lists', 'submissions', 'users', 'hashtags', 'neighborhoods', 'cities', 'restaurant_chains'];
    const tableNameLower = tableName?.toLowerCase();

    if (!allowedTables.includes(tableNameLower)) {
        throw new Error(`Invalid table name: ${tableName}. Allowed tables: ${allowedTables.join(', ')}`);
    }
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
    if (isNaN(numericId) || numericId <= 0) {
        throw new Error(`Invalid ID provided for deletion: ${id}`);
    }

    // Check constraints before deleting chains
    if (tableNameLower === 'restaurant_chains') {
         // Use lowercase table name
         const checkUsageQuery = 'SELECT 1 FROM restaurants WHERE chain_id = $1 LIMIT 1';
         const usageResult = await db.query(checkUsageQuery, [numericId]);
         if (usageResult.rowCount > 0) {
              throw new Error(`Cannot delete chain: It is referenced by existing restaurants. Please reassign restaurants first.`);
         }
    }


    const query = `DELETE FROM "${tableNameLower}" WHERE id = $1 RETURNING id`; // Quote lowercase table name
    const result = await db.query(query, [numericId]);
    return (result.rowCount ?? 0) > 0;
};

// --- Submission Admin Functions ---
// No changes needed unless SubmissionModel interface changes
export const getSubmissions = SubmissionModel.findSubmissionsByStatus;
export const updateSubmissionStatus = SubmissionModel.updateSubmissionStatus;


// --- Bulk Add Function ---
// Patch: Major overhaul for restaurant lookup, typo suggestions, chain checks, stricter validation
export const bulkAddItems = async (items) => {
    const client = await db.getClient();
    const results = {
         processedCount: 0, addedCount: 0, skippedCount: 0, errorCount: 0,
         // Structure for detailed results passed back to frontend
         details: [] // { input: { name, type, line }, status: 'added'|'skipped'|'error'|'review_needed', reason?: string, id?: number, suggestions?: [{id, name, address, score}], duplicateInfo?: {} }
    };

    // --- Pre-processing: Check for duplicates within the batch ---
    const uniqueItemKeys = new Set();
    const batchDuplicates = new Map(); // lineNumber -> reason
    items.forEach((item, index) => {
        // Use _lineNumber if provided by frontend, otherwise fall back to index
        const lineNumber = item._lineNumber || (index + 1);
        // Normalize type to lowercase for consistent key generation
        const itemTypeLower = item.type?.toLowerCase();
        let key = `${itemTypeLower}::${String(item.name || '').toLowerCase()}`;

        if (itemTypeLower === 'restaurant') {
            // Use city_id which should be validated/present from frontend parsing
            key += `::${item.city_id}`;
        } else if (itemTypeLower === 'dish') {
             // Key based on dish name + restaurant identifier (ID preferred, then name)
             const restaurantIdentifier = item.restaurant_id || item.restaurant_name?.toLowerCase();
             key += `::${restaurantIdentifier}`;
             // Could add city_id here too if dishes need city context for uniqueness beyond restaurant
             // key += `::${item.city_id}`;
        }

        if (uniqueItemKeys.has(key)) {
             const reason = `Duplicate entry within this batch for type '${itemTypeLower}', name '${item.name}'.`;
             batchDuplicates.set(lineNumber, reason);
             console.warn(`[BulkAdd PreCheck] Duplicate found in batch for key: ${key} at line ${lineNumber}`);
        } else {
             uniqueItemKeys.add(key);
        }
        // Store the original line number back onto the item for tracking
        item._originalLineNumber = lineNumber;
    });
    // --- End Pre-processing ---


    try {
        await client.query('BEGIN');

        for (const item of items) {
            results.processedCount++;
            const originalLineNumber = item._originalLineNumber;
            let addedDbItem = null; // The item returned from the DB model create function
            let reason = '';
            let status = 'skipped'; // Default status (e.g., if skipped due to conflict)
            let suggestions = undefined; // For restaurant suggestions
            let duplicateInfo = undefined; // For potential DB duplicate warnings

            // Initialize result detail object for this item
            let resultDetail = {
                 input: { name: item.name, type: item.type, line: originalLineNumber },
                 status: 'processing', // Start as processing
                 reason: undefined,
                 id: undefined,
                 suggestions: undefined,
                 duplicateInfo: undefined
            };

            try {
                // --- Apply Batch Duplicate Check ---
                if (batchDuplicates.has(originalLineNumber)) {
                    throw new Error(batchDuplicates.get(originalLineNumber));
                }

                // --- Basic Item Validation ---
                if (!item.type || !ALLOWED_TYPES.includes(item.type.toLowerCase())) {
                     throw new Error(`Invalid or missing item type: '${item.type}'. Allowed: ${ALLOWED_TYPES.join(', ')}`);
                }
                if (!item.name || String(item.name).trim() === '') {
                     throw new Error(`Missing item name.`);
                }

                const itemTypeLower = item.type.toLowerCase(); // Normalize type

                // --- Type Specific Processing ---
                if (itemTypeLower === 'restaurant') {
                    // ** Restaurant Validation **
                    if (!item.city_id || isNaN(Number(item.city_id)) || Number(item.city_id) <= 0) {
                         throw new Error(`Invalid or missing city_id for restaurant '${item.name}'. Must be a positive integer.`);
                    }
                    const cityCheckRes = await client.query('SELECT id FROM cities WHERE id = $1', [item.city_id]);
                    if (cityCheckRes.rowCount === 0) {
                         throw new Error(`Provided City ID ${item.city_id} does not exist.`);
                    }

                    // Neighborhood Validation (Use ID provided by frontend if valid for the city)
                    let itemNeighborhoodId = null;
                    if (item.neighborhood_id && !isNaN(Number(item.neighborhood_id)) && Number(item.neighborhood_id) > 0) {
                          itemNeighborhoodId = Number(item.neighborhood_id);
                          const nbCheck = await client.query('SELECT name FROM neighborhoods WHERE id = $1 AND city_id = $2', [itemNeighborhoodId, item.city_id]);
                          if (nbCheck.rowCount === 0) {
                               console.warn(`[BulkAdd] Provided Neighborhood ID ${itemNeighborhoodId} not valid for City ID ${item.city_id}. Setting to NULL.`);
                               itemNeighborhoodId = null;
                               // Optionally add a warning reason to the result
                               reason += ` (Warning: Provided neighborhood ID ${item.neighborhood_id} invalid for city, set to null.)`;
                          }
                    }

                    // Chain Validation (if chain_id provided)
                    let itemChainId = null;
                    if (item.chain_id && !isNaN(Number(item.chain_id)) && Number(item.chain_id) > 0) {
                        itemChainId = Number(item.chain_id);
                        const chainCheck = await client.query('SELECT id FROM restaurant_chains WHERE id = $1', [itemChainId]);
                        if (chainCheck.rowCount === 0) {
                            console.warn(`[BulkAdd] Provided Chain ID ${itemChainId} not valid. Setting to NULL.`);
                            itemChainId = null;
                            reason += ` (Warning: Provided chain ID ${item.chain_id} invalid, set to null.)`;
                        }
                    }

                    // ** Optional: Database Duplicate/Chain Check (Beyond unique constraint) **
                    // Could add an approximate name check here within the same city to flag potential duplicates/chain locations for review
                    // const potentialDuplicates = await RestaurantModel.findRestaurantsApproximate(item.name, item.city_id, 3);
                    // if (potentialDuplicates.length > 0) {
                    //    duplicateInfo = { message: "Potential duplicate(s) found in DB.", duplicates: potentialDuplicates };
                    //    status = 'review_needed'; // Or just add warning to reason
                    // }


                    // ** Prepare Payload for createResource -> RestaurantModel.createRestaurant **
                    const createPayload = {
                         name: item.name,
                         city_id: Number(item.city_id),
                         neighborhood_id: itemNeighborhoodId,
                         chain_id: itemChainId, // Pass validated chain_id
                         // Pass other relevant fields from item if they match RestaurantModel expected input
                         city_name: item.city_name,
                         neighborhood_name: item.neighborhood_name, // Note: frontend lookup might be more reliable
                         address: item.address,
                         google_place_id: item.google_place_id,
                         latitude: item.latitude,
                         longitude: item.longitude,
                         zip_code: item.zip_code,
                         borough: item.borough,
                         phone: item.phone,
                         website: item.website,
                    };

                    // ** Attempt Creation **
                    // Need to use 'restaurant' (singular) for createResource mapping now
                    addedDbItem = await createResource('restaurant', createPayload, null, null); // userId/Handle not needed by restaurant create

                    if (addedDbItem) {
                         status = 'added';
                         results.addedCount++;
                         resultDetail.id = addedDbItem.id;
                         // Add Tags
                         if (Array.isArray(item.tags) && item.tags.length > 0) {
                              await addTagsToItem(client, 'restaurant', addedDbItem.id, item.tags);
                         }
                    } else {
                         status = 'skipped';
                         reason = reason ? reason.trim() : 'Restaurant likely already exists (name/city combination).'; // Preserve warnings
                         results.skippedCount++;
                    }

                } else if (itemTypeLower === 'dish') {
                    // ** Dish Validation **
                    let targetRestaurantId = null;

                    // Case 1: Restaurant ID provided directly and is valid
                    if (item.restaurant_id && !isNaN(Number(item.restaurant_id)) && Number(item.restaurant_id) > 0) {
                          targetRestaurantId = Number(item.restaurant_id);
                          // Verify restaurant exists
                          const restCheck = await client.query('SELECT id FROM restaurants WHERE id = $1', [targetRestaurantId]);
                          if (restCheck.rowCount === 0) {
                               throw new Error(`Provided Restaurant ID ${targetRestaurantId} does not exist for dish '${item.name}'.`);
                          }
                          console.log(`[BulkAdd Dish] Using provided restaurant_id: ${targetRestaurantId}`);
                    }
                    // Case 2: Restaurant Name provided -> Requires Lookup & potentially Review
                    else if (item.restaurant_name) {
                        // ** Crucial: Need city_id context for reliable lookup **
                        // This assumes city_id is *always* passed from the frontend for dishes needing name lookup
                        if (!item.city_id || isNaN(Number(item.city_id)) || Number(item.city_id) <= 0) {
                             throw new Error(`Missing valid City ID context required to look up restaurant name '${item.restaurant_name}' for dish '${item.name}'.`);
                        }
                        const cityCtxId = Number(item.city_id);

                          console.log(`[BulkAdd Dish] Looking up restaurant "${item.restaurant_name}" in city ${cityCtxId}`);
                          const matches = await RestaurantModel.findRestaurantsApproximate(item.restaurant_name, cityCtxId);

                           if (matches.length === 1 && matches[0].score > 0.9) { // High confidence exact/near-exact match
                              targetRestaurantId = matches[0].id;
                              reason = `Auto-matched restaurant: ${matches[0].name} (ID: ${targetRestaurantId})`;
                              console.log(`[BulkAdd Dish] Auto-matched restaurant: ${matches[0].name} (ID: ${targetRestaurantId})`);
                              status = 'processing'; // Mark ready for creation attempt below
                          } else if (matches.length > 0) {
                              // Suggestions found, but requires user review - mark and stop processing this item here
                              status = 'review_needed';
                              reason = `Potential matches found for restaurant '${item.restaurant_name}'. Please review.`;
                              suggestions = matches.map(m => ({ id: m.id, name: m.name, address: m.address, score: m.score })); // Send suggestions to frontend
                              resultDetail.suggestions = suggestions;
                              console.log(`[BulkAdd Dish] Found suggestions for '${item.restaurant_name}', requires review.`);
                              // Do not proceed to create attempt
                          } else {
                              // No matches found
                              throw new Error(`Restaurant name '${item.restaurant_name}' not found in City ID ${cityCtxId} for dish '${item.name}'.`);
                          }
                    }
                     // Case 3: Neither ID nor Name provided (or Name provided without City context)
                     else {
                         throw new Error(`Missing Restaurant ID or (Restaurant Name + City ID) for dish '${item.name}'.`);
                     }

                    // ** Attempt Creation ONLY if ID is confirmed and status allows **
                     if (targetRestaurantId && status !== 'review_needed' && status !== 'skipped' && status !== 'error') {
                         const createPayload = { name: item.name, restaurant_id: targetRestaurantId };
                         // Need to use 'dish' (singular) for createResource mapping now
                         addedDbItem = await createResource('dish', createPayload, null, null);

                         if (addedDbItem) {
                             status = 'added'; // Override initial 'processing' status
                             results.addedCount++;
                             resultDetail.id = addedDbItem.id;
                              // Add Tags
                              if (Array.isArray(item.tags) && item.tags.length > 0) {
                                   await addTagsToItem(client, 'dish', addedDbItem.id, item.tags);
                              }
                         } else {
                             status = 'skipped';
                             reason = reason ? reason.trim() : 'Dish likely already exists for this restaurant.'; // Preserve auto-match reason
                             results.skippedCount++;
                         }
                    } else if (status === 'review_needed') {
                         // Item needs review, count as skipped for now
                         results.skippedCount++;
                    }
                    // If targetRestaurantId is null due to error, the exception handler below catches it.

                }
                // Add other item types here if needed (e.g., restaurant_chains)
                // else if (itemTypeLower === 'restaurant_chain') { ... }
                 else {
                    // This handles types listed in ALLOWED_TYPES but not specifically processed above
                    console.warn(`[BulkAdd] Processing for type '${itemTypeLower}' not explicitly defined in bulk add loop. Using generic createResource.`);
                    // Ensure necessary fields are present for generic creation if applicable
                    // Example: Create a hashtag
                    if (itemTypeLower === 'hashtag') {
                         const createPayload = { name: item.name, category: item.category };
                         addedDbItem = await createResource('hashtag', createPayload, null, null);
                         if (addedDbItem) {
                             status = 'added'; results.addedCount++; resultDetail.id = addedDbItem.id;
                         } else {
                             status = 'skipped'; reason = 'Hashtag likely already exists.'; results.skippedCount++;
                         }
                    } else {
                        throw new Error(`Generic bulk add not implemented for type: ${itemTypeLower}`);
                    }
                }

                // Finalize successful/skipped item status
                resultDetail.status = status;
                resultDetail.reason = reason ? reason.substring(0, 250) : undefined; // Add reason if any, ensure undefined otherwise

            } catch (itemError) {
                 console.error(`[Bulk Add Item Error] Line ${originalLineNumber}: Failed processing item: ${JSON.stringify(item)}`);
                 console.error(`  > Error Message: ${itemError.message}`);
                 // console.error(`  > Error Stack: ${itemError.stack}`); // Optional: very verbose

                 resultDetail.status = 'error';
                 resultDetail.reason = (itemError.message || 'Unknown error').substring(0, 250);
                 results.errorCount++;
                 // Don't increment skippedCount here, errorCount implies not added/skipped normally
            }

            results.details.push(resultDetail); // Add detail object for this item

        } // End loop

        await client.query('COMMIT');
        results.message = `Bulk processing complete. Processed: ${results.processedCount}, Added: ${results.addedCount}, Skipped/Needs Review/Errors: ${results.processedCount - results.addedCount}.`;
        // Clean up intermediate status if any left
        results.details.forEach(d => { if(d.status === 'processing') d.status = 'skipped'; });
        return results;

    } catch (err) { // Transaction level error
        await client.query('ROLLBACK').catch(rbErr => console.error("Rollback Error:", rbErr));
        console.error('[AdminModel bulkAddItems] Transaction error:', err);
        // Construct a more informative error response for the frontend
         const finalResults = {
              processedCount: items.length, // Mark all as processed
              addedCount: 0, // No items were added if transaction failed
              skippedCount: 0, // Reset counts
              errorCount: items.length,
              message: `Bulk add failed: ${err.message || 'Unknown database error'}. No items were added.`,
              details: items.map((item, idx) => ({ // Create error details for all items
                   input: { name: item.name, type: item.type, line: item._originalLineNumber || (idx + 1) },
                   status: 'error',
                   reason: `Operation failed: ${err.message || 'Unknown database error'}`.substring(0, 250)
              }))
         };
         // Throwing might prevent sending partial results, so return instead
         return finalResults;
    } finally {
        client.release();
    }
};


// Patch: Handle restaurant_chains lookup
export const getLookupTable = async (tableName) => {
    // Patch: Add restaurant_chains (use lowercase)
    const allowedLookupTables = ['cities', 'neighborhoods', 'hashtags', 'restaurant_chains'];
    const tableNameLower = tableName?.toLowerCase();

    if (!allowedLookupTables.includes(tableNameLower)) {
        throw new Error(`Lookup not allowed for table: ${tableName}. Allowed tables: ${allowedLookupTables.join(', ')}`);
    }
    // Adjust columns based on table
    let columns = 'id, name';
    if (tableNameLower === 'restaurant_chains') {
         columns = 'id, name, website';
    }

    const query = `SELECT ${columns} FROM "${tableNameLower}" ORDER BY name ASC`; // Quote lowercase table name
    try {
        const result = await db.query(query);
        return result.rows;
    } catch (error) {
        console.error(`[AdminModel getLookupTable] Error fetching lookup for ${tableNameLower}:`, error);
        throw error;
    }
};