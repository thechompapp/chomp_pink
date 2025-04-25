// Filename: /root/doof-backend/models/adminModel.js
/* REFACTORED: Convert to ES Modules */
import db from '../db/index.js'; // Use import, add .js
import format from 'pg-format'; // Use import
import { extractHashtags, findOrCreateHashtags } from './hashtagModel.js'; // Use import, add .js
// Assuming logger utility needs conversion or we use console for now
// import { logToDatabase } from '../utils/logger.js'; // Needs .js if converted

// Placeholder logger if logger utility isn't converted yet
const logToDatabase = (level, message, details) => {
    console.log(`[${level.toUpperCase()}] ${message}`, details || '');
};

// Helper function to get table/column configuration (unchanged)
const getResourceConfig = (dataType) => {
    // ... (implementation remains the same)
    switch (dataType) {
        case 'restaurants': return { table: 'restaurants', columns: ['id', 'name', 'address', 'neighborhood_id', 'city_id', 'zip_code', 'phone', 'website', 'google_place_id', 'latitude', 'longitude', 'adds', 'created_at', 'updated_at' /* add other relevant fields */], idColumn: 'id' };
        case 'dishes': return { table: 'dishes', columns: ['id', 'name', 'description', 'restaurant_id', 'price', 'adds', 'is_common', 'created_at', 'updated_at'], idColumn: 'id' };
        case 'users': return { table: 'users', columns: ['id', 'username', 'email', 'account_type', 'created_at'], idColumn: 'id' }; // Exclude password_hash
        case 'cities': return { table: 'cities', columns: ['id', 'name'], idColumn: 'id' };
        case 'neighborhoods': return { table: 'neighborhoods', columns: ['id', 'name', 'city_id', 'borough', 'zipcode_ranges'], idColumn: 'id' };
        case 'hashtags': return { table: 'hashtags', columns: ['id', 'name', 'category'], idColumn: 'id' };
         case 'restaurant_chains': return { table: 'restaurant_chains', columns: ['id', 'name', 'website', 'description', 'created_at', 'updated_at'], idColumn: 'id' };
         case 'lists': return { table: 'lists', columns: ['id', 'name', 'description', 'list_type', 'is_public', 'user_id', 'creator_handle', 'item_count', 'saved_count', 'city_name', 'tags', 'created_at', 'updated_at'], idColumn: 'id' }; // Added lists
        // Add other data types as needed
        default: throw new Error(`Unsupported admin data type: ${dataType}`);
    }
};


