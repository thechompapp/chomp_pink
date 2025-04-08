/* src/doof-backend/models/adminModel.js */
import db from '../db/index.js';

// Note: Many admin operations involve reading data covered by other models
// (e.g., listModel, dishModel). This model focuses on admin-specific
// actions like bulk add and potentially fetching data across types if needed,
// though fetching specific types is better handled by dedicated models + route logic.

// Handles the database interactions for bulk adding items
export const bulkAddItems = async (items) => {
    const client = await db.getClient(); // Use transaction
    const results = { processedCount: 0, addedCount: 0, skippedCount: 0, details: [] };

    try {
        await client.query('BEGIN');

        for (const item of items) {
            results.processedCount++;
            let addedItem = null;
            let reason = '';
            let status = 'skipped';

            try {
                if (item.type === 'restaurant') {
                    const query = `
                        INSERT INTO restaurants (name, city_id, neighborhood_id, city_name, neighborhood_name, address, google_place_id, latitude, longitude, adds)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 0)
                        ON CONFLICT (name, city_id) DO NOTHING -- Use unique constraint
                        RETURNING *
                    `;
                    const result = await client.query(query, [
                        item.name, item.city_id || null, item.neighborhood_id || null, item.city || null,
                        item.neighborhood || null, item.location || null, item.place_id || null,
                        item.latitude || null, item.longitude || null
                    ]);
                    if (result.rows.length > 0) {
                        addedItem = result.rows[0];
                        status = 'added';
                        results.addedCount++;
                    } else {
                        reason = 'Restaurant likely already exists with this name in the specified city.';
                        results.skippedCount++;
                    }
                } else if (item.type === 'dish') {
                    let restaurantId = null;
                    if (item.restaurant_name) {
                         // Find restaurant case-insensitively
                         const findRestQuery = 'SELECT id FROM restaurants WHERE name ILIKE $1 LIMIT 1';
                         const restResult = await client.query(findRestQuery, [item.restaurant_name]);
                         if (restResult.rows.length > 0) {
                             restaurantId = restResult.rows[0].id;
                         } else {
                             reason = `Restaurant '${item.restaurant_name}' not found. Dish skipped.`;
                         }
                    } else {
                        reason = 'Restaurant name missing for dish.';
                    }

                    if (restaurantId) {
                        const query = `
                            INSERT INTO dishes (name, restaurant_id, adds)
                            VALUES ($1, $2, 0)
                            ON CONFLICT (name, restaurant_id) DO NOTHING -- Use unique constraint
                            RETURNING *
                        `;
                        const result = await client.query(query, [item.name, restaurantId]);
                        if (result.rows.length > 0) {
                            addedItem = result.rows[0];
                            status = 'added';
                            results.addedCount++;
                        } else {
                            reason = reason || 'Dish likely already exists for this restaurant.';
                            results.skippedCount++;
                        }
                    } else {
                         results.skippedCount++;
                    }
                }
                // Handle potential tag additions here if needed within transaction
                // e.g., find/create hashtags, link to addedItem.id

            } catch (itemError) {
                console.warn(`[Bulk Add Item Error] Item: ${JSON.stringify(item)}, Error: ${itemError.message}`);
                status = 'error';
                reason = itemError.message.substring(0, 200); // Keep error message concise
                results.skippedCount++;
                // Optionally decide if one error should fail the whole transaction
                // For now, we continue processing other items
            }
            results.details.push({
                input: { name: item.name, type: item.type },
                status: status,
                reason: reason || undefined,
                id: addedItem?.id || undefined,
                type: addedItem ? item.type : undefined,
            });
        } // end for loop

        await client.query('COMMIT');
        return results; // Return detailed results object
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('[AdminModel bulkAddItems] Transaction error:', err);
        throw new Error('Bulk add operation failed during transaction.'); // Throw generic error
    } finally {
        client.release();
    }
};

// Function to fetch paginated/sorted/searched data for various admin types
// Note: This central function can become complex. Alternatively, keep fetch logic
// closer to specific models (listModel, dishModel etc.) and have the admin *route*
// call the appropriate model based on `:type`. Let's keep it simpler for now
// and have the route build the query, as done previously.
// This model might hold functions for deleting/updating generic resources if needed.

export const deleteResourceById = async (tableName, id) => {
     // Basic validation - ensure tableName is allowed? Handled by route.
     const query = `DELETE FROM ${tableName} WHERE id = $1 RETURNING id`; // Use template literal cautiously, ensure tableName is validated
     const result = await db.query(query, [id]);
     return result.rows.length > 0; // true if deleted, false otherwise
 };

 // Add generic updateResourceById if needed, carefully handling fields based on type