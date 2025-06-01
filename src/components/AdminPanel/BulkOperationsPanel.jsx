/**
 * Bulk Operations Panel Component
 * 
 * Provides advanced bulk operations for admin data management:
 * - Bulk import/export with CSV/JSON support
 * - Batch updates with field validation
 * - Data transformation and normalization
 * - Progress tracking and error handling
 * - Template downloads and format validation
 */

import React, { useState, useCallback, useRef } from 'react';
import { 
  Upload, 
  Download, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Settings,
  Play,
  Pause,
  RotateCcw,
  Eye,
  Filter,
  Plus,
  Trash2,
  Loader
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { enhancedAdminService } from '@/services/enhancedAdminService';
import { format } from 'date-fns';

// Operation types
const OPERATION_TYPES = {
  BULK_UPDATE: 'bulk_update',
  BULK_DELETE: 'bulk_delete',
  BULK_IMPORT: 'bulk_import',
  BULK_EXPORT: 'bulk_export',
  BULK_ADD: 'bulk_add'
};

// File formats
const FILE_FORMATS = {
  CSV: 'csv',
  JSON: 'json',
  XLSX: 'xlsx'
};

// Progress indicator component
const ProgressBar = ({ progress, status, message }) => (
  <div className="w-full">
    <div className="flex justify-between text-sm text-gray-600 mb-1">
      <span>{message}</span>
      <span>{Math.round(progress)}%</span>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div 
        className={cn(
          "h-2 rounded-full transition-all duration-300",
          status === 'success' && "bg-green-500",
          status === 'error' && "bg-red-500",
          status === 'warning' && "bg-yellow-500",
          status === 'processing' && "bg-blue-500"
        )}
        style={{ width: `${progress}%` }}
      />
    </div>
  </div>
);

// File drop zone component
const FileDropZone = ({ onFileSelect, acceptedTypes, isLoading }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);
  
  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);
  
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      onFileSelect(files[0]);
    }
  }, [onFileSelect]);
  
  const handleFileInput = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      onFileSelect(file);
    }
  }, [onFileSelect]);
  
  return (
    <div
      className={cn(
        "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
        isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300",
        isLoading && "opacity-50 pointer-events-none"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes}
        onChange={handleFileInput}
        className="hidden"
      />
      
      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      
      <div className="space-y-2">
        <p className="text-lg font-medium text-gray-900">
          Drop your file here, or{' '}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-blue-600 hover:text-blue-700 underline"
            disabled={isLoading}
          >
            browse
          </button>
        </p>
        <p className="text-sm text-gray-500">
          Supports {acceptedTypes.split(',').join(', ')} files up to 10MB
        </p>
      </div>
    </div>
  );
};

