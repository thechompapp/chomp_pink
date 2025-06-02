/**
 * Validation Results Component
 * 
 * Extracted from BulkOperationsPanel for better separation of concerns
 * and specialized validation result display functionality.
 */

import React, { useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

// Resource type field mapping utilities
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
        resolved.type,
        resolved.parent_name,
        resolved.state || resolved.country,
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
        resolved.field1 || 'N/A',
        resolved.field2 || 'N/A',
        '✅ Ready'
      ];
  }
};

export const ValidationResults = ({ 
  results, 
  onContinue, 
  onCancel, 
  resourceType 
}) => {
  const [showInvalid, setShowInvalid] = useState(false);
  const [showWarnings, setShowWarnings] = useState(false);
  
  if (!results) return null;
  
  const headers = getFieldHeaders(resourceType);
  const hasErrors = results.invalid && results.invalid.length > 0;
  const hasWarnings = results.warnings && results.warnings.length > 0;
  
  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Validation Summary</h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span>Valid: {results.valid?.length || 0}</span>
          </div>
          <div className="flex items-center space-x-2">
            <XCircle className="w-5 h-5 text-red-500" />
            <span>Invalid: {results.invalid?.length || 0}</span>
          </div>
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-yellow-500" />
            <span>Warnings: {results.warnings?.length || 0}</span>
          </div>
        </div>
      </div>

      {/* Valid Records Preview */}
      {results.valid && results.valid.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-green-700">
            Valid Records ({results.valid.length})
          </h4>
          <div className="max-h-64 overflow-auto border rounded">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 sticky top-0">
                <tr>
                  {headers.map((header, i) => (
                    <th key={i} className="text-left p-2 border-b">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.valid.slice(0, 10).map((item, i) => (
                  <tr key={i} className="border-b">
                    {getFieldValues(item, resourceType).map((value, j) => (
                      <td key={j} className="p-2 border-r">
                        {value || 'N/A'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {results.valid.length > 10 && (
              <div className="p-2 text-center text-gray-500 text-sm">
                ...and {results.valid.length - 10} more
              </div>
            )}
          </div>
        </div>
      )}

      {/* Invalid Records */}
      {hasErrors && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-red-700">
              Invalid Records ({results.invalid.length})
            </h4>
            <button
              onClick={() => setShowInvalid(!showInvalid)}
              className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700"
            >
              <Eye className="w-4 h-4" />
              <span>{showInvalid ? 'Hide' : 'Show'} Details</span>
            </button>
          </div>
          
          {showInvalid && (
            <div className="max-h-64 overflow-auto border rounded bg-red-50">
              <div className="space-y-2 p-3">
                {results.invalid.map((item, i) => (
                  <div key={i} className="bg-white p-3 rounded border-l-4 border-red-500">
                    <div className="font-medium text-red-700">
                      Row {item.rowNumber}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {item.errors.map((error, j) => (
                        <div key={j} className="text-red-600">• {error}</div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Warnings */}
      {hasWarnings && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-yellow-700">
              Warnings ({results.warnings.length})
            </h4>
            <button
              onClick={() => setShowWarnings(!showWarnings)}
              className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700"
            >
              <Eye className="w-4 h-4" />
              <span>{showWarnings ? 'Hide' : 'Show'} Details</span>
            </button>
          </div>
          
          {showWarnings && (
            <div className="max-h-64 overflow-auto border rounded bg-yellow-50">
              <div className="space-y-2 p-3">
                {results.warnings.map((warning, i) => (
                  <div key={i} className="bg-white p-3 rounded border-l-4 border-yellow-500">
                    <div className="font-medium text-yellow-700">
                      Row {warning.rowNumber}
                    </div>
                    <div className="text-sm text-yellow-600 mt-1">
                      {warning.warnings.map((warn, j) => (
                        <div key={j}>• {warn}</div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onContinue}
          disabled={!results.valid || results.valid.length === 0}
          className={cn(
            "px-4 py-2 rounded transition-colors",
            results.valid && results.valid.length > 0
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          )}
        >
          Continue with {results.valid?.length || 0} Valid Records
        </button>
      </div>
    </div>
  );
}; 