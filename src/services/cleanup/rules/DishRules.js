/**
 * Dish Cleanup Rules
 * 
 * Contains all validation and cleanup rules specific to dish data.
 * Extracted from the monolithic cleanupService.js for better maintainability.
 */

import {
  createRequiredFieldsRule,
  createNameFormattingRule,
  createWhitespaceTrimmingRule
} from './BaseRules.js';

export const dishRules = {
  relationships: {
    missingRestaurantId: {
      check: (item) => !item.restaurant_id || item.restaurant_id === null,
      fix: (item, context) => ({
        message: `Dish missing restaurant assignment`,
        details: `Dish: "${item.name}" (ID: ${item.id})`,
        suggestion: 'Assign to a restaurant or remove',
        fixable: false,
        priority: 'high',
        valueBefore: 'No restaurant assigned',
        valueAfter: 'Requires restaurant assignment'
      })
    },
    invalidRestaurantId: {
      check: (item, context) => {
        if (!item.restaurant_id) return false;
        // Handle potential type mismatches by converting both to numbers for comparison
        const dishRestaurantId = Number(item.restaurant_id);
        return !context.restaurants?.find(r => Number(r.id) === dishRestaurantId);
      },
      fix: (item, context) => {
        // Try to find the restaurant name with type-safe comparison
        const dishRestaurantId = Number(item.restaurant_id);
        const restaurant = context.restaurants?.find(r => Number(r.id) === dishRestaurantId);
        const restaurantDisplay = restaurant ? 
          `"${restaurant.name}" (ID: ${item.restaurant_id})` : 
          `Restaurant ID: ${item.restaurant_id} (not found)`;
          
        return {
          message: `Dish has invalid restaurant reference`,
          details: `Dish: "${item.name}" (ID: ${item.id})`,
          suggestion: 'Reassign to valid restaurant',
          fixable: false,
          priority: 'high',
          valueBefore: restaurantDisplay,
          valueAfter: 'Requires valid restaurant assignment'
        };
      }
    },
    orphanedDishes: {
      check: (item, context) => {
        if (!item.restaurant_id) return true;
        // Handle potential type mismatches by converting both to numbers for comparison
        const dishRestaurantId = Number(item.restaurant_id);
        const restaurant = context.restaurants?.find(r => Number(r.id) === dishRestaurantId);
        return !restaurant;
      },
      fix: (item, context) => {
        // Show the restaurant name if found, even for orphaned dishes
        const dishRestaurantId = Number(item.restaurant_id);
        const restaurant = context.restaurants?.find(r => Number(r.id) === dishRestaurantId);
        const restaurantDisplay = item.restaurant_id ? 
          (restaurant ? 
            `"${restaurant.name}" (ID: ${item.restaurant_id})` : 
            `Restaurant ID: ${item.restaurant_id} (deleted)`) : 
          'No restaurant assigned';
          
        return {
          message: `Orphaned dish detected`,
          details: `Dish: "${item.name}" (ID: ${item.id})`,
          suggestion: 'Reassign or remove dish',
          fixable: false,
          priority: 'high',
          valueBefore: restaurantDisplay,
          valueAfter: 'Requires reassignment or removal'
        };
      }
    }
  },
  formatting: {
    nameFormatting: createNameFormattingRule('Dish', (item, context) => {
      // Also show which restaurant this dish belongs to for context with type-safe comparison
      const dishRestaurantId = Number(item.restaurant_id);
      const restaurant = context.restaurants?.find(r => Number(r.id) === dishRestaurantId);
      const restaurantContext = restaurant ? ` at "${restaurant.name}"` : '';
      return `Dish: "${item.name}"${restaurantContext} (ID: ${item.id})`;
    }),
    descriptionFormatting: createWhitespaceTrimmingRule(
      'description',
      'Dish',
      (item, context) => {
        // Show restaurant context with type-safe comparison
        const dishRestaurantId = Number(item.restaurant_id);
        const restaurant = context.restaurants?.find(r => Number(r.id) === dishRestaurantId);
        const restaurantContext = restaurant ? ` at "${restaurant.name}"` : '';
        return `Dish: "${item.name}"${restaurantContext} (ID: ${item.id})`;
      }
    )
  },
  validation: {
    requiredFields: createRequiredFieldsRule(['name', 'restaurant_id'], 'Dish'),
    duplicateDishes: {
      check: (item, context, allItems) => {
        return allItems.filter(other => 
          other.id !== item.id && 
          other.restaurant_id === item.restaurant_id &&
          other.name && 
          other.name.toLowerCase() === item.name?.toLowerCase()
        ).length > 0;
      },
      fix: (item, context, allItems) => {
        const duplicates = allItems.filter(other => 
          other.id !== item.id && 
          other.restaurant_id === item.restaurant_id &&
          other.name && 
          other.name.toLowerCase() === item.name?.toLowerCase()
        );
        
        // Use type-safe comparison for restaurant lookup
        const dishRestaurantId = Number(item.restaurant_id);
        const restaurant = context.restaurants?.find(r => Number(r.id) === dishRestaurantId);
        const restaurantName = restaurant?.name || `Restaurant ID ${item.restaurant_id}`;
        
        return {
          message: `Duplicate dish name at restaurant`,
          details: `Dish: "${item.name}" at "${restaurantName}"`,
          suggestion: 'Review and merge or rename duplicates',
          fixable: false,
          priority: 'medium',
          valueBefore: `"${item.name}" at "${restaurantName}" (${duplicates.length + 1} total)`,
          valueAfter: 'Requires manual review and resolution'
        };
      }
    }
  }
}; 