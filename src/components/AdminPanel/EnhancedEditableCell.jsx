/**
 * Enhanced Editable Cell Component
 * 
 * Provides improved inline editing with:
 * - Field-specific input types and validation
 * - Real-time error feedback
 * - Auto-save functionality
 * - Better UX with loading states
 * - Support for dropdowns, autocomplete, and custom field types
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Edit2, Check, X, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { enhancedAdminService } from '@/services/enhancedAdminService';

// Input components for different field types
const TextInput = ({ value, onChange, onBlur, onKeyDown, placeholder, className, autoFocus, error }) => (
  <input
    type="text"
    value={value || ''}
    onChange={(e) => onChange(e.target.value)}
    onBlur={onBlur}
    onKeyDown={onKeyDown}
    placeholder={placeholder}
    className={cn(
      "w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500",
      error ? "border-red-500" : "border-gray-300",
      className
    )}
    autoFocus={autoFocus}
  />
);

const NumberInput = ({ value, onChange, onBlur, onKeyDown, placeholder, className, autoFocus, error, min, max, step }) => (
  <input
    type="number"
    value={value || ''}
    onChange={(e) => onChange(e.target.value)}
    onBlur={onBlur}
    onKeyDown={onKeyDown}
    placeholder={placeholder}
    className={cn(
      "w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500",
      error ? "border-red-500" : "border-gray-300",
      className
    )}
    autoFocus={autoFocus}
    min={min}
    max={max}
    step={step}
  />
);

const SelectInput = ({ value, onChange, onBlur, onKeyDown, options, className, autoFocus, error }) => (
  <select
    value={value || ''}
    onChange={(e) => onChange(e.target.value)}
    onBlur={onBlur}
    onKeyDown={onKeyDown}
    className={cn(
      "w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500",
      error ? "border-red-500" : "border-gray-300",
      className
    )}
    autoFocus={autoFocus}
  >
    <option value="">Select...</option>
    {options.map((option) => (
      <option key={option.value} value={option.value}>
        {option.label}
      </option>
    ))}
  </select>
);

const BooleanInput = ({ value, onChange, onBlur, onKeyDown, className, autoFocus }) => (
  <select
    value={value ? 'true' : 'false'}
    onChange={(e) => onChange(e.target.value === 'true')}
    onBlur={onBlur}
    onKeyDown={onKeyDown}
    className={cn(
      "w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500",
      className
    )}
    autoFocus={autoFocus}
  >
    <option value="false">No</option>
    <option value="true">Yes</option>
  </select>
);

const TextAreaInput = ({ value, onChange, onBlur, onKeyDown, placeholder, className, autoFocus, error }) => (
  <textarea
    value={value || ''}
    onChange={(e) => onChange(e.target.value)}
    onBlur={onBlur}
    onKeyDown={onKeyDown}
    placeholder={placeholder}
    className={cn(
      "w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y min-h-[60px]",
      error ? "border-red-500" : "border-gray-300",
      className
    )}
    autoFocus={autoFocus}
    rows={2}
  />
);

/**
 * Enhanced Editable Cell Component
 */
