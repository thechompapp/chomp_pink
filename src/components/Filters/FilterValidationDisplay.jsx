/**
 * FilterValidationDisplay.jsx - Simple Validation UI
 * 
 * Single Responsibility: Display validation errors only
 * - Clean error message display
 * - Simple styling
 * - No business logic
 */

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * FilterValidationDisplay - Simple validation error display
 */
const FilterValidationDisplay = ({ validation, onDismiss }) => {
  if (!validation || validation.isValid) {
    return null;
  }

  const hasErrors = Object.keys(validation.fieldErrors || {}).length > 0;
  
  if (!hasErrors) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="text-red-500 mt-0.5" size={20} />
            <div className="flex-1">
              <h4 className="text-red-800 font-medium mb-2">
                Please fix the following errors:
              </h4>
              <ul className="text-red-700 text-sm space-y-1">
                {Object.entries(validation.fieldErrors).map(([field, error]) => (
                  <li key={field} className="flex items-center space-x-2">
                    <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                    <span><strong>{field}:</strong> {error}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-red-400 hover:text-red-600 transition-colors"
              aria-label="Dismiss"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FilterValidationDisplay; 