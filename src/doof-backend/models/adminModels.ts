/* src/doof-backend/models/adminModel.ts */
import db from '../db/index.js'; // Keep .js extension for compiled db import
import type { PoolClient } from 'pg';

// Define interfaces for input/output if needed, using 'any' for now
interface BulkAddItem {
    type: 'restaurant' | 'dish';
    name: string;
    city_id?: number | null;
    neighborhood_id?: number | null;
    city?: string | null;
    neighborhood?: string | null;
    location?: string | null;
    place_id?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    restaurant_name?: string | null; // For dish type
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
    message?: string; // Added for consistency
}

export const bulkAddItems = async (items: BulkAddItem[]): Promise<BulkAddResults> => {
    const client: PoolClient = await db.getClient(); // Use transaction
    const results: BulkAddResults = { processedCount: 0, addedCount: 0, skippedCount: 0, details: [] };

    try {
        await client.query('BEGIN');

        for (const item of items) {
            results.processedCount++;
            let addedItem: any = null;
            let reason: string = '';
            let status: 'added' | 'skipped' | 'error' = 'skipped';

            try {
                if (item.type === 'restaurant') {
                    const query = `
                        INSERT INTO restaurants (name, city_id, neighborhood_id, city_name, neighborhood_name, address, google_place_id, latitude, longitude, adds)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 0)
                        ON CONFLICT (name, city_id) DO NOTHING
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
                    let restaurantId: number | null = null;
                    if (item.restaurant_name) {
                        const findRestQuery = 'SELECT id FROM restaurants WHERE name ILIKE $1 LIMIT 1';
                        const restResult = await client.query<{ id: number }>(findRestQuery, [item.restaurant_name]);
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
                            ON CONFLICT (name, restaurant_id) DO NOTHING
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
                // TODO: Handle tag additions within transaction if needed

            } catch (itemError: any) {
                console.warn(`[Bulk Add Item Error] Item: ${JSON.stringify(item)}, Error: ${itemError.message}`);
                status = 'error';
                reason = itemError.message.substring(0, 200);
                results.skippedCount++;
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
        return results;
    } catch (err: any) {
        await client.query('ROLLBACK').catch(rbErr => console.error("Rollback Error:", rbErr));
        console.error('[AdminModel bulkAddItems] Transaction error:', err);
        throw new Error('Bulk add operation failed during transaction.');
    } finally {
        client.release();
    }
};

export const deleteResourceById = async (tableName: string, id: number): Promise<boolean> => {
     // Basic validation or ensure tableName is from a controlled list in the route
     // Use template literal cautiously, ensure tableName is validated by caller (admin route)
     const query = `DELETE FROM ${tableName} WHERE id = $1 RETURNING id`;
     const result = await db.query(query, [id]);
     return result.rowCount > 0; // true if deleted, false otherwise
 };