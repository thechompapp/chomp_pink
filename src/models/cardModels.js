/**
 * Standardized Card Models
 * 
 * This file defines the complete data models for all card types in the application.
 * Each model ensures consistency, type safety, and includes all required attributes.
 */

import PropTypes from 'prop-types';

/**
 * Restaurant Card Model
 * Standard structure for restaurant data across all pages
 */
export const RestaurantModel = {
  // Required fields
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  name: PropTypes.string.isRequired,
  
  // Location fields
  neighborhood_name: PropTypes.string,
  city_name: PropTypes.string,
  address: PropTypes.string,
  
  // Content fields
  description: PropTypes.string,
  cuisine: PropTypes.string,
  tags: PropTypes.array,
  
  // Metrics
  adds: PropTypes.number,
  rating: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  review_count: PropTypes.number,
  
  // Status flags
  is_trending: PropTypes.bool,
  is_featured: PropTypes.bool,
  is_active: PropTypes.bool,
  
  // Contact information
  website: PropTypes.string,
  phone: PropTypes.string,
  email: PropTypes.string,
  
  // Operational info
  hours: PropTypes.string,
  price_range: PropTypes.string,
  
  // Media
  image_url: PropTypes.string,
  photos: PropTypes.array,
  
  // Timestamps
  created_at: PropTypes.string,
  updated_at: PropTypes.string,
  
  // UI callbacks
  onAddToList: PropTypes.func,
  className: PropTypes.string,
};

/**
 * Dish Card Model
 * Standard structure for dish data across all pages
 */
export const DishModel = {
  // Required fields
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  name: PropTypes.string.isRequired,
  
  // Restaurant association
  restaurant: PropTypes.string,
  restaurant_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  restaurant_name: PropTypes.string,
  
  // Content fields
  description: PropTypes.string,
  category: PropTypes.string,
  tags: PropTypes.array,
  
  // Pricing
  price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  price_range: PropTypes.string,
  
  // Metrics
  adds: PropTypes.number,
  rating: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  review_count: PropTypes.number,
  
  // Status flags
  is_trending: PropTypes.bool,
  is_featured: PropTypes.bool,
  is_available: PropTypes.bool,
  
  // Dietary information
  is_vegetarian: PropTypes.bool,
  is_vegan: PropTypes.bool,
  is_gluten_free: PropTypes.bool,
  is_dairy_free: PropTypes.bool,
  is_spicy: PropTypes.bool,
  spice_level: PropTypes.number, // 1-5 scale
  
  // Operational info
  prep_time: PropTypes.string,
  calories: PropTypes.number,
  allergens: PropTypes.array,
  
  // Media
  image_url: PropTypes.string,
  photos: PropTypes.array,
  
  // Timestamps
  created_at: PropTypes.string,
  updated_at: PropTypes.string,
  
  // UI callbacks
  onAddToList: PropTypes.func,
  className: PropTypes.string,
};

/**
 * List Card Model
 * Standard structure for list data across all pages
 */
export const ListModel = {
  // Required fields
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  name: PropTypes.string.isRequired,
  
  // Content fields
  description: PropTypes.string,
  list_type: PropTypes.string, // e.g., 'favorites', 'wishlist', 'recommendations'
  tags: PropTypes.array,
  
  // List metadata
  items: PropTypes.array,
  items_count: PropTypes.number,
  item_types: PropTypes.array, // e.g., ['restaurant', 'dish']
  
  // Metrics
  view_count: PropTypes.number,
  follow_count: PropTypes.number,
  comment_count: PropTypes.number,
  share_count: PropTypes.number,
  
  // Status flags
  is_trending: PropTypes.bool,
  is_featured: PropTypes.bool,
  is_public: PropTypes.bool,
  is_collaborative: PropTypes.bool,
  
  // User association
  user_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  user: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    username: PropTypes.string,
    avatar_url: PropTypes.string,
  }),
  creator_handle: PropTypes.string,
  created_by_user: PropTypes.bool,
  
  // Follow functionality
  is_following: PropTypes.bool,
  can_follow: PropTypes.bool,
  
  // Permissions
  can_edit: PropTypes.bool,
  can_delete: PropTypes.bool,
  can_add_items: PropTypes.bool,
  
  // Media
  cover_image_url: PropTypes.string,
  
  // Timestamps
  created_at: PropTypes.string,
  updated_at: PropTypes.string,
  last_activity_at: PropTypes.string,
  
  // UI callbacks
  onQuickAdd: PropTypes.func,
  onFollow: PropTypes.func,
  onUnfollow: PropTypes.func,
  onShare: PropTypes.func,
  className: PropTypes.string,
};

/**
 * Default values for each model
 */