export const EnhancedEditableCell = ({
  resourceType,
  rowId,
  fieldName,
  value: initialValue,
  columnConfig = {},
  cities = [],
  neighborhoods = [],
  onSave,
  onCancel,
  autoSave = true,
  disabled = false,
  className = ''
}) => {
  // State management
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(initialValue);
  const [isSaving, setIsSaving] = useState(false);
  const [validationError, setValidationError] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Refs
  const inputRef = useRef(null);
  const saveTimeoutRef = useRef(null);
  
  // Update local value when prop changes
  useEffect(() => {
    setCurrentValue(initialValue);
    setHasChanges(false);
    setValidationError(null);
  }, [initialValue]);
  
  // Field configuration
  const fieldType = useMemo(() => {
    if (columnConfig.valueType) return columnConfig.valueType;
    if (fieldName === 'email') return 'email';
    if (fieldName === 'phone') return 'phone';
    if (fieldName === 'website') return 'url';
    if (fieldName === 'price') return 'number';
    if (fieldName === 'description') return 'textarea';
    if (fieldName.includes('_id')) return 'select';
    if (fieldName.startsWith('is_')) return 'boolean';
    return 'text';
  }, [columnConfig.valueType, fieldName]);
  
  // Get select options
  const selectOptions = useMemo(() => {
    if (columnConfig.selectOptions) {
      if (typeof columnConfig.selectOptions === 'function') {
        return columnConfig.selectOptions(cities, neighborhoods);
      }
      return columnConfig.selectOptions;
    }
    
    // Default options for common fields
    if (fieldName === 'city_id') {
      return cities.map(city => ({ value: city.id, label: city.name }));
    }
    if (fieldName === 'neighborhood_id') {
      return neighborhoods.map(n => ({ value: n.id, label: n.name }));
    }
    if (fieldName === 'price_range') {
      return [
        { value: '$', label: '$' },
        { value: '$$', label: '$$' },
        { value: '$$$', label: '$$$' },
        { value: '$$$$', label: '$$$$' }
      ];
    }
    
    return [];
  }, [columnConfig.selectOptions, fieldName, cities, neighborhoods]);
  
  // Validation
  const validateValue = useCallback((val) => {
    const validation = enhancedAdminService.validateField(resourceType, fieldName, val);
    if (!validation.valid && validation.errors.length > 0) {
      setValidationError(validation.errors[0]); // Show first error
      return false;
    }
    setValidationError(null);
    return true;
  }, [resourceType, fieldName]);
  
  // Handle value change
  const handleValueChange = useCallback((newValue) => {
    setCurrentValue(newValue);
    setHasChanges(newValue !== initialValue);
    
    // Real-time validation
    if (newValue !== '') {
      validateValue(newValue);
    } else {
      setValidationError(null);
    }
    
    // Auto-save with debounce
    if (autoSave && newValue !== initialValue) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      saveTimeoutRef.current = setTimeout(() => {
        handleSave(newValue);
      }, 1000); // 1 second debounce
    }
  }, [initialValue, autoSave, validateValue]);
  
  // Save function
  const handleSave = useCallback(async (valueToSave = currentValue) => {
    if (valueToSave === initialValue) {
      setIsEditing(false);
      return;
    }
    
    if (!validateValue(valueToSave)) {
      return;
    }
    
    setIsSaving(true);
    
    try {
      await onSave(fieldName, valueToSave);
      setIsEditing(false);
      setHasChanges(false);
      toast.success(`${fieldName} updated successfully`);
    } catch (error) {
      console.error('Error saving field:', error);
      toast.error(`Failed to update ${fieldName}: ${error.message}`);
      setValidationError(error.message);
    } finally {
      setIsSaving(false);
    }
  }, [currentValue, initialValue, validateValue, onSave, fieldName]);
  
  // Cancel editing
  const handleCancel = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    setCurrentValue(initialValue);
    setIsEditing(false);
    setHasChanges(false);
    setValidationError(null);
    
    if (onCancel) {
      onCancel();
    }
  }, [initialValue, onCancel]);
  
  // Handle keyboard events
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && fieldType !== 'textarea') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  }, [handleSave, handleCancel, fieldType]);
  
  // Handle blur (when clicking away)
  const handleBlur = useCallback(() => {
    if (autoSave && hasChanges) {
      handleSave();
    } else if (!autoSave) {
      setIsEditing(false);
    }
  }, [autoSave, hasChanges, handleSave]);
  
  // Start editing
  const startEditing = useCallback(() => {
    if (disabled) return;
    setIsEditing(true);
    // Focus input after render
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  }, [disabled]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);
  
  // Format display value
  const displayValue = useMemo(() => {
    if (currentValue === null || currentValue === undefined) {
      return <span className="text-gray-400 italic">N/A</span>;
    }
    
    if (fieldType === 'boolean') {
      return currentValue ? 'Yes' : 'No';
    }
    
    if (fieldType === 'select' && selectOptions.length > 0) {
      const option = selectOptions.find(opt => opt.value === currentValue);
      return option ? option.label : currentValue;
    }
    
    if (fieldType === 'url' && currentValue) {
      return (
        <a 
          href={currentValue} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {currentValue}
        </a>
      );
    }
    
    return String(currentValue);
  }, [currentValue, fieldType, selectOptions]);
  
  // Render input based on field type
  const renderInput = () => {
    const commonProps = {
      value: currentValue,
      onChange: handleValueChange,
      onBlur: handleBlur,
      onKeyDown: handleKeyDown,
      className: "w-full",
      autoFocus: true,
      error: validationError
    };
    
    switch (fieldType) {
      case 'number':
        return (
          <NumberInput
            {...commonProps}
            min={columnConfig.min}
            max={columnConfig.max}
            step={columnConfig.step || 0.01}
            placeholder={`Enter ${fieldName}`}
          />
        );
        
      case 'email':
        return (
          <TextInput
            {...commonProps}
            placeholder="Enter email address"
          />
        );
        
      case 'url':
        return (
          <TextInput
            {...commonProps}
            placeholder="https://..."
          />
        );
        
      case 'phone':
        return (
          <TextInput
            {...commonProps}
            placeholder="Enter phone number"
          />
        );
        
      case 'textarea':
        return (
          <TextAreaInput
            {...commonProps}
            placeholder={`Enter ${fieldName}`}
          />
        );
        
      case 'select':
        return (
          <SelectInput
            {...commonProps}
            options={selectOptions}
          />
        );
        
      case 'boolean':
        return (
          <BooleanInput
            {...commonProps}
          />
        );
        
      default:
        return (
          <TextInput
            {...commonProps}
            placeholder={`Enter ${fieldName}`}
          />
        );
    }
  };
  
  if (isEditing) {
    return (
      <div className={cn("relative", className)} ref={inputRef}>
        {renderInput()}
        
        {/* Action buttons for non-auto-save mode */}
        {!autoSave && (
          <div className="flex items-center mt-1 space-x-1">
            <button
              onClick={() => handleSave()}
              disabled={isSaving || !!validationError}
              className="p-1 text-green-600 hover:bg-green-100 rounded"
              title="Save"
            >
              {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
            </button>
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="p-1 text-red-600 hover:bg-red-100 rounded"
              title="Cancel"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
        
        {/* Validation error */}
        {validationError && (
          <div className="flex items-center mt-1 text-xs text-red-600">
            <AlertCircle className="w-3 h-3 mr-1" />
            {validationError}
          </div>
        )}
        
        {/* Auto-save indicator */}
        {autoSave && isSaving && (
          <div className="absolute top-0 right-0 -mt-1 -mr-1">
            <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
          </div>
        )}
      </div>
    );
  }
  
  // Display mode
  return (
    <div
      className={cn(
        "group cursor-pointer p-1 rounded hover:bg-gray-50 min-h-[32px] flex items-center",
        disabled && "cursor-not-allowed opacity-50",
        hasChanges && "bg-yellow-50",
        className
      )}
      onClick={startEditing}
      title={disabled ? "Read-only field" : "Click to edit"}
    >
      <span className="flex-1">{displayValue}</span>
      
      {!disabled && (
        <Edit2 className="w-3 h-3 ml-2 opacity-0 group-hover:opacity-50 transition-opacity" />
      )}
      
      {hasChanges && (
        <div className="w-2 h-2 bg-yellow-500 rounded-full ml-1" title="Unsaved changes" />
      )}
    </div>
  );
};

export default EnhancedEditableCell; 