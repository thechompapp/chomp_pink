/**
 * Dynamic Column Configuration System
 * 
 * Provides runtime column configuration with caching and validation.
 * Allows for flexible, extensible column definitions.
 */

import { COLUMN_CONFIG } from '@/pages/AdminPanel/columnConfig';

class DynamicColumnConfigManager {
  constructor() {
    this.cache = new Map();
    this.customConfigs = new Map();
    this.validators = new Map();
  }

  /**
   * Get column configuration for a resource type
   * @param {string} resourceType - The resource type
   * @param {Object} options - Additional options
   * @returns {Array} Column configuration array
   */
  getColumns(resourceType, options = {}) {
    const cacheKey = `${resourceType}-${JSON.stringify(options)}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    let columns = this.getBaseColumns(resourceType);
    
    // Apply custom configurations
    if (this.customConfigs.has(resourceType)) {
      columns = this.applyCustomConfig(columns, this.customConfigs.get(resourceType));
    }

    // Apply runtime options
    if (options.includeColumns) {
      columns = columns.filter(col => options.includeColumns.includes(col.accessor));
    }

    if (options.excludeColumns) {
      columns = columns.filter(col => !options.excludeColumns.includes(col.accessor));
    }

    if (options.reorderColumns) {
      columns = this.reorderColumns(columns, options.reorderColumns);
    }

    // Apply field-level customizations
    if (options.fieldCustomizations) {
      columns = this.applyFieldCustomizations(columns, options.fieldCustomizations);
    }

    // Cache the result
    this.cache.set(cacheKey, columns);
    
    return columns;
  }

  /**
   * Register a custom column configuration
   * @param {string} resourceType - The resource type
   * @param {Object} config - Custom configuration
   */
  registerCustomConfig(resourceType, config) {
    this.customConfigs.set(resourceType, config);
    this.clearCache(resourceType);
  }

  /**
   * Register a field validator
   * @param {string} fieldName - The field name
   * @param {Function} validator - Validation function
   */
  registerValidator(fieldName, validator) {
    this.validators.set(fieldName, validator);
  }

  /**
   * Get base columns from static configuration
   * @param {string} resourceType - The resource type
   * @returns {Array} Base column configuration
   */
  getBaseColumns(resourceType) {
    const baseColumns = COLUMN_CONFIG[resourceType];
    
    if (!baseColumns) {
      console.warn(`No column configuration found for resource type: ${resourceType}`);
      return this.generateDefaultColumns(resourceType);
    }

    return [...baseColumns]; // Return a copy
  }

  /**
   * Generate default columns for unknown resource types
   * @param {string} resourceType - The resource type
   * @returns {Array} Default column configuration
   */
  generateDefaultColumns(resourceType) {
    return [
      { accessor: 'id', header: 'ID', isEditable: false, isSortable: true },
      { accessor: 'name', header: 'Name', isEditable: true, isSortable: true, required: true },
      { accessor: 'created_at', header: 'Created', isEditable: false, isSortable: true },
      { accessor: 'updated_at', header: 'Updated', isEditable: false, isSortable: true }
    ];
  }

  /**
   * Apply custom configuration to base columns
   * @param {Array} columns - Base columns
   * @param {Object} customConfig - Custom configuration
   * @returns {Array} Modified columns
   */
  applyCustomConfig(columns, customConfig) {
    return columns.map(column => {
      const customCol = customConfig.fields?.[column.accessor];
      if (customCol) {
        return { ...column, ...customCol };
      }
      return column;
    });
  }

  /**
   * Reorder columns based on provided order
   * @param {Array} columns - Original columns
   * @param {Array} order - Desired order
   * @returns {Array} Reordered columns
   */
  reorderColumns(columns, order) {
    const columnMap = new Map(columns.map(col => [col.accessor, col]));
    const reordered = [];
    
    // Add columns in specified order
    order.forEach(accessor => {
      if (columnMap.has(accessor)) {
        reordered.push(columnMap.get(accessor));
        columnMap.delete(accessor);
      }
    });
    
    // Add remaining columns
    reordered.push(...columnMap.values());
    
    return reordered;
  }

  /**
   * Apply field-level customizations
   * @param {Array} columns - Original columns
   * @param {Object} customizations - Field customizations
   * @returns {Array} Customized columns
   */
  applyFieldCustomizations(columns, customizations) {
    return columns.map(column => {
      const fieldCustom = customizations[column.accessor];
      if (fieldCustom) {
        return { ...column, ...fieldCustom };
      }
      return column;
    });
  }

  /**
   * Validate column configuration
   * @param {Array} columns - Columns to validate
   * @returns {Object} Validation result
   */
  validateColumns(columns) {
    const errors = [];
    const warnings = [];

    columns.forEach((column, index) => {
      // Required properties
      if (!column.accessor) {
        errors.push(`Column at index ${index} missing required 'accessor' property`);
      }
      
      if (!column.header) {
        warnings.push(`Column '${column.accessor}' missing 'header' property`);
      }

      // Validate against custom validators
      if (this.validators.has(column.accessor)) {
        const validator = this.validators.get(column.accessor);
        const validationResult = validator(column);
        if (!validationResult.valid) {
          errors.push(`Column '${column.accessor}': ${validationResult.message}`);
        }
      }
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Clear cache for a specific resource type
   * @param {string} resourceType - The resource type
   */
  clearCache(resourceType) {
    const keysToDelete = [];
    this.cache.forEach((value, key) => {
      if (key.startsWith(`${resourceType}-`)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Clear all cache
   */
  clearAllCache() {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      customConfigs: Array.from(this.customConfigs.keys()),
      validators: Array.from(this.validators.keys())
    };
  }
}

// Create singleton instance
const dynamicColumnConfig = new DynamicColumnConfigManager();

// Export both the class and the singleton instance
export { DynamicColumnConfigManager, dynamicColumnConfig };

// Helper functions for common use cases
export const getColumnsForResource = (resourceType, options = {}) => {
  return dynamicColumnConfig.getColumns(resourceType, options);
};

export const registerCustomResourceConfig = (resourceType, config) => {
  return dynamicColumnConfig.registerCustomConfig(resourceType, config);
};

export const registerFieldValidator = (fieldName, validator) => {
  return dynamicColumnConfig.registerValidator(fieldName, validator);
};

// Common validators
export const commonValidators = {
  email: (column) => ({
    valid: column.accessor === 'email' ? column.required !== undefined : true,
    message: 'Email fields should have required property defined'
  }),
  
  phone: (column) => ({
    valid: column.accessor === 'phone' ? column.valueType !== 'number' : true,
    message: 'Phone fields should not use number value type'
  }),
  
  price: (column) => ({
    valid: column.accessor.includes('price') ? column.valueType === 'number' : true,
    message: 'Price fields should use number value type'
  })
};

// Register common validators
Object.entries(commonValidators).forEach(([name, validator]) => {
  registerFieldValidator(name, validator);
}); 