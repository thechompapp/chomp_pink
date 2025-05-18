import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Edit, Trash2, Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import { formatDate } from '../../utils/dateUtils';
import { useAdminTable } from '../../hooks/useAdminTable';
import { adminService } from '../../services/adminService';

export const AdminTable = ({ tabKey, data = [], onRefetch, isLoading }) => {
  // Use the admin table hook to manage state and operations
  const {
    sortConfig,
    sortedData,
    editingId,
    editData,
    relatedData,
    requestSort,
    startEditing: handleEdit,
    cancelEditing,
    saveEdit: handleSave,
    deleteItem: handleDelete,
    getRelationshipValue
  } = useAdminTable(tabKey, data, onRefetch);

  // Define relationship configurations for rendering
  const relationshipConfigs = useMemo(() => ({
    dishes: {
      fields: ['restaurant_id', 'restaurant'],
      directField: 'restaurant_name',
      mapKey: 'restaurants',
      invalidValue: 'Unknown Restaurant'
    },
    restaurants: {
      fields: ['neighborhood_id', 'neighborhood'],
      directField: 'neighborhood_name',
      mapKey: 'neighborhoods',
      invalidValue: 'Unknown Neighborhood'
    },
    neighborhoods: {
      fields: ['city_id', 'city'],
      directField: 'city_name',
      mapKey: 'cities',
      invalidValue: 'Unknown City'
    }
  }), []);

  // Render input field for editing - extracted for better organization
  const renderEditInput = (key, value) => (
    <input
      type={typeof value === 'number' ? 'number' : 'text'}
      value={editData[key] || ''}
      onChange={(e) => setEditData(prev => ({
        ...prev,
        [key]: e.target.value
      }))}
      className="w-full px-2 py-1 border rounded"
    />
  );

  // Render cell based on field type and context
  const renderCell = (key, value, item) => {
    // If in edit mode, render input field
    if (editingId === item.id) {
      return renderEditInput(key, value);
    }

    const config = relationshipConfigs[tabKey];
    if (config && config.fields.includes(key)) {
      // Check if we have the name directly in the data
      if (config.directField && item[config.directField] && 
          (!config.invalidValue || item[config.directField] !== config.invalidValue) && 
          (!config.checkType || typeof item[config.directField] === 'string')) {
        return item[config.directField];
      }
      // Otherwise try to look it up from our mapping
      if (relatedData[config.mapKey][value]) {
        return relatedData[config.mapKey][value];
      }
      // If we can't find it in our mapping, just return the value
      return value;
    }
    
    // Format special field types
    
    // Format date strings
    if (typeof value === 'string' && !isNaN(Date.parse(value))) {
      return new Date(value).toLocaleString();
    }
    
    // Format hashtags - ensure they have # prefix
    if (tabKey === 'hashtags' && key === 'name' && value && typeof value === 'string') {
      return value.startsWith('#') ? value : `#${value}`;
    }
    
    // Format phone numbers
    if (key === 'phone' && value && typeof value === 'string') {
      const digits = value.replace(/\D/g, '');
      if (digits.length === 10) {
        return `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`;
      }
    }
    
    // Format websites
    if (key === 'website' && value && typeof value === 'string') {
      if (!value.startsWith('http://') && !value.startsWith('https://')) {
        return `https://${value}`;
      }
    }
    
    // Badge rendering for special status fields
    const badgeConfigs = [
      {
        condition: tabKey === 'users' && key === 'account_type' && value === 'admin',
        className: 'bg-blue-100 text-blue-800',
        text: 'Admin'
      },
      {
        condition: tabKey === 'users' && key === 'verified' && value === true,
        className: 'bg-green-100 text-green-800',
        text: 'Verified'
      }
    ];
    
    const badgeConfig = badgeConfigs.find(config => config.condition);
    if (badgeConfig) {
      return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${badgeConfig.className}`}>
          {badgeConfig.text}
        </span>
      );
    }
    
    // Handle nested objects
    if (value && typeof value === 'object') {
      return JSON.stringify(value);
    }
    
    return value || '-';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        No data available
      </div>
    );
  }

  // Get all unique keys from the data for table headers
  let allKeys = [...new Set(data.flatMap(item => Object.keys(item)))];
  
  // Remove specific columns based on tab
  if (tabKey === 'restaurants') {
    allKeys = allKeys.filter(key => key !== 'price' && key !== 'city' && key !== 'neighborhood');
  } else if (tabKey === 'dishes') {
    allKeys = allKeys.filter(key => key !== 'price' && key !== 'restaurant_name' && key !== 'dish_id');
  } else if (tabKey === 'neighborhoods') {
    allKeys = allKeys.filter(key => key !== 'city_name' && key !== 'zipcode_ranges');
  } else if (tabKey === 'hashtags') {
    // Ensure hashtags are properly displayed
    data.forEach(item => {
      if (item.name && !item.name.startsWith('#')) {
        item.name = `#${item.name}`;
      }
    });
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {allKeys.map((key) => (
              <th
                key={key}
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => requestSort(key)}
              >
                <div className="flex items-center">
                  {key.replace(/_/g, ' ')}
                  {sortConfig.key === key && (
                    <span className="ml-1">
                      {sortConfig.direction === 'asc' ? (
                        <ChevronUp className="h-4 w-4 inline" />
                      ) : (
                        <ChevronDown className="h-4 w-4 inline" />
                      )}
                    </span>
                  )}
                </div>
              </th>
            ))}
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedData.map((item, index) => (
            <tr key={item.id || index} className="hover:bg-gray-50">
              {allKeys.map((key) => (
                <td key={`${item.id}-${key}`} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {renderCell(key, item[key], item)}
                </td>
              ))}
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                {editingId === item.id ? (
                  <div className="flex space-x-2 justify-end">
                    <button
                      onClick={handleSave}
                      className="text-green-600 hover:text-green-900"
                      title="Save"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="text-gray-600 hover:text-gray-900"
                      title="Cancel"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex space-x-2 justify-end">
                    <button
                      onClick={() => handleEdit(item)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Define prop types for better documentation and validation
AdminTable.propTypes = {
  /** The current tab key/resource type being displayed */
  tabKey: PropTypes.string.isRequired,
  /** Array of data items to display in the table */
  data: PropTypes.array,
  /** Function to call when data needs to be refreshed */
  onRefetch: PropTypes.func.isRequired,
  /** Loading state indicator */
  isLoading: PropTypes.bool
};

export default AdminTable;
