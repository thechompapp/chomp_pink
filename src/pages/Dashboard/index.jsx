// src/pages/Dashboard/index.jsx
import React, { useState, useCallback } from "react";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import useSubmissionStore from '@/stores/useSubmissionStore';
import useTrendingStore from '@/stores/useTrendingStore';
import Button from "@/components/Button";
import { CheckCircle, XCircle, Loader2, AlertTriangle } from "lucide-react"; // Added AlertTriangle for error state
import { API_BASE_URL } from '@/config';
import LoadingSpinner from "@/components/UI/LoadingSpinner"; // Keep for specific states
import ErrorMessage from "@/components/UI/ErrorMessage";
import SubmissionSkeleton from "@/pages/Dashboard/SubmissionSkeleton"; // Corrected import path

// Fetcher Function
const fetchPendingSubmissionsData = async () => {
  console.log('[Dashboard] Fetching pending submissions...');
  try {
    const data = await apiClient('/api/submissions?status=pending', 'Dashboard Submissions');
    console.log(`[Dashboard] Received ${Array.isArray(data) ? data.length : 0} pending submissions.`);
    return Array.isArray(data) ? data : []; // Ensure array is returned
  } catch (err) {
    console.error('[Dashboard] Error fetching submissions:', err);
    // Let React Query handle the error state
    throw new Error(err.message || 'Failed to load submissions');
  }
};

