/* src/components/QueryResultDisplay.jsx */
import React from 'react';
import LoadingSpinner from '@/components/UI/LoadingSpinner.jsx';
import ErrorMessage from '@/components/UI/ErrorMessage.jsx';

const QueryResultDisplay = ({
  queryResult,
  loadingMessage = "Loading...",
  LoadingComponent = null,
  errorMessagePrefix = "Failed to load data",
  noDataMessage = "No data available.",
  isDataEmpty = (data) => !data || (Array.isArray(data) && data.length === 0) || (typeof data === 'object' && data !== null && Object.keys(data).length === 0),
  children,
  ErrorChildren = null,
  showSpinnerOnRefetch = false,
}) => {
  const { isLoading, isError, error, data, refetch, isFetching, isSuccess } = queryResult;

  const showLoading = isLoading || (showSpinnerOnRefetch && isFetching && !isError);

  if (showLoading) {
    return LoadingComponent ? (
      typeof LoadingComponent === 'function' ? LoadingComponent() : LoadingComponent
    ) : (
      <LoadingSpinner message={loadingMessage} />
    );
  }

  if (isError) {
    const specificError = error?.details?.error || error?.message || 'Unknown error';
    const displayMessage = `${errorMessagePrefix}: ${specificError}`;
    return (
      <ErrorMessage
        message={displayMessage}
        onRetry={refetch}
        isLoadingRetry={isFetching}
      >
        {ErrorChildren}
      </ErrorMessage>
    );
  }

  if (isSuccess) {
    if (isDataEmpty(data)) {
      return <p className="text-center text-gray-500 py-8">{noDataMessage}</p>;
    }
    return typeof children === 'function' ? children(data) : children;
  }

  return null;
};

export default QueryResultDisplay;