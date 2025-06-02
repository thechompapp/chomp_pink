/**
 * Operation History Component
 * 
 * Displays a log of recent bulk operations
 * Extracted from the monolithic BulkOperationsPanel for better maintainability.
 */

import React, { useState } from 'react';
import { Clock, CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { OPERATION_TYPES } from '@/hooks/useBulkOperations';
import { format } from 'date-fns';

export const OperationHistory = ({ 
  history = [], 
  resourceType 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (history.length === 0) return null;

  const getOperationIcon = (type) => {
    switch (type) {
      case OPERATION_TYPES.BULK_IMPORT:
        return '📁';
      case OPERATION_TYPES.BULK_EXPORT:
        return '📤';
      case OPERATION_TYPES.BULK_UPDATE:
        return '✏️';
      case OPERATION_TYPES.BULK_DELETE:
        return '🗑️';
      case OPERATION_TYPES.BULK_ADD:
        return '➕';
      default:
        return '⚡';
    }
  };

  const getOperationLabel = (type) => {
    switch (type) {
      case OPERATION_TYPES.BULK_IMPORT:
        return 'Import';
      case OPERATION_TYPES.BULK_EXPORT:
        return 'Export';
      case OPERATION_TYPES.BULK_UPDATE:
        return 'Update';
      case OPERATION_TYPES.BULK_DELETE:
        return 'Delete';
      case OPERATION_TYPES.BULK_ADD:
        return 'Add';
      default:
        return 'Operation';
    }
  };

  const getOperationSummary = (operation) => {
    switch (operation.type) {
      case OPERATION_TYPES.BULK_IMPORT:
        return `${operation.success || 0} imported, ${operation.failed || 0} failed`;
      case OPERATION_TYPES.BULK_EXPORT:
        return `${operation.records} records as ${(operation.format || 'csv').toUpperCase()}`;
      case OPERATION_TYPES.BULK_UPDATE:
        return `${operation.records} records, ${operation.fields?.length || 0} fields`;
      case OPERATION_TYPES.BULK_DELETE:
        return `${operation.success || operation.records || 0} deleted${operation.failed ? `, ${operation.failed} failed` : ''}`;
      case OPERATION_TYPES.BULK_ADD:
        return `${operation.success || operation.records || 0} added`;
      default:
        return 'Completed';
    }
  };

  const getStatusColor = (operation) => {
    if (operation.failed && operation.failed > 0) {
      return 'text-yellow-600';
    }
    if (operation.success !== undefined) {
      return operation.success > 0 ? 'text-green-600' : 'text-red-600';
    }
    return 'text-green-600';
  };

  const getStatusIcon = (operation) => {
    if (operation.failed && operation.failed > 0) {
      return <XCircle className="w-4 h-4 text-yellow-600" />;
    }
    if (operation.success !== undefined) {
      return operation.success > 0 
        ? <CheckCircle className="w-4 h-4 text-green-600" />
        : <XCircle className="w-4 h-4 text-red-600" />;
    }
    return <CheckCircle className="w-4 h-4 text-green-600" />;
  };

  const displayHistory = isExpanded ? history : history.slice(0, 3);
  const hasMore = history.length > 3;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-gray-900 flex items-center space-x-2">
          <Clock className="w-4 h-4" />
          <span>Recent Operations</span>
        </h4>
        {hasMore && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700 transition-colors"
          >
            {isExpanded ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span>{isExpanded ? 'Show Less' : `Show All (${history.length})`}</span>
          </button>
        )}
      </div>

      <div className="space-y-2">
        {displayHistory.map((operation, index) => (
          <div 
            key={operation.id || index}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm"
          >
            <div className="flex items-center space-x-3 flex-1">
              <span className="text-lg">{getOperationIcon(operation.type)}</span>
              
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-900">
                    {getOperationLabel(operation.type)}
                  </span>
                  <span className="text-gray-600">•</span>
                  <span className={cn("text-sm", getStatusColor(operation))}>
                    {getOperationSummary(operation)}
                  </span>
                </div>
                
                <div className="text-xs text-gray-500 mt-1">
                  {format(new Date(operation.timestamp), 'MMM d, yyyy h:mm a')}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {getStatusIcon(operation)}
            </div>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      {history.length > 0 && (
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="text-sm text-blue-800">
            <strong>{history.length}</strong> operations completed for {resourceType} today
          </div>
        </div>
      )}
    </div>
  );
}; 