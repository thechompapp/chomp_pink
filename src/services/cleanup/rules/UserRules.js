/**
 * User Cleanup Rules
 * 
 * Contains all validation and cleanup rules specific to user data.
 */

import {
  createRequiredFieldsRule,
  createNameFormattingRule
} from './BaseRules.js';

export const userRules = {
  formatting: {
    nameFormatting: createNameFormattingRule('User', (item) => `User: ${item.username} (ID: ${item.id})`),
    emailFormatting: {
      check: (item) => {
        if (!item.email) return false;
        const lowercase = item.email.toLowerCase();
        return item.email !== lowercase;
      },
      fix: (item, context) => {
        const lowercase = item.email.toLowerCase();
        return {
          message: `Email needs lowercase formatting`,
          details: `User: ${item.username} (ID: ${item.id})`,
          suggestion: 'Convert email to lowercase',
          fixable: true,
          priority: 'medium',
          valueBefore: item.email,
          valueAfter: lowercase,
          autoFix: {
            field: 'email',
            value: lowercase
          }
        };
      }
    }
  },
  validation: {
    requiredFields: createRequiredFieldsRule(['username', 'email'], 'User'),
    emailValidation: {
      check: (item) => {
        if (!item.email) return false;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return !emailRegex.test(item.email);
      },
      fix: (item, context) => ({
        message: `Invalid email format`,
        details: `User: ${item.username} (ID: ${item.id})`,
        suggestion: 'Correct email format',
        fixable: false,
        priority: 'high',
        valueBefore: item.email,
        valueAfter: 'Requires valid email format'
      })
    },
    duplicateEmails: {
      check: (item, context, allItems) => {
        if (!item.email) return false;
        return allItems.filter(other => 
          other.id !== item.id && 
          other.email && 
          other.email.toLowerCase() === item.email.toLowerCase()
        ).length > 0;
      },
      fix: (item, context, allItems) => {
        const duplicates = allItems.filter(other => 
          other.id !== item.id && 
          other.email && 
          other.email.toLowerCase() === item.email.toLowerCase()
        );
        
        return {
          message: `Duplicate email address found`,
          details: `User: ${item.username} (ID: ${item.id})`,
          suggestion: 'Resolve duplicate accounts',
          fixable: false,
          priority: 'high',
          valueBefore: `${item.email} (${duplicates.length + 1} accounts)`,
          valueAfter: 'Requires manual resolution'
        };
      }
    },
    unverifiedAccounts: {
      check: (item) => item.verified === false || item.verified === 0,
      fix: (item, context) => ({
        message: `Unverified user account`,
        details: `User: ${item.username} (ID: ${item.id})`,
        suggestion: 'Send verification email or manually verify',
        fixable: false,
        priority: 'low',
        valueBefore: 'Unverified',
        valueAfter: 'Requires verification'
      })
    }
  }
}; 