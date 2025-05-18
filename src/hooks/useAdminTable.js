// src/hooks/useAdminTable.js
import { useState, useEffect, useMemo, useCallback } from 'react';
import { adminService } from '../services/adminService';
import { logDebug, logError } from '../utils/logger';

/**
 * Custom hook for managing AdminTable state and operations
 * @param {string} tabKey - The current tab/resource type
 * @param {Array} data - The data to display in the table
 * @param {Function} onRefetch - Function to call to refresh data
 * @returns {Object} - Table state and operations
 */
export const useAdminTable = (tabKey, data, onRefetch) => {
  // State for sorting
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'asc' });
  
  // State for editing
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  
  // State for related data (e.g., restaurant names for dishes)
  const [relatedData, setRelatedData] = useState({});

  // Define relationship configurations - memoized
  const relationshipConfigs = useMemo(() => ({
    dishes: {
      fields: ['restaurant_id', 'restaurant'],
      directField: 'restaurant_name',
      mapKey: 'restaurants',
      invalidValue: 'Unknown Restaurant',
      resource: 'restaurants'
    },
    restaurants: {
      fields: ['neighborhood_id', 'neighborhood'],
      directField: 'neighborhood_name',
      mapKey: 'neighborhoods',
      invalidValue: 'Unknown Neighborhood',
      resource: 'neighborhoods'
    },
    neighborhoods: {
      fields: ['city_id', 'city'],
      directField: 'city_name',
      mapKey: 'cities',
      invalidValue: 'Unknown City',
      resource: 'cities'
    }
  }), []);

  // Define column configurations - memoized
  const columnConfigurations = useMemo(() => ({
    dishes: ['restaurant_id', 'price', 'description'],
    restaurants: ['neighborhood_id', 'address', 'website', 'phone'],
    neighborhoods: ['city_id', 'borough'],
    users: ['email', 'account_type'],
    lists: ['user_id', 'description']
  }), []);
  
  // Common columns that appear in all tables
  const commonColumns = useMemo(() => ['id', 'name', 'created_at', 'updated_at'], []);
  
  // Determine which columns to show based on tabKey - memoized
  const columns = useMemo(() => {
    const specificColumns = columnConfigurations[tabKey] || [];
    return [...specificColumns, ...commonColumns];
  }, [tabKey, columnConfigurations, commonColumns]);

  // Helper function to create ID-to-name mapping - memoized
  const createEntityMap = useCallback((entities) => {
    if (!entities || !Array.isArray(entities)) return {};
    
    return entities.reduce((map, entity) => {
      if (entity && entity.id && entity.name) {
        map[entity.id] = entity.name;
      }
      return map;
    }, {});
  }, []);

  // Handle sorting with improved type handling - memoized
  const sortedData = useMemo(() => {
    if (!sortConfig.key || !data) return data || [];
    
    const sortValue = (item, key) => {
      const value = item[key];
      // Handle different data types appropriately
      if (value === null || value === undefined) return '';
      if (typeof value === 'string') return value.toLowerCase(); // Case-insensitive string comparison
      return value; // Numbers and other types
    };
    
    // Create a new sorted array
    return [...data].sort((a, b) => {
      const valueA = sortValue(a, sortConfig.key);
      const valueB = sortValue(b, sortConfig.key);
      
      if (valueA < valueB) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (valueA > valueB) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [data, sortConfig]);

  // Fetch related data when component mounts or tabKey changes
  useEffect(() => {
    const fetchRelatedData = async () => {
      try {
        // Get config for current tab
        const config = relationshipConfigs[tabKey];
        
        if (!config) return;
        
        logDebug(`[useAdminTable] Fetching related data for ${tabKey} tab`);
        
        // Fetch related data
        const response = await adminService.getAdminData(config.resource);
        const relatedDataArray = Array.isArray(response) ? response : [];
        
        logDebug(`[useAdminTable] Fetched ${config.resource} data:`, {
          length: relatedDataArray.length || 0
        });
        
        // Create mapping and update state in one operation
        const mapping = createEntityMap(relatedDataArray);
        setRelatedData(prevMap => ({
          ...prevMap,
          [config.mapKey]: mapping
        }));
      } catch (error) {
        logError(`[useAdminTable] Error fetching related data for ${tabKey}:`, error);
      }
    };
    
    fetchRelatedData();
  }, [tabKey, relationshipConfigs, createEntityMap]);

  // Handle sort request - memoized
  const requestSort = useCallback((key) => {
    setSortConfig(prevConfig => {
      if (prevConfig.key === key) {
        return {
          key,
          direction: prevConfig.direction === 'asc' ? 'desc' : 'asc'
        };
      }
      return { key, direction: 'asc' };
    });
  }, []);

  // Start editing an item - memoized
  const startEditing = useCallback((item) => {
    setEditingId(item.id);
    setEditData({ ...item });
  }, []);

  // Cancel editing - memoized
  const cancelEditing = useCallback(() => {
    setEditingId(null);
    setEditData({});
  }, []);

  // Save edited item - memoized
  const saveEdit = useCallback(async () => {
    try {
      // Don't save if no editingId
      if (!editingId) return;
      
      await adminService.updateAdminItem(tabKey, editingId, editData);
      setEditingId(null);
      setEditData({});
      
      if (typeof onRefetch === 'function') {
        onRefetch();
      }
    } catch (error) {
      logError(`[useAdminTable] Error updating ${tabKey} item:`, error);
    }
  }, [editingId, editData, tabKey, onRefetch]);

  // Delete an item - memoized
  const deleteItem = useCallback(async (id) => {
    if (!id) return;
    
    if (window.confirm(`Are you sure you want to delete this ${tabKey.slice(0, -1)}?`)) {
      try {
        await adminService.deleteAdminItem(tabKey, id);
        
        if (typeof onRefetch === 'function') {
          onRefetch();
        }
      } catch (error) {
        logError('[useAdminTable] Error deleting item:', error);
      }
    }
  }, [tabKey, onRefetch]);

  // Get display value for a relationship field - memoized
  const getRelationshipValue = useCallback((key, value, item) => {
    const config = relationshipConfigs[tabKey];
    if (!config || !config.fields.includes(key)) return value;

    // Check if we have the name directly in the data
    if (config.directField && item[config.directField] && 
        (!config.invalidValue || item[config.directField] !== config.invalidValue) && 
        (!config.checkType || typeof item[config.directField] === 'string')) {
      return item[config.directField];
    }
    
    // Otherwise, look up the name in our mapping
    const idField = config.fields[0]; // e.g., restaurant_id
    const id = item[idField];
    
    if (id && relatedData[config.mapKey] && relatedData[config.mapKey][id]) {
      return relatedData[config.mapKey][id];
    }
    
    return value || config.invalidValue || 'Unknown';
  }, [tabKey, relationshipConfigs, relatedData]);

  // Return memoized values and functions
  return useMemo(() => ({
    sortConfig,
    editingId,
    editData,
    relatedData,
    columns,
    sortedData,
    requestSort,
    startEditing,
    cancelEditing,
    saveEdit,
    deleteItem,
    getRelationshipValue,
    setEditData
  }), [
    sortConfig,
    editingId,
    editData,
    relatedData,
    columns,
    sortedData,
    requestSort,
    startEditing,
    cancelEditing,
    saveEdit,
    deleteItem,
    getRelationshipValue
  ]);
};
