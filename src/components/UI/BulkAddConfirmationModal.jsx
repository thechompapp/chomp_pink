import React from 'react';
import PropTypes from 'prop-types';
import './ConfirmationModal.css'; // Reuse existing modal styles

/**
 * BulkAddConfirmationModal - A specialized modal for displaying bulk add results
 * Shows summary statistics and detailed results with appropriate styling
 */
const BulkAddConfirmationModal = ({ isOpen, onClose, results }) => {
  if (!isOpen) return null;

  const { summary, details } = results || { summary: {}, details: [] };
  
  // Default values if not provided
  const total = summary?.total || 0;
  const added = summary?.added || 0;
  const duplicates = summary?.duplicates || 0;
  const errors = summary?.errors || 0;

  return (
    <div className="modal-overlay">
      <div className="modal-container max-w-2xl">
        <div className="modal-header">
          <h2 className="text-xl font-bold">Bulk Add Results</h2>
          <button
            className="modal-close-button"
            onClick={onClose}
            aria-label="Close"
          >
            &times;
          </button>
        </div>
        
        <div className="modal-content">
          {/* Summary statistics */}
          <div className="summary-stats mb-4 p-3 bg-gray-50 rounded-md">
            <h3 className="text-lg font-semibold mb-2">Summary</h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="stat-item">
                <span className="font-medium">Total Items:</span> {total}
              </div>
              <div className="stat-item">
                <span className="font-medium">Added to Database:</span> 
                <span className="text-green-600"> {added}</span>
              </div>
              <div className="stat-item">
                <span className="font-medium">Duplicates:</span> 
                <span className={duplicates > 0 ? "text-yellow-600" : ""}> {duplicates}</span>
              </div>
              <div className="stat-item">
                <span className="font-medium">Errors:</span> 
                <span className={errors > 0 ? "text-red-600" : ""}> {errors}</span>
              </div>
            </div>
          </div>
          
          {/* Detailed results */}
          {details && details.length > 0 && (
            <div className="details-section">
              <h3 className="text-lg font-semibold mb-2">Details</h3>
              <div className="max-h-60 overflow-y-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-4 py-2 text-left">Item</th>
                      <th className="px-4 py-2 text-left">Status</th>
                      <th className="px-4 py-2 text-left">Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    {details.map((item, index) => {
                      // Determine status style
                      let statusClass = '';
                      let statusIcon = '';
                      
                      if (item.status === 'success') {
                        statusClass = 'text-green-600';
                        statusIcon = '✓';
                      } else if (item.status === 'warning') {
                        statusClass = 'text-yellow-600';
                        statusIcon = '⚠️';
                      } else if (item.status === 'error') {
                        statusClass = 'text-red-600';
                        statusIcon = '✕';
                      }
                      
                      return (
                        <tr key={index} className="border-b border-gray-200">
                          <td className="px-4 py-2">{item.name}</td>
                          <td className={`px-4 py-2 ${statusClass}`}>
                            <span className="mr-1">{statusIcon}</span>
                            {item.status === 'warning' ? 'Duplicate' : 
                             item.status === 'success' ? 'Added' : 
                             item.status === 'error' ? 'Error' : item.status}
                          </td>
                          <td className="px-4 py-2">{item.message}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
        
        <div className="modal-footer">
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

BulkAddConfirmationModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  results: PropTypes.shape({
    summary: PropTypes.shape({
      total: PropTypes.number,
      added: PropTypes.number,
      duplicates: PropTypes.number,
      errors: PropTypes.number
    }),
    details: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string.isRequired,
        status: PropTypes.string.isRequired,
        message: PropTypes.string
      })
    )
  })
};

export default BulkAddConfirmationModal; 