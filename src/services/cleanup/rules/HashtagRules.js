/**
 * Hashtag Cleanup Rules
 * 
 * Contains all validation and cleanup rules specific to hashtag data.
 */

import {
  createRequiredFieldsRule,
  createDuplicateNameRule
} from './BaseRules.js';

export const hashtagRules = {
  formatting: {
    nameFormatting: {
      check: (item) => {
        if (!item.name) return false;
        const lowercase = item.name.toLowerCase();
        return item.name !== lowercase;
      },
      fix: (item, context) => {
        const lowercase = item.name.toLowerCase();
        return {
          message: `Hashtag needs lowercase formatting`,
          details: `Hashtag ID: ${item.id}`,
          suggestion: 'Convert to lowercase',
          fixable: true,
          priority: 'medium',
          valueBefore: item.name,
          valueAfter: lowercase,
          autoFix: {
            field: 'name',
            value: lowercase
          }
        };
      }
    },
    hashtagPrefix: {
      check: (item) => {
        if (!item.name) return false;
        return !item.name.startsWith('#');
      },
      fix: (item, context) => {
        const withPrefix = `#${item.name}`;
        return {
          message: `Hashtag missing # prefix`,
          details: `Hashtag ID: ${item.id}`,
          suggestion: 'Add # prefix',
          fixable: true,
          priority: 'low',
          valueBefore: item.name,
          valueAfter: withPrefix,
          autoFix: {
            field: 'name',
            value: withPrefix
          }
        };
      }
    }
  },
  validation: {
    requiredFields: createRequiredFieldsRule(['name'], 'Hashtag'),
    duplicateNames: createDuplicateNameRule('Hashtag'),
    unusedHashtags: {
      check: (item, context) => {
        // This would need actual usage data from submissions/dishes
        // For now, just check if the hashtag has been around for a while without usage
        const createdDate = new Date(item.created_at);
        const daysSinceCreated = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceCreated > 30; // Assume unused if older than 30 days
      },
      fix: (item, context) => ({
        message: `Potentially unused hashtag`,
        details: `Hashtag: "${item.name}" (ID: ${item.id})`,
        suggestion: 'Review usage and consider removal',
        fixable: false,
        priority: 'low',
        valueBefore: 'Old hashtag (30+ days)',
        valueAfter: 'Review for removal'
      })
    }
  }
}; 