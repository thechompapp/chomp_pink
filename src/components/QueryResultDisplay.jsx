/* src/components/QueryResultDisplay.jsx */
/* REMOVED: All TypeScript syntax */
import React from 'react';
import LoadingSpinner from '@/components/UI/LoadingSpinner.jsx';
import ErrorMessage from '@/components/UI/ErrorMessage.jsx';

const QueryResultDisplay = ({
  queryResult, // Expects the object returned by useQuery
  loadingMessage = 'Loading...', // Default loading message
  // Allow passing a custom loading component or using the default LoadingSpinner
  LoadingComponent = null,
  errorMessagePrefix = 'Failed to load data', // Prefix for error messages
  noDataMessage = 'No data available.', // Message when data is successfully fetched but empty
  // Function to determine if the fetched data should be considered empty
  isDataEmpty = (data) => !data || (Array.isArray(data) && data.length === 0) || (typeof data === 'object' && data !== null && Object.keys(data).length === 0),
  children, // Function or component to render when data is successfully loaded and not empty
  ErrorChildren = null, // Optional additional elements to render within the ErrorMessage component
  showSpinnerOnRefetch = false, // Option to show spinner during background refetches
}) => {
  // Destructure necessary states from the queryResult object
  // Adjust based on React Query version (e.g., isLoading vs isInitialLoading, isFetching)
  const { isLoading, isError, error, data, refetch, isFetching, isSuccess } = queryResult;

  // Determine if the loading indicator should be shown
  // Show if initial load OR if refetching and showSpinnerOnRefetch is true
  const showLoading = isLoading || (showSpinnerOnRefetch && isFetching && !isSuccess);

  // Render Loading State
  if (showLoading) {
    // Use provided LoadingComponent or default LoadingSpinner
    return LoadingComponent ? (
      typeof LoadingComponent === 'function' ? <LoadingComponent /> : LoadingComponent
    ) : (
      <div className="flex justify-center items-center py-8">
        <LoadingSpinner message={loadingMessage} />
      </div>
    );
  }

  // Render Error State
  if (isError) {
    // Extract a user-friendly error message
    // Check for specific backend error structure or fallback to generic message
    const specificError = error?.response?.data?.error || error?.response?.data?.message || error?.message || 'Unknown error';
    const displayMessage = `${errorMessagePrefix}: ${specificError}`;
    return (
      <div className="py-8">
        <ErrorMessage
            message={displayMessage}
            onRetry={refetch} // Allow retrying the query
            isLoadingRetry={isFetching} // Indicate loading state during retry
        >
          {ErrorChildren} {/* Render any additional error content */}
        </ErrorMessage>
      </div>
    );
  }

  // Render Success State (Data Loaded)
  if (isSuccess) {
    // Check if the data is considered empty based on the provided function
    if (isDataEmpty(data)) {
      return <p className="text-center text-gray-500 py-8 text-sm">{noDataMessage}</p>;
    }
    // Render children with the fetched data
    // Supports render prop pattern (function as child) or standard component children
    return typeof children === 'function' ? children(data) : children;
  }

  // Return null if none of the states match (e.g., idle state before initial fetch)
  return null;
};

// Memoize the component for performance if props don't change unnecessarily often
export default React.memo(QueryResultDisplay);