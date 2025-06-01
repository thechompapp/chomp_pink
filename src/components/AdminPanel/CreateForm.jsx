/**
 * CreateForm Component
 * 
 * Extracted from EnhancedAdminTable for better maintainability.
 * Handles form creation with validation, field rendering, and submission.
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import PlacesAutocompleteInput from '@/components/UI/PlacesAutocompleteInput';

export const CreateForm = ({ 
  resourceType, 
  columns, 
  onSave, 
  onCancel, 
  isLoading, 
  cities = [], 
  neighborhoods = [] 
}) => {
  const [formData, setFormData] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [isFormValid, setIsFormValid] = useState(false);
  
  const editableColumns = useMemo(() => 
    columns.filter(col => 
      col.isEditable !== false && !['actions', 'select', 'id'].includes(col.accessor)
    ), [columns]
  );

  // Filter neighborhoods based on selected city
  const filteredNeighborhoods = useMemo(() => {
    const selectedCityId = formData.city_id;
    if (!selectedCityId) {
      return [];
    }
    return neighborhoods.filter(neighborhood => 
      neighborhood.city_id === parseInt(selectedCityId)
    );
  }, [neighborhoods, formData.city_id]);

  // Reset neighborhood when city changes
  useEffect(() => {
    if (formData.city_id && formData.neighborhood_id) {
      const isNeighborhoodValid = filteredNeighborhoods.some(
        n => n.id === parseInt(formData.neighborhood_id)
      );
      if (!isNeighborhoodValid) {
        setFormData(prev => ({
          ...prev,
          neighborhood_id: ''
        }));
      }
    }
  }, [formData.city_id, formData.neighborhood_id, filteredNeighborhoods]);
  
  const validateForm = useCallback(() => {
    const errors = {};
    
    editableColumns.forEach(column => {
      const value = formData[column.accessor];
      
      // Check required fields
      if (column.required && (!value || value.toString().trim() === '')) {
        errors[column.accessor] = `${column.header} is required`;
      }
      
      // Additional validation based on field type
      if (value && value.toString().trim() !== '') {
        if (column.accessor === 'email' && value) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            errors[column.accessor] = 'Please enter a valid email address';
          }
        }
        
        if (column.valueType === 'number' && value) {
          const numValue = Number(value);
          if (isNaN(numValue)) {
            errors[column.accessor] = `${column.header} must be a valid number`;
          }
        }
      }
    });

    // Special validation for neighborhood/city relationship
    if (formData.neighborhood_id && formData.city_id) {
      const selectedNeighborhood = neighborhoods.find(n => n.id === parseInt(formData.neighborhood_id));
      if (selectedNeighborhood && selectedNeighborhood.city_id !== parseInt(formData.city_id)) {
        errors.neighborhood_id = 'Selected neighborhood does not belong to the selected city';
      }
    }
    
    setFormErrors(errors);
    
    // Check if form is valid
    const hasRequiredFields = editableColumns.filter(col => col.required).length > 0;
    const requiredFieldsFilled = hasRequiredFields ? 
      editableColumns.filter(col => col.required).every(col => {
        const value = formData[col.accessor];
        return value && value.toString().trim() !== '';
      }) : true;
    
    const formValid = Object.keys(errors).length === 0 && requiredFieldsFilled;
    
    setIsFormValid(formValid);
    return formValid;
  }, [formData, editableColumns, neighborhoods]);
  
  // Validate form whenever formData changes
  useEffect(() => {
    validateForm();
  }, [formData, validateForm]);
  
  const handleFieldChange = useCallback((fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
    
    // Clear error for this field when user starts typing
    if (formErrors[fieldName]) {
      setFormErrors(prev => ({
        ...prev,
        [fieldName]: null
      }));
    }
  }, [formErrors]);

  // Handle Google Places selection for restaurant name
  const handlePlacesSelect = useCallback((placeData) => {
    console.log('[CreateForm] Places data received:', placeData);
    
    const updates = {};
    
    // Map data from PlacesAutocompleteInput format
    if (placeData.restaurantName || placeData.name) {
      updates.name = placeData.restaurantName || placeData.name;
    }
    
    if (placeData.address) {
      updates.address = placeData.address;
    }
    
    if (placeData.zipcode) {
      updates.zipcode = placeData.zipcode;
    }
    
    if (placeData.lat && placeData.lng) {
      updates.latitude = placeData.lat;
      updates.longitude = placeData.lng;
    }
    
    if (placeData.placeId) {
      updates.google_place_id = placeData.placeId;
    }
    
    // Try to match city from places data
    if (placeData.addressComponents && cities.length > 0) {
      // Look for city in address components
      const cityComponent = placeData.addressComponents.find(comp => 
        comp.types.includes('locality') || comp.types.includes('administrative_area_level_2')
      );
      
      if (cityComponent) {
        const matchingCity = cities.find(city => 
          city.name.toLowerCase().includes(cityComponent.long_name.toLowerCase()) ||
          cityComponent.long_name.toLowerCase().includes(city.name.toLowerCase())
        );
        if (matchingCity) {
          updates.city_id = matchingCity.id;
        }
      }
    }
    
    console.log('[CreateForm] Applying updates:', updates);
    
    setFormData(prev => ({
      ...prev,
      ...updates
    }));
  }, [cities]);
  
  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSave(formData);
    }
  }, [formData, onSave, validateForm]);
  
  const getFieldInputType = useCallback((column) => {
    if (column.accessor === 'email') return 'email';
    if (column.accessor === 'phone') return 'tel';
    if (column.accessor === 'website') return 'url';
    if (column.valueType === 'number') return 'number';
    if (column.valueType === 'boolean') return 'checkbox';
    if (column.valueType === 'date') return 'date';
    return 'text';
  }, []);
  
  const renderField = useCallback((column) => {
    const value = formData[column.accessor] || '';
    const hasError = formErrors[column.accessor];
    const baseClassName = `w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-150 ${
      hasError ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
    }`;

    // Special handling for restaurant name with Google Places autocomplete
    if (column.accessor === 'name' && resourceType === 'restaurants') {
      return (
        <div key={column.accessor}>
          <PlacesAutocompleteInput
            value={value}
            onChange={(value) => handleFieldChange(column.accessor, value)}
            onPlaceSelect={handlePlacesSelect}
            placeholder="Enter restaurant name or search..."
            className={hasError ? 'border-red-300 focus:ring-red-500' : ''}
            error={hasError ? formErrors[column.accessor] : null}
          />
          {!hasError && (
            <p className="mt-1 text-xs text-gray-500">
              Start typing to search Google Places for restaurant details
            </p>
          )}
        </div>
      );
    }
    
    if (column.accessor === 'city_id') {
      return (
        <div key={column.accessor}>
          <select
            name={column.accessor}
            value={value}
            onChange={(e) => handleFieldChange(column.accessor, e.target.value)}
            className={baseClassName}
            required={column.required}
            aria-label={`Select ${column.header}`}
          >
            <option value="">Select City</option>
            {cities.map(city => (
              <option key={city.id} value={city.id}>{city.name}</option>
            ))}
          </select>
          {hasError && <p className="mt-1 text-sm text-red-600">{hasError}</p>}
        </div>
      );
    }
    
    if (column.accessor === 'neighborhood_id') {
      const selectedCityId = formData.city_id;
      const availableNeighborhoods = selectedCityId ? filteredNeighborhoods : [];
      
      return (
        <div key={column.accessor}>
          <select
            name={column.accessor}
            value={value}
            onChange={(e) => handleFieldChange(column.accessor, e.target.value)}
            className={baseClassName}
            required={column.required}
            disabled={!selectedCityId}
            aria-label={`Select ${column.header}`}
          >
            <option value="">
              {!selectedCityId ? 'Select a city first' : 'Select Neighborhood'}
            </option>
            {availableNeighborhoods.map(neighborhood => (
              <option key={neighborhood.id} value={neighborhood.id}>
                {neighborhood.name}
              </option>
            ))}
          </select>
          {hasError && <p className="mt-1 text-sm text-red-600">{hasError}</p>}
          {selectedCityId && availableNeighborhoods.length === 0 && (
            <p className="mt-1 text-sm text-gray-500">
              No neighborhoods available for selected city
            </p>
          )}
        </div>
      );
    }
    
    if (column.valueType === 'boolean') {
      return (
        <div key={column.accessor}>
          <label className="flex items-center">
            <input
              type="checkbox"
              name={column.accessor}
              checked={value || false}
              onChange={(e) => handleFieldChange(column.accessor, e.target.checked)}
              className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700">{column.header}</span>
          </label>
        </div>
      );
    }
    
    if (column.valueType === 'select' && column.selectOptions) {
      const options = column.selectOptions(cities, neighborhoods);
      return (
        <div key={column.accessor}>
          <select
            name={column.accessor}
            value={value}
            onChange={(e) => handleFieldChange(column.accessor, e.target.value)}
            className={baseClassName}
            required={column.required}
            aria-label={`Select ${column.header}`}
          >
            <option value="">Select {column.header}</option>
            {options.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          {hasError && <p className="mt-1 text-sm text-red-600">{hasError}</p>}
        </div>
      );
    }
    
    if (column.type === 'textarea') {
      return (
        <div key={column.accessor}>
          <textarea
            name={column.accessor}
            value={value}
            onChange={(e) => handleFieldChange(column.accessor, e.target.value)}
            placeholder={`Enter ${column.header.toLowerCase()}`}
            rows={3}
            className={baseClassName}
            required={column.required}
            aria-label={column.header}
          />
          {hasError && <p className="mt-1 text-sm text-red-600">{hasError}</p>}
        </div>
      );
    }
    
    return (
      <div key={column.accessor}>
        <input
          type={getFieldInputType(column)}
          name={column.accessor}
          value={value}
          onChange={(e) => handleFieldChange(column.accessor, e.target.value)}
          placeholder={`Enter ${column.header.toLowerCase()}`}
          className={baseClassName}
          required={column.required}
          aria-label={column.header}
        />
        {hasError && <p className="mt-1 text-sm text-red-600">{hasError}</p>}
      </div>
    );
  }, [formData, formErrors, handleFieldChange, getFieldInputType, cities, filteredNeighborhoods, resourceType, handlePlacesSelect]);
  
  return (
    <tr className="bg-blue-50 border-l-4 border-l-blue-400">
      <td colSpan={columns.length} className="px-4 py-6">
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Add New {resourceType.slice(0, -1)}
            </h3>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-150"
              type="button"
              aria-label="Close form"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {editableColumns.map((column) => (
                <div key={column.accessor} className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    {column.header}
                    {column.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  {renderField(column)}
                </div>
              ))}
            </div>
            
            <div className="flex items-center justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-150"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-150"
                disabled={isLoading || !isFormValid}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4 mr-2 inline" />
                    Creating...
                  </>
                ) : (
                  'Create'
                )}
              </button>
            </div>
          </form>
        </div>
      </td>
    </tr>
  );
}; 