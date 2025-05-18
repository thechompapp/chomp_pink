import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Filter, RefreshCw, Search, Trash } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { useAuthStore } from '../../stores/useAuthStore';
import GenericAdminTableTab from './GenericAdminTableTab';
import { DataCleanupModal } from '@/components/DataCleanupModal';
import { adminService } from '../../services/adminService';
import { dataCleanupService } from '../../services/dataCleanupService';

/**
 * Tab configuration for admin panel
 * @type {Object}
 */
const TAB_CONFIG = {
  submissions: { label: 'Submissions', key: 'submissions' },
  restaurants: { label: 'Restaurants', key: 'restaurants' },
  dishes: { label: 'Dishes', key: 'dishes' },
  users: { label: 'Users', key: 'users' },
  cities: { label: 'Cities', key: 'cities' },
  neighborhoods: { label: 'Neighborhoods', key: 'neighborhoods' },
  hashtags: { label: 'Hashtags', key: 'hashtags' },
  restaurant_chains: { label: 'Restaurant Chains', key: 'restaurant_chains' }
};

/**
 * Data processing utilities for admin panel
 */
const DataProcessor = {
  /**
   * Process the response data consistently for each endpoint
   * @param {Object|Array} response - API response data
   * @param {string} endpoint - API endpoint name
   * @returns {Array} Processed data array
   */
  processResponseData: (response, endpoint) => {
    if (!response) {
      console.warn(`Empty response for ${endpoint}`);
      return [];
    }
    
    // Handle array response
    if (Array.isArray(response)) {
      return response;
    }
    
    // Handle { data: [...] } response
    if (response.data && Array.isArray(response.data)) {
      return response.data;
    }
    
    // Handle { data: { data: [...] } } response
    if (response.data?.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    
    // Try to find any array property
    if (typeof response === 'object' && response !== null) {
      const arrayProps = Object.keys(response).filter(key => Array.isArray(response[key]));
      if (arrayProps.length > 0) {
        return response[arrayProps[0]];
      }
    }
    
    // Return empty array as fallback
    console.warn(`Could not extract array data from ${endpoint} response:`, response);
    return [];
  },

  /**
   * Fetch data for a specific endpoint
   * @param {string} endpoint - API endpoint name
   * @returns {Promise<Object>} Object containing endpoint name and data
   */
  fetchEndpointData: async (endpoint) => {
    try {
      console.log(`Fetching data for ${endpoint}`);
      const response = await adminService.getAdminData(endpoint);
      const processedData = DataProcessor.processResponseData(response, endpoint);
      
      console.log(`Successfully processed ${endpoint} data:`, {
        length: processedData.length
      });
      
      return { endpoint, data: processedData };
    } catch (error) {
      console.error(`Error fetching ${endpoint}:`, {
        message: error.message,
        status: error.response?.status
      });
      
      return { endpoint, data: [] };
    }
  },

  /**
   * Fetch all admin data from the API
   * @returns {Promise<Object>} Object containing data for all endpoints
   */
  fetchAllAdminData: async () => {
    try {
      console.log('Fetching admin data...');
      
      // This will be populated with results from API
      const data = {};
      
      // Get all endpoint names from TAB_CONFIG
      const endpoints = Object.keys(TAB_CONFIG);
      
      // Use Promise.all for parallel requests to improve performance
      const results = await Promise.all(
        endpoints.map(endpoint => DataProcessor.fetchEndpointData(endpoint))
      );
      
      // Populate the data object with results
      results.forEach(({ endpoint, data: endpointData }) => {
        data[endpoint] = endpointData;
      });
      
      console.log('All admin data fetched:', 
        Object.entries(data).map(([key, val]) => `${key}: ${val.length}`).join(', '));
      
      return data;
    } catch (error) {
      console.error('Error in fetchAllAdminData:', error);
      throw error;
    }
  }
};

/**
 * Data cleanup utilities for admin panel
 */
const DataCleanupManager = {
  /**
   * Analyze data for cleanup and get changes
   * @param {string} resourceType - Type of resource to analyze
   * @returns {Promise<Array>} List of changes
   */
  analyzeData: async (resourceType) => {
    console.log(`[AdminPanel] Calling dataCleanupService.analyzeData(${resourceType})`);
    
    try {
      const changes = await dataCleanupService.analyzeData(resourceType);
      console.log(`[AdminPanel] Received ${changes.length} cleanup changes for ${resourceType}:`, changes);
      return changes;
    } catch (error) {
      console.error('[AdminPanel] Error analyzing data:', error);
      throw error;
    }
  },
  
  /**
   * Process and approve changes
   * @param {Array} changes - Changes to approve
   * @param {string} resourceType - Type of resource being changed
   * @returns {Promise<Object>} Processing result
   */
  approveChanges: async (changes, resourceType) => {
    console.log(`[AdminPanel] Approving ${changes.length} changes for ${resourceType}`);
    
    try {
      const result = await dataCleanupService.applyChanges(changes, true);
      console.log('[AdminPanel] Changes approved successfully:', result);
      return result;
    } catch (error) {
      console.error('[AdminPanel] Error approving changes:', error);
      throw error;
    }
  },
  
  /**
   * Process and reject changes
   * @param {Array} changes - Changes to reject
   * @param {string} resourceType - Type of resource being changed
   * @returns {Promise<Object>} Processing result
   */
  rejectChanges: async (changes, resourceType) => {
    console.log(`[AdminPanel] Rejecting ${changes.length} changes for ${resourceType}`);
    
    try {
      const result = await dataCleanupService.applyChanges(changes, false);
      console.log('[AdminPanel] Changes rejected successfully:', result);
      return result;
    } catch (error) {
      console.error('[AdminPanel] Error rejecting changes:', error);
      throw error;
    }
  }
};

/**
 * Main AdminPanel component
 */
const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('submissions');
  const [showFilters, setShowFilters] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDataCleanup, setIsDataCleanup] = useState(false);
  const [isCleanupModalOpen, setIsCleanupModalOpen] = useState(false);
  const [cleanupChanges, setCleanupChanges] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [displayChanges, setDisplayChanges] = useState({});
  
  // Get auth state
  const { isAuthenticated, isSuperuser, token, checkAuthStatus } = useAuthStore();
  
  // Check if user is authorized
  const isAuthorized = useMemo(() => {
    console.log('[AdminPanel] Authorization check:', { 
      isAuthenticated, 
      isSuperuser, 
      hasToken: Boolean(token), 
      result: isAuthenticated && isSuperuser && token 
    });
    return isAuthenticated && isSuperuser && token;
  }, [isAuthenticated, isSuperuser, token]);

  /**
   * Verify authentication status
   */
  const verifyAuth = async () => {
    try {
      console.log('[AdminPanel] Starting auth verification...');
      // Always check auth status on mount to ensure state is up-to-date
      await checkAuthStatus();
      console.log('[AdminPanel] Auth verification completed successfully');
    } catch (error) {
      console.error('[AdminPanel] Auth verification failed:', error);
    } finally {
      console.log('[AdminPanel] Auth verification complete, isInitializing set to false');
      setIsInitializing(false);
    }
  };
  
  // Check auth status on mount
  useEffect(() => {
    verifyAuth();
  }, [checkAuthStatus]); // Only depend on checkAuthStatus, not token

  // Log authorization state changes
  useEffect(() => {
    console.log('[AdminPanel] Authorization state updated:', { 
      isAuthorized, 
      isInitializing 
    });
  }, [isAuthorized, isInitializing]);

  // Fetch admin data
  const { 
    data: adminData, 
    error, 
    refetch, 
    isFetching,
    isError
  } = useQuery({
    queryKey: ['adminData', token],
    queryFn: DataProcessor.fetchAllAdminData,
    enabled: Boolean(isAuthorized), // Ensure this is a boolean value
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 1,
    onError: (error) => {
      console.error('[useQuery] Error fetching admin data:', error);
      console.error('[useQuery] Error details:', {
        message: error.message,
        stack: error.stack,
        response: error.response ? {
          status: error.response.status,
          data: error.response.data
        } : 'No response data'
      });
    },
    onSuccess: (data) => {
      console.log('[useQuery] Successfully fetched admin data:', {
        keys: Object.keys(data),
        lengths: Object.entries(data).map(([key, value]) => ({ [key]: value.length })) 
      });
    }
  });

  // Log display changes for debugging
  useEffect(() => {
    if (Object.keys(displayChanges).length > 0) {
      console.log('[AdminPanel] displayChanges state updated:', displayChanges);
      console.log('[AdminPanel] Keys in displayChanges:', Object.keys(displayChanges));
      if (displayChanges[activeTab]) {
        console.log(`[AdminPanel] Changes for current tab (${activeTab}):`, displayChanges[activeTab]);
      }
    } else {
      console.log('[AdminPanel] displayChanges state is empty');
    }
  }, [displayChanges, activeTab]);

  /**
   * Analyze data for cleanup and handle results
   */
  const analyzeDataForCleanup = async () => {
    setIsAnalyzing(true);
    
    try {
      const changes = await DataCleanupManager.analyzeData(activeTab);
      
      if (changes.length === 0) {
        console.log('[AdminPanel] No cleanup issues found, setting isDataCleanup=true');
        toast.success(`No cleanup issues found for ${TAB_CONFIG[activeTab]?.label || activeTab}`);
        setIsDataCleanup(true);
      } else {
        console.log('[AdminPanel] Found cleanup issues, opening modal');
        setCleanupChanges(changes);
        console.log('[AdminPanel] Setting isCleanupModalOpen=true');
        setIsCleanupModalOpen(true);
        console.log('[AdminPanel] Current modal state after setting:', { isCleanupModalOpen });
      }
    } catch (error) {
      console.error('[AdminPanel] Error analyzing data:', error);
      toast.error(`Failed to analyze data: ${error.message || 'Unknown error'}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  /**
   * Toggle data cleanup mode
   */
  const toggleDataCleanup = async () => {
    console.log(`[AdminPanel] Toggling data cleanup mode. Current mode: ${isDataCleanup}`);
    
    if (isDataCleanup) {
      // Turn off data cleanup mode
      console.log('[AdminPanel] Turning off data cleanup mode');
      setIsDataCleanup(false);
      // Clear any display changes
      setDisplayChanges({});
    } else {
      // Turn on data cleanup mode
      console.log('[AdminPanel] Turning on data cleanup mode, analyzing data');
      await analyzeDataForCleanup();
    }
  };

  /**
   * Handle cleanup modal close
   */
  const handleCleanupModalClose = () => {
    console.log('[AdminPanel] Closing cleanup modal');
    setIsCleanupModalOpen(false);
    // Keep cleanup mode on if modal is just closed
    setIsDataCleanup(true);
  };

  /**
   * Handle approving changes
   * @param {Array} changesToApprove - Changes to approve
   */
  const handleApproveChanges = async (changesToApprove) => {
    console.log(`[AdminPanel] Approving ${changesToApprove.length} changes`);
    
    try {
      // Process changes on server
      await DataCleanupManager.approveChanges(changesToApprove, activeTab);
      
      // Update UI with success message
      toast.success(`Approved ${changesToApprove.length} changes`);
      
      // Refetch data to get updated values
      await refetch();
      
    } catch (error) {
      console.error('[AdminPanel] Error approving changes:', error);
      toast.error(`Failed to approve changes: ${error.message || 'Unknown error'}`);
    }
  };

  /**
   * Handle rejecting changes
   * @param {Array} changesToReject - Changes to reject
   */
  const handleRejectChanges = async (changesToReject) => {
    console.log(`[AdminPanel] Rejecting ${changesToReject.length} changes`);
    
    try {
      // Process changes on server
      await DataCleanupManager.rejectChanges(changesToReject, activeTab);
      
      // Update UI with success message
      toast.success(`Rejected ${changesToReject.length} changes`);
      
      // If all changes are rejected, no need to refetch data
      if (changesToReject.length === cleanupChanges.length) {
        console.log('[AdminPanel] All changes rejected, no refetch needed');
      } else {
        // Refetch data to ensure we have correct state
        await refetch();
      }
      
    } catch (error) {
      console.error('[AdminPanel] Error rejecting changes:', error);
      toast.error(`Failed to reject changes: ${error.message || 'Unknown error'}`);
    }
  };

  // Show loading state during initialization
  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-100 border-t-blue-500"></div>
      </div>
    );
  }

  // Check authorization after initial load
  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-md text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">
            You don't have permission to access the admin panel. Please contact an administrator.
          </p>
        </div>
      </div>
    );
  }

  // Show error state if there was an error fetching data
  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5" aria-hidden="true" />
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-red-800">
                Something went wrong in the Admin Panel
              </h3>
              <div className="mt-2 text-sm text-red-700 space-y-2">
                <p>
                  <span className="font-medium">Error:</span>{' '}
                  {error?.message || 'An unknown error occurred.'}
                </p>
                <button
                  onClick={() => refetch()}
                  className="mt-2 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-sm"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Calculate loading state and current data
  const isLoading = isFetching && !adminData;
  const currentData = adminData?.[activeTab] || [];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          {isFetching && !isLoading && (
            <p className="text-sm text-gray-500 mt-1">Updating data...</p>
          )}
        </div>
        <div className="flex space-x-2 mt-2 md:mt-0">
          <button
            onClick={() => setShowFilters(prev => !prev)}
            className="px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 rounded-md text-sm flex items-center transition-colors duration-150"
            aria-label={showFilters ? 'Hide filters' : 'Show filters'}
            disabled={isLoading}
          >
            <Filter className="h-4 w-4 mr-1.5" />
            {showFilters ? 'Hide' : 'Show'} Filters
          </button>
          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-md text-sm flex items-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
            aria-label="Refresh data"
          >
            <RefreshCw className={`h-4 w-4 mr-1.5 ${isFetching ? 'animate-spin' : ''}`} />
            {isFetching ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-6 overflow-x-auto pb-px -mb-px">
          {Object.entries(TAB_CONFIG).map(([key, { label }]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={cn(
                'py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap',
                activeTab === key
                  ? 'border-blue-500 text-blue-600 font-semibold'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                'transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:ring-offset-2 focus:rounded-sm',
                'flex items-center space-x-1.5'
              )}
              aria-current={activeTab === key ? 'page' : undefined}
            >
              <span>{label}</span>
              {isFetching && activeTab === key && (
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-100 border-t-blue-500 mb-4"></div>
            <p className="text-gray-600">Loading {TAB_CONFIG[activeTab]?.label.toLowerCase()} data...</p>
          </div>
        ) : (
          <>
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800">
                {TAB_CONFIG[activeTab]?.label || 'Data'}
              </h2>
              <div className="text-sm text-gray-500 flex items-center gap-2">
                {/* Search Input */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="search"
                    placeholder={`Search ${TAB_CONFIG[activeTab]?.label || 'items'}...`}
                    className="w-64 pl-10 pr-3 py-1.5 border border-gray-300 rounded-md text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                {/* Data Cleanup Button */}
                <button
                  className={`px-2.5 py-1.5 ${isDataCleanup ? 'bg-orange-200 text-orange-800' : 'bg-orange-50 text-orange-700'} border border-orange-200 rounded-md text-sm hover:bg-orange-100 transition-colors flex items-center gap-1`}
                  onClick={toggleDataCleanup}
                  disabled={isAnalyzing}
                >
                  <Trash className={`h-3.5 w-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
                  <span>
                    {isAnalyzing 
                      ? 'Analyzing...' 
                      : isDataCleanup 
                        ? 'Exit Cleanup' 
                        : 'Cleanup'
                    }
                  </span>
                </button>
                <span>
                  Showing {currentData.length} items
                </span>
              </div>
            </div>
            <GenericAdminTableTab
              resourceType={activeTab}
              initialData={currentData}
              isLoading={isLoading}
              error={error}
              onRetry={refetch}
              cities={adminData?.cities || []}
              neighborhoods={adminData?.neighborhoods || []}
              searchTerm={searchTerm}
              isDataCleanup={isDataCleanup}
              displayChanges={displayChanges}
            />
          </>
        )}
      </div>
      
      {/* Data Cleanup Modal */}
      <DataCleanupModal
        isOpen={isCleanupModalOpen}
        onClose={handleCleanupModalClose}
        changes={cleanupChanges}
        onApprove={handleApproveChanges}
        onReject={handleRejectChanges}
        onApproveAll={handleApproveChanges}
        onRejectAll={handleRejectChanges}
        resourceType={activeTab}
      />
    </div>
  );
};

