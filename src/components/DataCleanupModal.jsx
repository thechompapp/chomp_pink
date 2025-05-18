import React, { useState, useEffect, useMemo } from 'react';
import { Check, X, AlertTriangle, ChevronDown, ChevronUp, CheckSquare, Square, Loader2 } from 'lucide-react';
import { Button } from '@/components/UI/Button';
import { cn } from '@/lib/utils';
import { Modal } from '@/components/UI/Modal';
import { logDebug, logWarn, logError } from '@/utils/logger';

/**
 * Modal for reviewing and managing data cleanup suggestions
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Function to call when the modal is closed
 * @param {Array} props.changes - Array of change objects to display
 * @param {Function} props.onApprove - Function to call to approve changes
 * @param {Function} props.onReject - Function to call to reject changes
 * @param {Function} props.onApproveAll - Function to call to approve all changes
 * @param {Function} props.onRejectAll - Function to call to reject all changes
 * @param {string} props.resourceType - Type of resource being modified
 */
const DataCleanupModal = ({ 
  isOpen, 
  onClose, 
  changes: rawChanges,
  onApprove,
  onReject,
  onApproveAll,
  onRejectAll,
  resourceType 
}) => {
  // Log modal render
  logDebug('[DataCleanupModal] Render called with props:', { 
    isOpen, 
    resourceType,
    rawChangesLength: rawChanges?.length,
    hasOnClose: !!onClose,
    hasOnApprove: !!onApprove,
    hasOnReject: !!onReject
  });

  // Component state
  const [expandedSections, setExpandedSections] = useState({});
  const [selectedChangeIds, setSelectedChangeIds] = useState(new Set());
  const [isApproveAllLoading, setIsApproveAllLoading] = useState(false);
  const [isRejectAllLoading, setIsRejectAllLoading] = useState(false);
  const [actionError, setActionError] = useState(null);

  /**
   * Process and normalize raw changes data
   */
  const processedChanges = useMemo(() => {
    logDebug(`[DataCleanupModal] Processing ${rawChanges?.length || 0} raw changes for resourceType: ${resourceType}`);
    
    if (!Array.isArray(rawChanges)) {
      logWarn('[DataCleanupModal] rawChanges is not an array:', rawChanges);
      return [];
    }
    
    return rawChanges.map(change => ({
      ...change,
      changeId: change.changeId || `missing-id-${Math.random().toString(36).substr(2, 9)}`,
      category: change.category || 'General',
      title: change.title || `Update ${change.field || 'field'}`,
      currentValue: String(change.currentValue ?? 'N/A'),
      proposedValue: String(change.proposedValue ?? 'N/A'),
    }));
  }, [rawChanges, resourceType]);

  /**
   * Group changes by category for easier organization
   */
  const groupedChanges = useMemo(() => {
    return processedChanges.reduce((acc, change) => {
      const category = change.category || 'General';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(change);
      return acc;
    }, {});
  }, [processedChanges]);

  /**
   * Reset selection and expand first category when modal opens
   */
  useEffect(() => {
    if (isOpen) {
      logDebug('[DataCleanupModal] Modal opened, resetting selections.');
      setSelectedChangeIds(new Set());
      
      // Expand first category by default if there are changes
      const firstCategory = Object.keys(groupedChanges)[0];
      if (firstCategory) {
        setExpandedSections({ [firstCategory]: true });
      } else {
        setExpandedSections({});
      }
    }
  }, [isOpen, processedChanges]);

  /**
   * Toggle a category's expanded state
   * @param {string} category - Category to toggle
   */
  const toggleSection = (category) => {
    setExpandedSections(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  /**
   * Toggle selection for a specific change
   * @param {string} changeId - ID of change to toggle
   */
  const handleToggleChangeSelection = (changeId) => {
    setSelectedChangeIds(prev => {
      const next = new Set(prev);
      if (next.has(changeId)) {
        next.delete(changeId);
      } else {
        next.add(changeId);
      }
      return next;
    });
  };

  /**
   * Find a change by its ID
   * @param {string} changeId - ID of change to find
   * @returns {Object|undefined} The change object or undefined if not found
   */
  const getChangeById = (changeId) => {
    return processedChanges.find(c => c.changeId === changeId);
  };

  /**
   * Handle approval operations with shared logic
   * @param {Array} changes - Changes to approve
   * @param {string} logMessage - Message to log
   */
  const handleApproveChanges = (changes, logMessage) => {
    if (changes.length > 0) {
      logDebug(logMessage, changes);
      onApprove(changes);
      setSelectedChangeIds(new Set()); // Clear selection after action
    } else {
      logWarn('[DataCleanupModal] No changes to approve');
    }
  };

  /**
   * Handle reject operations with shared logic
   * @param {Array} changes - Changes to reject
   * @param {string} logMessage - Message to log
   */
  const handleRejectChanges = (changes, logMessage) => {
    if (changes.length > 0) {
      logDebug(logMessage, changes);
      onReject(changes);
      setSelectedChangeIds(new Set()); // Clear selection after action
    } else {
      logWarn('[DataCleanupModal] No changes to reject');
    }
  };

  /**
   * Approve a single change
   * @param {string} changeId - ID of change to approve
   */
  const handleApproveSingle = (changeId) => {
    const changeToApprove = getChangeById(changeId);
    if (changeToApprove) {
      handleApproveChanges(
        [changeToApprove],
        `[DataCleanupModal] Approving single change:`
      );
    } else {
      logWarn(`[DataCleanupModal] Could not find change to approve with ID: ${changeId}`);
    }
  };

  /**
   * Reject a single change
   * @param {string} changeId - ID of change to reject
   */
  const handleRejectSingle = (changeId) => {
    const changeToReject = getChangeById(changeId);
    if (changeToReject) {
      handleRejectChanges(
        [changeToReject],
        `[DataCleanupModal] Rejecting single change:`
      );
    } else {
      logWarn(`[DataCleanupModal] Could not find change to reject with ID: ${changeId}`);
    }
  };
  
  /**
   * Approve selected changes
   */
  const handleApproveSelected = () => {
    const changesToApprove = processedChanges.filter(c => selectedChangeIds.has(c.changeId));
    handleApproveChanges(
      changesToApprove,
      `[DataCleanupModal] Approving ${changesToApprove.length} selected changes.`
    );
  };

  /**
   * Reject selected changes
   */
  const handleRejectSelected = () => {
    const changesToReject = processedChanges.filter(c => selectedChangeIds.has(c.changeId));
    handleRejectChanges(
      changesToReject,
      `[DataCleanupModal] Rejecting ${changesToReject.length} selected changes.`
    );
  };

  /**
   * Update selected changes based on category
   * @param {string} category - Category to update
   * @param {Function} updateFn - Function to update selection set
   */
  const updateSelectionByCategory = (category, updateFn) => {
    const categoryChangeIds = groupedChanges[category]?.map(c => c.changeId) || [];
    setSelectedChangeIds(prev => {
      const next = new Set(prev);
      updateFn(next, categoryChangeIds);
      return next;
    });
  };

  /**
   * Select all changes in a category
   * @param {string} category - Category to select all changes in
   */
  const handleSelectAllInCategory = (category) => {
    updateSelectionByCategory(category, (next, ids) => {
      ids.forEach(id => next.add(id));
    });
  };

  /**
   * Deselect all changes in a category
   * @param {string} category - Category to deselect all changes in
   */
  const handleDeselectAllInCategory = (category) => {
    updateSelectionByCategory(category, (next, ids) => {
      ids.forEach(id => next.delete(id));
    });
  };

  /**
   * Handle bulk operation with shared logic
   * @param {Function} operation - Operation to perform
   * @param {Function} setLoadingState - Function to update loading state
   * @param {string} logMessage - Message to log
   */
  const handleBulkOperation = async (operation, setLoadingState, logMessage) => {
    setLoadingState(true);
    setActionError(null);
    
    try {
      logDebug(logMessage);
      if (processedChanges.length === 0) {
        logWarn('[DataCleanupModal] No changes to process');
        return;
      }
      
      await operation(processedChanges);
      logDebug('[DataCleanupModal] Bulk operation completed successfully');
    } catch (error) {
      logError(`[DataCleanupModal] Error in bulk operation:`, error);
      setActionError(`Failed to process changes: ${error.message || 'Unknown error'}`);
    } finally {
      setLoadingState(false);
    }
  };

  /**
   * Approve all visible changes
   */
  const handleApproveAllVisible = async () => {
    await handleBulkOperation(
      onApproveAll,
      setIsApproveAllLoading,
      `[DataCleanupModal] Approving all ${processedChanges.length} visible changes.`
    );
  };

  /**
   * Reject all visible changes
   */
  const handleRejectAllVisible = async () => {
    await handleBulkOperation(
      onRejectAll,
      setIsRejectAllLoading,
      `[DataCleanupModal] Rejecting all ${processedChanges.length} visible changes.`
    );
  };

  // Don't render if modal is not open
  if (!isOpen) {
    return null;
  }

  // Render modal content
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Review Data Cleanup Changes for ${resourceType || 'Resources'}`} dialogClassName="max-w-5xl">
      <div className="space-y-4 p-6 max-h-[85vh] overflow-y-auto">
        {/* Description */}
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Review and approve or reject the proposed changes.
          {resourceType === 'dishes' && " Note: Dish names may be standardized to title case upon approval if configured."}
        </p>
        
        {/* Summary section */}
        <div className="mb-6 bg-muted p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Summary</h3>
              <p className="text-sm text-muted-foreground">
                {processedChanges.length > 0 
                  ? `${processedChanges.length} changes proposed across ${Object.keys(groupedChanges).length} categories.`
                  : `No cleanup suggestions found for ${resourceType}.`
                }
              </p>
            </div>
            
            {/* Bulk action buttons */}
            {processedChanges.length > 0 && (
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <Button 
                    variant="success" 
                    size="sm" 
                    onClick={handleApproveAllVisible} 
                    data-testid="approve-all-btn"
                    className="bg-green-600 hover:bg-green-700 text-white border-green-700 font-medium"
                    disabled={isApproveAllLoading || isRejectAllLoading}
                  >
                    {isApproveAllLoading ? <Loader2 size={16} className="mr-1 animate-spin" /> : <Check size={16} className="mr-1" />}
                    Approve All ({processedChanges.length})
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleRejectAllVisible} 
                    data-testid="reject-all-btn"
                    className="border-gray-500 text-gray-600 dark:border-gray-400 dark:text-gray-300 font-medium"
                    disabled={isApproveAllLoading || isRejectAllLoading}
                  >
                    {isRejectAllLoading ? <Loader2 size={16} className="mr-1 animate-spin" /> : <X size={16} className="mr-1" />}
                    Reject All
                  </Button>
                </div>
                
                {/* Selected items actions */}
                {selectedChangeIds.size > 0 && (
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleApproveSelected}
                      className="border-green-600 text-green-700 dark:border-green-500 dark:text-green-400"
                    >
                      <Check size={14} className="mr-1" />
                      Approve Selected ({selectedChangeIds.size})
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleRejectSelected}
                      className="border-gray-500 text-gray-600 dark:border-gray-400 dark:text-gray-300"
                    >
                      <X size={14} className="mr-1" />
                      Reject Selected
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Error message */}
          {actionError && (
            <div className="mt-4 p-2 bg-red-50 border-l-4 border-red-400 text-red-700 text-sm">
              <div className="flex">
                <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
                <span>{actionError}</span>
              </div>
            </div>
          )}
        </div>

        {/* No changes message */}
        {processedChanges.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">No cleanup changes found for {resourceType}.</p>
            <button 
              onClick={onClose}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            >
              Close
            </button>
          </div>
        )}

        {/* Changes by category */}
        {Object.entries(groupedChanges).map(([category, categoryChanges]) => (
          <div key={category} className="mb-4 border rounded-md overflow-hidden">
            {/* Category header */}
            <button
              onClick={() => toggleSection(category)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 flex justify-between items-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center">
                <h3 className="text-md font-medium">{category}</h3>
                <span className="ml-2 px-2 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 rounded-full">
                  {categoryChanges.length}
                </span>
              </div>
              
              <div className="flex items-center gap-4">
                {/* Select/deselect all in category */}
                <div className="flex gap-2 mr-2">
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      handleSelectAllInCategory(category); 
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Select All
                  </button>
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      handleDeselectAllInCategory(category); 
                    }}
                    className="text-xs text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300"
                  >
                    Deselect All
                  </button>
                </div>
                
                {/* Expand/collapse indicator */}
                {expandedSections[category] 
                  ? <ChevronUp className="h-4 w-4 text-gray-500" /> 
                  : <ChevronDown className="h-4 w-4 text-gray-500" />}
              </div>
            </button>
            
            {/* Category changes */}
            {expandedSections[category] && (
              <div className="divide-y">
                {categoryChanges.map((change) => (
                  <ChangeRow
                    key={change.changeId}
                    change={change}
                    isSelected={selectedChangeIds.has(change.changeId)}
                    onToggleSelect={() => handleToggleChangeSelection(change.changeId)}
                    onApprove={() => handleApproveSingle(change.changeId)}
                    onReject={() => handleRejectSingle(change.changeId)}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Footer actions */}
      <div className="p-4 bg-gray-50 dark:bg-gray-800 border-t flex justify-end space-x-2">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>
    </Modal>
  );
};

/**
 * Row component for a single change
 */
const ChangeRow = ({ change, isSelected, onToggleSelect, onApprove, onReject }) => {
  const severity = change.severity || 'info';
  const severityClasses = {
    critical: 'bg-red-50 border-red-200',
    warning: 'bg-yellow-50 border-yellow-200',
    info: 'bg-blue-50 border-blue-200',
    low: 'bg-gray-50 border-gray-200',
  };
  
  return (
    <div className={cn(
      'px-4 py-3 flex items-start hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors',
      severityClasses[severity] || severityClasses.info
    )}>
      {/* Checkbox */}
      <div className="mr-3 pt-1" onClick={onToggleSelect}>
        <button className="cursor-pointer text-blue-600 hover:text-blue-800">
          {isSelected ? <CheckSquare className="h-5 w-5" /> : <Square className="h-5 w-5" />}
        </button>
      </div>
      
      {/* Change content */}
      <div className="flex-grow">
        <h4 className="font-medium text-sm">{change.title}</h4>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {change.description || `Change ${change.field || 'value'}`}
        </p>
        
        <div className="mt-2 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Current</p>
            <p className="text-sm mt-1 bg-white dark:bg-gray-700 p-2 rounded border border-gray-200 dark:border-gray-600 break-words">
              {change.currentValue}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Proposed</p>
            <p className="text-sm mt-1 bg-white dark:bg-gray-700 p-2 rounded border border-gray-200 dark:border-gray-600 break-words">
              {change.proposedValue}
            </p>
          </div>
        </div>
      </div>
      
      {/* Action buttons */}
      <div className="ml-3 flex flex-col gap-2">
        <Button
          size="sm"
          variant="ghost"
          className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
          onClick={onApprove}
        >
          <Check className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="text-gray-600 hover:text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
          onClick={onReject}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export { DataCleanupModal };