// Component Definition
const Dashboard = React.memo(() => {
  const queryClient = useQueryClient();

  const {
      data: pendingSubmissions = [], // Default to empty array
      isLoading: isLoadingSubmissions,
      isError: isFetchError,
      error: fetchError,
      refetch
  } = useQuery({
      queryKey: ['pendingSubmissions'], // Unique query key
      queryFn: fetchPendingSubmissionsData,
      staleTime: 2 * 60 * 1000, // Stale after 2 minutes
  });

  // Store actions and local state
  const approveSubmission = useSubmissionStore(state => state.approveSubmission);
  const rejectSubmission = useSubmissionStore(state => state.rejectSubmission);
  const storeError = useSubmissionStore(state => state.error); // Error from store actions
  const clearStoreError = useSubmissionStore(state => state.clearError); // Action to clear store error
  // Note: trendingItems is not directly used in rendering logic anymore
  // const trendingItems = useTrendingStore(state => state.trendingItems);

  // State for UI feedback/control during actions
  const [mergeTarget, setMergeTarget] = useState(null);
  const [processingId, setProcessingId] = useState(null);


  // --- Callbacks ---

   // Helper to find potential duplicates (using cached trending data or fetched data)
   const findDuplicates = useCallback((submission) => {
       // Logic might need refinement - depends on what data 'trendingItems' holds
       // For now, assuming simple name & type matching against fetched submissions
       return pendingSubmissions.filter(
            (other) =>
                other.id !== submission.id &&
                other.type === submission.type &&
                other.name.toLowerCase() === submission.name.toLowerCase()
            // Optionally add city/neighborhood check
            // && other.city?.toLowerCase() === submission.city?.toLowerCase()
       );
   }, [pendingSubmissions]); // Depend on fetched submissions

   // Unified action handler
   const handleAction = useCallback(async (actionType, submissionId) => {
     if (processingId) return; // Prevent multiple actions at once
     setProcessingId(submissionId);
     clearStoreError(); // Clear previous store errors

     const actionFn = actionType === 'approve' ? approveSubmission : rejectSubmission;

     try {
       await actionFn(submissionId);
       // Query invalidation is good practice, but store might update pendingSubmissions directly
       // If store removes the item on success, invalidation might not be strictly needed immediately
       // queryClient.invalidateQueries({ queryKey: ['pendingSubmissions'] });
     } catch (err) {
       // Error state is set within the store action (approve/reject)
       console.error(`[Dashboard] Action ${actionType} failed for ${submissionId}:`, err);
     } finally {
       setProcessingId(null);
       setMergeTarget(null); // Reset merge target if any
     }
   }, [approveSubmission, rejectSubmission, processingId, clearStoreError]); // Add clearStoreError

   const handleApprove = useCallback((submissionId) => {
     handleAction('approve', submissionId);
   }, [handleAction]);

   const handleReject = useCallback((submissionId) => {
     handleAction('reject', submissionId);
   }, [handleAction]);

   const handleMerge = useCallback((submission) => {
       // Logic for handling merge (e.g., finding target, approving/rejecting)
       // This needs further definition based on requirements
       console.log("Merge action clicked for:", submission);
       setMergeTarget(submission); // Example: set target for potential further actions
       // Might need to show a modal or specific UI for merge confirmation/target selection
   }, []);


  // --- Render Logic ---
  const displayError = storeError || fetchError?.message; // Show store error first, then fetch error

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">Pending Submissions</h1>

        {/* Display General Fetch Error (if query fails) */}
        {isFetchError && !isLoadingSubmissions && (
             <ErrorMessage
                 message={fetchError?.message || 'Error loading submissions.'}
                 onRetry={refetch}
                 isLoadingRetry={isLoadingSubmissions}
                 containerClassName="mb-4"
             />
        )}
        {/* Display Action Error (from store) */}
        {storeError && (
           <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm flex justify-between items-center" role="alert">
             <span className="flex items-center"><AlertTriangle size={16} className="mr-2"/> {storeError}</span>
             <button
                 onClick={clearStoreError}
                 className="text-red-700 hover:text-red-900 font-bold text-lg"
                 aria-label="Clear error"
             >
                 &times;
             </button>
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
               const duplicates = findDuplicates(submission);
               const isProcessing = processingId === submission.id;
                return (
                     <div key={submission.id} className={`bg-white p-4 rounded-lg shadow-sm border ${duplicates.length > 0 ? 'border-amber-300 bg-amber-50' : 'border-gray-100'}`}>
                         {/* Submission Info */}
                         <div className="flex flex-col sm:flex-row justify-between sm:items-start mb-3 gap-2">
                             <div>
                                 <h3 className="text-base font-semibold text-gray-900">{submission.name}</h3>
                                 <p className="text-sm text-gray-600 capitalize">Type: {submission.type}</p>
                                 <p className="text-sm text-gray-500">Location: {submission.location || `${submission.neighborhood}, ${submission.city}` || 'N/A'}</p>
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

                          {/* Duplicate Warning */}
                         {duplicates.length > 0 && (
                             <div className="mb-3 p-2 bg-amber-100 border border-amber-200 rounded text-xs text-amber-700 flex items-center">
                                 <AlertTriangle size={14} className="mr-1.5 flex-shrink-0"/>
                                 Potential duplicate found.
                                 {/* Optionally list duplicates: {duplicates.map(d => d.id).join(', ')} */}
                             </div>
                         )}

                         {/* Actions */}
                         <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100 mt-3">
                             <Button
                                 variant="primary" size="sm"
                                 onClick={() => handleApprove(submission.id)}
                                 disabled={isProcessing}
                             >
                                 {isProcessing && actionType === 'approve' ? <Loader2 className="animate-spin h-4 w-4 mr-1" /> : <CheckCircle size={16} className="mr-1" />}
                                 Approve
                             </Button>
                             <Button
                                 variant="tertiary" size="sm"
                                 onClick={() => handleReject(submission.id)}
                                 disabled={isProcessing}
                                 className="text-red-600 hover:bg-red-50"
                             >
                                 {isProcessing && actionType === 'reject' ? <Loader2 className="animate-spin h-4 w-4 mr-1" /> : <XCircle size={16} className="mr-1" />}
                                 Reject
                             </Button>
                              {/* Merge button - conditionally shown or always visible */}
                             {duplicates.length > 0 && (
                                 <Button
                                     variant="tertiary" size="sm"
                                     onClick={() => handleMerge(submission)}
                                     disabled={isProcessing}
                                     className="text-blue-600 hover:bg-blue-50"
                                 >
                                      {/* Add appropriate icon? */}
                                     Merge...
                                 </Button>
                             )}
                         </div>
                     </div>
                );
            })}
          </div>
        )}
    </div>
  );
});

export default Dashboard;