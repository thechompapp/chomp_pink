/* root/doof-backend/utils/formatters.js */
/* Centralized formatting logic for database row data */

// --- Helper Functions for Safe Type Conversion ---
const safeParseInt = (value, defaultValue = null) => {
  if (value === null || value === undefined || value === '') return defaultValue;
  const num = Number(value);
  if (isNaN(num) || !isFinite(num)) return defaultValue;
  return Math.floor(num);
};

const safeParseFloat = (value, defaultValue = null) => {
  if (value === null || value === undefined || value === '') return defaultValue;
  const num = Number(value);
  if (isNaN(num) || !isFinite(num)) return defaultValue;
  return num;
};

const safeToBoolean = (value, defaultValue = false) => {
  if (value === null || value === undefined) return defaultValue;
  // Handle specific string values if necessary
  if (typeof value === 'string' && (value.toLowerCase() === 'false' || value === '0')) return false;
  return Boolean(value);
};

const safeToString = (value, defaultValue = null) => {
  if (value === null || value === undefined) return defaultValue;
  return String(value);
};

const safeToDateString = (value, defaultValue = null) => {
  if (!value) return defaultValue;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string') {
      // Attempt to parse string, return null if invalid
      const date = new Date(value);
      return isNaN(date.getTime()) ? defaultValue : date.toISOString();
  }
  // Handle numbers if they represent timestamps (optional)
  // if (typeof value === 'number') { ... }
  return defaultValue;
};

const safeToArray = (value, filterFn = (item) => typeof item === 'string' && !!item) => {
  if (!Array.isArray(value)) return [];
  return value.filter(filterFn);
};
// --- End Helper Functions ---


// --- Consolidated Formatters ---

/**
* Formats a restaurant data row from the database.
* @param {object | null | undefined} restaurantRow - The raw row data.
* @returns {object | null} The formatted restaurant object or null.
*/
export const formatRestaurant = (restaurantRow) => {
  if (!restaurantRow || restaurantRow.id == null) return null;
  try {
      const formatted = {
          // Prioritize essential & typed fields
          id: safeParseInt(restaurantRow.id),
          name: safeToString(restaurantRow.name, 'Unnamed Restaurant'),
          city_id: safeParseInt(restaurantRow.city_id),
          neighborhood_id: safeParseInt(restaurantRow.neighborhood_id),
          chain_id: safeParseInt(restaurantRow.chain_id),
          latitude: safeParseFloat(restaurantRow.latitude),
          longitude: safeParseFloat(restaurantRow.longitude),
          adds: safeParseInt(restaurantRow.adds, 0),
          saved_count: safeParseInt(restaurantRow.saved_count, 0),
          the_take_reviewer_verified: safeToBoolean(restaurantRow.the_take_reviewer_verified, false),
          created_at: safeToDateString(restaurantRow.created_at),
          updated_at: safeToDateString(restaurantRow.updated_at),

          // String fields (default to null if missing/empty)
          address: safeToString(restaurantRow.address?.trim()),
          city_name: safeToString(restaurantRow.city_name?.trim()),
          neighborhood_name: safeToString(restaurantRow.neighborhood_name?.trim()),
          google_place_id: safeToString(restaurantRow.google_place_id?.trim()),
          zip_code: safeToString(restaurantRow.zip_code?.trim()),
          phone: safeToString(restaurantRow.phone?.trim()), // Use 'phone' if that's the column name
          phone_number: safeToString(restaurantRow.phone_number?.trim()), // Or 'phone_number'
          website: safeToString(restaurantRow.website?.trim()),
          instagram_handle: safeToString(restaurantRow.instagram_handle?.trim()),
          photo_url: safeToString(restaurantRow.photo_url?.trim()), // Include if used

          // Array fields
          tags: safeToArray(restaurantRow.tags),
          featured_on_lists: safeToArray(restaurantRow.featured_on_lists, item => !!item), // Adjust filter if needed
          similar_places: safeToArray(restaurantRow.similar_places, item => !!item), // Adjust filter if needed

          // Other fields (ensure correct types or default)
          rating: safeParseFloat(restaurantRow.rating), // Example
          hours: restaurantRow.hours || null, // Example

          // Legacy compatibility/aliases (optional)
          // city: safeToString(restaurantRow.city_name?.trim()),
          // neighborhood: safeToString(restaurantRow.neighborhood_name?.trim()),
      };

      // Final check on essential ID
      if (formatted.id === null) {
          console.error(`[Formatter formatRestaurant] Failed to parse essential ID:`, restaurantRow);
          return null;
      }
      return formatted;
  } catch (e) {
      console.error(`[Formatter formatRestaurant] Error formatting row ID ${restaurantRow?.id}:`, restaurantRow, e);
      return null;
  }
};

