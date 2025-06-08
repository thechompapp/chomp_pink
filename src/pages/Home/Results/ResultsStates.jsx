/**
 * Results States Components
 * 
 * Handles different UI states (loading, error, empty) for results.
 * Extracted from Results.jsx for better separation of concerns.
 */

import React from 'react';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import AddIcon from '@mui/icons-material/Add';
import { Link } from 'react-router-dom';
import { GRID_LAYOUTS } from '@/utils/layoutConstants';
import ItemSkeleton from './ItemSkeleton';

/**
 * Component for rendering loading skeletons
 */
export const ResultsLoading = ({ contentType }) => {
  return (
    <div className={GRID_LAYOUTS.PRIMARY}>
      {[...Array(10)].map((_, i) => (
        <ItemSkeleton key={`skeleton-${contentType}-${i}`} type={contentType} />
      ))}
    </div>
  );
};

/**
 * Component for rendering error state
 */
export const ResultsError = ({
  apiError,
  infiniteQueryError,
  processedPageError,
  contentType,
  refetch,
  setApiError
}) => {
  const errorMessage = apiError?.message || 
                      infiniteQueryError?.message || 
                      processedPageError || 
                      `Failed to load ${contentType}. Please try again.`;
  
  return (
    <div className="text-center py-8 px-4 max-w-lg mx-auto">
      <ErrorOutlineIcon className="h-10 w-10 text-red-400 mx-auto mb-3" />
      <p className="text-red-600 mb-4">{errorMessage}</p>
      <button
        onClick={() => {
          setApiError(null);
          refetch();
        }}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-chomp-blue hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <RefreshIcon className="-ml-1 mr-2 h-4 w-4" />
        Try Again
      </button>
    </div>
  );
};

/**
 * Component for rendering empty state
 */
export const ResultsEmpty = ({
  searchQuery,
  cityId,
  boroughId,
  neighborhoodId,
  hashtags,
  contentType
}) => {
  const isSearch = searchQuery && searchQuery.length > 0;
  const hasFilters = cityId || boroughId || neighborhoodId || (hashtags && hashtags.length > 0);
  
  return (
    <div className="text-center py-12 px-4">
      <DescriptionOutlinedIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
        {isSearch || hasFilters ? `No ${contentType} found` : `No ${contentType} yet`}
      </h3>
      <p className="text-gray-500 dark:text-gray-400 mb-6">
        {isSearch || hasFilters 
          ? `Try adjusting your search or filters to find ${contentType}.`
          : contentType === 'lists' 
            ? `Create your first list to get started!`
            : `Be the first to add ${contentType} to this area.`
        }
      </p>
      {contentType === 'lists' && !isSearch && !hasFilters && (
        <Link 
          to="/lists/new" 
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-chomp-blue hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <AddIcon className="-ml-1 mr-2 h-4 w-4" />
          Create Your First List
        </Link>
      )}
    </div>
  );
}; 