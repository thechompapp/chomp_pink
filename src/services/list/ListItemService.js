/**
 * List Item Service
 * 
 * Handles operations related to items within lists, including
 * adding, updating, removing, and reordering items.
 */
import BaseService from '../utils/BaseService';
import { logDebug, logError, logInfo } from '@/utils/logger';
import { validateId } from '@/utils/serviceHelpers';

/**
 * List Item Service class
 */
class ListItemService extends BaseService {
  /**
   * Constructor
   */
  constructor() {
    super('/lists');
  }
  
  /**
   * Fetch items within a specific list
   * @param {string} listId - List ID
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number for pagination
   * @param {number} params.limit - Number of items per page
   * @param {string} params.sortBy - Field to sort by
   * @param {string} params.sortOrder - Sort order (asc or desc)
   * @returns {Promise<Object>} Response with list items
   */
  async getListItems(listId, params = {}) {
    if (!validateId(listId)) {
      return { success: false, message: 'Invalid list ID' };
    }
    
    logDebug(`[ListItemService] Getting items for list ID: ${listId}`);
    
    return this.get(`/${listId}/items`, { params });
  }
  
  /**
   * Add an item to a specific list
   * @param {string} listId - List ID
   * @param {Object} itemData - Item data
   * @param {string} itemData.dish_id - Dish ID (if type is 'dish')
   * @param {string} itemData.restaurant_id - Restaurant ID (if type is 'restaurant')
   * @param {string} itemData.notes - Optional notes
   * @param {string} itemData.custom_item_name - Custom item name (if type is 'custom')
   * @param {string} itemData.custom_item_description - Custom item description (if type is 'custom')
   * @param {string} itemData.type - Item type ('dish', 'restaurant', or 'custom')
   * @returns {Promise<Object>} Response with added item
   */
  async addItemToList(listId, itemData) {
    if (!validateId(listId)) {
      return { success: false, message: 'Invalid list ID' };
    }
    
    if (!itemData || !itemData.type) {
      return { success: false, message: 'Item data and type are required' };
    }
    
    logDebug(`[ListItemService] Adding item to list ID: ${listId}`);
    
    return this.post(`/${listId}/items`, itemData);
  }
  
  /**
   * Update an item within a list
   * @param {string} listId - List ID
   * @param {string} itemId - Item ID
   * @param {Object} itemData - Updated item data
   * @returns {Promise<Object>} Response with updated item
   */
  async updateListItem(listId, itemId, itemData) {
    if (!validateId(listId) || !validateId(itemId)) {
      return { success: false, message: 'Invalid list ID or item ID' };
    }
    
    logDebug(`[ListItemService] Updating item ${itemId} in list ${listId}`);
    
    return this.put(`/${listId}/items/${itemId}`, itemData);
  }
  
  /**
   * Remove an item from a list
   * @param {string} listId - List ID
   * @param {string} itemId - Item ID
   * @returns {Promise<Object>} Response with deletion status
   */
  async deleteListItem(listId, itemId) {
    if (!validateId(listId) || !validateId(itemId)) {
      return { success: false, message: 'Invalid list ID or item ID' };
    }
    
    logDebug(`[ListItemService] Deleting item ${itemId} from list ${listId}`);
    
    return this.delete(`/${listId}/items/${itemId}`);
  }
  
  /**
   * Add multiple items to a list (bulk operation)
   * @param {string} listId - List ID
   * @param {Array<Object>} items - Array of item data objects
   * @returns {Promise<Object>} Response with added items
   */
  async addItemsToListBulk(listId, items) {
    if (!validateId(listId)) {
      return { success: false, message: 'Invalid list ID' };
    }
    
    if (!Array.isArray(items) || items.length === 0) {
      return { success: false, message: 'No items provided' };
    }
    
    logDebug(`[ListItemService] Adding ${items.length} items to list ${listId}`);
    
    return this.post(`/${listId}/items/bulk`, { items });
  }
  
  /**
   * Reorder items within a list
   * @param {string} listId - List ID
   * @param {Array<string>} orderedItemIds - Array of item IDs in the desired new order
   * @returns {Promise<Object>} Response with reordering status
   */
  async reorderListItems(listId, orderedItemIds) {
    if (!validateId(listId)) {
      return { success: false, message: 'Invalid list ID' };
    }
    
    if (!Array.isArray(orderedItemIds) || orderedItemIds.length === 0) {
      return { success: false, message: 'No item IDs provided' };
    }
    
    logDebug(`[ListItemService] Reordering items in list ${listId}`);
    
    return this.put(`/${listId}/items/reorder`, { itemIds: orderedItemIds });
  }
  
