/**
 * Restaurant Chain Cleanup Rules
 * 
 * Contains all validation and cleanup rules specific to restaurant chain data.
 */

import {
  createRequiredFieldsRule,
  createDuplicateNameRule,
  createNameFormattingRule
} from './BaseRules.js';

export const restaurantChainRules = {
  formatting: {
    nameFormatting: createNameFormattingRule('Chain')
  },
  validation: {
    requiredFields: createRequiredFieldsRule(['name'], 'Restaurant chain'),
    duplicateNames: createDuplicateNameRule('Chain')
  }
}; 