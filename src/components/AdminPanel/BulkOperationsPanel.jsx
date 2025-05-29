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
  Filter
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
  BULK_EXPORT: 'bulk_export'
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
const ValidationResults = ({ results, onContinue, onCancel }) => {
  const { valid, invalid, warnings, summary } = results;
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
            <span className="font-medium text-green-800">Valid Records</span>
          </div>
          <p className="text-2xl font-bold text-green-900 mt-1">{valid.length}</p>
        </div>
        
        <div className="bg-red-50 rounded-lg p-4">
          <div className="flex items-center">
            <XCircle className="w-5 h-5 text-red-500 mr-2" />
            <span className="font-medium text-red-800">Invalid Records</span>
          </div>
          <p className="text-2xl font-bold text-red-900 mt-1">{invalid.length}</p>
        </div>
        
        <div className="bg-yellow-50 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-yellow-500 mr-2" />
            <span className="font-medium text-yellow-800">Warnings</span>
          </div>
          <p className="text-2xl font-bold text-yellow-900 mt-1">{warnings.length}</p>
        </div>
      </div>
      
      {summary && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Validation Summary</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            {summary.map((item, index) => (
              <li key={index}>• {item}</li>
            ))}
          </ul>
        </div>
      )}
      
      {invalid.length > 0 && (
        <div className="max-h-60 overflow-y-auto">
          <h4 className="font-medium text-red-800 mb-2">Invalid Records</h4>
          <div className="space-y-2">
            {invalid.slice(0, 10).map((error, index) => (
              <div key={index} className="bg-red-50 border border-red-200 rounded p-3">
                <p className="text-sm font-medium text-red-800">Row {error.row}</p>
                <p className="text-sm text-red-600">{error.message}</p>
              </div>
            ))}
            {invalid.length > 10 && (
              <p className="text-sm text-gray-500">
                And {invalid.length - 10} more errors...
              </p>
            )}
          </div>
        </div>
      )}
      
      <div className="flex justify-end space-x-3">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={onContinue}
          disabled={valid.length === 0}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue with {valid.length} Valid Records
        </button>
      </div>
    </div>
  );
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
      }
    };
    
    return templates[resourceType] || {};
  };
  
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                  <option value="price_range">Price Range</option>
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