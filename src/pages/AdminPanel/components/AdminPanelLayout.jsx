/**
 * AdminPanelLayout Component
 * 
 * Handles the layout and navigation for the Admin Panel.
 * Extracted from AdminPanel.jsx to improve separation of concerns.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { cn } from '@/lib/utils';
import { AlertTriangle, Filter, RefreshCw, Search, Trash } from 'lucide-react';

/**
 * AdminPanelLayout Component
 * @param {Object} props - Component props
 * @returns {JSX.Element} Rendered component
 */
const AdminPanelLayout = ({
  children,
  title = 'Admin Panel',
  tabs = {},
  activeTab,
  onTabChange,
  onRefresh,
  onOpenCleanup,
  isRefreshing = false,
  isLoading = false,
  error = null
}) => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{title}</h1>
        
        <div className="flex space-x-2">
          {/* Refresh button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing || isLoading}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-md",
              "bg-blue-100 text-blue-700 hover:bg-blue-200",
              "dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800",
              "transition-colors duration-200",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
            <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
          </button>
          
          {/* Data cleanup button */}
          {activeTab && onOpenCleanup && (
            <button
              onClick={() => onOpenCleanup(activeTab)}
              disabled={isRefreshing || isLoading}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-md",
                "bg-amber-100 text-amber-700 hover:bg-amber-200",
                "dark:bg-amber-900 dark:text-amber-200 dark:hover:bg-amber-800",
                "transition-colors duration-200",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              <Trash size={16} />
              <span>Clean Data</span>
            </button>
          )}
        </div>
      </div>
      
      {/* Error display */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded-md">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-red-600 dark:text-red-400 mt-0.5" size={20} />
            <div>
              <h3 className="font-semibold text-red-700 dark:text-red-300">Error Loading Admin Data</h3>
              <p className="text-red-600 dark:text-red-400 mt-1">{error.message || 'An unknown error occurred'}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Tabs navigation */}
      {Object.keys(tabs).length > 0 && (
        <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
          <nav className="flex space-x-4 overflow-x-auto pb-2 -mb-px">
            {Object.entries(tabs).map(([key, { label }]) => (
              <button
                key={key}
                onClick={() => onTabChange(key)}
                className={cn(
                  "px-4 py-2 font-medium text-sm whitespace-nowrap",
                  "border-b-2 transition-colors duration-200",
                  activeTab === key
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600"
                )}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>
      )}
      
      {/* Main content */}
      <div className="min-h-[400px]">
        {children}
      </div>
    </div>
  );
};

AdminPanelLayout.propTypes = {
  children: PropTypes.node.isRequired,
  title: PropTypes.string,
  tabs: PropTypes.object,
  activeTab: PropTypes.string,
  onTabChange: PropTypes.func,
  onRefresh: PropTypes.func,
  onOpenCleanup: PropTypes.func,
  isRefreshing: PropTypes.bool,
  isLoading: PropTypes.bool,
  error: PropTypes.object
};

export default AdminPanelLayout;
