import React, { useState } from 'react';
import { Check, X, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/UI/Button';
import { cn } from '@/lib/utils';

const DataCleanupModal = ({ 
  isOpen, 
  onClose, 
  changes, 
  onApprove, 
  onReject,
  onApproveAll,
  onRejectAll,
  resourceType 
}) => {
  const [expandedSections, setExpandedSections] = useState({});
  const [selectedChanges, setSelectedChanges] = useState(new Set());

  // Debugging logs
  console.log(`[DataCleanupModal] Modal isOpen=${isOpen}, resourceType=${resourceType}, changes:`, changes);

  // Group changes by category
  const safeChanges = changes || [];
  console.log(`[DataCleanupModal] Safe changes length: ${safeChanges.length}`);
  
  const groupedChanges = safeChanges.reduce((acc, change) => {
    if (!change.category) {
      console.warn(`[DataCleanupModal] Change missing category:`, change);
      change.category = 'General';
    }
    if (!acc[change.category]) {
      acc[change.category] = [];
    }
    acc[change.category].push(change);
    return acc;
  }, {});

  const toggleSection = (category) => {
    setExpandedSections(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const toggleChange = (changeId) => {
    setSelectedChanges(prev => {
      const next = new Set(prev);
      if (next.has(changeId)) {
        next.delete(changeId);
      } else {
        next.add(changeId);
      }
      return next;
    });
  };

  const handleApproveSelected = () => {
    selectedChanges.forEach(changeId => {
      onApprove(changeId);
    });
    setSelectedChanges(new Set());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <h2 className="text-2xl font-semibold">Data Cleanup: {resourceType}</h2>
          <p className="text-muted-foreground mt-1">
            Review and approve proposed changes to your data
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Summary */}
          <div className="mb-6 bg-muted p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Summary</h3>
                <p className="text-sm text-muted-foreground">
                  {safeChanges.length > 0 
                    ? `${safeChanges.length} changes proposed across ${Object.keys(groupedChanges).length} categories`
                    : `No changes found for ${resourceType}.`
                  }
                </p>
              </div>
              {safeChanges.length > 0 && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onApproveAll}
                  >
                    Approve All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onRejectAll}
                  >
                    Reject All
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Changes List */}
          {safeChanges.length > 0 ? (
            <div className="space-y-4">
              {Object.entries(groupedChanges).map(([category, categoryChanges]) => (
                <div key={category} className="border border-border rounded-lg">
                  {/* Category Header */}
                  <button
                    className="w-full p-4 flex items-center justify-between hover:bg-muted/50"
                    onClick={() => toggleSection(category)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{category}</span>
                      <span className="text-sm text-muted-foreground">
                        ({categoryChanges.length} changes)
                      </span>
                    </div>
                    {expandedSections[category] ? (
                      <ChevronUp size={20} />
                    ) : (
                      <ChevronDown size={20} />
                    )}
                  </button>

                  {/* Category Changes */}
                  {expandedSections[category] && (
                    <div className="p-4 border-t border-border space-y-4">
                      {categoryChanges.map((change) => (
                        <div
                          key={change.id}
                          className={cn(
                            "p-4 rounded-lg border",
                            selectedChanges.has(change.id)
                              ? "border-primary bg-primary/5"
                              : "border-border"
                          )}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <input
                                  type="checkbox"
                                  checked={selectedChanges.has(change.id)}
                                  onChange={() => toggleChange(change.id)}
                                  className="rounded border-input"
                                />
                                <h4 className="font-medium">{change.title}</h4>
                              </div>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className="text-muted-foreground">Current:</p>
                                  <p className="font-mono">{change.currentValue || 'N/A'}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Proposed:</p>
                                  <p className="font-mono">{change.proposedValue || 'N/A'}</p>
                                </div>
                              </div>
                              {change.impact && (
                                <p className="text-sm text-muted-foreground mt-2">
                                  Impact: {change.impact}
                                </p>
                              )}
                              {change.confidence && (
                                <div className="flex items-center gap-2 mt-2">
                                  <AlertTriangle
                                    size={14}
                                    className={cn(
                                      "text-yellow-500",
                                      change.confidence > 0.8 && "text-green-500"
                                    )}
                                  />
                                  <span className="text-sm text-muted-foreground">
                                    Confidence: {Math.round(change.confidence * 100)}%
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onApprove(change.id)}
                                className="text-green-600 hover:text-green-700"
                              >
                                <Check size={16} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onReject(change.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <X size={16} />
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
              <p className="text-muted-foreground">No changes found to display.</p>
              <p className="text-sm mt-2">Try analyzing a different resource type.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleApproveSelected}
              disabled={selectedChanges.size === 0}
            >
              Approve Selected ({selectedChanges.size})
            </Button>
          </div>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DataCleanupModal; 