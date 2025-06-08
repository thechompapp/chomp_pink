/**
 * Base Cleanup Rules
 * 
 * Shared utilities and common rule patterns used across all resource types.
 * This follows the DRY principle and provides consistent behavior.
 */

/**
 * Apply title case formatting to a string
 * @param {string} text - Text to format
 * @returns {string} Title cased text
 */
export const applyTitleCase = (text) => {
  if (!text) return text;
  return text.replace(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
};

/**
 * Format US phone number to standard format
 * @param {string} phone - Phone number to format
 * @returns {string} Formatted phone number
 */
export const formatUSPhone = (phone) => {
  if (!phone) return phone;
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length !== 10) return phone;
  return `(${cleaned.slice(0,3)}) ${cleaned.slice(3,6)}-${cleaned.slice(6)}`;
};

/**
 * Add https protocol to website URL if missing
 * @param {string} website - Website URL
 * @returns {string} URL with protocol
 */
export const addProtocolToWebsite = (website) => {
  if (!website) return website;
  if (website.startsWith('http://') || website.startsWith('https://')) {
    return website;
  }
  return `https://${website}`;
};

/**
 * Common rule patterns
 */
export const createRequiredFieldsRule = (requiredFields, resourceType) => ({
  check: (item) => {
    return requiredFields.some(field => !item[field]);
  },
  fix: (item, context) => {
    const missingFields = requiredFields.filter(field => !item[field]);
    
    return {
      message: `${resourceType} missing required fields`,
      details: `${resourceType} ID: ${item.id}`,
      suggestion: 'Add missing required information',
      fixable: false,
      priority: 'high',
      valueBefore: `Missing: ${missingFields.join(', ')}`,
      valueAfter: 'Requires manual data entry'
    };
  }
});

export const createDuplicateNameRule = (resourceType, additionalFilters = []) => ({
  check: (item, context, allItems) => {
    if (!item.name) return false;
    return allItems.filter(other => {
      if (other.id === item.id) return false;
      if (!other.name) return false;
      if (other.name.toLowerCase() !== item.name.toLowerCase()) return false;
      
      // Apply additional filters (e.g., same restaurant_id for dishes)
      return additionalFilters.every(filter => filter(item, other));
    }).length > 0;
  },
  fix: (item, context, allItems) => {
    const duplicates = allItems.filter(other => {
      if (other.id === item.id) return false;
      if (!other.name) return false;
      if (other.name.toLowerCase() !== item.name.toLowerCase()) return false;
      
      return additionalFilters.every(filter => filter(item, other));
    });
    
    return {
      message: `Duplicate ${resourceType.toLowerCase()} name found`,
      details: `${resourceType}: "${item.name}" (ID: ${item.id})`,
      suggestion: 'Review and merge or rename duplicates',
      fixable: false,
      priority: 'medium',
      valueBefore: `"${item.name}" (${duplicates.length + 1} total)`,
      valueAfter: 'Requires manual review and resolution'
    };
  }
});

export const createNameFormattingRule = (resourceType, getDisplayName = (item) => `${resourceType} ID: ${item.id}`) => ({
  check: (item) => {
    if (!item.name) return false;
    const titleCase = applyTitleCase(item.name);
    return item.name !== titleCase;
  },
  fix: (item, context) => {
    const titleCase = applyTitleCase(item.name);
    return {
      message: `${resourceType} name needs title case formatting`,
      details: getDisplayName(item),
      suggestion: 'Apply title case formatting',
      fixable: true,
      priority: 'medium',
      valueBefore: item.name,
      valueAfter: titleCase,
      autoFix: {
        field: 'name',
        value: titleCase
      }
    };
  }
});

export const createWhitespaceTrimmingRule = (field, resourceType, getDisplayName = (item) => `${resourceType} ID: ${item.id}`) => ({
  check: (item) => {
    if (!item[field]) return false;
    return item[field] !== item[field].trim();
  },
  fix: (item, context) => {
    const trimmedValue = item[field].trim();
    return {
      message: `${field.charAt(0).toUpperCase() + field.slice(1)} has extra whitespace`,
      details: getDisplayName(item),
      suggestion: 'Trim whitespace',
      fixable: true,
      priority: 'low',
      valueBefore: `"${item[field]}"`,
      valueAfter: `"${trimmedValue}"`,
      autoFix: {
        field: field,
        value: trimmedValue
      }
    };
  }
}); 