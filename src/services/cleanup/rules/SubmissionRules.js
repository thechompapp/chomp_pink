/**
 * Submission Cleanup Rules
 * 
 * Contains all validation and cleanup rules specific to submission data.
 */

import { createRequiredFieldsRule } from './BaseRules.js';

export const submissionRules = {
  validation: {
    requiredFields: createRequiredFieldsRule(['dish_name', 'restaurant_name'], 'Submission'),
    pendingSubmissions: {
      check: (item) => {
        if (item.status !== 'pending') return false;
        const createdDate = new Date(item.created_at);
        const daysPending = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysPending > 7; // Pending for more than 7 days
      },
      fix: (item, context) => {
        const createdDate = new Date(item.created_at);
        const daysPending = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
        
        return {
          message: `Long-pending submission requires attention`,
          details: `Submission: "${item.dish_name}" at "${item.restaurant_name}"`,
          suggestion: 'Review and approve/reject submission',
          fixable: false,
          priority: 'medium',
          valueBefore: `Pending for ${daysPending} days`,
          valueAfter: 'Requires review decision'
        };
      }
    },
    duplicateSubmissions: {
      check: (item, context, allItems) => {
        return allItems.filter(other => 
          other.id !== item.id && 
          other.dish_name && 
          other.restaurant_name &&
          other.dish_name.toLowerCase() === item.dish_name?.toLowerCase() &&
          other.restaurant_name.toLowerCase() === item.restaurant_name?.toLowerCase()
        ).length > 0;
      },
      fix: (item, context, allItems) => {
        const duplicates = allItems.filter(other => 
          other.id !== item.id && 
          other.dish_name && 
          other.restaurant_name &&
          other.dish_name.toLowerCase() === item.dish_name?.toLowerCase() &&
          other.restaurant_name.toLowerCase() === item.restaurant_name?.toLowerCase()
        );
        
        return {
          message: `Duplicate submission detected`,
          details: `"${item.dish_name}" at "${item.restaurant_name}"`,
          suggestion: 'Review and merge duplicates',
          fixable: false,
          priority: 'medium',
          valueBefore: `${duplicates.length + 1} identical submissions`,
          valueAfter: 'Requires manual review and merge'
        };
      }
    }
  }
}; 