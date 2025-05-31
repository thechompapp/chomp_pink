/**
 * DataCleanupModal Component
 * 
 * Modal interface for configuring data cleanup checks and displaying results.
 * Allows users to enable/disable specific validation rules and see detailed cleanup results.
 */

import React, { useState, useCallback, useMemo } from 'react';
import { X, Settings, AlertTriangle, CheckCircle, AlertCircle, Info, Wrench } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { cleanupService } from '@/services/cleanupService';
import { logInfo, logError } from '@/utils/logger';

/**
 * Priority colors and icons
 */
const PRIORITY_CONFIG = {
  high: { 
    color: 'text-red-600', 
    bgColor: 'bg-red-50', 
    borderColor: 'border-red-200',
    icon: AlertTriangle 
  },
  medium: { 
    color: 'text-yellow-600', 
    bgColor: 'bg-yellow-50', 
    borderColor: 'border-yellow-200',
    icon: AlertCircle 
  },
  low: { 
    color: 'text-blue-600', 
    bgColor: 'bg-blue-50', 
    borderColor: 'border-blue-200',
    icon: Info 
  }
};

/**
 * DataCleanupModal Component
 */
export const DataCleanupModal = ({
  isOpen,
  onClose,
  resourceType,
  cleanupResults,
  cleanupConfig,
  onConfigChange,
  onCleanupComplete,
  enabledChecksCount
}) => {
  const [activeTab, setActiveTab] = useState('config');
  const [isApplyingFixes, setIsApplyingFixes] = useState(false);
  const [selectedFixes, setSelectedFixes] = useState(new Set());

  // Calculate summary statistics
  const summary = useMemo(() => {
    if (!cleanupResults) return null;

    const stats = {
      total: cleanupResults.totalIssues || 0,
      high: 0,
      medium: 0,
      low: 0,
      categories: Object.keys(cleanupResults.issues || {}).length
    };

    Object.values(cleanupResults.issues || {}).forEach(categoryIssues => {
      Object.values(categoryIssues || {}).forEach(issues => {
        issues.forEach(issue => {
          if (issue.priority === 'high') stats.high++;
          else if (issue.priority === 'medium') stats.medium++;
          else if (issue.priority === 'low') stats.low++;
        });
      });
    });

    return stats;
  }, [cleanupResults]);

  // Handle fix selection
  const handleFixToggle = useCallback((fixId) => {
    setSelectedFixes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fixId)) {
        newSet.delete(fixId);
      } else {
        newSet.add(fixId);
      }
      return newSet;
    });
  }, []);

  // Handle select all fixes
  const handleSelectAllFixes = useCallback(() => {
    if (!cleanupResults) return;

    const allFixIds = [];
    Object.values(cleanupResults.issues || {}).forEach(categoryIssues => {
      Object.values(categoryIssues || {}).forEach(issues => {
        issues.forEach(issue => {
          if (issue.fixable && issue.id) {
            allFixIds.push(issue.id);
          }
        });
      });
    });

    setSelectedFixes(new Set(allFixIds));
  }, [cleanupResults]);

  // Handle clear selection
  const handleClearSelection = useCallback(() => {
    setSelectedFixes(new Set());
  }, []);

  // Handle apply fixes
  const handleApplyFixes = useCallback(async () => {
    if (selectedFixes.size === 0) {
      toast.error('No fixes selected');
      return;
    }

    setIsApplyingFixes(true);

    try {
      logInfo(`[DataCleanupModal] Applying ${selectedFixes.size} fixes for ${resourceType}`);
      
      await cleanupService.applyFixes(resourceType, Array.from(selectedFixes));
      
      toast.success(`Applied ${selectedFixes.size} fixes successfully`);
      onCleanupComplete();
    } catch (error) {
      logError('[DataCleanupModal] Failed to apply fixes:', error);
      toast.error(`Failed to apply fixes: ${error.message}`);
    } finally {
      setIsApplyingFixes(false);
    }
  }, [selectedFixes, resourceType, onCleanupComplete]);

  // Render configuration tab
  const renderConfigTab = () => (
    <div className="space-y-6">
      <div className="text-sm text-gray-600">
        Configure which checks to run for <span className="font-medium">{resourceType}</span> data cleanup.
      </div>

      {Object.entries(cleanupConfig).map(([categoryKey, category]) => (
        <div key={categoryKey} className="space-y-3">
          <h4 className="font-medium text-gray-900 capitalize">{categoryKey}</h4>
          <div className="space-y-2">
            {Object.entries(category).map(([checkKey, check]) => {
              const priorityConfig = PRIORITY_CONFIG[check.priority] || PRIORITY_CONFIG.low;
              const PriorityIcon = priorityConfig.icon;

              return (
                <label
                  key={checkKey}
                  className={cn(
                    'flex items-center p-3 rounded-lg border cursor-pointer transition-colors',
                    check.enabled 
                      ? `${priorityConfig.bgColor} ${priorityConfig.borderColor}` 
                      : 'bg-gray-50 border-gray-200',
                    'hover:border-gray-300'
                  )}
                >
                  <input
                    type="checkbox"
                    checked={check.enabled}
                    onChange={(e) => onConfigChange(categoryKey, checkKey, e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div className="ml-3 flex-1">
                    <div className="flex items-center">
                      <PriorityIcon className={cn('w-4 h-4 mr-2', priorityConfig.color)} />
                      <span className="text-sm font-medium text-gray-900">
                        {check.label}
                      </span>
                      <span className={cn(
                        'ml-2 px-2 py-0.5 text-xs rounded-full',
                        priorityConfig.bgColor,
                        priorityConfig.color
                      )}>
                        {check.priority}
                      </span>
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  // Render results tab
  const renderResultsTab = () => {
    if (!cleanupResults) {
      return (
        <div className="text-center py-8 text-gray-500">
          Run analysis to see results
        </div>
      );
    }

    if (summary.total === 0) {
      return (
        <div className="text-center py-8">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">All Clear!</h3>
          <p className="text-gray-500">No data issues found with the enabled checks.</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Summary */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{summary.total}</div>
              <div className="text-sm text-gray-500">Total Issues</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{summary.high}</div>
              <div className="text-sm text-gray-500">High Priority</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{summary.medium}</div>
              <div className="text-sm text-gray-500">Medium Priority</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{summary.low}</div>
              <div className="text-sm text-gray-500">Low Priority</div>
            </div>
          </div>
        </div>

        {/* Issues by Category */}
        {Object.entries(cleanupResults.issues || {}).map(([categoryKey, categoryIssues]) => (
          <div key={categoryKey} className="space-y-3">
            <h4 className="font-medium text-gray-900 capitalize">{categoryKey}</h4>
            
            {Object.entries(categoryIssues || {}).map(([checkKey, issues]) => (
              <div key={checkKey} className="space-y-2">
                <h5 className="text-sm font-medium text-gray-700">{checkKey}</h5>
                
                {issues.map((issue, index) => {
                  const priorityConfig = PRIORITY_CONFIG[issue.priority] || PRIORITY_CONFIG.low;
                  const PriorityIcon = priorityConfig.icon;
                  const isSelected = selectedFixes.has(issue.id);

                  return (
                    <div
                      key={issue.id || index}
                      className={cn(
                        'p-3 rounded-lg border',
                        priorityConfig.bgColor,
                        priorityConfig.borderColor
                      )}
                    >
                      <div className="flex items-start">
                        {issue.fixable && (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleFixToggle(issue.id)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-0.5 mr-3"
                          />
                        )}
                        
                        <div className="flex-1">
                          <div className="flex items-center">
                            <PriorityIcon className={cn('w-4 h-4 mr-2', priorityConfig.color)} />
                            <span className="text-sm font-medium text-gray-900">
                              {issue.message}
                            </span>
                          </div>
                          
                          {issue.details && (
                            <p className="text-sm text-gray-600 mt-1">{issue.details}</p>
                          )}
                          
                          {/* Before/After Values */}
                          {(issue.valueBefore || issue.valueAfter) && (
                            <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                              <div className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Change Preview:</div>
                              <div className="flex items-center space-x-3 text-sm">
                                <div className="flex-1">
                                  <div className="text-xs text-gray-500 mb-1">Before:</div>
                                  <div className="text-red-700 font-mono bg-red-100 px-3 py-2 rounded border border-red-200 break-all">
                                    {issue.valueBefore || 'N/A'}
                                  </div>
                                </div>
                                <div className="flex-shrink-0 text-gray-400 font-bold text-lg">
                                  →
                                </div>
                                <div className="flex-1">
                                  <div className="text-xs text-gray-500 mb-1">After:</div>
                                  <div className="text-green-700 font-mono bg-green-100 px-3 py-2 rounded border border-green-200 break-all">
                                    {issue.valueAfter || 'N/A'}
                                  </div>
                                </div>
                              </div>
                              {issue.fixable && (
                                <div className="mt-2 text-xs text-blue-600 font-medium">
                                  ✓ This change can be applied automatically
                                </div>
                              )}
                            </div>
                          )}
                          
                          {issue.suggestion && (
                            <p className="text-sm text-blue-600 mt-1">
                              <strong>Suggestion:</strong> {issue.suggestion}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        ))}

        {/* Fix Actions */}
        {selectedFixes.size > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-blue-900">
                  {selectedFixes.size} fix{selectedFixes.size !== 1 ? 'es' : ''} selected
                </h4>
                <p className="text-sm text-blue-700">
                  These issues will be automatically fixed
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleClearSelection}
                  className="px-3 py-1 text-sm border border-blue-200 text-blue-700 rounded hover:bg-blue-100"
                >
                  Clear
                </button>
                <button
                  onClick={handleApplyFixes}
                  disabled={isApplyingFixes}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {isApplyingFixes ? 'Applying...' : 'Apply Fixes'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <div className="bg-white">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Wrench className="w-5 h-5 text-orange-600 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900">
                    Data Cleanup - {resourceType}
                  </h3>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tabs */}
              <div className="mt-4 border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => setActiveTab('config')}
                    className={cn(
                      'py-2 px-1 border-b-2 font-medium text-sm',
                      activeTab === 'config'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    )}
                  >
                    <Settings className="w-4 h-4 inline mr-2" />
                    Configuration ({enabledChecksCount} enabled)
                  </button>
                  <button
                    onClick={() => setActiveTab('results')}
                    className={cn(
                      'py-2 px-1 border-b-2 font-medium text-sm',
                      activeTab === 'results'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    )}
                  >
                    <AlertTriangle className="w-4 h-4 inline mr-2" />
                    Results {summary && `(${summary.total} issues)`}
                  </button>
                </nav>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-4 max-h-96 overflow-y-auto">
              {activeTab === 'config' && renderConfigTab()}
              {activeTab === 'results' && renderResultsTab()}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  {enabledChecksCount > 0 ? (
                    `${enabledChecksCount} checks enabled`
                  ) : (
                    'No checks enabled'
                  )}
                </div>
                <div className="flex space-x-3">
                  {cleanupResults && summary.total > 0 && activeTab === 'results' && (
                    <button
                      onClick={handleSelectAllFixes}
                      className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                    >
                      Select All Fixable
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataCleanupModal; 