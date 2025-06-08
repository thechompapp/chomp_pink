/**
 * Bulk Update Panel Component
 * 
 * Specialized component for handling bulk update operations
 * Extracted from the monolithic BulkOperationsPanel for better maintainability.
 */

import React, { useState } from 'react';
import { Settings, Plus, X, Save } from 'lucide-react';
import { cn } from '@/lib/utils';

export const BulkUpdatePanel = ({ 
  resourceType, 
  selectedRows, 
  bulkOps 
}) => {
  const [updateFields, setUpdateFields] = useState({});
  const [newFieldKey, setNewFieldKey] = useState('');
  const [newFieldValue, setNewFieldValue] = useState('');
  
  const recordCount = selectedRows.size;

  // Get available fields for the resource type
  const getAvailableFields = (resourceType) => {
    const fieldOptions = {
      restaurants: [
        { key: 'name', label: 'Restaurant Name', type: 'text' },
        { key: 'address', label: 'Address', type: 'text' },
        { key: 'city', label: 'City', type: 'text' },
        { key: 'phone', label: 'Phone', type: 'text' },
        { key: 'cuisine_type', label: 'Cuisine Type', type: 'text' },
        { key: 'status', label: 'Status', type: 'select', options: ['active', 'inactive', 'pending'] }
      ],
      dishes: [
        { key: 'name', label: 'Dish Name', type: 'text' },
        { key: 'description', label: 'Description', type: 'textarea' },
        { key: 'price', label: 'Price', type: 'number' },
        { key: 'category', label: 'Category', type: 'text' },
        { key: 'status', label: 'Status', type: 'select', options: ['available', 'unavailable', 'seasonal'] }
      ],
      users: [
        { key: 'full_name', label: 'Full Name', type: 'text' },
        { key: 'email', label: 'Email', type: 'email' },
        { key: 'role', label: 'Role', type: 'select', options: ['user', 'admin', 'moderator'] },
        { key: 'status', label: 'Status', type: 'select', options: ['active', 'inactive', 'suspended'] }
      ],
      locations: [
        { key: 'name', label: 'Location Name', type: 'text' },
        { key: 'type', label: 'Type', type: 'select', options: ['city', 'neighborhood'] },
        { key: 'state', label: 'State/Country', type: 'text' }
      ],
      hashtags: [
        { key: 'name', label: 'Hashtag Name', type: 'text' },
        { key: 'category', label: 'Category', type: 'text' }
      ],
      restaurant_chains: [
        { key: 'name', label: 'Chain Name', type: 'text' },
        { key: 'website', label: 'Website', type: 'url' },
        { key: 'description', label: 'Description', type: 'textarea' }
      ]
    };
    return fieldOptions[resourceType] || [];
  };

  const availableFields = getAvailableFields(resourceType);

  const addField = () => {
    if (!newFieldKey || !newFieldValue) return;
    
    const newFields = { ...updateFields, [newFieldKey]: newFieldValue };
    setUpdateFields(newFields);
    bulkOps.setBulkUpdateFields(newFields);
    
    setNewFieldKey('');
    setNewFieldValue('');
  };

  const removeField = (fieldKey) => {
    const newFields = { ...updateFields };
    delete newFields[fieldKey];
    setUpdateFields(newFields);
    bulkOps.setBulkUpdateFields(newFields);
  };

  const updateFieldValue = (fieldKey, value) => {
    const newFields = { ...updateFields, [fieldKey]: value };
    setUpdateFields(newFields);
    bulkOps.setBulkUpdateFields(newFields);
  };

  const handleUpdate = () => {
    bulkOps.handleBulkUpdate();
  };

  const renderFieldInput = (field, value) => {
    const commonProps = {
      value: value || '',
      onChange: (e) => updateFieldValue(field.key, e.target.value),
      className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-white focus:border-white"
    };

    switch (field.type) {
      case 'textarea':
        return <textarea {...commonProps} rows={3} />;
      case 'select':
        return (
          <select {...commonProps}>
            <option value="">Select {field.label}</option>
            {field.options?.map(option => (
              <option key={option} value={option}>
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </option>
            ))}
          </select>
        );
      case 'number':
        return <input {...commonProps} type="number" step="0.01" />;
      case 'email':
        return <input {...commonProps} type="email" />;
      case 'url':
        return <input {...commonProps} type="url" />;
      default:
        return <input {...commonProps} type="text" />;
    }
  };

  // Simplified render function for new field value input
  const renderNewFieldInput = (selectedField, value, onChange) => {
    const commonProps = {
      value: value || '',
      onChange: onChange,
      placeholder: "Enter new value",
      className: "flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-white focus:border-white"
    };

    switch (selectedField.type) {
      case 'textarea':
        return <textarea {...commonProps} rows={2} />;
      case 'select':
        return (
          <select {...commonProps} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-white focus:border-white">
            <option value="">Select {selectedField.label}</option>
            {selectedField.options?.map(option => (
              <option key={option} value={option}>
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </option>
            ))}
          </select>
        );
      case 'number':
        return <input {...commonProps} type="number" step="0.01" />;
      case 'email':
        return <input {...commonProps} type="email" />;
      case 'url':
        return <input {...commonProps} type="url" />;
      default:
        return <input {...commonProps} type="text" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Update Info */}
      <div className="bg-orange-50 p-4 rounded-lg">
        <div className="flex items-center space-x-3">
          <Settings className="w-5 h-5 text-orange-600" />
          <div>
            <h4 className="font-medium text-orange-900">
              Bulk Update {recordCount} {resourceType}
            </h4>
            <p className="text-sm text-orange-700 mt-1">
              Set field values that will be applied to all selected records
            </p>
          </div>
        </div>
      </div>

      {/* Current Fields */}
      {Object.keys(updateFields).length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Fields to Update</h4>
          <div className="space-y-3">
            {Object.entries(updateFields).map(([fieldKey, fieldValue]) => {
              const field = availableFields.find(f => f.key === fieldKey) || { key: fieldKey, label: fieldKey, type: 'text' };
              return (
                <div key={fieldKey} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {field.label}
                    </label>
                    {renderFieldInput(field, fieldValue)}
                  </div>
                  <button
                    onClick={() => removeField(fieldKey)}
                    className="mt-6 p-2 text-red-600 hover:text-red-800 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add New Field */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-900">Add Field to Update</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Field
            </label>
            <select
              value={newFieldKey}
              onChange={(e) => setNewFieldKey(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-white focus:border-white"
            >
              <option value="">Select field to update</option>
              {availableFields
                .filter(field => !updateFields[field.key])
                .map(field => (
                  <option key={field.key} value={field.key}>
                    {field.label}
                  </option>
                ))
              }
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Value
            </label>
            <div className="flex space-x-2">
              {newFieldKey ? (() => {
                const selectedField = availableFields.find(f => f.key === newFieldKey);
                return selectedField ? 
                  renderNewFieldInput(selectedField, newFieldValue, (e) => setNewFieldValue(e.target.value)) :
                  <input
                    type="text"
                    value={newFieldValue}
                    onChange={(e) => setNewFieldValue(e.target.value)}
                    placeholder="Enter new value"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-white focus:border-white"
                  />;
              })() : (
                <input
                  type="text"
                  value={newFieldValue}
                  onChange={(e) => setNewFieldValue(e.target.value)}
                  placeholder="Select a field first"
                  disabled
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                />
              )}
              <button
                onClick={addField}
                disabled={!newFieldKey || !newFieldValue}
                className={cn(
                  "px-3 py-2 rounded-lg transition-colors flex items-center",
                  newFieldKey && newFieldValue
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                )}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Update Preview */}
      {Object.keys(updateFields).length > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Update Preview</h4>
          <p className="text-sm text-blue-800 mb-3">
            The following changes will be applied to {recordCount} selected records:
          </p>
          <div className="space-y-1">
            {Object.entries(updateFields).map(([fieldKey, fieldValue]) => {
              const field = availableFields.find(f => f.key === fieldKey);
              return (
                <div key={fieldKey} className="text-sm text-blue-700">
                  <strong>{field?.label || fieldKey}:</strong> {fieldValue}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <button
          onClick={bulkOps.resetOperation}
          className="px-4 py-2 text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleUpdate}
          disabled={Object.keys(updateFields).length === 0 || bulkOps.isLoading}
          className={cn(
            "px-4 py-2 rounded transition-colors flex items-center space-x-2",
            Object.keys(updateFields).length > 0 && !bulkOps.isLoading
              ? "bg-orange-600 text-white hover:bg-orange-700"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          )}
        >
          <Save className="w-4 h-4" />
          <span>
            {bulkOps.isLoading 
              ? 'Updating...' 
              : `Update ${recordCount} Records`
            }
          </span>
        </button>
      </div>
    </div>
  );
}; 