const adminModel = {
    /**
     * Generic function to fetch all data for a given admin type.
     */
    async getAdminData(dataType) {
        const config = getResourceConfig(dataType);
        // Add JOINs if needed for display names (e.g., city_name for neighborhoods)
        let queryText = format('SELECT %s FROM %I ORDER BY %I ASC', config.columns.join(', '), config.table, config.idColumn);
         if (dataType === 'neighborhoods') {
             queryText = `
                 SELECT n.*, c.name as city_name
                 FROM neighborhoods n
                 LEFT JOIN cities c ON n.city_id = c.id
                 ORDER BY n.id ASC;
             `;
         } else if (dataType === 'restaurants') {
             queryText = `
                 SELECT r.*, c.name as city_name, n.name as neighborhood_name
                 FROM restaurants r
                 LEFT JOIN cities c ON r.city_id = c.id
                 LEFT JOIN neighborhoods n ON r.neighborhood_id = n.id
                 ORDER BY r.id ASC;
             `;
         } else if (dataType === 'dishes') {
              queryText = `
                 SELECT d.*, r.name as restaurant_name
                 FROM dishes d
                 LEFT JOIN restaurants r ON d.restaurant_id = r.id
                 ORDER BY d.id ASC;
              `;
         }

        try {
            logToDatabase('debug', `Executing getAdminData query for ${dataType}: ${queryText}`);
            const result = await db.query(queryText);
            // TODO: Apply consistent formatting if needed before returning
            return result.rows;
        } catch (error) {
            logToDatabase('error', `Error fetching admin data for ${dataType}: ${error.message}`, { error });
            throw error; // Re-throw original error
        }
    },

    /**
     * Generic function to add a new record for a given admin type.
     */
    async addAdminData(dataType, data) {
        const config = getResourceConfig(dataType);
        // Filter data to include only columns belonging to the table (+ ensure required are present)
        const columnsToInsert = config.columns.filter(col => data.hasOwnProperty(col) && col !== config.idColumn && col !== 'created_at' && col !== 'updated_at');
        // TODO: Add validation here or rely on DB constraints/validators
        if (columnsToInsert.length === 0) {
            throw new Error('No valid data provided for insertion.');
        }

        const values = columnsToInsert.map(col => data[col]);
        const queryText = format(
            'INSERT INTO %I (%s) VALUES (%L) RETURNING *', // Return all columns of the new row
            config.table,
            columnsToInsert.join(', '),
            values
        );

        try {
            logToDatabase('debug', `Executing addAdminData query for ${dataType}: ${queryText}`);
            const result = await db.query(queryText);
            if (result.rows.length > 0) {
                // TODO: Format result if needed
                return result.rows[0];
            }
            throw new Error(`Failed to insert ${dataType}, no data returned.`);
        } catch (error) {
             logToDatabase('error', `Error adding admin data for ${dataType}: ${error.message}`, { error, data });
             // Handle specific DB errors like unique constraints if necessary
             if (error.code === '23505') { // Unique violation
                 throw new Error(`${dataType.slice(0,-1)} with similar properties already exists (${error.detail || error.constraint || ''}).`);
             } else if (error.code === '23503') { // FK violation
                 throw new Error(`Invalid reference provided for ${dataType} (${error.detail || error.constraint || ''}).`);
             }
             throw error;
        }
    },

    /**
     * Generic function to update an existing record.
     */
    async updateAdminData(dataType, id, data) {
        const config = getResourceConfig(dataType);
        const numericId = parseInt(id, 10);
        if (isNaN(numericId)) throw new Error('Invalid ID provided.');

        const fieldsToUpdate = Object.keys(data).filter(key =>
             config.columns.includes(key) && key !== config.idColumn && key !== 'created_at' && key !== 'updated_at'
         );

        if (fieldsToUpdate.length === 0) {
            throw new Error('No valid fields provided for update.');
        }

        const setClauses = fieldsToUpdate.map((field, index) => format('%I = $%s', field, index + 2)).join(', ');
        const values = fieldsToUpdate.map(field => data[field]);
        values.unshift(numericId); // Add id as the first parameter ($1)

        const queryText = format(
            'UPDATE %I SET %s, updated_at = NOW() WHERE %I = $1 RETURNING *',
            config.table,
            setClauses,
            config.idColumn
        );


        try {
            logToDatabase('debug', `Executing updateAdminData query for ${dataType}/${id}: ${queryText}`);
            const result = await db.query(queryText, values);
            if (result.rows.length > 0) {
                // TODO: Format result if needed
                return result.rows[0];
            }
            return null; // Indicate not found
        } catch (error) {
             logToDatabase('error', `Error updating admin data for ${dataType}/${id}: ${error.message}`, { error, data });
              // Handle specific DB errors
             if (error.code === '23505') {
                 throw new Error(`${dataType.slice(0,-1)} update failed due to unique constraint (${error.detail || error.constraint || ''}).`);
             } else if (error.code === '23503') {
                  throw new Error(`Invalid reference provided during update for ${dataType} (${error.detail || error.constraint || ''}).`);
             }
             throw error;
        }
    },

    /**
     * Generic function to delete a record.
     */
    async deleteAdminData(dataType, id) {
        const config = getResourceConfig(dataType);
        const numericId = parseInt(id, 10);
         if (isNaN(numericId)) throw new Error('Invalid ID provided.');

        const queryText = format('DELETE FROM %I WHERE %I = $1 RETURNING %I', config.table, config.idColumn, config.idColumn);

        try {
            logToDatabase('debug', `Executing deleteAdminData query for ${dataType}/${id}: ${queryText}`);
            const result = await db.query(queryText, [numericId]);
            return result.rowCount > 0; // Return true if a row was deleted
        } catch (error) {
            logToDatabase('error', `Error deleting admin data for ${dataType}/${id}: ${error.message}`, { error });
             // Handle specific errors like FK constraints preventing delete
             if (error.code === '23503') { // Foreign key violation
                 throw new Error(`Cannot delete ${dataType.slice(0,-1)} with ID ${id} because it is referenced by other records.`);
             }
            throw error;
        }
    },

    /**
     * Adds multiple items (restaurants or dishes) in bulk, including handling hashtags within a transaction.
     * (Implementation from previous analysis - uses format, assumes hashtagModel uses ESM)
     */
    async bulkAddItems(itemType, items) {
        // ... (Implementation remains the same, ensure dependencies like hashtagModel use import/export)
         if (itemType !== 'restaurants' && itemType !== 'dishes') { throw new Error('Invalid item type specified for bulk add.'); }
         if (!items || items.length === 0) { return []; }
         const client = await db.getClient();
         try {
             await client.query('BEGIN');
             logToDatabase('info', `Starting bulk add transaction for ${itemType}`);
             const addedItems = [];
             const columns = Object.keys(items[0]).filter( key => key !== 'tags' && key !== 'notes' ); // Assuming 'notes' might exist
             const values = items.map(item => columns.map(col => item[col]));
             const baseTable = itemType;
             // Define columns to return based on itemType
             const returningColumnsDef = {
                 restaurants: ['id', 'name', 'address', 'neighborhood_id', 'city_id'], // Add more as needed by formatter/UI
                 dishes: ['id', 'name', 'restaurant_id'] // Add more as needed by formatter/UI
             };
             const returningColumns = returningColumnsDef[itemType] || ['id', 'name']; // Default return basic info

             const queryText = format( 'INSERT INTO %I (%s) VALUES %L RETURNING %s', baseTable, columns.join(', '), values, returningColumns.join(', ') );
             logToDatabase( 'debug', `Bulk add query for ${itemType}: ${queryText}` );
             const result = await client.query(queryText);
             const insertedItems = result.rows;
             logToDatabase('info', `Inserted ${insertedItems.length} base items for ${itemType}`);

             // Handle tags and notes
              for (let i = 0; i < items.length; i++) {
                 const originalItem = items[i];
                 const newItem = insertedItems.find( inserted => inserted.name === originalItem.name /* Add more robust matching if needed */ );
                 if (!newItem) { logToDatabase( 'warn', `Could not find matching inserted item for original: ${JSON.stringify( originalItem )}` ); continue; }

                 // --- Tag Handling START ---
                 const textForTags = `${originalItem.notes || ''} ${ originalItem.description || '' } ${originalItem.name || ''}`;
                 const extractedTags = extractHashtags(textForTags);
                 if (extractedTags.length > 0) {
                     logToDatabase( 'debug', `Processing tags for ${itemType} ID ${newItem.id}: ${extractedTags.join( ', ' )}` );
                     const tagIds = await findOrCreateHashtags( extractedTags, client ); // Pass client!
                     if (tagIds.length > 0) {
                         const tagLinkTable = itemType === 'restaurants' ? 'RestaurantHashtags' : 'DishHashtags';
                         const tagLinkColumn = itemType === 'restaurants' ? 'restaurant_id' : 'dish_id';
                         const tagValues = tagIds.map((tagId) => [ newItem.id, tagId ]);
                         const tagQuery = format( 'INSERT INTO %I (%s, hashtag_id) VALUES %L ON CONFLICT DO NOTHING', tagLinkTable, tagLinkColumn, tagValues );
                         logToDatabase( 'debug', `Tag linking query for ${itemType} ID ${newItem.id}: ${tagQuery}` );
                         await client.query(tagQuery);
                     }
                 }
                 // --- Tag Handling END ---
                 // --- Notes Handling Placeholder ---
                 // if (originalItem.notes) { logToDatabase( 'info', `Note found for item ID ${newItem.id}, but 'notes' table handling is not implemented yet.` ); }
                 // --- Notes Handling END ---

                 addedItems.push(newItem); // Add the inserted item reference
             }

             await client.query('COMMIT');
             logToDatabase( 'info', `Bulk add transaction committed successfully for ${itemType}` );
             return addedItems; // Return references to added items
         } catch (error) {
             await client.query('ROLLBACK');
             logToDatabase('error', `Bulk add transaction rolled back for ${itemType}: ${error}`);
             console.error(`Error in bulk add transaction for ${itemType}:`, error);
             throw new Error(`Failed to bulk add ${itemType}: ${error.message}`);
         } finally {
             client.release();
             logToDatabase('info', `Database client released after bulk add for ${itemType}`);
         }
    },

    /**
     * Performs an efficient lookup for existing items based on specific criteria.
     * (Implementation from previous analysis)
     */
    async checkExistingItems(itemType, items, lookupFields) {
        // ... (Implementation remains the same)
        if (!items || items.length === 0 || !lookupFields || lookupFields.length === 0) { return new Set(); }
        const table = itemType === 'restaurants' ? 'restaurants' : (itemType === 'dishes' ? 'dishes' : 'neighborhoods'); // Expanded for neighborhoods
        const conditions = []; const values = []; let valueCounter = 1;
        items.forEach(item => {
            const groupConditions = []; let skipItemGroup = false;
            lookupFields.forEach(field => {
                 if (item[field] === undefined || item[field] === null) { skipItemGroup = true; return; } // Skip item if lookup field is missing
                 groupConditions.push(`LOWER(${format('%I', field)}) = $${valueCounter++}`);
                 values.push(String(item[field]).toLowerCase());
             });
            if (!skipItemGroup) conditions.push(`(${groupConditions.join(' AND ')})`);
        });
        if (conditions.length === 0) return new Set(); // No valid items to check
        const queryText = format( 'SELECT %s FROM %I WHERE %s', lookupFields.join(', '), table, conditions.join(' OR ') );
        logToDatabase('debug', `Checking existing items query: ${queryText} with values: ${JSON.stringify(values)}`);
        try {
            const result = await db.query(queryText, values);
            const existingIdentifiers = new Set();
            result.rows.forEach(row => {
                 const identifier = lookupFields.map(field => String(row[field] || '').toLowerCase()).join('|');
                 existingIdentifiers.add(identifier);
             });
            logToDatabase('info', `Found ${existingIdentifiers.size} existing ${itemType} based on lookup.`);
            return existingIdentifiers;
        } catch (error) {
            logToDatabase('error', `Error checking existing items for ${itemType}: ${error}`);
            console.error(`Error checking existing items for ${itemType}:`, error);
            throw new Error(`Failed to check existing ${itemType}: ${error.message}`); // Throw error upwards
        }
    },

};

// Use export default for ES Module compatibility
export default adminModel;