/**
* Formats a dish data row from the database.
* @param {object | null | undefined} dishRow - The raw row data.
* @returns {object | null} The formatted dish object or null.
*/
export const formatDish = (dishRow) => {
  if (!dishRow || dishRow.id == null) return null;
  try {
      const formatted = {
          // Prioritize essential & typed fields
          id: safeParseInt(dishRow.id),
          name: safeToString(dishRow.name, 'Unnamed Dish'),
          restaurant_id: safeParseInt(dishRow.restaurant_id),
          adds: safeParseInt(dishRow.adds, 0),
          is_common: safeToBoolean(dishRow.is_common, false),
          created_at: safeToDateString(dishRow.created_at),
          updated_at: safeToDateString(dishRow.updated_at),

          // String fields
          restaurant_name: safeToString(dishRow.restaurant_name?.trim()),
          city_name: safeToString(dishRow.city_name?.trim()),
          neighborhood_name: safeToString(dishRow.neighborhood_name?.trim()),
          description: safeToString(dishRow.description?.trim()),

          // Array fields
          tags: safeToArray(dishRow.tags),

          // Legacy compatibility/aliases (optional)
          city: safeToString(dishRow.city_name?.trim()),
          neighborhood: safeToString(dishRow.neighborhood_name?.trim()),
      };

      if (formatted.id === null) {
          console.error(`[Formatter formatDish] Failed to parse essential ID:`, dishRow);
          return null;
      }
      // Dish must have a valid restaurant_id
      if (formatted.restaurant_id === null) {
           console.warn(`[Formatter formatDish] Dish row ID ${dishRow.id} is missing a valid restaurant_id.`);
           // Return null or allow? Depending on requirements. Let's return null for data integrity.
           return null;
      }
      return formatted;
  } catch (e) {
      console.error(`[Formatter formatDish] Error formatting row ID ${dishRow?.id}:`, dishRow, e);
      return null;
  }
};

/**
* Formats a list data row from the database.
* @param {object | null | undefined} listRow - The raw row data.
* @returns {object | null} The formatted list object or null.
*/
export const formatList = (listRow) => {
  if (!listRow || listRow.id == null) return null;

  // Determine and validate list_type
  const listType = listRow.list_type || listRow.type; // Prefer list_type
  if (!listType || !['restaurant', 'dish'].includes(listType)) {
      console.warn(`[Formatter formatList] Invalid or missing list_type '${listType}' for list ID ${listRow.id}.`);
      return null; // Invalid type
  }

  try {
      const formatted = {
          // Prioritize essential & typed fields
          id: safeParseInt(listRow.id),
          name: safeToString(listRow.name, 'Unnamed List'),
          user_id: safeParseInt(listRow.user_id),
          is_public: safeToBoolean(listRow.is_public, true), // Default public to true
          is_following: safeToBoolean(listRow.is_following, false), // Provided by specific queries
          created_by_user: safeToBoolean(listRow.created_by_user, false), // Provided by specific queries
          item_count: safeParseInt(listRow.item_count, 0), // Provided by specific queries
          saved_count: safeParseInt(listRow.saved_count, 0), // Provided by specific queries
          list_type: listType, // Validated type
          created_at: safeToDateString(listRow.created_at),
          updated_at: safeToDateString(listRow.updated_at),

          // String fields
          description: safeToString(listRow.description?.trim()),
          creator_handle: safeToString(listRow.creator_handle?.trim()),
          city_name: safeToString(listRow.city_name?.trim()),

          // Array fields
          tags: safeToArray(listRow.tags),

          // Legacy compatibility/aliases (optional)
          type: listType,
          city: safeToString(listRow.city_name?.trim()),
      };

      if (formatted.id === null) {
          console.error(`[Formatter formatList] Failed to parse essential ID:`, listRow);
          return null;
      }
      return formatted;
  } catch (e) {
      console.error(`[Formatter formatList] Error formatting row ID ${listRow?.id}:`, listRow, e);
      return null;
  }
};

