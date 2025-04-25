/* src/pages/BulkAdd/ReviewMode.jsx */
/* Patched: Use toTitleCase utility to format displayed names */

import { useCallback } from 'react';
import PropTypes from 'prop-types';
import { CheckCircle, AlertTriangle, Info, XCircle } from 'lucide-react';
import Button from '@/components/UI/Button.jsx'; // Use global alias
import { toTitleCase } from '@/utils/formatting.js'; // ++ Import the utility function ++

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
  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    onSubmit();
  }, [onSubmit]);

  const readyCount = items.filter(item => item.status === 'ready').length;
  const errorCount = items.filter(item => item.status === 'error').length;
  const skippedCount = items.filter(item => item.status === 'skipped').length;
  const reviewNeededCount = items.filter(item => item.status === 'review_needed').length;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-700">Review Items</h2>
        <div className="text-sm text-gray-600">
          Ready: {readyCount} | Errors: {errorCount} | Skipped: {skippedCount} {reviewNeededCount > 0 ? `| Review Needed: ${reviewNeededCount}` : ''}
        </div>
      </div>
      <div className="overflow-x-auto border border-gray-200 rounded-md shadow-sm max-h-[60vh] overflow-y-auto">
        <table className="min-w-full bg-white divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10"><tr>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Line</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location Detail</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Neighborhood</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">Address</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tags</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px]">Message</th>
          </tr></thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items && items.length > 0 ? items.map((item, index) => (
              <tr key={index} className={`hover:bg-gray-50 ${item.status === 'error' ? 'bg-red-50' : item.status === 'skipped' ? 'bg-yellow-50 opacity-80' : ''}`}>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{item._lineNumber || index + 1}</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{item.type || '-'}</td>
                {/* ++ Use toTitleCase for the name ++ */}
                <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{toTitleCase(item.name || '-')}</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">
                  {/* ++ Use toTitleCase for restaurant name if it's a dish ++ */}
                  {item.type === 'restaurant' ? toTitleCase(item.city_name || '-') : toTitleCase(item.restaurant_name || '-')}
                </td>
                {/* ++ Use toTitleCase for neighborhood name ++ */}
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">{toTitleCase(item.neighborhood_name || '-')}</td>
                <td className="px-3 py-2 text-sm text-gray-700">{item.address || '-'}</td>
                <td className="px-3 py-2 text-sm text-gray-700">
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
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800"><AlertTriangle className="w-3 h-3 mr-1" /> Review Needed</span>
                  )}
                </td>
                 <td className="px-3 py-2 text-sm text-gray-600">
                    {item.message || (item.status === 'ready' ? 'Ready' : item.status === 'processing' ? 'Processing...' : '')}
                 </td>
              </tr>
            )) : (
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
  items: PropTypes.arrayOf(PropTypes.object).isRequired,
  onSubmit: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired,
  isSubmitting: PropTypes.bool.isRequired,
  submitProgress: PropTypes.number.isRequired,
};

export default ReviewMode;