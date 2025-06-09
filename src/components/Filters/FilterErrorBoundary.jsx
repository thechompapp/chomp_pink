/**
 * FilterErrorBoundary.jsx - Error Boundary for Filter Components
 * 
 * Single Responsibility: Handle filter-related errors gracefully
 * - Catch JavaScript errors in filter components
 * - Provide user-friendly error messages
 * - Offer recovery options (retry, reset filters)
 * - Log errors for debugging
 */

import React from 'react';
import { AlertTriangle, RotateCcw, X } from 'lucide-react';
import Button from '@/components/UI/Button';
import { logError } from '@/utils/logger';

class FilterErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error for debugging
    logError('[FilterErrorBoundary] Filter component error:', {
      error: error.toString(),
      errorInfo,
      componentStack: errorInfo.componentStack,
      retryCount: this.state.retryCount
    });

    this.setState({
      error,
      errorInfo
    });

    // Report to error tracking service if available
    if (window.errorReporting) {
      window.errorReporting.captureException(error, {
        tags: { component: 'FilterSystem' },
        extra: errorInfo
      });
    }
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));

    // Call optional retry callback from props
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    });

    // Call optional reset callback from props
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleDismiss = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      const { fallback: CustomFallback, showDetails = false } = this.props;
      const { error, retryCount } = this.state;

      // Use custom fallback if provided
      if (CustomFallback) {
        return (
          <CustomFallback
            error={error}
            onRetry={this.handleRetry}
            onReset={this.handleReset}
            retryCount={retryCount}
          />
        );
      }

      // Default error UI
      return (
        <div className="p-6 border border-red-200 rounded-lg bg-red-50 max-w-md mx-auto">
          {/* Error Icon and Title */}
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-red-800">
                Filter System Error
              </h3>
              <div className="mt-1">
                <p className="text-sm text-red-700">
                  {retryCount > 2 
                    ? "The filter system is experiencing persistent issues. Please refresh the page or contact support if the problem continues."
                    : "There was an issue with the filter system. This is usually temporary."
                  }
                </p>
              </div>

              {/* Error Details (Debug Mode) */}
              {showDetails && error && (
                <details className="mt-3">
                  <summary className="text-xs text-red-600 cursor-pointer hover:text-red-800">
                    Technical Details
                  </summary>
                  <div className="mt-2 p-2 bg-red-100 rounded text-xs font-mono text-red-800 overflow-auto max-h-32">
                    {error.toString()}
                  </div>
                </details>
              )}

              {/* Action Buttons */}
              <div className="mt-4 flex flex-wrap gap-2">
                {retryCount < 3 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={this.handleRetry}
                    className="text-red-700 border-red-300 hover:bg-red-100"
                  >
                    <RotateCcw size={14} className="mr-1" />
                    Try Again
                  </Button>
                )}
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={this.handleReset}
                  className="text-red-700 border-red-300 hover:bg-red-100"
                >
                  Reset Filters
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={this.handleDismiss}
                  className="text-red-600 hover:text-red-800"
                >
                  <X size={14} className="mr-1" />
                  Dismiss
                </Button>
              </div>

              {/* Help Text */}
              <div className="mt-3 text-xs text-red-600">
                If this problem persists, try refreshing the page or clearing your browser cache.
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook version of FilterErrorBoundary for functional components
 */
export const useFilterErrorHandler = () => {
  const [error, setError] = React.useState(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const handleError = React.useCallback((error) => {
    logError('[useFilterErrorHandler] Filter error caught:', error);
    setError(error);
  }, []);

  React.useEffect(() => {
    const handleUnhandledRejection = (event) => {
      if (event.reason?.message?.includes('filter')) {
        handleError(event.reason);
        event.preventDefault();
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [handleError]);

  return {
    error,
    resetError,
    handleError,
    hasError: !!error
  };
};

export default FilterErrorBoundary; 