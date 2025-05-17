import React, { useState, useEffect, useMemo } from 'react';
import { Check, X, AlertTriangle, ChevronDown, ChevronUp, CheckSquare, Square, Loader2 } from 'lucide-react';
import { Button } from '@/components/UI/Button';
import { cn } from '@/lib/utils';
import { Modal } from '@/components/UI/Modal';
import { logDebug, logWarn, logError } from '@/utils/logger'; // Assuming logger exists

const DataCleanupModal = ({ 
  isOpen, 
  onClose, 
  changes: rawChanges, // Renamed to rawChanges to avoid confusion with internal state
  onApprove, // Callback for individual approve: (changeObject) => void
  onReject,  // Callback for individual reject: (changeObject) => void
  onApproveAll, // Callback for mass approve: (allChangeObjects) => void
  onRejectAll,  // Callback for mass reject: (allChangeObjects) => void
  resourceType 
}) => {
  const [expandedSections, setExpandedSections] = useState({});
  const [selectedChangeIds, setSelectedChangeIds] = useState(new Set()); // Store unique change IDs
  const [isApproveAllLoading, setIsApproveAllLoading] = useState(false);
  const [isRejectAllLoading, setIsRejectAllLoading] = useState(false);
  const [actionError, setActionError] = useState(null);

  // Memoize processed changes to prevent re-computation on every render
  const processedChanges = useMemo(() => {
    logDebug(`[DataCleanupModal] Processing ${rawChanges?.length || 0} raw changes for resourceType: ${resourceType}`);
    if (!Array.isArray(rawChanges)) {
      logWarn('[DataCleanupModal] rawChanges is not an array:', rawChanges);
      return [];
    }
    return rawChanges.map(change => ({
      ...change, // Spread original change properties
      // Ensure key fields are present, falling back if necessary (though backend should provide them)
      changeId: change.changeId || `missing-id-${Math.random().toString(36).substr(2, 9)}`,
      category: change.category || 'General',
      title: change.title || `Update ${change.field || 'field'}`,
      currentValue: String(change.currentValue ?? 'N/A'),
      proposedValue: String(change.proposedValue ?? 'N/A'),
    }));
  }, [rawChanges, resourceType]);

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

  // Effect to reset selections when modal is closed or changes are new
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
  }, [isOpen, processedChanges]); // Re-run if processedChanges array reference changes (i.e. new analysis results)


  const toggleSection = (category) => {
    setExpandedSections(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

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

  const getChangeById = (changeId) => {
    return processedChanges.find(c => c.changeId === changeId);
  }

  const handleApproveSingle = (changeId) => {
    const changeToApprove = getChangeById(changeId);
    if (changeToApprove) {
      logDebug(`[DataCleanupModal] Approving single change:`, changeToApprove);
      onApprove([changeToApprove]); // Pass as an array
    } else {
      logWarn(`[DataCleanupModal] Could not find change to approve with ID: ${changeId}`);
    }
  };

  const handleRejectSingle = (changeId) => {
    const changeToReject = getChangeById(changeId);
    if (changeToReject) {
      logDebug(`[DataCleanupModal] Rejecting single change:`, changeToReject);
      onReject([changeToReject]); // Pass as an array
    } else {
      logWarn(`[DataCleanupModal] Could not find change to reject with ID: ${changeId}`);
    }
  };
  
  const handleApproveSelected = () => {
    const changesToApprove = processedChanges.filter(c => selectedChangeIds.has(c.changeId));
    if (changesToApprove.length > 0) {
      logDebug(`[DataCleanupModal] Approving ${changesToApprove.length} selected changes.`);
      onApprove(changesToApprove);
      setSelectedChangeIds(new Set()); // Clear selection after action
    }
  };

  const handleRejectSelected = () => {
    const changesToReject = processedChanges.filter(c => selectedChangeIds.has(c.changeId));
     if (changesToReject.length > 0) {
      logDebug(`[DataCleanupModal] Rejecting ${changesToReject.length} selected changes.`);
      onReject(changesToReject);
      setSelectedChangeIds(new Set()); // Clear selection after action
    }
  };


  const handleSelectAllInCategory = (category) => {
    const categoryChangeIds = groupedChanges[category]?.map(c => c.changeId) || [];
    setSelectedChangeIds(prev => {
        const next = new Set(prev);
        categoryChangeIds.forEach(id => next.add(id));
        return next;
    });
  };

  const handleDeselectAllInCategory = (category) => {
     const categoryChangeIds = groupedChanges[category]?.map(c => c.changeId) || [];
     setSelectedChangeIds(prev => {
        const next = new Set(prev);
        categoryChangeIds.forEach(id => next.delete(id));
        return next;
    });
  };

  const handleApproveAllVisible = async () => {
    setIsApproveAllLoading(true);
    setActionError(null);
    try {
      logDebug(`[DataCleanupModal] Approving all ${processedChanges.length} visible changes.`);
      if (processedChanges.length === 0) {
        logWarn('[DataCleanupModal] No changes to approve');
        return;
      }
      
      console.log('[DataCleanupModal] Calling onApproveAll with:', processedChanges);
      await onApproveAll(processedChanges);
      // Don't automatically close - the parent component will handle this
    } catch (error) {
      logError(`[DataCleanupModal] Error approving all changes:`, error);
      setActionError(`Failed to approve changes: ${error.message || 'Unknown error'}`);
    } finally {
      setIsApproveAllLoading(false);
    }
  };

  const handleRejectAllVisible = async () => {
    setIsRejectAllLoading(true);
    setActionError(null);
    try {
      logDebug(`[DataCleanupModal] Rejecting all ${processedChanges.length} visible changes.`);
      if (processedChanges.length === 0) {
        logWarn('[DataCleanupModal] No changes to reject');
        return;
      }
      
      console.log('[DataCleanupModal] Calling onRejectAll with:', processedChanges);
      await onRejectAll(processedChanges);
      // Don't automatically close - the parent component will handle this
    } catch (error) {
      logError(`[DataCleanupModal] Error rejecting all changes:`, error);
      setActionError(`Failed to reject changes: ${error.message || 'Unknown error'}`);
    } finally {
      setIsRejectAllLoading(false);
    }
  };


  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Review Data Cleanup Changes for ${resourceType || 'Resources'}`} dialogClassName="max-w-5xl">
      <div className="space-y-4 p-6 max-h-[85vh] overflow-y-auto">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Review and approve or reject the proposed changes.
          {resourceType === 'dishes' && " Note: Dish names may be standardized to title case upon approval if configured."}
        </p>
        
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
                    disabled={isApproveAllLoading || isRejectAllLoading}
                  >
                    {isRejectAllLoading ? <Loader2 size={16} className="mr-1 animate-spin" /> : <X size={16} className="mr-1" />}
                    Reject All ({processedChanges.length})
                  </Button>
                </div>
                {actionError && (
                  <p className="text-xs text-red-600 mt-1">{actionError}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {processedChanges.length > 0 ? (
          <div className="space-y-4">
            {Object.entries(groupedChanges).map(([category, categoryChanges]) => (
              <div key={category} className="border border-border rounded-lg">
                <div className="flex items-center justify-between p-3">
                  <button
                    className="flex-1 flex items-center justify-between hover:bg-muted/50 -m-3 p-3"
                    onClick={() => toggleSection(category)}
                    aria-expanded={!!expandedSections[category]}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{category}</span>
                      <span className="text-sm text-muted-foreground">
                        ({categoryChanges.length} changes)
                      </span>
                    </div>
                    {expandedSections[category] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                  {expandedSections[category] && categoryChanges.length > 0 && (
                    <div className="flex items-center gap-2 ml-2">
                      <button 
                        className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-muted"
                        onClick={(e) => { e.stopPropagation(); handleSelectAllInCategory(category); }}
                      >
                        Select All
                      </button>
                      <button
                        className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-muted"
                        onClick={(e) => { e.stopPropagation(); handleDeselectAllInCategory(category); }}
                      >
                        Deselect All
                      </button>
                    </div>
                  )}
                </div>

                {expandedSections[category] && (
                  <div className="p-4 border-t border-border space-y-3">
                    {categoryChanges.map((change) => (
                      <div
                        key={change.changeId} // Use the unique changeId
                        className={cn(
                          "p-3 rounded-lg border",
                          selectedChangeIds.has(change.changeId)
                            ? "border-primary bg-primary/10 shadow-md"
                            : "border-border hover:border-muted-foreground/50"
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <button 
                                onClick={() => handleToggleChangeSelection(change.changeId)} 
                                className="flex-shrink-0 p-0.5"
                                aria-pressed={selectedChangeIds.has(change.changeId)}
                                data-testid={`select-change-${change.changeId}`}
                              >
                                {selectedChangeIds.has(change.changeId) ? <CheckSquare size={18} className="text-primary"/> : <Square size={18} className="text-muted-foreground"/>}
                              </button>
                              <h4 className="font-medium text-sm leading-tight">{change.title}</h4>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-2 text-sm pl-7">
                              <div className="bg-gray-50 p-2 rounded-md">
                                <p className="text-muted-foreground text-xs mb-1 font-medium">Current:</p>
                                <p className="font-mono break-all text-xs" title={change.currentValue}>{change.currentValue.length > 150 ? change.currentValue.substring(0,147) + "..." : change.currentValue}</p>
                              </div>
                              <div className="bg-blue-50 p-2 rounded-md">
                                <p className="text-muted-foreground text-xs mb-1 font-medium">Proposed:</p>
                                <p className="font-mono break-all text-xs" title={change.proposedValue}>{change.proposedValue.length > 150 ? change.proposedValue.substring(0,147) + "..." : change.proposedValue}</p>
                              </div>
                            </div>
                            <div className="pl-7 mt-1 space-y-1">
                                {change.impact && (
                                <p className="text-xs text-muted-foreground">
                                    Impact: {change.impact}
                                </p>
                                )}
                                {typeof change.confidence === 'number' && (
                                <div className="flex items-center gap-1">
                                    <AlertTriangle
                                    size={12}
                                    className={cn(
                                        change.confidence < 0.6 && "text-orange-500",
                                        change.confidence >= 0.6 && change.confidence < 0.85 && "text-yellow-500",
                                        change.confidence >= 0.85 && "text-green-500"
                                    )}
                                    />
                                    <span className="text-xs text-muted-foreground">
                                    Confidence: {Math.round(change.confidence * 100)}%
                                    </span>
                                </div>
                                )}
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-1.5 flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleApproveSingle(change.changeId)}
                              className="text-green-600 hover:text-green-700 hover:bg-green-500/10 h-auto px-2 py-1"
                              data-testid={`approve-change-${change.changeId}`}
                            >
                              <Check size={14} /> <span className="ml-1 hidden sm:inline">Approve</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRejectSingle(change.changeId)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-500/10 h-auto px-2 py-1"
                              data-testid={`reject-change-${change.changeId}`}
                            >
                              <X size={14} /> <span className="ml-1 hidden sm:inline">Reject</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-6">
            <p className="text-muted-foreground">No cleanup suggestions available for {resourceType}.</p>
            <p className="text-sm mt-2">Try analyzing a different resource type or check back later.</p>
          </div>
        )}
      </div>
      <div className="p-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button
            variant="default"
            onClick={handleApproveSelected}
            disabled={selectedChangeIds.size === 0}
            data-testid="approve-selected-btn"
            size="sm"
            className="w-full sm:w-auto"
          >
            Approve Selected ({selectedChangeIds.size})
          </Button>
           <Button
            variant="destructive_outline"
            onClick={handleRejectSelected}
            disabled={selectedChangeIds.size === 0}
            data-testid="reject-selected-btn"
            size="sm"
            className="w-full sm:w-auto"
          >
            Reject Selected ({selectedChangeIds.size})
          </Button>
        </div>
        <Button variant="secondary" onClick={onClose} size="sm" data-testid="close-modal-btn">
          Close
        </Button>
      </div>
    </Modal>
  );
};

export default DataCleanupModal;