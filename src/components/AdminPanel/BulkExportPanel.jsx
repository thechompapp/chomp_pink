/**
 * Bulk Export Panel Component
 * 
 * Specialized component for handling data export operations
 * Extracted from the monolithic BulkOperationsPanel for better maintainability.
 */

import React, { useState } from 'react';
import { Download, FileText, Table } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FILE_FORMATS } from '@/hooks/useBulkOperations';

export const BulkExportPanel = ({ 
  resourceType, 
  bulkOps, 
  adminData 
}) => {
  const [selectedFormat, setSelectedFormat] = useState(FILE_FORMATS.CSV);
  
  const data = adminData[resourceType] || [];
  const recordCount = data.length;

  const formatOptions = [
    {
      format: FILE_FORMATS.CSV,
      label: 'CSV Format',
      description: 'Comma-separated values, compatible with Excel',
      icon: Table,
      recommended: true
    },
    {
      format: FILE_FORMATS.JSON,
      label: 'JSON Format', 
      description: 'JavaScript Object Notation, for developers',
      icon: FileText,
      recommended: false
    }
  ];

  const handleExport = () => {
    bulkOps.handleBulkExport(selectedFormat);
  };

  return (
    <div className="space-y-6">
      {/* Export Info */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex items-center space-x-3">
          <Download className="w-5 h-5 text-blue-600" />
          <div>
            <h4 className="font-medium text-blue-900">
              Ready to Export {recordCount} {resourceType}
            </h4>
            <p className="text-sm text-blue-700 mt-1">
              Download your data in the format of your choice
            </p>
          </div>
        </div>
      </div>

      {/* Format Selection */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-900">Choose Export Format</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {formatOptions.map((option) => (
            <label
              key={option.format}
              className={cn(
                "relative flex items-start p-4 border rounded-lg cursor-pointer transition-colors",
                selectedFormat === option.format
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 hover:border-gray-400"
              )}
            >
              <input
                type="radio"
                name="exportFormat"
                value={option.format}
                checked={selectedFormat === option.format}
                onChange={(e) => setSelectedFormat(e.target.value)}
                className="sr-only"
              />
              
              <div className="flex items-start space-x-3 flex-1">
                <option.icon className={cn(
                  "w-5 h-5 mt-0.5",
                  selectedFormat === option.format ? "text-blue-600" : "text-gray-400"
                )} />
                
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900">
                      {option.label}
                    </span>
                    {option.recommended && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        Recommended
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {option.description}
                  </p>
                </div>
              </div>
              
              {/* Selected indicator */}
              {selectedFormat === option.format && (
                <div className="absolute top-3 right-3 w-2 h-2 bg-blue-600 rounded-full"></div>
              )}
            </label>
          ))}
        </div>
      </div>

      {/* Export Preview */}
      {recordCount > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Export Preview</h4>
          <div className="text-sm space-y-2">
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Records to export:</span>
              <span className="font-medium">{recordCount}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">File format:</span>
              <span className="font-medium">{selectedFormat.toUpperCase()}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Estimated file size:</span>
              <span className="font-medium">
                {selectedFormat === FILE_FORMATS.CSV 
                  ? `~${Math.round(recordCount * 0.1)}KB`
                  : `~${Math.round(recordCount * 0.2)}KB`
                }
              </span>
            </div>
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
          onClick={handleExport}
          disabled={recordCount === 0 || bulkOps.isLoading}
          className={cn(
            "px-4 py-2 rounded transition-colors flex items-center space-x-2",
            recordCount > 0 && !bulkOps.isLoading
              ? "bg-green-600 text-white hover:bg-green-700"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          )}
        >
          <Download className="w-4 h-4" />
          <span>
            {bulkOps.isLoading 
              ? 'Exporting...' 
              : `Export ${recordCount} Records`
            }
          </span>
        </button>
      </div>
    </div>
  );
}; 