/**
* Formats a list item data row from the database.
* @param {object | null | undefined} itemRow - The raw row data.
* @returns {object | null} The formatted list item object or null.
*/
export const formatListItem = (itemRow) => {
  if (!itemRow || itemRow.list_item_id == null || itemRow.item_id == null) return null;

  // Validate item type
  const itemType = itemRow.item_type;
  if (!itemType || !['restaurant', 'dish'].includes(itemType)) {
      console.warn(`[Formatter formatListItem] Invalid or missing item_type '${itemType}' for list item ID ${itemRow.list_item_id}.`);
      return null;
  }

  try {
      const formatted = {
          // Prioritize essential & typed fields
          list_item_id: safeParseInt(itemRow.list_item_id), // ID of the junction table row
          id: safeParseInt(itemRow.item_id), // ID of the actual item (restaurant/dish)
          item_id: safeParseInt(itemRow.item_id), // Keep original for clarity
          item_type: itemType, // Validated type
          added_at: safeToDateString(itemRow.added_at),

          // String fields
          name: safeToString(itemRow.name, `Item ${itemRow.item_id}`), // Default name
          restaurant_name: safeToString(itemRow.restaurant_name?.trim()), // Only for dishes
          city: safeToString(itemRow.city?.trim()), // City of the item
          neighborhood: safeToString(itemRow.neighborhood?.trim()), // Neighborhood of the item

          // Array fields
          tags: safeToArray(itemRow.tags),
      };

      if (formatted.list_item_id === null || formatted.id === null) {
          console.error(`[Formatter formatListItem] Failed to parse essential IDs:`, itemRow);
          return null;
      }
      return formatted;
  } catch (e) {
      console.error(`[Formatter formatListItem] Error formatting row ID ${itemRow?.list_item_id}:`, itemRow, e);
      return null;
  }
};


/**
* Formats a neighborhood data row from the database.
* @param {object | null | undefined} neighborhoodRow - The raw row data.
* @returns {object | null} The formatted neighborhood object or null.
*/
export const formatNeighborhood = (neighborhoodRow) => {
  if (!neighborhoodRow || neighborhoodRow.id == null) return null;

  try {
      const formatted = {
          // Prioritize essential & typed fields
          id: safeParseInt(neighborhoodRow.id),
          city_id: safeParseInt(neighborhoodRow.city_id),
          name: safeToString(neighborhoodRow.name?.trim()),
          created_at: safeToDateString(neighborhoodRow.created_at),
          updated_at: safeToDateString(neighborhoodRow.updated_at),

          // String fields
          city_name: safeToString(neighborhoodRow.city_name?.trim()),

          // Array fields (specific zipcode format validation)
          zipcode_ranges: safeToArray(neighborhoodRow.zipcode_ranges, (z) => typeof z === 'string' && /^\d{5}$/.test(z)).sort(),
      };

      if (formatted.id === null) {
           console.error(`[Formatter formatNeighborhood] Failed to parse essential ID:`, neighborhoodRow);
           return null;
      }
       if (formatted.city_id === null) {
           console.warn(`[Formatter formatNeighborhood] Neighborhood row ID ${neighborhoodRow.id} is missing a valid city_id.`);
           return null; // Neighborhood must belong to a city
       }
       if (!formatted.name) {
            console.warn(`[Formatter formatNeighborhood] Neighborhood row ID ${neighborhoodRow.id} is missing a name.`);
            return null; // Name is essential
       }
      return formatted;
  } catch (e) {
      console.error(`[Formatter formatNeighborhood] Error formatting row ID ${neighborhoodRow?.id}:`, neighborhoodRow, e);
      return null;
  }
};