// Validation results component
const ValidationResults = ({ results, onContinue, onCancel, resourceType }) => {
  const [showInvalid, setShowInvalid] = useState(false);
  const [showWarnings, setShowWarnings] = useState(false);
  
  if (!results) return null;
  
  // Get field headers based on resource type
  const getFieldHeaders = (resourceType) => {
    switch (resourceType) {
      case 'restaurants':
        return ['Row', 'Name', 'Address', 'City', 'Phone', 'Status'];
      case 'dishes':
        return ['Row', 'Name', 'Description', 'Restaurant', 'Status'];
      case 'users':
        return ['Row', 'Email', 'Username', 'Full Name', 'Role', 'Status'];
      case 'locations':
        return ['Row', 'Name', 'Type', 'Parent', 'State/Country', 'Status'];
      case 'hashtags':
        return ['Row', 'Name', 'Category', 'Status'];
      case 'restaurant_chains':
        return ['Row', 'Name', 'Website', 'Description', 'Status'];
      default:
        return ['Row', 'Name', 'Field1', 'Field2', 'Status'];
    }
  };
  
  // Get field values based on resource type
  const getFieldValues = (item, resourceType) => {
    const resolved = item.resolved;
    switch (resourceType) {
      case 'restaurants':
        return [
          item.rowNumber,
          resolved.name,
          resolved.address,
          resolved.city,
          resolved.phone,
          '✅ Ready'
        ];
      case 'dishes':
        return [
          item.rowNumber,
          resolved.name,
          resolved.description,
          resolved.restaurant_id,
          '✅ Ready'
        ];
      case 'users':
        return [
          item.rowNumber,
          resolved.email,
          resolved.username,
          resolved.full_name,
          resolved.role,
          '✅ Ready'
        ];
      case 'locations':
        return [
          item.rowNumber,
          resolved.name,
          resolved.location_type,
          resolved.parent_id,
          resolved.state_code,
          '✅ Ready'
        ];
      case 'hashtags':
        return [
          item.rowNumber,
          resolved.name,
          resolved.category,
          '✅ Ready'
        ];
      case 'restaurant_chains':
        return [
          item.rowNumber,
          resolved.name,
          resolved.website,
          resolved.description,
          '✅ Ready'
        ];
      default:
        return [
          item.rowNumber,
          resolved.name || 'N/A',
          'N/A',
          'N/A',
          '✅ Ready'
        ];
    }
  };
  
  const fieldHeaders = getFieldHeaders(resourceType);
  
  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">Validation Summary</h4>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{results.valid.length}</div>
            <div className="text-gray-600">Valid Records</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{results.invalid.length}</div>
            <div className="text-gray-600">Invalid Records</div>
        </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{results.warnings.length}</div>
            <div className="text-gray-600">Warnings</div>
          </div>
        </div>
        </div>
        
      {/* Valid Records Preview */}
      {results.valid.length > 0 && (
        <div className="border border-green-200 rounded-lg">
          <div className="bg-green-50 p-3 border-b border-green-200">
            <h5 className="font-medium text-green-800">
              ✅ {results.valid.length} Valid Records (Ready to Create)
            </h5>
          </div>
          <div className="p-4">
            <div className="overflow-x-auto max-h-64">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="border-b">
                    {fieldHeaders.map((header, index) => (
                      <th key={index} className="text-left p-2">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.valid.slice(0, 10).map((item) => {
                    const values = getFieldValues(item, resourceType);
                    return (
                      <tr key={item.rowNumber} className="border-b hover:bg-gray-50">
                        {values.map((value, index) => (
                          <td key={index} className={cn(
                            "p-2",
                            index === 1 && "font-medium", // Make name field bold
                            index === values.length - 1 && "text-green-600" // Make status green
                          )}>
                            {value}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {results.valid.length > 10 && (
                <p className="text-xs text-gray-500 mt-2">
                  Showing first 10 of {results.valid.length} valid records...
                </p>
              )}
        </div>
      </div>
        </div>
      )}
      
      {/* Invalid Records */}
      {results.invalid.length > 0 && (
        <div className="border border-red-200 rounded-lg">
          <div className="bg-red-50 p-3 border-b border-red-200">
            <button
              onClick={() => setShowInvalid(!showInvalid)}
              className="flex items-center justify-between w-full text-left"
            >
              <h5 className="font-medium text-red-800">
                ❌ {results.invalid.length} Invalid Records
              </h5>
              <span className="text-red-600">
                {showInvalid ? '▼' : '▶'}
              </span>
            </button>
          </div>
          {showInvalid && (
            <div className="p-4">
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {results.invalid.map((item) => (
                  <div key={item.rowNumber} className="p-2 bg-red-50 rounded text-xs">
                    <div className="font-medium text-red-800">
                      Row {item.rowNumber}: {item.original.name || 'Unnamed'}
                    </div>
                    <div className="text-red-600 mt-1">
                      {item.errors.join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Warnings */}
      {results.warnings.length > 0 && (
        <div className="border border-yellow-200 rounded-lg">
          <div className="bg-yellow-50 p-3 border-b border-yellow-200">
            <button
              onClick={() => setShowWarnings(!showWarnings)}
              className="flex items-center justify-between w-full text-left"
            >
              <h5 className="font-medium text-yellow-800">
                ⚠️ {results.warnings.length} Warnings
              </h5>
              <span className="text-yellow-600">
                {showWarnings ? '▼' : '▶'}
              </span>
            </button>
          </div>
          {showWarnings && (
            <div className="p-4">
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {results.warnings.map((item, index) => (
                  <div key={index} className="p-2 bg-yellow-50 rounded text-xs">
                    <div className="font-medium text-yellow-800">
                      Row {item.rowNumber}: {item.original.name || 'Unnamed'}
                    </div>
                    <div className="text-yellow-600 mt-1">
                      {item.warnings.join(', ')}
                    </div>
              </div>
            ))}
          </div>
            </div>
          )}
        </div>
      )}
      
      {/* Action Buttons */}
      <div className="flex justify-between pt-4 border-t">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
        
        <div className="space-x-3">
          {results.valid.length > 0 && (
        <button
              onClick={() => onContinue(results.valid)}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
              Create {results.valid.length} Valid Records
        </button>
          )}
        </div>
      </div>
    </div>
  );
};

const FORMATTING_INSTRUCTIONS = {
  restaurants: {
    title: "Restaurant Data Format",
    description: "Each restaurant should be an object with the following fields:",
    requiredFields: ["name"],
    optionalFields: ["description", "cuisine", "location", "city_name", "neighborhood_name", "hashtags"],
    example: {
      name: "Restaurant Name",
      description: "Brief description of the restaurant",
      cuisine: "Italian",
      location: "123 Main St",
      city_name: "New York",
      neighborhood_name: "Manhattan",
      hashtags: ["italian", "fine-dining"]
    },
    tips: [
      "Restaurant name is required",
      "Hashtags should be an array of strings",
      "All other fields are optional"
    ]
  },
  dishes: {
    title: "Dish Data Format", 
    description: "Each dish should be an object with the following fields:",
    requiredFields: ["name"],
    optionalFields: ["description", "cuisine", "restaurant_id", "hashtags"],
    example: {
      name: "Dish Name",
      description: "Brief description of the dish",
      cuisine: "Italian",
      restaurant_id: 123,
      hashtags: ["pasta", "vegetarian"]
    },
    tips: [
      "Dish name is required",
      "restaurant_id should be a valid restaurant ID number",
      "Hashtags should be an array of strings"
    ]
  },
  lists: {
    title: "List Data Format",
    description: "Each list should be an object with the following fields:",
    requiredFields: ["name"],
    optionalFields: ["description", "list_type", "city_name", "tags", "is_public", "creator_handle", "user_id"],
    example: {
      name: "Best Pizza Places",
      description: "My favorite pizza spots in the city",
      list_type: "restaurant",
      city_name: "New York",
      tags: ["pizza", "casual"],
      is_public: true,
      creator_handle: "foodie123",
      user_id: 456
    },
    tips: [
      "List name is required",
      "list_type must be 'restaurant', 'dish', or 'mixed'",
      "is_public should be true or false",
      "tags should be an array of strings",
      "user_id should be a valid user ID number"
    ]
  },
  users: {
    title: "User Data Format",
    description: "Each user should be an object with the following fields:",
    requiredFields: ["username", "email"],
    optionalFields: ["role"],
    example: {
      username: "johndoe",
      email: "john@example.com", 
      role: "user"
    },
    tips: [
      "Username and email are required",
      "Role must be 'user', 'admin', or 'superuser'"
    ]
  },
  cities: {
    title: "City Data Format",
    description: "Add cities with geographic information",
    fields: [
      { name: "name", required: true, description: "City name", example: "New York" },
      { name: "state", required: false, description: "State/province", example: "NY" },
      { name: "country", required: false, description: "Country name", example: "USA" }
    ],
    format: "name, state, country",
    examples: [
      "New York, NY, USA",
      "Los Angeles, CA, USA",
      "Toronto, ON, Canada"
    ],
    tips: [
      "City name is required",
      "State can be abbreviated (NY) or full name (New York)",
      "Country defaults to USA if not specified",
      "City names should be unique within the same state"
    ]
  },
  neighborhoods: {
    title: "Neighborhood Data Format",
    description: "Add neighborhoods within cities",
    fields: [
      { name: "name", required: true, description: "Neighborhood name", example: "Manhattan" },
      { name: "city_id", required: true, description: "City ID number", example: "1" },
      { name: "zip_code", required: false, description: "ZIP/postal code", example: "10001" }
    ],
    format: "name, city_id, zip_code",
    examples: [
      "Manhattan, 1, 10001",
      "Brooklyn, 1, 11201",
      "Williamsburg, 1, 11211"
    ],
    tips: [
      "Name and city_id are required",
      "City ID must exist in the cities table",
      "ZIP code can be empty but helps with accuracy",
      "Neighborhood names should be unique within the same city"
    ]
  },
  hashtags: {
    title: "Hashtag Data Format",
    description: "Each hashtag should be an object with the following fields:",
    requiredFields: ["name"],
    optionalFields: [],
    example: {
      name: "italian"
    },
    tips: [
      "Hashtag name is required",
      "Names should be lowercase with no spaces"
    ]
  },
  restaurant_chains: {
    title: "Restaurant Chain Data Format",
    description: "Each restaurant chain should be an object with the following fields:",
    requiredFields: ["name"],
    optionalFields: ["description", "website"],
    example: {
      name: "Chain Name",
      description: "Brief description of the chain",
      website: "https://example.com"
    },
    tips: [
      "Chain name is required",
      "Website should include http:// or https://",
      "Description is optional"
    ]
  },
  locations: {
    title: "Location Data Format",
    description: "Add cities, boroughs, and neighborhoods in hierarchical structure",
    fields: [
      { name: "name", required: true, description: "Location name", example: "Manhattan" },
      { name: "location_type", required: true, description: "Type: city, borough, neighborhood", example: "borough" },
      { name: "city_id", required: false, description: "City ID (for boroughs/neighborhoods)", example: "1" },
      { name: "parent_id", required: false, description: "Parent location ID (for sub-locations)", example: "2" },
      { name: "zip_code", required: false, description: "ZIP/postal code", example: "10001" },
      { name: "state_code", required: false, description: "State code (for cities)", example: "NY" },
      { name: "country_code", required: false, description: "Country code (for cities)", example: "US" }
    ],
    format: "name, location_type, city_id, parent_id, zip_code, state_code, country_code",
    examples: [
      "New York, city, , , , NY, US",
      "Manhattan, borough, 1, , 10001, , ",
      "Williamsburg, neighborhood, 1, 2, 11211, , "
    ],
    tips: [
      "Name and location_type are required",
      "For cities: use state_code and country_code, leave city_id and parent_id empty",
      "For boroughs: use city_id, leave parent_id empty unless it's a sub-borough",
      "For neighborhoods: use city_id and optionally parent_id if under a borough",
      "Valid location types: city, borough, neighborhood, district, area, zone",
      "ZIP code helps with address resolution",
      "Leave fields empty but keep commas for missing data"
    ]
  }
};

/**
 * Bulk Operations Panel Component
 */
export const BulkOperationsPanel = ({ 
  resourceType, 
  selectedRows = new Set(), 
  onOperationComplete,
  adminData = {}
}) => {
  const [activeOperation, setActiveOperation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [validationResults, setValidationResults] = useState(null);
  const [operationHistory, setOperationHistory] = useState([]);
  const [bulkUpdateFields, setBulkUpdateFields] = useState({});
  const [bulkAddText, setBulkAddText] = useState('');
  const bulkAddFileInputRef = useRef(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  
  // NEW: State for the 3-phase bulk add flow
  const [bulkAddPhase, setBulkAddPhase] = useState('input'); // 'input', 'validation', 'execution'
  const [validatedData, setValidatedData] = useState(null);
  
  // Handle file upload and validation
  const handleFileUpload = useCallback(async (file) => {
    setIsLoading(true);
    setProgress(0);
    
    try {
      // Simulate file processing
      setProgress(25);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('resourceType', resourceType);
      
      setProgress(50);
      
      // Validate the file content
      const validation = await enhancedAdminService.validateImportData(resourceType, formData);
      
      setProgress(75);
      setValidationResults(validation);
      setProgress(100);
      
      toast.success('File validated successfully');
    } catch (error) {
      console.error('File upload error:', error);
      toast.error(`File upload failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [resourceType]);
  
  // Handle bulk import
  const handleBulkImport = useCallback(async () => {
    if (!validationResults) return;
    
    setIsLoading(true);
    setProgress(0);
    
    try {
      const result = await enhancedAdminService.bulkImport(
        resourceType, 
        validationResults.valid,
        (progress) => setProgress(progress)
      );
      
      // Add to operation history
      setOperationHistory(prev => [...prev, {
        id: Date.now(),
        type: OPERATION_TYPES.BULK_IMPORT,
        timestamp: new Date(),
        success: result.success,
        failed: result.failed,
        total: result.total
      }]);
      
      toast.success(`Import completed: ${result.success} success, ${result.failed} failed`);
      setValidationResults(null);
      setActiveOperation(null);
      onOperationComplete?.();
      
    } catch (error) {
      console.error('Bulk import error:', error);
      toast.error(`Bulk import failed: ${error.message}`);
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  }, [resourceType, validationResults, onOperationComplete]);
  
  // Handle bulk export
  const handleBulkExport = useCallback(async (format = FILE_FORMATS.CSV) => {
    setIsLoading(true);
    setProgress(0);
    
    try {
      const data = adminData[resourceType] || [];
      setProgress(25);
      
      let content, mimeType, fileExtension;
      
      if (format === FILE_FORMATS.CSV) {
        content = convertToCSV(data);
        mimeType = 'text/csv';
        fileExtension = 'csv';
      } else if (format === FILE_FORMATS.JSON) {
        content = JSON.stringify(data, null, 2);
        mimeType = 'application/json';
        fileExtension = 'json';
      }
      
      setProgress(75);
      
      // Download file
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${resourceType}-export-${format(new Date(), 'yyyy-MM-dd')}.${fileExtension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setProgress(100);
      
      // Add to operation history
      setOperationHistory(prev => [...prev, {
        id: Date.now(),
        type: OPERATION_TYPES.BULK_EXPORT,
        timestamp: new Date(),
        format,
        records: data.length
      }]);
      
      toast.success(`Exported ${data.length} records as ${format.toUpperCase()}`);
      
    } catch (error) {
      console.error('Export error:', error);
      toast.error(`Export failed: ${error.message}`);
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  }, [resourceType, adminData]);
  
  // Handle bulk update
  const handleBulkUpdate = useCallback(async () => {
    if (selectedRows.size === 0 || Object.keys(bulkUpdateFields).length === 0) {
      toast.error('Select rows and fields to update');
      return;
    }
    
    setIsLoading(true);
    setProgress(0);
    
    try {
      const updates = Array.from(selectedRows).map(id => ({
        id,
        ...bulkUpdateFields
      }));
      
      const result = await enhancedAdminService.batchUpdate(
        resourceType,
        updates,
        (progress) => setProgress(progress)
      );
      
      // Add to operation history
      setOperationHistory(prev => [...prev, {
        id: Date.now(),
        type: OPERATION_TYPES.BULK_UPDATE,
        timestamp: new Date(),
        records: selectedRows.size,
        fields: Object.keys(bulkUpdateFields)
      }]);
      
      toast.success(`Updated ${selectedRows.size} records`);
      setBulkUpdateFields({});
      setActiveOperation(null);
      onOperationComplete?.();
      
    } catch (error) {
      console.error('Bulk update error:', error);
      toast.error(`Bulk update failed: ${error.message}`);
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  }, [resourceType, selectedRows, bulkUpdateFields, onOperationComplete]);
  
  // Handle bulk delete
  const handleBulkDelete = useCallback(async () => {
    if (selectedRows.size === 0) {
      toast.error('No rows selected for deletion');
      return;
    }
    
    setIsLoading(true);
    setProgress(0);
    
    try {
      const ids = Array.from(selectedRows);
      const result = await enhancedAdminService.bulkDelete(
        resourceType,
        ids,
        (progress) => setProgress(progress)
      );
      
      // Add to operation history
      setOperationHistory(prev => [...prev, {
        id: Date.now(),
        type: OPERATION_TYPES.BULK_DELETE,
        timestamp: new Date(),
        records: selectedRows.size,
        success: result.success,
        failed: result.failed
      }]);
      
      toast.success(`Deleted ${result.success} records, ${result.failed} failed`);
      setActiveOperation(null);
      onOperationComplete?.();
      
    } catch (error) {
      console.error('Bulk delete error:', error);
      toast.error(`Bulk delete failed: ${error.message}`);
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  }, [resourceType, selectedRows, onOperationComplete]);
  
  // Convert data to CSV
  const convertToCSV = (data) => {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          const stringValue = value === null || value === undefined ? '' : String(value);
          return stringValue.includes(',') ? `"${stringValue}"` : stringValue;
        }).join(',')
      )
    ].join('\n');
    
    return csvContent;
  };
  
  // Download template
  const handleDownloadTemplate = useCallback(() => {
    const templateData = getTemplateData(resourceType);
    const csv = convertToCSV([templateData]);
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${resourceType}-template.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Template downloaded');
  }, [resourceType]);
  
  // Get template data structure
  const getTemplateData = (resourceType) => {
    const templates = {
      restaurants: {
        name: 'Restaurant Name',
        phone: '+1234567890',
        website: 'https://example.com',
        address: '123 Main St',
        city: 'New York',
        price_range: '$$'
      },
      dishes: {
        name: 'Dish Name',
        price: '15.99',
        description: 'Dish description',
        restaurant_id: '1'
      },
      users: {
        email: 'user@example.com',
        username: 'username',
        full_name: 'John Doe'
      },
      locations: {
        name: 'Location Name',
        location_type: 'neighborhood',
        city_id: '1',
        parent_id: '',
        zip_code: '10001'
      },
      hashtags: {
        name: 'hashtag_name'
      },
      restaurant_chains: {
        name: 'Chain Name',
        website: 'https://chain.com',
        description: 'Chain description'
      }
    };
    
    return templates[resourceType] || {};
  };
  
  // Get format example for resource type
  const getFormatExample = (resourceType) => {
    const formats = {
      restaurants: 'Restaurant Name, Address, City, State, ZIP',
      dishes: 'Dish Name, Price, Description, Restaurant ID',
      users: 'Email, Username, Full Name',
      locations: 'Location Name, Type (city/borough/neighborhood), City ID, Parent ID, ZIP',
      hashtags: 'Hashtag Name (without #)',
      restaurant_chains: 'Chain Name, Website, Description'
    };
    
    return formats[resourceType] || 'Name, Field1, Field2';
  };
  
  // Get example data for resource type
  const getExampleData = (resourceType) => {
    const examples = {
      restaurants: "Joe's Pizza, 123 Main St, New York, NY, 10001",
      dishes: 'Margherita Pizza, 12.99, Classic tomato and mozzarella, 1',
      users: 'john@example.com, johndoe, John Doe',
      locations: 'Manhattan, borough, 1, , 10001',
      hashtags: 'italian_food',
      restaurant_chains: 'Pizza Express, https://pizzaexpress.com, Italian pizza chain'
    };
    
    return examples[resourceType] || 'Example, Data, Here';
  };
  
  // Get placeholder text for resource type
  const getPlaceholderText = (resourceType) => {
    const placeholders = {
      restaurants: "Restaurant Name, Address, City, State, ZIP\nAnother Restaurant, 456 Oak Ave, Brooklyn, NY, 11201\nThird Place, 789 Pine St, Queens, NY, 11373",
      dishes: "Dish Name, Description, Restaurant ID\nCheese Pizza, Classic cheese pizza, 1\nCaesar Salad, Fresh romaine with caesar dressing, 1",
      users: "Email, Username, Full Name\nuser1@example.com, user1, User One\nuser2@example.com, user2, User Two",
      locations: "Location Name, Type, City ID, Parent ID, ZIP Code\nManhattan, borough, 1, , 10001\nWilliamsburg, neighborhood, 1, 2, 11211\nQueens, borough, 1, , 11373",
      hashtags: "Hashtag Name\nitalian_food\nmexican_cuisine\nvegan_options",
      restaurant_chains: "Chain Name, Website, Description\nPizza Express, https://pizzaexpress.com, Italian pizza chain\nBurger King, https://burgerking.com, Fast food chain"
    };
    
    return placeholders[resourceType] || "Name, Field1, Field2\nExample 1, Value 1, Value 2\nExample 2, Value 3, Value 4";
  };
  
  // Get comprehensive formatting instructions for each resource type
  const getFormatInstructions = (resourceType) => {
    const instructions = {
      restaurants: {
        title: "Restaurant Data Format",
        description: "Add restaurants with location and contact information",
        fields: [
          { name: "name", required: true, description: "Restaurant name", example: "Joe's Pizza" },
          { name: "address", required: true, description: "Street address", example: "123 Main Street" },
          { name: "city", required: true, description: "City name", example: "New York" },
          { name: "neighborhood", required: false, description: "Neighborhood name", example: "Manhattan" },
          { name: "zip", required: false, description: "ZIP/postal code", example: "10001" },
          { name: "phone", required: false, description: "Phone number", example: "555-123-4567" },
          { name: "website", required: false, description: "Website URL", example: "https://joespizza.com" }
        ],
        format: "name, address, city, neighborhood, zip, phone, website",
        examples: [
          "Joe's Pizza, 123 Main St, New York, Manhattan, 10001, 555-123-4567, https://joespizza.com",
          "Burger Palace, 456 Oak Ave, Brooklyn, Williamsburg, 11211, 555-987-6543, ",
          "Fine Dining Restaurant, 789 Park Ave, Queens, Astoria, 11103, 555-555-5555, https://finedining.com"
        ],
        tips: [
          "Name and address are required fields",
          "Leave empty fields blank but keep commas: 'Restaurant, Address, City, , , Phone, ,'",
          "Website should include http:// or https://",
          "Phone numbers can be in any format"
        ]
      },
      dishes: {
        title: "Dish Data Format",
        description: "Add dishes with restaurant association",
        fields: [
          { name: "name", required: true, description: "Dish name", example: "Margherita Pizza" },
          { name: "description", required: false, description: "Dish description", example: "Classic tomato and mozzarella" },
          { name: "restaurant_id", required: true, description: "Restaurant ID number", example: "1" }
        ],
        format: "name, description, restaurant_id",
        examples: [
          "Margherita Pizza, Classic tomato and mozzarella pizza, 1",
          "Caesar Salad, Fresh romaine with caesar dressing, 1",
          "Chocolate Cake, , 2"
        ],
        tips: [
          "Name and restaurant_id are required",
          "Restaurant ID must exist in the restaurants table",
          "Description can be left empty"
        ]
      },
      users: {
        title: "User Data Format",
        description: "Add user accounts with authentication details",
        fields: [
          { name: "email", required: true, description: "Email address", example: "user@example.com" },
          { name: "username", required: true, description: "Unique username", example: "johndoe" },
          { name: "full_name", required: false, description: "Full display name", example: "John Doe" },
          { name: "role", required: false, description: "User role (user, admin, superuser)", example: "user" }
        ],
        format: "email, username, full_name, role",
        examples: [
          "john@example.com, johndoe, John Doe, user",
          "admin@company.com, admin123, Admin User, admin",
          "jane@test.com, jane_smith, Jane Smith, "
        ],
        tips: [
          "Email and username are required and must be unique",
          "Email must be valid format (user@domain.com)",
          "Username cannot contain spaces or special characters",
          "Role defaults to 'user' if not specified",
          "Valid roles: user, admin, superuser"
        ]
      },
      cities: {
        title: "City Data Format",
        description: "Add cities with geographic information",
        fields: [
          { name: "name", required: true, description: "City name", example: "New York" },
          { name: "state", required: false, description: "State/province", example: "NY" },
          { name: "country", required: false, description: "Country name", example: "USA" }
        ],
        format: "name, state, country",
        examples: [
          "New York, NY, USA",
          "Los Angeles, CA, USA",
          "Toronto, ON, Canada"
        ],
        tips: [
          "City name is required",
          "State can be abbreviated (NY) or full name (New York)",
          "Country defaults to USA if not specified",
          "City names should be unique within the same state"
        ]
      },
      neighborhoods: {
        title: "Neighborhood Data Format",
        description: "Add neighborhoods within cities",
        fields: [
          { name: "name", required: true, description: "Neighborhood name", example: "Manhattan" },
          { name: "city_id", required: true, description: "City ID number", example: "1" },
          { name: "zip_code", required: false, description: "ZIP/postal code", example: "10001" }
        ],
        format: "name, city_id, zip_code",
        examples: [
          "Manhattan, 1, 10001",
          "Brooklyn, 1, 11201",
          "Williamsburg, 1, 11211"
        ],
        tips: [
          "Name and city_id are required",
          "City ID must exist in the cities table",
          "ZIP code can be empty but helps with accuracy",
          "Neighborhood names should be unique within the same city"
        ]
      },
      hashtags: {
        title: "Hashtag Data Format",
        description: "Add hashtags for categorizing content",
        fields: [
          { name: "name", required: true, description: "Hashtag name (without #)", example: "italian_food" },
          { name: "category", required: false, description: "Hashtag category", example: "cuisine" }
        ],
        format: "name, category",
        examples: [
          "italian_food, cuisine",
          "vegan_options, dietary",
          "outdoor_seating, amenity"
        ],
        tips: [
          "Hashtag name is required",
          "Do not include the # symbol in the name",
          "Use underscores instead of spaces (italian_food, not italian food)",
          "Category helps organize hashtags but is optional",
          "Names should be unique and descriptive"
        ]
      },
      restaurant_chains: {
        title: "Restaurant Chain Data Format",
        description: "Add restaurant chains and franchises",
        fields: [
          { name: "name", required: true, description: "Chain name", example: "Pizza Express" },
          { name: "website", required: false, description: "Official website", example: "https://pizzaexpress.com" },
          { name: "description", required: false, description: "Chain description", example: "Italian pizza chain" }
        ],
        format: "name, website, description",
        examples: [
          "Pizza Express, https://pizzaexpress.com, Italian pizza chain",
          "Burger King, https://burgerking.com, Fast food burger chain",
          "Local Chain, , Small regional chain"
        ],
        tips: [
          "Chain name is required and should be unique",
          "Website should include http:// or https://",
          "Description helps identify the chain type",
          "Leave fields empty but keep commas for missing data"
        ]
      },
      locations: {
        title: "Location Data Format",
        description: "Add cities, boroughs, and neighborhoods in hierarchical structure",
        fields: [
          { name: "name", required: true, description: "Location name", example: "Manhattan" },
          { name: "location_type", required: true, description: "Type: city, borough, neighborhood", example: "borough" },
          { name: "city_id", required: false, description: "City ID (for boroughs/neighborhoods)", example: "1" },
          { name: "parent_id", required: false, description: "Parent location ID (for sub-locations)", example: "2" },
          { name: "zip_code", required: false, description: "ZIP/postal code", example: "10001" },
          { name: "state_code", required: false, description: "State code (for cities)", example: "NY" },
          { name: "country_code", required: false, description: "Country code (for cities)", example: "US" }
        ],
        format: "name, location_type, city_id, parent_id, zip_code, state_code, country_code",
        examples: [
          "New York, city, , , , NY, US",
          "Manhattan, borough, 1, , 10001, , ",
          "Williamsburg, neighborhood, 1, 2, 11211, , "
        ],
        tips: [
          "Name and location_type are required",
          "For cities: use state_code and country_code, leave city_id and parent_id empty",
          "For boroughs: use city_id, leave parent_id empty unless it's a sub-borough",
          "For neighborhoods: use city_id and optionally parent_id if under a borough",
          "Valid location types: city, borough, neighborhood, district, area, zone",
          "ZIP code helps with address resolution",
          "Leave fields empty but keep commas for missing data"
        ]
      }
    };
    
    return instructions[resourceType] || {
      title: "Data Format",
      description: "Add data records",
      fields: [{ name: "name", required: true, description: "Record name", example: "Example" }],
      format: "name, field1, field2",
      examples: ["Example, Value1, Value2"],
      tips: ["Please refer to documentation for specific format requirements"]
    };
  };
  
  // Handle bulk add from text input
  const handleBulkAddText = useCallback(async (e) => {
    e.preventDefault();
    if (!bulkAddText.trim()) return;
    
    setIsLoading(true);
    setProgress(0);
    
    try {
      // Phase 1: Parse text input based on resource type
      const lines = bulkAddText.trim().split('\n').filter(line => line.trim());
      let data = [];
      
      lines.forEach(line => {
        const fields = line.split(',').map(s => s?.trim());
        
        switch (resourceType) {
          case 'restaurants':
            if (fields.length >= 2) {
              data.push({
                name: fields[0],
                address: fields[1],
                city: fields[2] || '',
                neighborhood: fields[3] || '',
                zip: fields[4] || '',
                phone: fields[5] || '',
                website: fields[6] || ''
              });
            }
            break;
            
          case 'dishes':
            if (fields.length >= 2) {
              data.push({
                name: fields[0],
                description: fields[1] || '',
                restaurant_id: fields[2] || ''
              });
            }
            break;
            
          case 'users':
            if (fields.length >= 2) {
              data.push({
                email: fields[0],
                username: fields[1],
                full_name: fields[2] || '',
                role: fields[3] || 'user'
              });
            }
            break;
            
          case 'cities':
            if (fields.length >= 1) {
              data.push({
                name: fields[0],
                state: fields[1] || '',
                country: fields[2] || 'USA'
              });
            }
            break;
            
          case 'neighborhoods':
            if (fields.length >= 1) {
              data.push({
                name: fields[0],
                city_id: fields[1] || '',
                zip_code: fields[2] || ''
              });
            }
            break;
            
          case 'hashtags':
            if (fields.length >= 1) {
              data.push({
                name: fields[0].replace(/^#/, ''), // Remove # if present
                category: fields[1] || 'general'
              });
            }
            break;
            
          case 'restaurant_chains':
            if (fields.length >= 1) {
              data.push({
                name: fields[0],
                website: fields[1] || '',
                description: fields[2] || ''
              });
            }
            break;
            
          default:
            // Generic parsing for unknown resource types
            if (fields.length >= 1) {
              data.push({
                name: fields[0],
                ...fields.slice(1).reduce((acc, field, index) => {
                  acc[`field_${index + 1}`] = field;
                  return acc;
                }, {})
              });
            }
        }
      });
      
      // Filter out empty entries
      data = data.filter(item => item.name && item.name.trim());
      
      if (data.length === 0) {
        toast.error('No valid data found to process');
        return;
      }
      
      // Phase 2: Validate and resolve data
      setBulkAddPhase('validation');
      setProgress(0);
      
      const validationResult = await enhancedAdminService.bulkValidateResources(
        resourceType,
        data,
        (progressInfo) => {
          if (progressInfo.total > 0) {
            setProgress((progressInfo.completed / progressInfo.total) * 100);
          }
        }
      );
      
      setValidationResults(validationResult);
      setBulkAddPhase('validation');
      setProgress(100);
      
    } catch (error) {
      console.error('Bulk validation error:', error);
      toast.error(`Bulk validation failed: ${error.message}`);
      setBulkAddPhase('input');
    } finally {
      setIsLoading(false);
    }
  }, [resourceType, bulkAddText]);
  
  // Handle confirmation and execution of validated data
  const handleConfirmAndExecute = useCallback(async (validRecords) => {
      setIsLoading(true);
      setProgress(0);
    setBulkAddPhase('execution');
    
    try {
      // Phase 3: Execute creation with pre-validated data
      // Extract resolved data for creation
      const recordsToCreate = validRecords.map(record => record.resolved);
      
      const result = await enhancedAdminService.bulkAddResources(
          resourceType,
        recordsToCreate,
        (progressInfo) => {
          if (typeof progressInfo === 'number') {
            setProgress(progressInfo);
          } else if (progressInfo.total > 0) {
            setProgress((progressInfo.completed / progressInfo.total) * 100);
          }
        }
        );
        
        // Add to operation history
        setOperationHistory(prev => [...prev, {
          id: Date.now(),
          type: OPERATION_TYPES.BULK_ADD,
          timestamp: new Date(),
        records: recordsToCreate.length,
          success: result.success,
          failed: result.failed
        }]);
        
      toast.success(`Created ${result.success} records, ${result.failed} failed`);
      
      // Reset state
        setBulkAddText('');
      setValidationResults(null);
      setValidatedData(null);
      setBulkAddPhase('input');
        setActiveOperation(null);
        onOperationComplete?.();
        
      } catch (error) {
      console.error('Bulk execution error:', error);
      toast.error(`Bulk execution failed: ${error.message}`);
      setBulkAddPhase('validation'); // Go back to validation view
      } finally {
        setIsLoading(false);
        setProgress(0);
    }
  }, [resourceType, onOperationComplete]);
  
  // Handle cancel from validation
  const handleCancelValidation = useCallback(() => {
    setValidationResults(null);
    setValidatedData(null);
    setBulkAddPhase('input');
    setIsLoading(false);
    setProgress(0);
  }, []);
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Bulk Operations</h3>
          <p className="text-sm text-gray-600">
            Import, export, and batch update {resourceType} data
          </p>
        </div>
        
        {selectedRows.size > 0 && (
          <div className="text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
            {selectedRows.size} rows selected
          </div>
        )}
      </div>
      
      {/* Operation Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <button
          onClick={() => setActiveOperation(OPERATION_TYPES.BULK_IMPORT)}
          disabled={isLoading}
          className="flex items-center justify-center space-x-2 p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Upload className="w-5 h-5 text-blue-600" />
          <span>Import Data</span>
        </button>
        
        <button
          onClick={() => handleBulkExport(FILE_FORMATS.CSV)}
          disabled={isLoading}
          className="flex items-center justify-center space-x-2 p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Download className="w-5 h-5 text-green-600" />
          <span>Export CSV</span>
        </button>
        
        <button
          onClick={() => setActiveOperation(OPERATION_TYPES.BULK_UPDATE)}
          disabled={isLoading || selectedRows.size === 0}
          className="flex items-center justify-center space-x-2 p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <Settings className="w-5 h-5 text-purple-600" />
          <span>Bulk Update</span>
        </button>
        
        <button
          onClick={() => setActiveOperation(OPERATION_TYPES.BULK_DELETE)}
          disabled={isLoading || selectedRows.size === 0}
          className="flex items-center justify-center space-x-2 p-4 border border-gray-300 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
        >
          <Trash2 className="w-5 h-5 text-red-600" />
          <span>Bulk Delete</span>
        </button>
        
        <button
          onClick={() => setActiveOperation(OPERATION_TYPES.BULK_ADD)}
          disabled={isLoading}
          className="flex items-center justify-center space-x-2 p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Plus className="w-5 h-5 text-indigo-600" />
          <span>Bulk Add</span>
        </button>
        
        <button
          onClick={handleDownloadTemplate}
          disabled={isLoading}
          className="flex items-center justify-center space-x-2 p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <FileText className="w-5 h-5 text-orange-600" />
          <span>Download Template</span>
        </button>
      </div>
      
      {/* Progress Bar */}
      {isLoading && (
        <ProgressBar 
          progress={progress}
          status="processing"
          message="Processing operation..."
        />
      )}
      
      {/* Active Operation Panel */}
      {activeOperation === OPERATION_TYPES.BULK_IMPORT && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Import Data</h4>
          
          {!validationResults ? (
            <FileDropZone
              onFileSelect={handleFileUpload}
              acceptedTypes=".csv,.json,.xlsx"
              isLoading={isLoading}
            />
          ) : (
            <ValidationResults
              results={validationResults}
              onContinue={handleBulkImport}
              onCancel={() => {
                setValidationResults(null);
                setActiveOperation(null);
              }}
              resourceType={resourceType}
            />
          )}
        </div>
      )}
      
      {activeOperation === OPERATION_TYPES.BULK_UPDATE && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">
            Bulk Update ({selectedRows.size} records)
          </h4>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Field to Update
                </label>
                <select
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  onChange={(e) => {
                    const field = e.target.value;
                    if (field && !bulkUpdateFields[field]) {
                      setBulkUpdateFields(prev => ({ ...prev, [field]: '' }));
                    }
                  }}
                >
                  <option value="">Select field...</option>
                  <option value="name">Name</option>
                  <option value="phone">Phone</option>
                  <option value="website">Website</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Value
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="Enter new value..."
                />
              </div>
            </div>
            
            {Object.keys(bulkUpdateFields).length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h5 className="font-medium text-gray-900 mb-2">Fields to Update:</h5>
                <div className="space-y-2">
                  {Object.entries(bulkUpdateFields).map(([field, value]) => (
                    <div key={field} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{field}: {value}</span>
                      <button
                        onClick={() => {
                          setBulkUpdateFields(prev => {
                            const next = { ...prev };
                            delete next[field];
                            return next;
                          });
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setActiveOperation(null)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkUpdate}
                disabled={Object.keys(bulkUpdateFields).length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Update {selectedRows.size} Records
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Bulk Delete Confirmation Panel */}
      {activeOperation === OPERATION_TYPES.BULK_DELETE && (
        <div className="bg-white border border-red-200 rounded-lg p-6">
          <h4 className="text-lg font-medium text-red-900 mb-4">
            Confirm Bulk Delete ({selectedRows.size} records)
          </h4>
          
          <div className="space-y-4">
            {/* Warning message */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h5 className="font-medium text-red-800 mb-1">Warning: This action cannot be undone!</h5>
                  <p className="text-sm text-red-700">
                    You are about to permanently delete <strong>{selectedRows.size}</strong> {resourceType} records. 
                    This action cannot be reversed and may affect related data.
                  </p>
                  <p className="text-sm text-red-600 mt-2">
                    Please type <strong>DELETE</strong> below to confirm this operation.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Confirmation input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type "DELETE" to confirm:
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Type DELETE here..."
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                value={deleteConfirmText}
              />
            </div>
            
            {/* Action buttons */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setActiveOperation(null);
                  setDeleteConfirmText('');
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={deleteConfirmText !== 'DELETE' || isLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Deleting...' : `Delete ${selectedRows.size} Records`}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Bulk Add */}
      {activeOperation === OPERATION_TYPES.BULK_ADD && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Bulk Add {resourceType.charAt(0).toUpperCase() + resourceType.slice(1).replace('_', ' ')}
            </h3>
            <div className="text-sm text-gray-500">
              Step {bulkAddPhase === 'input' ? '1' : bulkAddPhase === 'validation' ? '2' : '3'} of 3
            </div>
          </div>
          
          {bulkAddPhase === 'input' && (
            <div className="space-y-6">
              {/* Comprehensive Format Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <FileText className="w-6 h-6 text-blue-600 mt-1" />
                  </div>
                  <div className="ml-4 flex-1">
                    <h4 className="text-lg font-medium text-blue-900 mb-2">
                      {getFormatInstructions(resourceType).title}
          </h4>
                    <p className="text-sm text-blue-700 mb-4">
                      {getFormatInstructions(resourceType).description}
                    </p>
                    
                    {/* Field Requirements */}
                    <div className="mb-6">
                      <h5 className="font-medium text-blue-900 mb-3">Field Requirements:</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {getFormatInstructions(resourceType).fields.map((field, index) => (
                          <div key={index} className="flex items-start space-x-2">
                            <span className={cn(
                              "inline-block w-2 h-2 rounded-full mt-2 flex-shrink-0",
                              field.required ? "bg-red-500" : "bg-gray-400"
                            )} />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-blue-800">{field.name}</span>
                                <span className={cn(
                                  "text-xs px-1.5 py-0.5 rounded",
                                  field.required 
                                    ? "bg-red-100 text-red-700" 
                                    : "bg-gray-100 text-gray-600"
                                )}>
                                  {field.required ? "Required" : "Optional"}
                                </span>
                              </div>
                              <p className="text-xs text-blue-600 mt-1">{field.description}</p>
                              <p className="text-xs text-gray-600 mt-1">
                                Example: <span className="font-mono">{field.example}</span>
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Format String */}
                    <div className="mb-4">
                      <h5 className="font-medium text-blue-900 mb-2">Format:</h5>
                      <div className="bg-white border border-blue-200 rounded p-3">
                        <code className="text-sm text-blue-800 font-mono">
                          {getFormatInstructions(resourceType).format}
              </code>
                      </div>
            </div>
            
                    {/* Examples */}
                    <div className="mb-4">
                      <h5 className="font-medium text-blue-900 mb-2">Examples:</h5>
                      <div className="bg-white border border-blue-200 rounded p-3 space-y-1">
                        {getFormatInstructions(resourceType).examples.map((example, index) => (
                          <div key={index} className="text-sm font-mono text-blue-800">
                            {example}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Tips */}
            <div>
                      <h5 className="font-medium text-blue-900 mb-2">Important Tips:</h5>
                      <ul className="text-sm text-blue-700 space-y-1">
                        {getFormatInstructions(resourceType).tips.map((tip, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-blue-500 mr-2 mt-0.5">•</span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Input Form */}
              <form onSubmit={handleBulkAddText} className="space-y-4">
                <div>
                  <label htmlFor="bulkAddText" className="block text-sm font-medium text-gray-700 mb-2">
                    Enter Data (one record per line, comma-separated)
              </label>
                  <div className="text-xs text-gray-500 mb-2">
                    Format: {getFormatInstructions(resourceType).format}
                  </div>
              <textarea
                    id="bulkAddText"
                value={bulkAddText}
                onChange={(e) => setBulkAddText(e.target.value)}
                    rows={8}
                    className="w-full border border-gray-300 rounded-md p-3 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={getPlaceholderText(resourceType)}
                  />
                  <div className="mt-2 text-xs text-gray-500">
                    💡 Tip: Copy and paste from spreadsheets works great! Make sure to follow the format above.
              </div>
            </div>
            
                <div className="flex justify-between">
              <button
                    type="button"
                    onClick={() => setActiveOperation(null)}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                    type="submit"
                disabled={!bulkAddText.trim() || isLoading}
                    className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
              >
                    {isLoading && <Loader className="w-4 h-4 animate-spin" />}
                    <span>{isLoading ? 'Validating...' : 'Validate Data'}</span>
              </button>
            </div>
              </form>
          </div>
          )}
          
          {bulkAddPhase === 'validation' && validationResults && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-medium">Validation Results</h4>
                <div className="text-sm text-gray-500">
                  Step 2 of 3: Review & Confirm
                </div>
              </div>
              
              <ValidationResults
                results={validationResults}
                onContinue={handleConfirmAndExecute}
                onCancel={handleCancelValidation}
                resourceType={resourceType}
              />
            </div>
          )}
          
          {bulkAddPhase === 'execution' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-medium">Creating Records</h4>
                <div className="text-sm text-gray-500">
                  Step 3 of 3: Execution
                </div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <Loader className="w-4 h-4 animate-spin text-blue-600 mr-2" />
                  <span className="text-sm font-medium text-blue-800">
                    Creating records... {Math.round(progress)}%
                  </span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          )}
          
          {(bulkAddPhase === 'validation' || bulkAddPhase === 'execution') && (
            <div className="bg-gray-50 p-3 rounded">
              <div className="flex items-center text-sm text-gray-600">
                {isLoading && <Loader className="w-4 h-4 animate-spin mr-2" />}
                <span>
                  {bulkAddPhase === 'validation' ? 'Data validated and resolved' : 'Creating records in database'}
                </span>
              </div>
              {progress > 0 && progress < 100 && (
                <div className="mt-2 w-full bg-gray-200 rounded-full h-1">
                  <div 
                    className="bg-blue-600 h-1 rounded-full transition-all duration-300" 
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Operation History */}
      {operationHistory.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Recent Operations</h4>
          <div className="space-y-3">
            {operationHistory.slice(-5).reverse().map(operation => (
              <div key={operation.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <p className="font-medium text-gray-900">
                    {operation.type.replace('_', ' ').toUpperCase()}
                  </p>
                  <p className="text-sm text-gray-600">
                    {format(operation.timestamp, 'MMM dd, yyyy HH:mm')}
                  </p>
                </div>
                <div className="text-right">
                  {operation.success && (
                    <p className="text-sm text-green-600">
                      {operation.success} successful
                    </p>
                  )}
                  {operation.failed && (
                    <p className="text-sm text-red-600">
                      {operation.failed} failed
                    </p>
                  )}
                  {operation.records && (
                    <p className="text-sm text-gray-600">
                      {operation.records} records
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}; 