const AdminPanelErrorBoundary = ({ children }) => {
  const [errorState, setErrorState] = useState({
    hasError: false,
    error: null,
    errorInfo: null,
    timestamp: null
  });

  const handleReset = useCallback(() => {
    console.log('[ErrorBoundary] Resetting error state');
    setErrorState({
      hasError: false,
      error: null,
      errorInfo: null,
      timestamp: null
    });
  }, []);

  const handleError = useCallback((error, errorInfo) => {
    console.error('[ErrorBoundary] Error caught:', { 
      error, 
      errorInfo,
      timestamp: new Date().toISOString()
    });
    
    setErrorState({
      hasError: true,
      error,
      errorInfo,
      timestamp: new Date().toISOString()
    });
    
    // Only log to error tracking in production
    if (process.env.NODE_ENV === 'production') {
      // logErrorToService(error, errorInfo);
    }
  }, []);

  // Handle component errors
  useEffect(() => {
    console.log('[ErrorBoundary] Setting up error handlers');
    
    // Handle React component errors
    const handleComponentError = (error, errorInfo) => {
      console.error('[ErrorBoundary] Component error:', { error, errorInfo });
      handleError(error, errorInfo);
    };
    
    // Handle uncaught JavaScript errors
    const handleUncaughtError = (event) => {
      console.error('[ErrorBoundary] Uncaught error:', event.error);
      event.preventDefault();
      handleError(
        event.error || new Error('Unknown error'),
        { 
          componentStack: event.error?.stack || 'No stack trace available',
          type: 'uncaught',
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      );
    };
    
    // Handle unhandled promise rejections
    const handleUnhandledRejection = (event) => {
      console.error('[ErrorBoundary] Unhandled rejection:', event.reason);
      event.preventDefault();
      handleError(
        event.reason || new Error('Unhandled promise rejection'),
        { 
          componentStack: event.reason?.stack || 'No stack trace available',
          type: 'unhandled_rejection'
        }
      );
    };
    
    // Set up error listeners
    const errorHandler = (event) => {
      // This handles errors from error boundaries
      if (event.detail && event.detail.error) {
        handleError(event.detail.error, event.detail.errorInfo || {});
      }
    };
    
    window.addEventListener('error', handleUncaughtError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('react-error-boundary', errorHandler);
    
    // Clean up
    return () => {
      window.removeEventListener('error', handleUncaughtError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('react-error-boundary', errorHandler);
    };
  }, [handleError]);

  if (errorState.hasError) {
    console.log('[ErrorBoundary] Rendering error UI', { errorState });
    
    return (
      <div className="p-4 max-w-4xl mx-auto">
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5" aria-hidden="true" />
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-red-800">
                Something went wrong in the Admin Panel
              </h3>
              <div className="mt-2 text-sm text-red-700 space-y-2">
                <p>
                  <span className="font-medium">Error:</span>{' '}
                  {errorState.error?.message || 'An unknown error occurred.'}
                </p>
                
                {errorState.timestamp && (
                  <p className="text-xs text-red-600">
                    Error occurred at: {new Date(errorState.timestamp).toLocaleString()}
                  </p>
                )}
                
                {/* Show component stack in development */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="space-y-2">
                    {errorState.errorInfo?.componentStack && (
                      <details className="mt-2 text-xs bg-red-50 p-2 rounded overflow-auto max-h-40">
                        <summary className="font-medium cursor-pointer mb-1">
                          Component Stack
                        </summary>
                        <pre className="whitespace-pre-wrap">
                          {errorState.errorInfo.componentStack}
                        </pre>
                      </details>
                    )}
                    
                    {errorState.error?.stack && (
                      <details className="mt-2 text-xs bg-red-50 p-2 rounded overflow-auto max-h-40">
                        <summary className="font-medium cursor-pointer mb-1">
                          Error Stack
                        </summary>
                        <pre className="whitespace-pre-wrap">
                          {errorState.error.stack}
                        </pre>
                      </details>
                    )}
                    
                    <div className="text-xs text-gray-500 mt-2">
                      <p>Check the browser console for more details.</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mt-4 flex space-x-3">
                <button
                  type="button"
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  onClick={handleReset}
                >
                  Try again
                </button>
                <a
                  href="/"
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Go to home
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render children normally
  return children;
};

const AdminPanelWithBoundary = () => (
  <AdminPanelErrorBoundary>
    <AdminPanel />
  </AdminPanelErrorBoundary>
);

export default AdminPanelWithBoundary;
