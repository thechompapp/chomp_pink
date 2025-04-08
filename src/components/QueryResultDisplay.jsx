/* src/components/QueryResultDisplay.jsx */
import React from 'react';
import LoadingSpinner from '@/components/UI/LoadingSpinner'; // Use global import alias
import ErrorMessage from '@/components/UI/ErrorMessage'; // Use global import alias

/**
 * A reusable component to handle common states from TanStack Query's useQuery hook.
 * It displays loading spinners, error messages, or renders children with the data.
 *
 * @param {object} queryResult - The result object returned by useQuery.
 * @param {string} [loadingMessage="Loading..."] - Message for the loading spinner.
 * @param {React.ReactNode | function(): React.ReactNode} [LoadingComponent=null] - Optional component to render instead of default spinner.
 * @param {string} [errorMessagePrefix="Failed to load data"] - Prefix for the error message.
 * @param {string} [noDataMessage="No data available."] - Message to display when query succeeds but data is considered empty.
 * @param {function} [isDataEmpty=(data) => !data || (Array.isArray(data) && data.length === 0)] - Function to determine if successful data is empty.
 * @param {React.ReactNode | function(data): React.ReactNode} children - Content to render on success, can be a node or a function receiving the data.
 * @param {React.ReactNode} [ErrorChildren=null] - Optional children to pass to the ErrorMessage component (e.g., a Back button).
 * @param {boolean} [showSpinnerOnRefetch=false] - Optionally show full spinner during background refetches (use isFetching).
 */
const QueryResultDisplay = ({
  queryResult,
  loadingMessage = "Loading...",
  LoadingComponent = null, // Added LoadingComponent prop
  errorMessagePrefix = "Failed to load data",
  noDataMessage = "No data available.",
  isDataEmpty = (data) => !data || (Array.isArray(data) && data.length === 0) || (typeof data === 'object' && data !== null && Object.keys(data).length === 0), // Improved empty check
  children,
  ErrorChildren = null,
  showSpinnerOnRefetch = false,
}) => {
  const { isLoading, isError, error, data, refetch, isFetching, isSuccess } = queryResult;

  // Handle initial loading or optional spinner during refetch
  const showLoading = isLoading || (showSpinnerOnRefetch && isFetching && !isError);

  if (showLoading) {
    // Render custom loading component if provided, otherwise default spinner
    return LoadingComponent ? (
        typeof LoadingComponent === 'function' ? LoadingComponent() : LoadingComponent
      ) : (
        <LoadingSpinner message={loadingMessage} />
    );
  }

  // Handle error state
  if (isError) {
     // Try to extract a more specific message from error details if available
     const specificError = error?.details?.error || error?.message || 'Unknown error';
     const displayMessage = `${errorMessagePrefix}: ${specificError}`;
    return (
      <ErrorMessage
        message={displayMessage}
        onRetry={refetch}
        isLoadingRetry={isFetching} // Show spinner in retry button if fetching
      >
        {ErrorChildren}
      </ErrorMessage>
    );
  }

  // Handle success state
  if (isSuccess) {
    // Check if data is considered empty using the provided function
    if (isDataEmpty(data)) {
      return <p className="text-center text-gray-500 py-8">{noDataMessage}</p>;
    }

    // Render children with data - can be a render prop or direct node
    return typeof children === 'function' ? children(data) : children;
  }

  // Fallback if none of the states match (should generally not happen with useQuery)
  return null;
};

export default QueryResultDisplay;