/**
 * AdminTabContent Component
 * 
 * Renders the content for the selected admin tab.
 * Extracted from AdminPanel.jsx to improve separation of concerns.
 */

import React from 'react';
import PropTypes from 'prop-types';
import GenericAdminTableTab from './GenericAdminTableTab';
import { Loader2 } from 'lucide-react';

/**
 * AdminTabContent Component
 * @param {Object} props - Component props
 * @returns {JSX.Element} Rendered component
 */
const AdminTabContent = ({
  activeTab,
  tabData = [],
  isLoading = false,
  onRefresh
}) => {
  // Render loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Loading admin data...</p>
      </div>
    );
  }
  
  // Render empty state
  if (!tabData || tabData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-4 mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-10 w-10 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
          No data available
        </h3>
        <p className="text-gray-500 dark:text-gray-400 max-w-md mb-4">
          There are no items to display for this category. Items will appear here once they are created.
        </p>
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800 rounded-md transition-colors duration-200"
        >
          Refresh Data
        </button>
      </div>
    );
  }
  
  // Render tab content based on active tab
  return (
    <GenericAdminTableTab
      resourceType={activeTab}
      data={tabData}
    />
  );
};

AdminTabContent.propTypes = {
  activeTab: PropTypes.string.isRequired,
  tabData: PropTypes.array,
  isLoading: PropTypes.bool,
  onRefresh: PropTypes.func
};

export default AdminTabContent;
