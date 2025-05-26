/**
 * RefactoredAdminPanel Component
 * 
 * Main container for the Admin Panel.
 * Refactored version of AdminPanel.jsx with improved separation of concerns.
 */

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataCleanupModal } from '@/components/DataCleanupModal';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import AdminPanelLayout from './AdminPanelLayout';
import AdminTabContent from './AdminTabContent';
import useAdminData from '../hooks/useAdminData';
import useDataCleanup from '../hooks/useDataCleanup';

/**
 * RefactoredAdminPanel Component
 * @returns {JSX.Element} Rendered component
 */
const RefactoredAdminPanel = () => {
  const navigate = useNavigate();
  
  // Check admin authentication
  const { isAdmin, isLoading: isAuthLoading, error: authError } = useAdminAuth();
  
  // Redirect non-admin users
  useEffect(() => {
    if (!isAuthLoading && !isAdmin && !authError) {
      navigate('/');
    }
  }, [isAdmin, isAuthLoading, authError, navigate]);
  
  // Use custom hooks for data management
  const {
    adminData,
    activeTab,
    activeTabData,
    isLoading,
    isRefreshing,
    isError,
    error,
    handleTabChange,
    handleRefresh,
    TAB_CONFIG
  } = useAdminData();
  
  // Use custom hook for data cleanup
  const {
    isCleanupModalOpen,
    cleanupResource,
    cleanupChanges,
    isAnalyzing,
    isProcessing,
    openCleanupModal,
    closeCleanupModal,
    analyzeData,
    approveChanges,
    rejectChanges
  } = useDataCleanup(handleRefresh);
  
  // Handle cleanup modal open
  const handleOpenCleanup = (resourceType) => {
    openCleanupModal(resourceType);
    // Analyze data when modal is opened
    analyzeData(resourceType);
  };
  
  // Show loading state while checking authentication
  if (isAuthLoading) {
    return (
      <div className="container mx-auto px-4 py-12 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Verifying admin access...</p>
      </div>
    );
  }
  
  // Show error if authentication failed
  if (authError) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded-md p-4">
          <h2 className="text-lg font-semibold text-red-700 dark:text-red-300 mb-2">Authentication Error</h2>
          <p className="text-red-600 dark:text-red-400">{authError.message || 'Failed to verify admin access'}</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-4 py-2 bg-red-200 text-red-700 hover:bg-red-300 dark:bg-red-800 dark:text-red-200 dark:hover:bg-red-700 rounded-md transition-colors duration-200"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }
  
  // Don't render anything if not admin
  if (!isAdmin) {
    return null;
  }
  
  return (
    <>
      <AdminPanelLayout
        title="Admin Panel"
        tabs={TAB_CONFIG}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onRefresh={handleRefresh}
        onOpenCleanup={handleOpenCleanup}
        isRefreshing={isRefreshing}
        isLoading={isLoading}
        error={isError ? error : null}
      >
        <AdminTabContent
          activeTab={activeTab}
          tabData={activeTabData}
          isLoading={isLoading}
          onRefresh={handleRefresh}
        />
      </AdminPanelLayout>
      
      {/* Data Cleanup Modal */}
      {isCleanupModalOpen && (
        <DataCleanupModal
          isOpen={isCleanupModalOpen}
          onClose={closeCleanupModal}
          resourceType={cleanupResource}
          changes={cleanupChanges}
          isAnalyzing={isAnalyzing}
          isProcessing={isProcessing}
          onAnalyze={() => analyzeData(cleanupResource)}
          onApprove={() => approveChanges(cleanupChanges, cleanupResource)}
          onReject={() => rejectChanges(cleanupChanges, cleanupResource)}
        />
      )}
    </>
  );
};

export default RefactoredAdminPanel;
