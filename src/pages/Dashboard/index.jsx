// src/pages/Dashboard/index.jsx
import React, { useState, useCallback, useMemo } from "react"; // Added useMemo
import { useQuery, useQueryClient } from '@tanstack/react-query';
import useSubmissionStore from '@/stores/useSubmissionStore';
// Corrected: Import the service, not the store, for fetching
import { submissionService } from '@/services/submissionService';
// Removed apiClient import - use service instead
// import { API_BASE_URL } from '@/config'; // No longer needed
import Button from "@/components/Button";
import { CheckCircle, XCircle, Loader2, AlertTriangle } from "lucide-react";
import ErrorMessage from "@/components/UI/ErrorMessage";
import SubmissionSkeleton from "@/pages/Dashboard/SubmissionSkeleton";

// Fetcher Function now uses the service
const fetchPendingSubmissionsData = async () => {
  console.log('[Dashboard] Fetching pending submissions via service...');
  // <<< USE SERVICE >>>
  const data = await submissionService.getPendingSubmissions();
  // Service already ensures array format and handles basic errors
  console.log(`[Dashboard] Received ${data.length} pending submissions via service.`);
  return data;
};

// Component Definition
const Dashboard = React.memo(() => {
  const queryClient = useQueryClient();

  // React Query setup (queryFn uses the updated fetcher)
  const {
      data: pendingSubmissions = [],
      isLoading: isLoadingSubmissions,
      isError: isFetchError,
      error: fetchError,
      refetch
  } = useQuery({
      queryKey: ['pendingSubmissions'], // Unique query key remains
      queryFn: fetchPendingSubmissionsData, // Use the service-based fetcher
      staleTime: 2 * 60 * 1000,
      refetchOnWindowFocus: true, // Refetch on focus for potential updates
  });

  // Store actions and local state
  const approveSubmission = useSubmissionStore(state => state.approveSubmission);
  const rejectSubmission = useSubmissionStore(state => state.rejectSubmission);
  const storeError = useSubmissionStore(state => state.error);
  const clearStoreError = useSubmissionStore(state => state.clearError);

  // UI State
  const [processingId, setProcessingId] = useState(null);
  // State to keep track of which action is processing for which ID
  const [actionType, setActionType] = useState(null); // 'approve' or 'reject'

  // --- Callbacks ---

  // Unified action handler
  const handleAction = useCallback(async (type, submissionId) => {
    if (processingId) return; // Prevent multiple actions at once
    setProcessingId(submissionId);
    setActionType(type); // Set the type of action being processed
    clearStoreError();

    const actionFn = type === 'approve' ? approveSubmission : rejectSubmission;

    try {
      // Use the store action which now calls the service internally
      await actionFn(submissionId);
      // Store action already invalidates queries on success
    } catch (err) {
      // Error state is set within the store action
      console.error(`[Dashboard] Store Action ${type} failed for ${submissionId}:`, err.message);
      // No need to set local error, storeError will be updated
    } finally {
      setProcessingId(null);
      setActionType(null); // Clear the action type
    }
  }, [approveSubmission, rejectSubmission, processingId, clearStoreError]); // Dependencies

  const handleApprove = useCallback((submissionId) => {
    handleAction('approve', submissionId);
  }, [handleAction]);

  const handleReject = useCallback((submissionId) => {
    handleAction('reject', submissionId);
  }, [handleAction]);

  // --- Render Logic ---
  const displayError = storeError || fetchError?.message;

  // Memoize the list rendering to avoid re-renders if pendingSubmissions array reference hasn't changed
  const renderedSubmissions = useMemo(() => {
      return pendingSubmissions.map((submission) => {
          // Find duplicates logic can be kept if needed
          // const duplicates = findDuplicates(submission);
          const isProcessingThis = processingId === submission.id;
          const isApproving = isProcessingThis && actionType === 'approve';
          const isRejecting = isProcessingThis && actionType === 'reject';

          return (
              <div key={submission.id} className={`bg-white p-4 rounded-lg shadow-sm border border-gray-100`}>
                  {/* Submission Info */}
                  <div className="flex flex-col sm:flex-row justify-between sm:items-start mb-3 gap-2">
                      <div>
                          <h3 className="text-base font-semibold text-gray-900 break-words">{submission.name}</h3>
                          <p className="text-sm text-gray-600 capitalize">Type: {submission.type}</p>
                          {/* Combine location fields */}
                          <p className="text-sm text-gray-500">
                              Location: {submission.location || `${submission.neighborhood || ''}${submission.neighborhood && submission.city ? ', ' : ''}${submission.city || ''}` || 'N/A'}
                          </p>
                          {submission.place_id && <p className="text-xs text-gray-400 mt-1">Place ID: {submission.place_id}</p>}
                      </div>
                      <p className="text-xs text-gray-400 mt-1 sm:mt-0 flex-shrink-0">
                          Submitted: {new Date(submission.created_at).toLocaleDateString()}
                      </p>
                  </div>

                  {/* Tags */}
                  {Array.isArray(submission.tags) && submission.tags.length > 0 && (
                      <div className="mb-3 flex flex-wrap gap-1">
                          {submission.tags.map(tag => (
                              <span key={tag} className="px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-600">#{tag}</span>
                          ))}
                      </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100 mt-3">
                      <Button
                          variant="primary" size="sm"
                          onClick={() => handleApprove(submission.id)}
                          disabled={isProcessingThis} // Disable if *any* action on this item is processing
                          className="flex items-center justify-center w-[100px]" // Fixed width for consistency
                      >
                          {isApproving ? <Loader2 className="animate-spin h-4 w-4" /> : <CheckCircle size={16} className="mr-1" />}
                          {isApproving ? '...' : 'Approve'}
                      </Button>
                      <Button
                          variant="tertiary" size="sm"
                          onClick={() => handleReject(submission.id)}
                          disabled={isProcessingThis} // Disable if *any* action on this item is processing
                          className="text-red-600 hover:bg-red-50 flex items-center justify-center w-[90px]" // Fixed width
                      >
                          {isRejecting ? <Loader2 className="animate-spin h-4 w-4" /> : <XCircle size={16} className="mr-1" />}
                          {isRejecting ? '...' : 'Reject'}
                      </Button>
                      {/* Merge button - Add logic later if needed */}
                  </div>
              </div>
          );
      });
  }, [pendingSubmissions, processingId, actionType, handleApprove, handleReject]); // Dependencies for memoization


  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">Pending Submissions</h1>

      {/* General Fetch Error */}
      {isFetchError && !isLoadingSubmissions && (
        <ErrorMessage
          message={fetchError?.message || 'Error loading submissions.'}
          onRetry={refetch}
          isLoadingRetry={isLoadingSubmissions}
          containerClassName="mb-4"
        />
      )}
      {/* Action Error (from store) */}
      {storeError && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm flex justify-between items-center" role="alert">
          <span className="flex items-center"><AlertTriangle size={16} className="mr-2" /> {storeError}</span>
          <button onClick={clearStoreError} className="text-red-700 hover:text-red-900 font-bold text-lg" aria-label="Clear error">&times;</button>
        </div>
      )}

      {/* Loading State: Skeletons */}
      {isLoadingSubmissions ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <SubmissionSkeleton key={i} />)}
        </div>
      // Empty State
      ) : !isFetchError && pendingSubmissions.length === 0 ? (
        <div className="text-center py-10 bg-white border border-gray-200 rounded-lg shadow-sm">
          <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-3" />
          <p className="text-gray-500">No pending submissions to review.</p>
        </div>
      // Display Submissions List
      ) : (
        <div className="space-y-4">
          {renderedSubmissions}
        </div>
      )}
    </div>
  );
});

export default Dashboard;