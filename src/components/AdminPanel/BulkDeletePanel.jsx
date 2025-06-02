/**
 * Bulk Delete Panel Component
 * 
 * Specialized component for handling bulk delete operations
 * Extracted from the monolithic BulkOperationsPanel for better maintainability.
 */

import React, { useState } from 'react';
import { Trash2, AlertTriangle, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

export const BulkDeletePanel = ({ 
  resourceType, 
  selectedRows, 
  bulkOps 
}) => {
  const [confirmText, setConfirmText] = useState('');
  const [hasConfirmed, setHasConfirmed] = useState(false);
  
  const recordCount = selectedRows.size;
  const requiredConfirmText = `DELETE ${recordCount} ${resourceType.toUpperCase()}`;
  const isConfirmValid = confirmText === requiredConfirmText;

  const handleDelete = () => {
    if (!isConfirmValid) return;
    bulkOps.handleBulkDelete();
  };

  const handleConfirmChange = (e) => {
    const value = e.target.value;
    setConfirmText(value);
    setHasConfirmed(value === requiredConfirmText);
  };

  return (
    <div className="space-y-6">
      {/* Warning Header */}
      <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-6 h-6 text-red-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-red-900 mb-2">
              ⚠️ Permanent Deletion Warning
            </h4>
            <p className="text-sm text-red-800">
              You are about to permanently delete <strong>{recordCount} {resourceType}</strong>. 
              This action cannot be undone and will remove all associated data.
            </p>
          </div>
        </div>
      </div>

      {/* Delete Summary */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-3">Deletion Summary</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-600">Records selected:</span>
            <span className="font-medium text-gray-900">{recordCount}</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-600">Resource type:</span>
            <span className="font-medium text-gray-900 capitalize">{resourceType}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-600">Action:</span>
            <span className="font-medium text-red-600">Permanent deletion</span>
          </div>
        </div>
      </div>

      {/* Impact Warning */}
      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
        <div className="flex items-start space-x-3">
          <Shield className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-yellow-900 mb-2">
              Potential Impact
            </h4>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• All related data and associations will be removed</li>
              <li>• References from other records may become invalid</li>
              <li>• This operation cannot be reversed</li>
              <li>• Consider exporting data before deletion</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Confirmation Input */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-900">Confirmation Required</h4>
        <p className="text-sm text-gray-600">
          To confirm this deletion, please type exactly: <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">{requiredConfirmText}</code>
        </p>
        
        <div className="space-y-2">
          <input
            type="text"
            value={confirmText}
            onChange={handleConfirmChange}
            placeholder={`Type "${requiredConfirmText}" to confirm`}
            className={cn(
              "w-full px-3 py-2 border rounded-lg font-mono text-sm transition-colors",
              hasConfirmed 
                ? "border-green-500 bg-green-50" 
                : confirmText && !isConfirmValid
                  ? "border-red-500 bg-red-50"
                  : "border-gray-300"
            )}
          />
          
          {/* Validation feedback */}
          {confirmText && (
            <div className="flex items-center space-x-2 text-sm">
              {isConfirmValid ? (
                <>
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-green-700">Confirmation text is correct</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-red-700">Please type the exact confirmation text</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Progress indicator during deletion */}
      {bulkOps.isLoading && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <span className="text-blue-800">Deleting records... Please wait.</span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <button
          onClick={bulkOps.resetOperation}
          disabled={bulkOps.isLoading}
          className="px-4 py-2 text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handleDelete}
          disabled={!isConfirmValid || bulkOps.isLoading}
          className={cn(
            "px-4 py-2 rounded transition-colors flex items-center space-x-2",
            isConfirmValid && !bulkOps.isLoading
              ? "bg-red-600 text-white hover:bg-red-700"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          )}
        >
          <Trash2 className="w-4 h-4" />
          <span>
            {bulkOps.isLoading 
              ? 'Deleting...' 
              : `Delete ${recordCount} Records`
            }
          </span>
        </button>
      </div>
    </div>
  );
}; 