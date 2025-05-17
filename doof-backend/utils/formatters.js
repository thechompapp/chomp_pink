// Filename: /root/doof-backend/utils/formatters.js
export const formatRestaurant = (restaurant) => {
    if (!restaurant || !restaurant.id || !restaurant.name) return null;
    return {
        id: Number(restaurant.id),
        name: restaurant.name || 'Unnamed Restaurant',
        city: restaurant.city || null,
        neighborhood: restaurant.neighborhood || null,
        tags: Array.isArray(restaurant.tags) ? restaurant.tags : [],
        adds: Number(restaurant.adds || 0),
        // Ensure all relevant fields from schema are included or handled
        address: restaurant.address || null,
        phone: restaurant.phone || null,
        website: restaurant.website || null,
        instagram_handle: restaurant.instagram_handle || null,
        google_place_id: restaurant.google_place_id || null,
        latitude: restaurant.latitude ? Number(restaurant.latitude) : null,
        longitude: restaurant.longitude ? Number(restaurant.longitude) : null,
        city_id: restaurant.city_id ? Number(restaurant.city_id) : null,
        neighborhood_id: restaurant.neighborhood_id ? Number(restaurant.neighborhood_id) : null,
        zip_code: restaurant.zip_code || null,
        chain_id: restaurant.chain_id ? Number(restaurant.chain_id) : null,
        created_at: restaurant.created_at || null,
        updated_at: restaurant.updated_at || null,

    };
};

export const formatDish = (dish) => {
    if (!dish || !dish.id || !dish.name) return null;
    return {
        id: Number(dish.id),
        dish_id: Number(dish.id), // dish_id seems redundant if id is the primary key for dishes
        name: dish.name || 'Unnamed Dish',
        restaurant_name: dish.restaurant_name || 'Unknown Restaurant', // This likely comes from a JOIN
        tags: Array.isArray(dish.tags) ? dish.tags : [],
        // Ensure all relevant fields from schema are included or handled
        restaurant_id: dish.restaurant_id ? Number(dish.restaurant_id) : null,
        description: dish.description || null,
        price: dish.price ? Number(dish.price) : null,
        is_common: typeof dish.is_common === 'boolean' ? dish.is_common : false,
        adds: dish.adds ? Number(dish.adds) : 0,
        created_at: dish.created_at || null,
        updated_at: dish.updated_at || null,
    };
};

export const formatList = (list) => {
    if (!list) return null;
    return {
        id: Number(list.id || 0),
        name: list.name || 'Unnamed List',
        description: list.description || null,
        type: list.list_type || 'mixed', // ensure 'type' and 'list_type' are consistent if both exist
        list_type: list.list_type || 'mixed',
        saved_count: Number(list.saved_count || 0),
        item_count: Number(list.item_count || 0), // This might be a derived count
        city: list.city_name || list.city || null, // Consolidate city representation
        tags: Array.isArray(list.tags) ? list.tags : [],
        is_public: !!list.is_public,
        is_following: !!list.is_following, // This likely depends on the querying user
        created_by_user: !!list.created_by_user,
        user_id: list.user_id ? Number(list.user_id) : null,
        creator_handle: list.creator_handle || null,
        created_at: list.created_at || null,
        updated_at: list.updated_at || null,
    };
};

export const formatUser = (user) => {
    if (!user || !user.id || !user.email) return null;
    return {
        id: Number(user.id),
        email: user.email,
        handle: user.handle || null,
        name: user.name || null, // If 'name' exists on users table, otherwise might be 'username'
        username: user.username || null, // Added based on common user table structures
        account_type: user.account_type || 'user',
        created_at: user.created_at || null,
        updated_at: user.updated_at || null,
    };
};

export const formatListItem = (item) => {
    // list_item_id implies a specific ID for the list-item association, not the item itself
    if (!item || !item.id || !item.item_id || !item.item_type) { // Assuming 'id' is the primary key for listitems
        // Fallback if list_item_id is indeed the PK from db
        if (!item || !item.list_item_id || !item.item_id || !item.item_type) return null;
         return {
            list_item_id: Number(item.list_item_id),
            id: Number(item.list_item_id), // map list_item_id to id if that's the case
            list_id: item.list_id ? Number(item.list_id) : null,
            item_id: Number(item.item_id),
            item_type: item.item_type,
            name: item.name || `Item ${item.item_id}`, // Name of the linked item (dish/restaurant)
            notes: item.notes || null,
            restaurant_name: item.restaurant_name || null, // Denormalized data
            city: item.city || null, // Denormalized data
            neighborhood: item.neighborhood || null, // Denormalized data
            tags: Array.isArray(item.tags) ? item.tags : [], // Tags of the linked item
            restaurant_id: item.item_type === 'restaurant' ? Number(item.item_id) : (item.restaurant_id ? Number(item.restaurant_id) : null),
            dish_id: item.item_type === 'dish' ? Number(item.item_id) : null,
            added_at: item.added_at || null,
        };
    }
    return {
        id: Number(item.id),
        list_item_id: Number(item.id), // Assuming id is the primary key for listitems table
        list_id: item.list_id ? Number(item.list_id) : null,
        item_id: Number(item.item_id),
        item_type: item.item_type,
        name: item.name || `Item ${item.item_id}`,
        notes: item.notes || null,
        restaurant_name: item.restaurant_name || null,
        city: item.city || null,
        neighborhood: item.neighborhood || null,
        tags: Array.isArray(item.tags) ? item.tags : [],
        restaurant_id: item.item_type === 'restaurant' ? Number(item.item_id) : (item.restaurant_id ? Number(item.restaurant_id) : null),
        dish_id: item.item_type === 'dish' ? Number(item.item_id) : null,
        added_at: item.added_at || null,
    };
};

export const formatNeighborhood = (neighborhood) => {
    if (!neighborhood || !neighborhood.id || !neighborhood.name) return null;
    return {
        id: Number(neighborhood.id),
        name: neighborhood.name || 'Unnamed Neighborhood',
        city_id: neighborhood.city_id ? Number(neighborhood.city_id) : null,
        city_name: neighborhood.city_name || null, // This usually comes from a JOIN
        borough: neighborhood.borough || null,
        // Add other relevant fields from schema: zipcode_ranges, parent_id, location_level, geom
        zipcode_ranges: neighborhood.zipcode_ranges || null,
        parent_id: neighborhood.parent_id ? Number(neighborhood.parent_id) : null,
        location_level: neighborhood.location_level || null,
        // geom is often large; decide if it's needed in basic format
    };
};

/**
 * Converts a string to title case (capitalizes the first letter of each word).
 * E.g., "hello world" -> "Hello World"
 * E.g., "user@example.com" -> "User@example.com" (Preserves email format)
 * E.g., "123 main st" -> "123 Main St"
 * E.g., "michael's diner" -> "Michael's Diner"
 * @param {string} str The string to convert.
 * @returns {string} The title-cased string.
 */
export const toTitleCase = (str) => {
  if (typeof str !== 'string' || !str) return '';
  
  // First, handle special cases like email addresses
  if (str.includes('@')) {
    return str; // Don't modify email addresses
  }
  
  // Convert to lowercase first, then capitalize first letter of each word
  // Using a more sophisticated regex that handles apostrophes and other word boundaries
  return str.toLowerCase()
    .replace(/(?:^|\s|['-])\w/g, (match) => {
      return match.toUpperCase();
    });
};

// Identity formatter if no specific formatting is needed for a resource
export const identityFormatter = (item) => item;