  /**
   * Add a dish to multiple lists
   * @param {string} dishId - Dish ID
   * @param {Array<string>} listIds - Array of list IDs
   * @param {string} notes - Optional notes
   * @returns {Promise<Object>} Response with addition status
   */
  async addDishToMultipleLists(dishId, listIds, notes = null) {
    if (!validateId(dishId)) {
      return { success: false, message: 'Invalid dish ID' };
    }
    
    if (!Array.isArray(listIds) || listIds.length === 0) {
      return { success: false, message: 'No list IDs provided' };
    }
    
    logDebug(`[ListItemService] Adding dish ${dishId} to ${listIds.length} lists`);
    
    const data = {
      dishId,
      listIds,
      type: 'dish'
    };
    
    if (notes) data.notes = notes;
    
    return this.post('/items/bulk-add', data);
  }
  
  /**
   * Add a restaurant to multiple lists
   * @param {string} restaurantId - Restaurant ID
   * @param {Array<string>} listIds - Array of list IDs
   * @param {string} notes - Optional notes
   * @returns {Promise<Object>} Response with addition status
   */
  async addRestaurantToMultipleLists(restaurantId, listIds, notes = null) {
    if (!validateId(restaurantId)) {
      return { success: false, message: 'Invalid restaurant ID' };
    }
    
    if (!Array.isArray(listIds) || listIds.length === 0) {
      return { success: false, message: 'No list IDs provided' };
    }
    
    logDebug(`[ListItemService] Adding restaurant ${restaurantId} to ${listIds.length} lists`);
    
    const data = {
      restaurantId,
      listIds,
      type: 'restaurant'
    };
    
    if (notes) data.notes = notes;
    
    return this.post('/items/bulk-add', data);
  }
  
  /**
   * Fetch lists that contain a specific dish ID
   * @param {string} dishId - Dish ID
   * @param {Object} options - Query options
   * @param {string} options.userId - User ID for personalized results
   * @param {number} options.page - Page number
   * @param {number} options.limit - Items per page
   * @returns {Promise<Object>} Response with lists containing the dish
   */
  async getListsContainingDish(dishId, { userId, page = 1, limit = 10 } = {}) {
    if (!validateId(dishId)) {
      return { success: false, message: 'Invalid dish ID' };
    }
    
    logDebug(`[ListItemService] Getting lists containing dish ${dishId}`);
    
    const params = { dishId, page, limit };
    if (userId) params.userId = userId;
    
    return this.get('/containing-item', { params });
  }
  
  /**
   * Fetch lists that contain a specific restaurant ID
   * @param {string} restaurantId - Restaurant ID
   * @param {Object} options - Query options
   * @param {string} options.userId - User ID for personalized results
   * @param {number} options.page - Page number
   * @param {number} options.limit - Items per page
   * @returns {Promise<Object>} Response with lists containing the restaurant
   */
  async getListsContainingRestaurant(restaurantId, { userId, page = 1, limit = 10 } = {}) {
    if (!validateId(restaurantId)) {
      return { success: false, message: 'Invalid restaurant ID' };
    }
    
    logDebug(`[ListItemService] Getting lists containing restaurant ${restaurantId}`);
    
    const params = { restaurantId, page, limit };
    if (userId) params.userId = userId;
    
    return this.get('/containing-item', { params });
  }
  
  /**
   * Fetch details for multiple list items by their IDs
   * @param {Array<string>} listItemIds - Array of list item IDs
   * @returns {Promise<Object>} Response with item details
   */
  async getMultipleListItemsDetails(listItemIds) {
    if (!Array.isArray(listItemIds) || listItemIds.length === 0) {
      return { success: false, message: 'No list item IDs provided' };
    }
    
    logDebug(`[ListItemService] Getting details for ${listItemIds.length} list items`);
    
    return this.post('/items/details', { itemIds: listItemIds });
  }
}

// Create and export a singleton instance
export const listItemService = new ListItemService();

export default ListItemService;
