// src/pages/Dashboard/index.jsx
import React, { useState, useCallback } from "react";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import useSubmissionStore from '@/stores/useSubmissionStore';
import useTrendingStore from '@/stores/useTrendingStore';
import Button from "@/components/Button";
import { CheckCircle, XCircle, Loader2 } from "lucide-react"; // Removed AlertTriangle
import { API_BASE_URL } from '@/config';
import LoadingSpinner from "@/components/UI/LoadingSpinner"; // Keep for specific states
import ErrorMessage from "@/components/UI/ErrorMessage";
import SubmissionSkeleton from "./SubmissionSkeleton"; // Import skeleton

// Fetcher Function remains the same
const fetchPendingSubmissionsData = async () => { /* ... */ };

// Component Definition
const Dashboard = React.memo(() => {
  const queryClient = useQueryClient();

  const {
      data: pendingSubmissions = [],
      isLoading: isLoadingSubmissions,
      isError: isFetchError,
      error: fetchError,
      refetch
  } = useQuery({ /* ... query config ... */ });

  // Store actions and local state remain the same
  const approveSubmission = useSubmissionStore(state => state.approveSubmission);
  const rejectSubmission = useSubmissionStore(state => state.rejectSubmission);
  const error = useSubmissionStore(state => state.error); // Use unified error
  const trendingItems = useTrendingStore(state => state.trendingItems);
  const [mergeTarget, setMergeTarget] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  // Removed local actionError, use unified store error

  // Callbacks remain the same (findDuplicates, handleAction, handleApprove, handleReject, etc.)
  // Error setting in callbacks should rely on store's unified 'error' state. Example:
   const handleAction = useCallback(async (actionType, submissionId) => {
     if (processingId) return;
     setProcessingId(submissionId);
     // Optionally clear store error before action: useSubmissionStore.getState().clearError?.();
     const actionFn = actionType === 'approve' ? approveSubmission : rejectSubmission;
     try {
       await actionFn(submissionId);
       queryClient.invalidateQueries({ queryKey: ['pendingSubmissions'] });
     } catch (err) {
       // Error is set in the store action, no need to set local state
       console.error(`[Dashboard] Failed to ${actionType} submission ${submissionId}:`, err);
     } finally {
       setProcessingId(null);
       setMergeTarget(null);
     }
   }, [approveSubmission, rejectSubmission, processingId, queryClient]);
   // ... other callbacks ...


  // --- Render Logic ---
  const displayError = error; // Use unified error from submission store

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">Pending Submissions</h1>

        {/* Display Fetch Error (from useQuery) */}
        {isFetchError && !isLoadingSubmissions && (
             <ErrorMessage
                 message={fetchError?.message || 'Error loading submissions.'}
                 onRetry={refetch}
                 isLoadingRetry={isLoadingSubmissions}
                 containerClassName="mb-4"
             />
        )}
        {/* Display Action Error from Store */}
        {displayError && (
           <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm flex justify-between items-center" role="alert">
             <span>{typeof displayError === 'string' ? displayError : 'An action failed.'}</span>
             {/* Optionally add clear button: <button onClick={useSubmissionStore(state => state.clearError)} className="...">✕</button> */}
           </div>
         )}

        {/* Loading State: Use Skeletons */}
        {isLoadingSubmissions ? (
          <div className="space-y-4">
              <SubmissionSkeleton />
              <SubmissionSkeleton />
              <SubmissionSkeleton />
          </div>
        // Empty State
        ) : !isFetchError && pendingSubmissions.length === 0 ? (
          <div className="text-center py-10 bg-white border border-gray-200 rounded-lg shadow-sm">
            <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-3" />
            <p className="text-gray-500">No pending submissions to review.</p>
          </div>
        // Display Submissions List/Table
        ) : (
          <div className="space-y-4">
            {pendingSubmissions.map((submission) => {
                // ... submission rendering logic remains the same ...
            })}
          </div>
        )}
    </div>
  );
});

export default Dashboard;