/**
 * Restaurant Cleanup Rules
 * 
 * Contains all validation and cleanup rules specific to restaurant data.
 * Extracted from the monolithic cleanupService.js for better maintainability.
 */

import {
  applyTitleCase,
  formatUSPhone,
  addProtocolToWebsite,
  createRequiredFieldsRule,
  createDuplicateNameRule,
  createNameFormattingRule,
  createWhitespaceTrimmingRule
} from './BaseRules.js';

export const restaurantRules = {
  relationships: {
    missingCityId: {
      check: (item) => !item.city_id || item.city_id === null,
      fix: (item, context) => ({
        message: `Restaurant "${item.name}" missing city assignment`,
        details: `Address: ${item.address}`,
        suggestion: 'Use Google Places or manual assignment',
        fixable: false,
        priority: 'high',
        valueBefore: 'No city assigned',
        valueAfter: 'Requires manual assignment'
      })
    },
    missingNeighborhoodId: {
      check: (item) => !item.neighborhood_id || item.neighborhood_id === null,
      fix: (item, context) => ({
        message: `Restaurant "${item.name}" missing neighborhood assignment`,
        details: `Address: ${item.address}`,
        suggestion: 'Use Google Places or manual assignment',
        fixable: false,
        priority: 'high',
        valueBefore: 'No neighborhood assigned',
        valueAfter: 'Requires manual assignment'
      })
    },
    invalidCityId: {
      check: (item, context) => {
        if (!item.city_id) return false;
        return !context.cities?.find(c => c.id === item.city_id);
      },
      fix: (item, context) => ({
        message: `Restaurant "${item.name}" has invalid city reference`,
        details: `City ID ${item.city_id} not found`,
        suggestion: 'Reassign to valid city',
        fixable: false,
        priority: 'high',
        valueBefore: `City ID: ${item.city_id}`,
        valueAfter: 'Requires valid city assignment'
      })
    },
    invalidNeighborhoodId: {
      check: (item, context) => {
        if (!item.neighborhood_id) return false;
        return !context.neighborhoods?.find(n => n.id === item.neighborhood_id);
      },
      fix: (item, context) => ({
        message: `Restaurant "${item.name}" has invalid neighborhood reference`,
        details: `Neighborhood ID ${item.neighborhood_id} not found`,
        suggestion: 'Reassign to valid neighborhood',
        fixable: false,
        priority: 'high',
        valueBefore: `Neighborhood ID: ${item.neighborhood_id}`,
        valueAfter: 'Requires valid neighborhood assignment'
      })
    }
  },
  formatting: {
    nameFormatting: createNameFormattingRule('Restaurant', (item) => `Name: "${item.name}"`),
    phoneFormatting: {
      check: (item) => {
        if (!item.phone) return false;
        const cleaned = item.phone.replace(/\D/g, '');
        if (cleaned.length !== 10) return false;
        const formatted = formatUSPhone(item.phone);
        return item.phone !== formatted;
      },
      fix: (item, context) => {
        const formatted = formatUSPhone(item.phone);
        return {
          message: `Phone number needs standard formatting`,
          details: `Restaurant: "${item.name}"`,
          suggestion: 'Apply standard US phone format',
          fixable: true,
          priority: 'medium',
          valueBefore: item.phone,
          valueAfter: formatted,
          autoFix: {
            field: 'phone',
            value: formatted
          }
        };
      }
    },
    websiteFormatting: {
      check: (item) => {
        if (!item.website) return false;
        return !item.website.startsWith('http://') && !item.website.startsWith('https://');
      },
      fix: (item, context) => {
        const formattedWebsite = addProtocolToWebsite(item.website);
        return {
          message: `Website URL missing protocol`,
          details: `Restaurant: "${item.name}"`,
          suggestion: 'Add https:// prefix',
          fixable: true,
          priority: 'low',
          valueBefore: item.website,
          valueAfter: formattedWebsite,
          autoFix: {
            field: 'website',
            value: formattedWebsite
          }
        };
      }
    },
    addressFormatting: createWhitespaceTrimmingRule(
      'address', 
      'Restaurant', 
      (item) => `Restaurant: "${item.name}"`
    )
  },
  validation: {
    requiredFields: createRequiredFieldsRule(['name', 'address'], 'Restaurant'),
    duplicateNames: createDuplicateNameRule('Restaurant')
  }
}; 