export const DefaultValues = {
  restaurant: {
    id: null,
    name: 'Unnamed Restaurant',
    neighborhood_name: '',
    city_name: '',
    description: '',
    tags: [],
    adds: 0,
    rating: null,
    is_trending: false,
    is_featured: false,
    is_active: true,
    website: '',
    phone: '',
    hours: '',
    image_url: '',
    className: '',
  },
  
  dish: {
    id: null,
    name: 'Unnamed Dish',
    restaurant: '',
    restaurant_id: null,
    description: '',
    tags: [],
    price: null,
    adds: 0,
    rating: null,
    is_trending: false,
    is_featured: false,
    is_available: true,
    is_vegetarian: false,
    is_vegan: false,
    is_gluten_free: false,
    is_dairy_free: false,
    is_spicy: false,
    spice_level: 0,
    prep_time: '',
    image_url: '',
    className: '',
  },
  
  list: {
    id: null,
    name: 'Unnamed List',
    description: '',
    list_type: 'custom',
    tags: [],
    items: [],
    items_count: 0,
    view_count: 0,
    follow_count: 0,
    comment_count: 0,
    is_trending: false,
    is_featured: false,
    is_public: true,
    is_collaborative: false,
    is_following: false,
    can_follow: true,
    can_edit: false,
    can_delete: false,
    can_add_items: false,
    user: null,
    className: '',
  },
};

/**
 * Data validation functions
 */
export const validateCardData = {
  restaurant: (data) => {
    const errors = [];
    if (!data.id) errors.push('Restaurant ID is required');
    if (!data.name || data.name.trim() === '') errors.push('Restaurant name is required');
    return { isValid: errors.length === 0, errors };
  },
  
  dish: (data) => {
    const errors = [];
    if (!data.id) errors.push('Dish ID is required');
    if (!data.name || data.name.trim() === '') errors.push('Dish name is required');
    return { isValid: errors.length === 0, errors };
  },
  
  list: (data) => {
    const errors = [];
    if (!data.id) errors.push('List ID is required');
    if (!data.name || data.name.trim() === '') errors.push('List name is required');
    return { isValid: errors.length === 0, errors };
  },
};

/**
 * Utility functions for normalizing card data
 */
export const normalizeCardData = {
  restaurant: (data) => ({
    ...DefaultValues.restaurant,
    ...data,
    id: data.id ? String(data.id) : null,
    adds: Number(data.adds || 0),
    rating: data.rating ? Number(data.rating) : null,
    tags: Array.isArray(data.tags) ? data.tags : [],
  }),
  
  dish: (data) => ({
    ...DefaultValues.dish,
    ...data,
    id: data.id ? String(data.id) : null,
    restaurant_id: data.restaurant_id ? String(data.restaurant_id) : null,
    adds: Number(data.adds || 0),
    rating: data.rating ? Number(data.rating) : null,
    price: data.price ? String(data.price) : null,
    tags: Array.isArray(data.tags) ? data.tags : [],
    spice_level: Number(data.spice_level || 0),
  }),
  
  list: (data) => ({
    ...DefaultValues.list,
    ...data,
    id: data.id ? String(data.id) : null,
    user_id: data.user_id ? String(data.user_id) : null,
    items_count: Number(data.items_count || data.items?.length || 0),
    view_count: Number(data.view_count || 0),
    follow_count: Number(data.follow_count || 0),
    comment_count: Number(data.comment_count || 0),
    tags: Array.isArray(data.tags) ? data.tags : [],
    items: Array.isArray(data.items) ? data.items : [],
  }),
};

/**
 * Type definitions for TypeScript support
 */
export const CardTypes = {
  RESTAURANT: 'restaurant',
  DISH: 'dish',
  LIST: 'list',
};

/**
 * Card size constants to ensure uniformity
 */
export const CARD_SPECS = {
  // All cards must use these exact dimensions
  HEIGHT: 'h-64',          // 16rem / 256px
  MIN_HEIGHT: 'min-h-64',  // Fallback for flex layouts
  PADDING: 'p-4',          // 1rem padding
  BORDER: 'border border-black',
  BACKGROUND: 'bg-white',
  BORDER_RADIUS: 'rounded-lg',
  
  // Interactive states
  HOVER_SHADOW: 'hover:shadow-lg',
  TRANSITION: 'transition-all duration-200',
  
  // Full card class - includes flex layout for proper content distribution
  FULL_CLASS: 'bg-white rounded-lg border border-black p-4 h-64 overflow-hidden relative hover:shadow-lg transition-all duration-200 flex flex-col',
};

export default {
  RestaurantModel,
  DishModel,
  ListModel,
  DefaultValues,
  validateCardData,
  normalizeCardData,
  CardTypes,
  CARD_SPECS,
}; 