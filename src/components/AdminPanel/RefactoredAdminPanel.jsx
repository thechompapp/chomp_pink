/**
 * Refactored Admin Panel Component
 * 
 * Main container for the Admin Panel using extracted modules.
 * Dramatically simplified from the original 821-line monolithic component.
 * 
 * This component focuses solely on:
 * - Module coordination
 * - UI composition
 * - Event handling delegation
 */

import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Filter, RefreshCw, Search, Trash } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DataCleanupModal } from '@/components/DataCleanupModal';
import GenericAdminTableTab from '@/pages/AdminPanel/GenericAdminTableTab';

// Import all the extracted modules
import {
  TAB_CONFIG,
  DataProcessor,
  DataFilter,
  useAdminPanelState,
  useAdminAuthentication,
  DataCleanupManager,
  CleanupFeedback
} from '@/pages/AdminPanel/modules';

/**
 * Refactored Admin Panel Component
 * @returns {JSX.Element} Rendered component
 */
const RefactoredAdminPanel = () => {
  // Use extracted authentication module
  const {
    isLoading: isAuthLoading,
    hasAccess,
    handleAuthVerification
  } = useAdminAuthentication();

  // Use extracted state management module
  const {
    state,
    setActiveTab,
    setShowFilters,
    setSearchTerm,
    setIsDataCleanup,
    setIsCleanupModalOpen,
    setCleanupChanges,
    setIsAnalyzing,
    initializePanel,
    resetCleanupState
  } = useAdminPanelState();

  // Destructure state for easier access
  const {
    activeTab,
    showFilters,
    searchTerm,
    isDataCleanup,
    isCleanupModalOpen,
    cleanupChanges,
    isAnalyzing
  } = state;

  // Verify authentication on mount and auth changes
  useEffect(() => {
    handleAuthVerification().then(result => {
      if (result.verified) {
        initializePanel();
      }
    });
  }, [handleAuthVerification, initializePanel]);

  // Fetch admin data using extracted data module
  const {
    data: adminData,
    error,
    refetch,
    isFetching,
    isError
  } = useQuery({
    queryKey: ['adminData'],
    queryFn: DataProcessor.fetchAllAdminData,
    enabled: hasAccess,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
    onSuccess: (data) => {
      console.log('[RefactoredAdminPanel] Admin data fetched successfully');
    },
    onError: (error) => {
      console.error('[RefactoredAdminPanel] Error fetching admin data:', error);
    }
  });

  // Handle cleanup analysis using extracted cleanup module
  const handleAnalyzeDataForCleanup = async () => {
    setIsAnalyzing(true);
    
    try {
      const changes = await DataCleanupManager.analyzeData(activeTab);
      
      if (changes.length === 0) {
        CleanupFeedback.showAnalysisResults({ changes, stats: { total: 0 } }, activeTab);
        setIsDataCleanup(true);
      } else {
        setCleanupChanges(changes);
        setIsCleanupModalOpen(true);
      }
    } catch (error) {
      CleanupFeedback.showError(error, 'analyze data');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle cleanup mode toggle
  const handleToggleDataCleanup = async () => {
    if (isDataCleanup) {
      resetCleanupState();
    } else {
      await handleAnalyzeDataForCleanup();
    }
  };

  // Handle approve changes using extracted cleanup module
  const handleApproveChanges = async (changesToApprove) => {
    try {
      await DataCleanupManager.approveChanges(changesToApprove, activeTab);
      CleanupFeedback.showProcessingResults(
        { success: true }, 
        'approve', 
        changesToApprove.length
      );
      await refetch();
    } catch (error) {
      CleanupFeedback.showError(error, 'approve changes');
    }
  };

  // Handle reject changes using extracted cleanup module
  const handleRejectChanges = async (changesToReject) => {
    try {
      await DataCleanupManager.rejectChanges(changesToReject, activeTab);
      CleanupFeedback.showProcessingResults(
        { success: true }, 
        'reject', 
        changesToReject.length
      );
      
      if (changesToReject.length < cleanupChanges.length) {
        await refetch();
      }
    } catch (error) {
      CleanupFeedback.showError(error, 'reject changes');
    }
  };

  // Show loading state while verifying authentication
  if (isAuthLoading) {
    return (
      <div className="admin-panel-loading">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-4">Loading Admin Panel</h2>
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if there was an error fetching data
  if (isError) {
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
  const dataIsLoading = isFetching && !adminData;
  const currentData = adminData?.[activeTab] || [];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          {isFetching && !dataIsLoading && (
            <p className="text-sm text-gray-500 mt-1">Updating data...</p>
          )}
        </div>
        <div className="flex space-x-2 mt-2 md:mt-0">
          <button
            onClick={() => setShowFilters(prev => !prev)}
            className="px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 rounded-md text-sm flex items-center transition-colors duration-150"
            aria-label={showFilters ? 'Hide filters' : 'Show filters'}
            disabled={dataIsLoading}
          >
            <Filter className="h-4 w-4 mr-1.5" />
            {showFilters ? 'Hide' : 'Show'} Filters
          </button>
          <button
            onClick={() => refetch()}
            disabled={dataIsLoading}
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
        {dataIsLoading ? (
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
                  onClick={handleToggleDataCleanup}
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
              isLoading={dataIsLoading}
              error={error}
              onRetry={refetch}
              cities={adminData?.cities || []}
              neighborhoods={adminData?.neighborhoods || []}
              searchTerm={searchTerm}
              isDataCleanup={isDataCleanup}
              displayChanges={{}}
            />
          </>
        )}
      </div>
      
      {/* Data Cleanup Modal */}
      <DataCleanupModal
        isOpen={isCleanupModalOpen}
        onClose={() => setIsCleanupModalOpen(false)}
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

export default RefactoredAdminPanel; 