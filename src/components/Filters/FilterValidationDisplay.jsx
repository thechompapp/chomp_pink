/**
 * FilterValidationDisplay.jsx - Phase 3 New Component
 * 
 * Single Responsibility: Filter validation feedback
 * - Display validation errors and warnings
 * - Show validation status indicators
 * - Provide clear user feedback
 * - Handle validation state visualization
 */

import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Alert, AlertDescription } from '@/components/UI/alert';
import { Badge } from '@/components/UI/badge';

/**
 * FilterValidationDisplay - Validation feedback component
 * 
 * @param {Object} props - Component props
 * @param {Object} props.validationState - Validation state from useFilterValidation
 * @param {boolean} props.isValid - Overall validation status
 * @param {boolean} props.showErrors - Whether to show error messages
 * @param {boolean} props.showWarnings - Whether to show warning messages
 * @param {boolean} props.showStatus - Whether to show validation status badge
 * @param {boolean} props.compact - Whether to use compact display mode
 * @param {string} props.className - Additional CSS classes
 */
const FilterValidationDisplay = ({
  validationState = {},
  isValid = true,
  showErrors = true,
  showWarnings = true,
  showStatus = true,
  compact = false,
  className = ''
}) => {
  // Safely extract validation state with proper defaults
  const safeValidationState = validationState || {};
  const {
    errors = [],
    warnings = [],
    crossFieldErrors = [],
    businessRuleViolations = []
  } = safeValidationState;

  // Ensure all extracted values are arrays before using spread operator
  const safeErrors = Array.isArray(errors) ? errors : [];
  const safeWarnings = Array.isArray(warnings) ? warnings : [];
  const safeCrossFieldErrors = Array.isArray(crossFieldErrors) ? crossFieldErrors : [];
  const safeBusinessRuleViolations = Array.isArray(businessRuleViolations) ? businessRuleViolations : [];

  const allErrors = [...safeErrors, ...safeCrossFieldErrors];
  const allWarnings = [...safeWarnings];
  const allViolations = [...safeBusinessRuleViolations];

  const hasErrors = allErrors.length > 0;
  const hasWarnings = allWarnings.length > 0;
  const hasViolations = allViolations.length > 0;
  const hasAnyIssues = hasErrors || hasWarnings || hasViolations;

  // Don't render if no issues and valid
  if (!hasAnyIssues && isValid) {
    return null;
  }

  // Get status icon and color
  const getStatusIcon = () => {
    if (hasErrors || hasViolations) {
      return <AlertCircle size={16} className="text-red-500" />;
    }
    if (hasWarnings) {
      return <AlertTriangle size={16} className="text-yellow-500" />;
    }
    return <CheckCircle size={16} className="text-green-500" />;
  };

  const getStatusText = () => {
    if (hasErrors || hasViolations) {
      return 'Invalid filters';
    }
    if (hasWarnings) {
      return 'Filters have warnings';
    }
    return 'Filters valid';
  };

  const getStatusVariant = () => {
    if (hasErrors || hasViolations) {
      return 'destructive';
    }
    if (hasWarnings) {
      return 'warning';
    }
    return 'success';
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={`space-y-2 ${className}`}
      >
        {/* Status Badge */}
        {showStatus && (
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <Badge variant={getStatusVariant()} className="text-xs">
              {getStatusText()}
            </Badge>
          </div>
        )}

        {/* Error Messages */}
        {showErrors && hasErrors && (
          <Alert variant="destructive" className={compact ? 'py-2' : ''}>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {compact ? (
                <span>{allErrors.length} error{allErrors.length !== 1 ? 's' : ''} found</span>
              ) : (
                <ul className="list-disc list-inside space-y-1">
                  {allErrors.map((error, index) => (
                    <li key={`error-${index}`} className="text-sm">
                      {error}
                    </li>
                  ))}
                </ul>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Business Rule Violations */}
        {showErrors && hasViolations && (
          <Alert variant="destructive" className={compact ? 'py-2' : ''}>
            <Info className="h-4 w-4" />
            <AlertDescription>
              {compact ? (
                <span>{allViolations.length} rule violation{allViolations.length !== 1 ? 's' : ''}</span>
              ) : (
                <div>
                  <strong className="text-sm font-medium">Business Rule Violations:</strong>
                  <ul className="list-disc list-inside space-y-1 mt-1">
                    {allViolations.map((violation, index) => (
                      <li key={`violation-${index}`} className="text-sm">
                        {violation}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Warning Messages */}
        {showWarnings && hasWarnings && (
          <Alert variant="warning" className={compact ? 'py-2' : ''}>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {compact ? (
                <span>{allWarnings.length} warning{allWarnings.length !== 1 ? 's' : ''}</span>
              ) : (
                <ul className="list-disc list-inside space-y-1">
                  {allWarnings.map((warning, index) => (
                    <li key={`warning-${index}`} className="text-sm">
                      {warning}
                    </li>
                  ))}
                </ul>
              )}
            </AlertDescription>
          </Alert>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default FilterValidationDisplay; 