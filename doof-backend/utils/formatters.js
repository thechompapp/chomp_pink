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
    };
};

export const formatDish = (dish) => {
    if (!dish || !dish.id || !dish.name) return null;
    return {
        id: Number(dish.id),
        dish_id: Number(dish.id),
        name: dish.name || 'Unnamed Dish',
        restaurant_name: dish.restaurant_name || 'Unknown Restaurant',
        tags: Array.isArray(dish.tags) ? dish.tags : [],
    };
};

export const formatList = (list) => {
    if (!list) return null;
    return {
        id: Number(list.id || 0),
        name: list.name || 'Unnamed List',
        description: list.description || null,
        type: list.list_type || 'mixed',
        list_type: list.list_type || 'mixed',
        saved_count: Number(list.saved_count || 0),
        item_count: Number(list.item_count || 0),
        city: list.city_name || list.city || null,
        tags: Array.isArray(list.tags) ? list.tags : [],
        is_public: !!list.is_public,
        is_following: !!list.is_following,
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
        name: user.name || null,
        created_at: user.created_at || null,
        updated_at: user.updated_at || null,
    };
};

export const formatListItem = (item) => {
    if (!item || !item.list_item_id || !item.item_id || !item.item_type) return null;
    return {
        list_item_id: Number(item.list_item_id),
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
        city_name: neighborhood.city_name || null,
    };
};