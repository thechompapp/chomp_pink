/**
 * City Cleanup Rules
 * 
 * Contains all validation and cleanup rules specific to city data.
 */

import {
  createRequiredFieldsRule,
  createDuplicateNameRule,
  createNameFormattingRule
} from './BaseRules.js';

export const cityRules = {
  formatting: {
    nameFormatting: createNameFormattingRule('City'),
    stateFormatting: {
      check: (item) => {
        if (!item.state) return false;
        const uppercase = item.state.toUpperCase();
        return item.state !== uppercase;
      },
      fix: (item, context) => {
        const uppercase = item.state.toUpperCase();
        return {
          message: `State code needs uppercase formatting`,
          details: `City: "${item.name}" (ID: ${item.id})`,
          suggestion: 'Convert to uppercase',
          fixable: true,
          priority: 'low',
          valueBefore: item.state,
          valueAfter: uppercase,
          autoFix: {
            field: 'state',
            value: uppercase
          }
        };
      }
    }
  },
  validation: {
    requiredFields: createRequiredFieldsRule(['name'], 'City'),
    duplicateNames: createDuplicateNameRule('City')
  }
}; 