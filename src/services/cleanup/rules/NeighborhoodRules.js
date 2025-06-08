/**
 * Neighborhood Cleanup Rules
 * 
 * Contains all validation and cleanup rules specific to neighborhood data.
 */

import {
  createRequiredFieldsRule,
  createDuplicateNameRule,
  createNameFormattingRule
} from './BaseRules.js';

export const neighborhoodRules = {
  relationships: {
    missingCityId: {
      check: (item) => !item.city_id || item.city_id === null,
      fix: (item, context) => ({
        message: `Neighborhood missing city assignment`,
        details: `Neighborhood: "${item.name}" (ID: ${item.id})`,
        suggestion: 'Assign to appropriate city',
        fixable: false,
        priority: 'high',
        valueBefore: 'No city assigned',
        valueAfter: 'Requires city assignment'
      })
    },
    invalidCityId: {
      check: (item, context) => {
        if (!item.city_id) return false;
        return !context.cities?.find(c => c.id === item.city_id);
      },
      fix: (item, context) => ({
        message: `Neighborhood has invalid city reference`,
        details: `Neighborhood: "${item.name}" (ID: ${item.id})`,
        suggestion: 'Reassign to valid city',
        fixable: false,
        priority: 'high',
        valueBefore: `City ID: ${item.city_id}`,
        valueAfter: 'Requires valid city assignment'
      })
    }
  },
  formatting: {
    nameFormatting: createNameFormattingRule('Neighborhood'),
    boroughFormatting: createNameFormattingRule('Borough', (item) => `Neighborhood: "${item.name}" (ID: ${item.id})`)
  },
  validation: {
    requiredFields: createRequiredFieldsRule(['name', 'city_id'], 'Neighborhood'),
    duplicateNames: createDuplicateNameRule('Neighborhood', [
      (item, other) => other.city_id === item.city_id
    ])
  }
}; 