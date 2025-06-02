/**
 * Custom hook for managing bulk operations state and logic
 * 
 * Extracted from BulkOperationsPanel for better separation of concerns
 * and reusability across admin components.
 */

import { useState, useCallback, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { enhancedAdminService } from '@/services/enhancedAdminService';
import { format } from 'date-fns';

// Operation types
export const OPERATION_TYPES = {
  BULK_UPDATE: 'bulk_update',
  BULK_DELETE: 'bulk_delete',
  BULK_IMPORT: 'bulk_import',
  BULK_EXPORT: 'bulk_export',
  BULK_ADD: 'bulk_add'
};

// File formats
export const FILE_FORMATS = {
  CSV: 'csv',
  JSON: 'json',
  XLSX: 'xlsx'
};

export const useBulkOperations = ({ 
  resourceType, 
  selectedRows = new Set(), 
  adminData = {},
  onOperationComplete 
}) => {
  // Core state
  const [activeOperation, setActiveOperation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [validationResults, setValidationResults] = useState(null);
  const [operationHistory, setOperationHistory] = useState([]);
  
  // Operation-specific state
  const [bulkUpdateFields, setBulkUpdateFields] = useState({});
  const [bulkAddText, setBulkAddText] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  
  // Bulk add flow state
  const [bulkAddPhase, setBulkAddPhase] = useState('input'); // 'input', 'validation', 'execution'
  const [validatedData, setValidatedData] = useState(null);
  
  // Refs
  const bulkAddFileInputRef = useRef(null);

  // Utility function to convert data to CSV
  const convertToCSV = useCallback((data) => {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvHeaders = headers.join(',');
    
    const csvRows = data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Escape commas and quotes in CSV
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value || '';
      }).join(',')
    );
    
    return [csvHeaders, ...csvRows].join('\n');
  }, []);

  // Handle file upload and validation
  const handleFileUpload = useCallback(async (file) => {
    setIsLoading(true);
    setProgress(0);
    
    try {
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
  }, [resourceType, adminData, convertToCSV]);

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
      const result = await enhancedAdminService.batchDelete(
        resourceType,
        Array.from(selectedRows),
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
      
      toast.success(`Deleted ${result.success} records`);
      setDeleteConfirmText('');
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

  // Reset state
  const resetOperation = useCallback(() => {
    setActiveOperation(null);
    setValidationResults(null);
    setBulkUpdateFields({});
    setBulkAddText('');
    setDeleteConfirmText('');
    setBulkAddPhase('input');
    setValidatedData(null);
    setProgress(0);
  }, []);

  return {
    // State
    activeOperation,
    isLoading,
    progress,
    validationResults,
    operationHistory,
    bulkUpdateFields,
    bulkAddText,
    deleteConfirmText,
    bulkAddPhase,
    validatedData,
    bulkAddFileInputRef,
    
    // Setters
    setActiveOperation,
    setBulkUpdateFields,
    setBulkAddText,
    setDeleteConfirmText,
    setBulkAddPhase,
    setValidatedData,
    
    // Operations
    handleFileUpload,
    handleBulkImport,
    handleBulkExport,
    handleBulkUpdate,
    handleBulkDelete,
    resetOperation,
    
    // Utilities
    convertToCSV
  };
}; 