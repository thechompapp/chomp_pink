/* src/pages/BulkAdd/ReviewMode.jsx */
/* Patched: Use toTitleCase utility to format displayed names */
/* Updated: Added support for duplicate detection */

import { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import { CheckCircle, AlertTriangle, Info, XCircle, Copy, AlertCircle } from 'lucide-react';
import Button from '@/components/UI/Button.jsx'; // Use global alias
import { toTitleCase } from '@/utils/formatting.js'; // Import the utility function

/**
 * ReviewMode component for reviewing processed bulk add items.
 * @param {object} props
 * @param {array} props.items - Processed items
 * @param {function} props.onSubmit - Handler for submitting items
 * @param {function} props.onBack - Handler for returning to input mode
 * @param {boolean} props.isSubmitting - Submitting state
 * @param {number} props.submitProgress - Submission progress (0-100)
 */
function ReviewMode({ items, onSubmit, onBack, isSubmitting, submitProgress }) {
  // State to track items that should be force-submitted despite being duplicates
  const [forceSubmitItems, setForceSubmitItems] = useState({});
  
  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    
    // Apply force submit flags to items
    const itemsWithForceFlags = items.map(item => {
      if (item.isDuplicate && forceSubmitItems[item._lineNumber]) {
        return { ...item, forceSubmit: true };
      }
      return item;
    });
    
    onSubmit(itemsWithForceFlags);
  }, [onSubmit, items, forceSubmitItems]);
  
  // Toggle force submit for a duplicate item
  const toggleForceSubmit = useCallback((lineNumber) => {
    setForceSubmitItems(prev => ({
      ...prev,
      [lineNumber]: !prev[lineNumber]
    }));
  }, []);

  const readyCount = items.filter(item => item.status === 'ready').length;
  const errorCount = items.filter(item => item.status === 'error').length;
  const skippedCount = items.filter(item => item.status === 'skipped').length;
  const reviewNeededCount = items.filter(item => item.status === 'review_needed').length;
  const duplicateCount = items.filter(item => item.isDuplicate).length;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-700">Review Items</h2>
        <div className="text-sm text-gray-600">
          Ready: {readyCount} | Errors: {errorCount} | Skipped: {skippedCount} 
          {duplicateCount > 0 && <span className="text-amber-600"> | Duplicates: {duplicateCount}</span>}
          {reviewNeededCount > 0 ? ` | Review Needed: ${reviewNeededCount}` : ''}
        </div>
      </div>
      
      {duplicateCount > 0 && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-4 rounded">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-amber-500" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-amber-800">Duplicate Detection</h3>
              <div className="mt-2 text-sm text-amber-700">
                <p>{duplicateCount} potential duplicate{duplicateCount !== 1 ? 's' : ''} found. These items already exist in the database.</p>
                <p className="mt-1">You can choose to skip these items (default) or force submit them by checking the "Force Submit" option.</p>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="overflow-x-auto border border-gray-200 rounded-md shadow-sm max-h-[70vh] overflow-y-auto">
        <table className="min-w-full bg-white divide-y divide-gray-200 table-fixed">
          <thead className="bg-gray-50 sticky top-0 z-10"><tr>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[5%]">Line</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[8%]">Type</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[15%]">Name</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[12%]">Location</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[12%]">Neighborhood</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[20%]">Address</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[10%]">Tags</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[8%]">Status</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[10%]">Message</th>
          </tr></thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items && items.length > 0 ? items.map((item, index) => {
              // Determine row class based on status and duplicate flag
              let rowClass = 'hover:bg-gray-50';
              if (item.status === 'error') rowClass += ' bg-red-50';
              else if (item.status === 'skipped') rowClass += ' bg-yellow-50 opacity-80';
              else if (item.isDuplicate) rowClass += ' bg-amber-50';
              else if (item.status === 'ready') rowClass += ' bg-green-50';
              
              return (
                <tr key={index} className={rowClass}>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{item._lineNumber || index + 1}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{item.type || '-'}</td>
                  {/* Use toTitleCase for the name */}
                  <td className="px-3 py-2 text-sm font-medium text-gray-900 truncate" title={toTitleCase(item.name || '-')}>
                    {toTitleCase(item.name || '-')}
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-700 truncate" 
                      title={item.type === 'restaurant' ? toTitleCase(item.city_name || '-') : toTitleCase(item.restaurant_name || '-')}>
                    {/* Use toTitleCase for restaurant name if it's a dish */}
                    {item.type === 'restaurant' ? toTitleCase(item.city_name || '-') : toTitleCase(item.restaurant_name || '-')}
                  </td>
                  {/* Use toTitleCase for neighborhood name */}
                  <td className="px-3 py-2 text-sm text-gray-700 truncate" title={toTitleCase(item.neighborhood_name || item.neighborhood || 'Default Neighborhood')}>
                    {toTitleCase(item.neighborhood_name || item.neighborhood || 'Default Neighborhood')}
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-700 truncate" title={item.address || '-'}>
                    {item.address || '-'}
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-700 truncate" title={item.tags?.length > 0 ? item.tags.join(', ') : '-'}>
                    {item.tags?.length > 0 ? item.tags.join(', ') : '-'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm">
                    {/* Status Indicators */}
                    {item.status === 'ready' && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" /> Ready</span>}
                    {item.status === 'error' && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" /> Error</span>}
                    {item.status === 'processing' && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Processing...</span>}
                    {item.status === 'pending' && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Pending</span>}
                    {item.status === 'skipped' && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><Info className="w-3 h-3 mr-1" /> Skipped</span>}
                    {item.status === 'review_needed' && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800"><AlertTriangle className="w-3 h-3 mr-1" /> Review</span>
                    )}
                    {item.isDuplicate && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800"><Copy className="w-3 h-3 mr-1" /> Duplicate</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-600">
                    {item.isDuplicate ? (
                      <div className="flex flex-col space-y-1">
                        <div className="truncate" title={item.message || `Duplicate of existing item`}>
                          {item.message || `Duplicate of existing item`}
                        </div>
                        <div className="flex items-center">
                          <input 
                            type="checkbox" 
                            id={`force-submit-${item._lineNumber}`}
                            checked={!!forceSubmitItems[item._lineNumber]}
                            onChange={() => toggleForceSubmit(item._lineNumber)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor={`force-submit-${item._lineNumber}`} className="ml-2 text-xs font-medium text-gray-700">
                            Force Submit
                          </label>
                        </div>
                      </div>
                    ) : (
                      <div className="truncate" title={item.message || (item.status === 'ready' ? 'Ready' : item.status === 'processing' ? 'Processing...' : '')}>
                        {item.message || (item.status === 'ready' ? 'Ready' : item.status === 'processing' ? 'Processing...' : '')}
                      </div>
                    )}
                  </td>
                </tr>
              );
            }) : (
                <tr>
                    <td colSpan="9" className="px-3 py-4 text-center text-sm text-gray-500">No items to review. Enter data above and click "Process Items".</td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
      {/* Progress bar and buttons */}
      {isSubmitting && (
        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mt-4">
          <div
            className="bg-blue-600 h-2.5 rounded-full transition-width duration-300 ease-out"
            style={{ width: `${submitProgress}%` }}
          ></div>
           <p className="text-sm text-gray-600 mt-1 text-center">Submitting... {submitProgress.toFixed(0)}%</p>
        </div>
      )}
      <div className="flex space-x-4 pt-4">
        <Button
          variant="secondary"
          onClick={onBack}
          disabled={isSubmitting}
        >
          Back to Input
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={isSubmitting || readyCount === 0}
          isLoading={isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : `Submit ${readyCount} Ready Items`}
        </Button>
      </div>
    </div>
  );
}

ReviewMode.propTypes = {
  items: PropTypes.arrayOf(PropTypes.shape({
    _lineNumber: PropTypes.number,
    name: PropTypes.string,
    type: PropTypes.string,
    status: PropTypes.string,
    message: PropTypes.string,
    isDuplicate: PropTypes.bool,
    duplicateInfo: PropTypes.object
  })).isRequired,
  onSubmit: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired,
  isSubmitting: PropTypes.bool.isRequired,
  submitProgress: PropTypes.number.isRequired,
};

export default ReviewMode;