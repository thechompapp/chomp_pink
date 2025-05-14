/* src/pages/BulkAdd/InputMode.jsx */
/* Patched: Use default parameters instead of defaultProps, clarify placeholder text */

import React from 'react';
import PropTypes from 'prop-types';

// Use default parameters in the function signature
const InputMode = ({
  onRawTextChange,
  onSubmit,
  rawText = '', // Default parameter
  isProcessing = false, // Default parameter
  processingProgress
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (typeof onSubmit === 'function') {
      onSubmit();
    } else {
      console.error('[InputMode] onSubmit is not a function');
    }
  };

  const handleChange = (e) => {
    if (typeof onRawTextChange === 'function') {
      onRawTextChange(e.target.value);
    } else {
      console.error('[InputMode] onRawTextChange is not a function');
    }
  };

  // ** Updated placeholder text for clarity **
   const exampleFormat = `Restaurant Example: Katz's Deli; restaurant; New York; pastrami, jewish deli
Dish Example: Plain Pie; dish; Lucali; pizza, brooklyn`;


  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="bulkInput" className="block text-sm font-medium text-gray-700 mb-1">
          Enter Dishes or Restaurants (one per line)
        </label>
        {/* ** Updated description text ** */}
        <p className="text-xs text-gray-500 mb-2">
          Format: <code className="bg-gray-200 px-1 rounded">name; type; location; tags</code> (comma-separated)<br/>
          - For <code className="bg-gray-200 px-1 rounded">restaurant</code> type, 'location' is the **City Name** (e.g., New York).<br/>
          - For <code className="bg-gray-200 px-1 rounded">dish</code> type, 'location' is the **Restaurant Name** (e.g., Lucali).
        </p>
        <textarea
          id="bulkInput"
          value={rawText}
          onChange={handleChange}
          rows={15}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 font-mono text-sm"
          style={{ minWidth: '100%', maxWidth: '100%' }}
          placeholder={exampleFormat} // Use the updated example format
          disabled={isProcessing}
        />
      </div>
      {isProcessing && (
        <div className="mt-2">
          <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-width duration-300 ease-out" // Added transition
              style={{ width: `${processingProgress}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Processing... {processingProgress.toFixed(0)}%
          </p>
        </div>
      )}
      <button
        type="submit"
        disabled={isProcessing || !rawText.trim()}
        className="px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessing ? 'Processing...' : 'Process Items'}
      </button>
    </form>
  );
};

InputMode.propTypes = {
  onRawTextChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  rawText: PropTypes.string,
  isProcessing: PropTypes.bool,
  processingProgress: PropTypes.number.isRequired,
};

// Default props removed, handled by default parameters now

export default InputMode;